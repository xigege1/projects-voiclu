/**
 * 计费 + 缓存 + 额度 —— 这个文件是毛利的关键。
 *
 * 三条硬规则（方案 D2 / D4）：
 *   1. 缓存键 sha256(provider_voice_id|lang|text)，命中直接返回，不扣额度、不计 API 成本
 *   2. 按字符计费（1 字符 = 1 credit，1000 字符 ≈ 1 分钟）
 *   3. 免费额度只信数据库（usage 表），绝不写 localStorage
 */
import crypto from "crypto";
import { getSupabaseAdmin } from "./supabase";
import { FREE_CHARS } from "./constants";

export type Identity = {
  /** auth user id；未登录时为匿名 cookie id（形如 "anon:uuid"） */
  userId: string;
  /** 是否已登录（决定额度口径） */
  authed: boolean;
};

export function cacheKey(providerVoiceId: string, lang: string, text: string): string {
  return crypto.createHash("sha256").update(`${providerVoiceId}|${lang}|${text}`).digest("hex");
}

export function currentMonth(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

/** 查缓存：同 hash 最近一次成功任务 */
export async function findCachedJob(textHash: string): Promise<string | null> {
  const db = getSupabaseAdmin();
  const { data } = await db
    .from("jobs")
    .select("audio_url")
    .eq("text_hash", textHash)
    .eq("status", "done")
    .not("audio_url", "is", null)
    .order("created_at", { ascending: false })
    .limit(1);
  return data?.[0]?.audio_url ?? null;
}

/**
 * 额度检查。返回 null = 放行；返回数字 = 需要扣的字符数没问题；
 * 抛 QuotaError = 应弹付费窗（HTTP 402）。
 */
export class QuotaError extends Error {
  constructor(public reason: "free_used" | "chars_exceeded", public message: string) {
    super(message);
  }
}

export async function checkAndReserveFree(
  identity: Identity,
  text: string
): Promise<{ chars: number }> {
  const chars = text.length;
  const db = getSupabaseAdmin();
  const month = currentMonth();
  const userId = identity.userId;

  const { data: usage } = await db
    .from("usage")
    .select("chars_used, free_generations")
    .eq("user_id", userId)
    .eq("month", month)
    .maybeSingle();

  const freeUsed = usage?.free_generations ?? 0;
  if (freeUsed >= 1) {
    throw new QuotaError("free_used", "Free generation already used — upgrade to continue.");
  }
  if (chars > FREE_CHARS) {
    throw new QuotaError(
      "chars_exceeded",
      `Free generations are limited to ${FREE_CHARS} characters (about 30 seconds of audio).`
    );
  }
  return { chars };
}

/** 生成成功后：记 usage + 写 job。api_called=false 表示缓存命中（不扣额度）。 */
export async function recordGeneration(opts: {
  identity: Identity;
  voiceRowId: string;
  textHash: string;
  lang: string;
  chars: number;
  audioUrl: string | null;
  apiCalled: boolean;
  charged: boolean;
}): Promise<void> {
  const db = getSupabaseAdmin();
  const month = currentMonth();

  await db.from("jobs").insert({
    user_id: opts.identity.userId,
    voice_id: opts.voiceRowId,
    text_hash: opts.textHash,
    lang: opts.lang,
    chars: opts.chars,
    status: opts.audioUrl ? "done" : "failed",
    audio_url: opts.audioUrl,
    api_called: opts.apiCalled,
    charged: opts.charged,
  });

  if (opts.charged) {
    // usage upsert（匿名与登录都记库）
    const { data: usage } = await db
      .from("usage")
      .select("chars_used, free_generations")
      .eq("user_id", opts.identity.userId)
      .eq("month", month)
      .maybeSingle();

    if (usage) {
      await db
        .from("usage")
        .update({
          chars_used: usage.chars_used + opts.chars,
          free_generations: usage.free_generations + 1,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", opts.identity.userId)
        .eq("month", month);
    } else {
      await db.from("usage").insert({
        user_id: opts.identity.userId,
        month,
        chars_used: opts.chars,
        free_generations: 1,
      });
    }
  }
}
