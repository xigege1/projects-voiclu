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
  /** 扣哪个桶：free = 免费次数（每身份 1 次）；credits = 付费字符额度（已单独扣） */
  bucket?: "free" | "credits";
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

  if (!opts.charged) return;

  const bucket = opts.bucket ?? "free";

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
        // 付费用户不消耗免费次数，否则降级回 free 时会被误判为"已用过"
        free_generations:
          bucket === "free" ? usage.free_generations + 1 : usage.free_generations,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", opts.identity.userId)
      .eq("month", month);
  } else {
    await db.from("usage").insert({
      user_id: opts.identity.userId,
      month,
      chars_used: opts.chars,
      free_generations: bucket === "free" ? 1 : 0,
    });
  }
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
 * 重读最新值再试。3 次都失败就抛错（此时音频已生成，宁可报错让用户重试，
 * 也不能悄悄白送一次）。
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

