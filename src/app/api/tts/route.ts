/**
 * POST /api/tts
 * body: { voiceId, text, lang? }
 * → { audioUrl, cached, charsLeft? }
 *
 * 成本三道闸（方案 D2，这一条决定免费流量再大也不亏钱）：
 *   1. 调供应商前预留额度（免费 1 次 / 付费按字符扣），上游失败时归还
 *   2. 缓存键 sha256(provider_voice_id|lang|text) —— 命中直接返回 URL，不扣额度
 *   3. 成功后在同一数据库事务里记录 job 与用量
 */
import { NextResponse } from "next/server";
import { resolveIdentity } from "@/lib/identity";
import { getSupabaseAdmin } from "@/lib/supabase";
import { synthesize, maxCharsPerRequest } from "@/lib/elevenlabs";
import { putAudio, audioKey } from "@/lib/storage";
import {
  cacheKey,
  findCachedJob,
  checkAndReserveFree,
  recordGeneration,
  getPlanInfo,
  isPaidPlan,
  chargeCredits,
  releaseFreeGeneration,
  restoreCredits,
  QuotaError,
} from "@/lib/billing";
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
    const maxChars = maxCharsPerRequest();
    if (text.length > maxChars) {
      return NextResponse.json(
        { error: "text_too_long", message: `Max ${maxChars.toLocaleString("en-US")} characters per generation.` },
        { status: 400 }
      );
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

    // ---- 闸 1：额度 ----
    // 付费用户（starter / creator / onetime）走 credits_left 扣字符；
    // 免费与匿名用户走「每身份 1 次」。
    // 之前这里只有免费闸，付费用户生成第二次就被 402 拦住 —— 付了钱也用不了。
    const planInfo = identity.authed ? await getPlanInfo(identity.userId) : null;
    const paid = isPaidPlan(planInfo?.plan);
    const bucket: "free" | "credits" = paid ? "credits" : "free";

    if (paid) {
      const left = planInfo?.creditsLeft ?? 0;
      if (left < text.length) {
        return NextResponse.json(
          {
            error: "quota_exceeded",
            reason: "credits_exceeded",
            message: `This request needs ${text.length} characters but you have ${left} left.`,
            creditsLeft: left,
            upgradeUrl: "/pricing",
          },
          { status: 402 }
        );
      }
    }
    let creditsLeft: number | undefined;
    try {
      if (paid) {
        // 在调用付费供应商前扣减，避免并发请求都通过预检后产生额外成本。
        creditsLeft = await chargeCredits(identity.userId, text.length);
      } else {
        await checkAndReserveFree(identity, text);
      }
    } catch (e) {
      if (e instanceof QuotaError) {
        return NextResponse.json(
          { error: "quota_exceeded", reason: e.reason, message: e.message, upgradeUrl: "/pricing" },
          { status: 402 }
        );
      }
      throw e;
    }

    // 供应商或存储失败才归还预留额度；已成功生成的音频会保留扣费。
    let url: string;
    try {
      const audio = await synthesize(voice.provider_voice_id, text);
      url = await putAudio(audioKey("voiclu-AI-generated"), audio, "audio/mpeg");
    } catch (e) {
      if (paid) await restoreCredits(identity.userId, text.length);
      else await releaseFreeGeneration(identity.userId);
      throw e;
    }

    await recordGeneration({
      identity,
      voiceRowId: voice.id,
      textHash,
      lang,
      chars: text.length,
      audioUrl: url,
      apiCalled: true,
      charged: true,
      bucket,
    });

    // 转化邮件（day1 邮件 2）：登录用户第一次免费生成成功后发。
    // 付费用户已经在付钱，不再推销 —— 只给 free 桶发。
    if (identity.authed && bucket === "free") {
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

    return NextResponse.json({ audioUrl: url, cached: false, creditsLeft });
  } catch (e) {
    console.error("[/api/tts]", e);
    return NextResponse.json(
      { error: "tts_failed", message: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 }
    );
  }
}
