/**
 * POST /api/clone
 * multipart: audio (30s~3min 干声), consent ("true"), name?
 * → { voiceId, voiceName }
 *
 * 合规硬门槛：不勾选授权无法开始克隆（方案 D10 的要求提前到接口层做死）
 */
import { NextResponse } from "next/server";
import { resolveIdentity } from "@/lib/identity";
import { getSupabaseAdmin } from "@/lib/supabase";
import { cloneVoice, demoCloneMode } from "@/lib/elevenlabs";
import { MAX_UPLOAD_MB, MIN_AUDIO_SEC, MAX_AUDIO_SEC } from "@/lib/constants";


const ALLOWED_TYPES = ["audio/mpeg", "audio/wav", "audio/x-wav", "audio/mp4", "audio/x-m4a", "audio/m4a"];

export async function POST(req: Request) {
  try {
    const identity = await resolveIdentity(req);

    const form = await req.formData();
    const audio = form.get("audio");
    const consent = form.get("consent");
    const name = (form.get("name") as string | null)?.slice(0, 60) || "My voice";

    // ---- 合规门槛：consent 必须显式为 "true" ----
    if (consent !== "true") {
      return NextResponse.json(
        { error: "consent_required", message: "You must confirm you have permission to clone this voice." },
        { status: 400 }
      );
    }

    if (!(audio instanceof File)) {
      return NextResponse.json({ error: "audio_required" }, { status: 400 });
    }
    if (audio.size > MAX_UPLOAD_MB * 1024 * 1024) {
      return NextResponse.json(
        { error: "file_too_large", message: `Max file size is ${MAX_UPLOAD_MB}MB.` },
        { status: 400 }
      );
    }
    if (audio.type && !ALLOWED_TYPES.includes(audio.type)) {
      return NextResponse.json(
        { error: "bad_format", message: "Accepted formats: mp3, wav, m4a." },
        { status: 400 }
      );
    }

    // ---- 简单防滥用：同身份 24h 内最多 5 次克隆尝试 ----
    const db = getSupabaseAdmin();
    const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
    const { count, error: countError } = await db
      .from("voices")
      .select("id", { count: "exact", head: true })
      .eq("user_id", identity.userId)
      .gte("created_at", since);
    if (countError) throw countError;
    if ((count ?? 0) >= 5) {
      return NextResponse.json(
        { error: "rate_limited", message: "Too many clone attempts today. Try again tomorrow." },
        { status: 429 }
      );
    }

    // ---- 调 ElevenLabs Instant Voice Cloning ----
    // ELEVENLABS_DEMO_VOICE_ID 存在时为「模拟克隆」：只验流程，不产生真克隆
    const demo = demoCloneMode();
    const providerVoiceId = await cloneVoice(audio, name);

    // ---- consent 时间 + IP 落库（voices.consent_at / consent_ip） ----
    const consentIp =
      req.headers.get("cf-connecting-ip") ??
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      "unknown";

    const { data: voiceRow, error } = await db
      .from("voices")
      .insert({
        user_id: identity.userId,
        // demo 行单独标记，升级真克隆后可一键筛出来清理
        provider: demo ? "elevenlabs-demo" : "elevenlabs",
        provider_voice_id: providerVoiceId,
        name,
        status: "active",
        consent_at: new Date().toISOString(),
        consent_ip: consentIp,
      })
      .select("id")
      .single();

    if (error) throw error;

    return NextResponse.json({
      voiceId: voiceRow.id,
      providerVoiceId,
      voiceName: name,
      demo,
      // 提示前端：时长校验建议在前端已做过（Audio API 检测 30s~3min、静音、峰值）
      limits: { minSec: MIN_AUDIO_SEC, maxSec: MAX_AUDIO_SEC },
    });
  } catch (e) {
    console.error("[/api/clone]", e);
    return NextResponse.json(
      { error: "clone_failed", message: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 }
    );
  }
}
