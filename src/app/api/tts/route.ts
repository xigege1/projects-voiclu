/**
 * POST /api/tts
 * body: { voiceId, text, lang? }
 * → { audioUrl, cached, charsLeft? }
 *
 * 成本三道闸（方案 D2，这一条决定免费流量再大也不亏钱）：
 *   1. 额度检查（usage 表，免费 1 次 / 付费按字符扣）
 *   2. 缓存键 sha256(provider_voice_id|lang|text) —— 命中直接返回 URL，不扣额度
 *   3. 只有真正调了 API 才扣额度
 */
import { NextResponse } from "next/server";
import { resolveIdentity } from "@/lib/identity";
import { getSupabaseAdmin } from "@/lib/supabase";
import { synthesize } from "@/lib/elevenlabs";
import { putAudio, audioKey } from "@/lib/storage";
import { cacheKey, findCachedJob, checkAndReserveFree, recordGeneration, QuotaError } from "@/lib/billing";
import { sendFreeGenerationDone } from "@/lib/emails";


export async function POST(req: Request) {
  try {
    const identity = await resolveIdentity(req);
    const body = (await req.json()) as { voiceId?: string; text?: string; lang?: string };
    const text = (body.text ?? "").trim();
    const lang = body.lang || "en";

    if (!body.voiceId || !text) {
      return NextResponse.json({ error: "voiceId_and_text_required" }, { status: 400 });
    }
    if (text.length > 10000) {
      return NextResponse.json({ error: "text_too_long", message: "Max 10,000 characters per generation." }, { status: 400 });
    }

    const db = getSupabaseAdmin();

    // 取声音档案（校验归属，防越权用别人的 voice）
    const { data: voice, error: vErr } = await db
      .from("voices")
      .select("id, provider_voice_id, status, user_id")
      .eq("id", body.voiceId)
      .eq("user_id", identity.userId)
      .maybeSingle();
    if (vErr) throw vErr;
    if (!voice) {
      return NextResponse.json({ error: "voice_not_found" }, { status: 404 });
    }
    if (voice.status !== "active") {
      return NextResponse.json({ error: "voice_suspended", message: "This voice has been suspended." }, { status: 403 });
    }

    // ---- 闸 2：缓存命中 → 直接返回，不扣额度、不计 API 成本 ----
    const textHash = cacheKey(voice.provider_voice_id, lang, text);
    const cachedUrl = await findCachedJob(textHash);
    if (cachedUrl) {
      // 记一条 api_called=false 的 job（审计可见），charged=false
      await recordGeneration({
        identity,
        voiceRowId: voice.id,
        textHash,
        lang,
        chars: text.length,
        audioUrl: cachedUrl,
        apiCalled: false,
        charged: false,
      });
      return NextResponse.json({ audioUrl: cachedUrl, cached: true });
    }

    // ---- 闸 1：额度（登录用户按 plan 扣字符；匿名/免费用户 1 次） ----
    // TODO(付费): 登录且 plan != free 时，走 credits_left 扣减而不是 checkAndReserveFree
    let charged = false;
    try {
      await checkAndReserveFree(identity, text);
      charged = true; // 免费额度也算"收费"口径：占用 1 次免费机会
    } catch (e) {
      if (e instanceof QuotaError) {
        return NextResponse.json(
          { error: "quota_exceeded", reason: e.reason, message: e.message, upgradeUrl: "/pricing" },
          { status: 402 }
        );
      }
      throw e;
    }

    // ---- 闸 3：真调 API 才花钱 ----
    const audio = await synthesize(voice.provider_voice_id, text);
    // 文件名带 AI-generated 标记（合规：生成音频可识别）
    const url = await putAudio(audioKey("voiclu-AI-generated"), audio, "audio/mpeg");

    await recordGeneration({
      identity,
      voiceRowId: voice.id,
      textHash,
      lang,
      chars: text.length,
      audioUrl: url,
      apiCalled: true,
      charged,
    });

    // 转化邮件（day1 邮件 2）：登录用户第一次免费生成成功后发。
    // 匿名用户没有邮箱，转化靠页面付费弹窗 —— 不阻塞响应，失败只记日志。
    if (identity.authed && charged) {
      void (async () => {
        try {
          const { data: user } = await db.from("users").select("email").eq("id", identity.userId).maybeSingle();
          if (user?.email) {
            await sendFreeGenerationDone(user.email, url);
          }
        } catch (e) {
          console.error("[tts:email]", e);
        }
      })();
    }

    return NextResponse.json({ audioUrl: url, cached: false });
  } catch (e) {
    console.error("[/api/tts]", e);
    return NextResponse.json(
      { error: "tts_failed", message: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 }
    );
  }
}
