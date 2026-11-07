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

/** 查缓存：同 hash 最近一次成功任务 */
export async function findCachedJob(textHash: string): Promise<string | null> {
  const db = getSupabaseAdmin();
  const { data, error } = await db
    .from("jobs")
    .select("audio_url")
    .eq("text_hash", textHash)
    .eq("status", "done")
    .not("audio_url", "is", null)
    .order("created_at", { ascending: false })
    .limit(1);
  if (error) throw error;
  return data?.[0]?.audio_url ?? null;
}

/** 额度不足时由接口转换为 HTTP 402。 */
export class QuotaError extends Error {
  constructor(
    public reason: "free_used" | "chars_exceeded" | "credits_exceeded",
    public message: string
  ) {
    super(message);
  }
}

export async function checkAndReserveFree(
  identity: Identity,
  text: string
): Promise<{ chars: number }> {
  const chars = text.length;
  if (chars > FREE_CHARS) {
    throw new QuotaError(
      "chars_exceeded",
      `Free generations are limited to ${FREE_CHARS} characters (about 30 seconds of audio).`
    );
  }
  const { data: reserved, error } = await getSupabaseAdmin().rpc("reserve_free_generation", {
    p_user_id: identity.userId,
    p_chars: chars,
  });
  if (error) throw error;
  if (!reserved) {
    throw new QuotaError("free_used", "Free generation already used — upgrade to continue.");
  }
  return { chars };
}

/** 供应商或存储失败时归还尚未完成的免费次数。 */
export async function releaseFreeGeneration(userId: string): Promise<void> {
  const { error } = await getSupabaseAdmin().rpc("release_free_generation", { p_user_id: userId });
  if (error) throw error;
}

/** 供应商或存储失败时原子返还预扣的付费字符。 */
export async function restoreCredits(userId: string, chars: number): Promise<void> {
  const { error } = await getSupabaseAdmin().rpc("restore_credits", {
    p_user_id: userId,
    p_chars: chars,
  });
  if (error) throw error;
}

/** 生成成功后：在数据库一次事务中写 job 与月度用量。 */
export async function recordGeneration(opts: {
  identity: Identity;
  voiceRowId: string;
  textHash: string;
  lang: string;
  chars: number;
  audioUrl: string | null;
  apiCalled: boolean;
  charged: boolean;
  /** free = 免费次数已预留；credits = 付费字符已预扣 */
  bucket?: "free" | "credits";
}): Promise<void> {
  const jobId = crypto.randomUUID();
  let lastError: Error | null = null;
  for (let attempt = 0; attempt < 2; attempt++) {
    const { error } = await getSupabaseAdmin().rpc("record_generation", {
      p_job_id: jobId,
      p_user_id: opts.identity.userId,
      p_voice_id: opts.voiceRowId,
      p_text_hash: opts.textHash,
      p_lang: opts.lang,
      p_chars: opts.chars,
      p_audio_url: opts.audioUrl,
      p_api_called: opts.apiCalled,
      p_charged: opts.charged,
      p_bucket: opts.bucket ?? "free",
    });
    if (!error) return;
    lastError = error;
  }
  throw lastError;
}

/* ============================================================
 * 付费额度（credits_left）—— 2026-11-05 补：之前付费用户走的是免费闸，
 * 生成第二次就被 402 拦住，付了钱也用不了。
 * ============================================================ */

export type PlanInfo = { plan: string; creditsLeft: number };

/** 读用户套餐。返回 null = 没有 users 行（按 free 处理） */
export async function getPlanInfo(userId: string): Promise<PlanInfo | null> {
  const db = getSupabaseAdmin();
  const { data, error } = await db
    .from("users")
    .select("plan, credits_left")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return { plan: String(data.plan ?? "free"), creditsLeft: Number(data.credits_left ?? 0) };
}

export function isPaidPlan(plan: string | undefined | null): boolean {
  // onetime 也是一次性购买的付费额度，同样走 credits_left
  return Boolean(plan) && plan !== "free";
}

/**
 * 扣付费额度。
 *
 * 用乐观锁（CAS）而不是读-改-写：Supabase 的 update 没法原子自减，
 * 并发两个请求会各自读到同一个旧值，都减去 chars → 超扣甚至扣成负数。
 * 这里用 `eq("credits_left", 旧值)` 做条件更新，影响 0 行就是被别人抢先了，
 * 重读最新值再试。预扣发生在供应商调用之前，避免并发请求造成额外成本。
 */
export async function chargeCredits(userId: string, chars: number): Promise<number> {
  const db = getSupabaseAdmin();

  for (let attempt = 0; attempt < 3; attempt++) {
    const { data: row, error: readErr } = await db
      .from("users")
      .select("credits_left")
      .eq("id", userId)
      .maybeSingle();
    if (readErr) throw readErr;
    if (!row) throw new Error("No user row to charge");

    const current = Number(row.credits_left ?? 0);
    if (current < chars) {
      throw new QuotaError("credits_exceeded", "Not enough characters left on your plan.");
    }

    const { data: updated, error: writeErr } = await db
      .from("users")
      .update({ credits_left: current - chars })
      .eq("id", userId)
      .eq("credits_left", current) // CAS：值被别人改过就影响 0 行
      .select("credits_left");
    if (writeErr) throw writeErr;

    if (updated && updated.length > 0) {
      return Number(updated[0].credits_left);
    }
    // 竞争失败，循环重读
  }

  throw new Error("Failed to charge credits after 3 attempts (concurrent usage)");
}

