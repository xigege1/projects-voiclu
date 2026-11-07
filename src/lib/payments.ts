/**
 * 渠道无关的入账核心 —— 所有支付渠道（Creem / Stripe / Paddle）共用这一份逻辑。
 *
 * 分工约定（加新渠道时照这个来，不要复制粘贴一份 webhook）：
 *   1. 渠道 adapter（`app/api/webhooks/<provider>/route.ts`）只做两件事：
 *      验签 → 把渠道事件归一化成 GrantInput
 *   2. 幂等、加额度、发邮件、写 orders 全部在 grantPlan() 里
 *
 * 幂等口径：orders 的唯一键是 (provider, provider_txn)。
 * 只按 provider_txn 唯一是不够的 —— 不同渠道的交易号命名空间互相独立，
 * 理论上可能撞号；而且没有 provider 字段就没法对账和判断该找谁退款。
 */
import { getSupabaseAdmin } from "@/lib/supabase";
import { PLANS } from "@/lib/constants";
import { sendPaymentSuccess } from "@/lib/emails";

export type PaymentProvider = "creem" | "stripe" | "paddle";

export type GrantInput = {
  provider: PaymentProvider;
  /** 渠道侧交易号，必须稳定（回调重试时不变） */
  txnId: string;
  userId: string;
  /** 对应 PLANS 里的 id：starter | creator | onetime */
  planId: string;
  amount: number;
  currency?: string;
};

export type GrantResult =
  | { ok: true; deduped: false; plan: string; creditsLeft: number }
  | { ok: true; deduped: true }
  | { ok: false; error: "missing_fields" | "unknown_plan" };

export async function grantPlan(input: GrantInput): Promise<GrantResult> {
  const { provider, txnId, userId, planId } = input;
  const currency = input.currency ?? "USD";

  if (!txnId || !userId || !planId) return { ok: false, error: "missing_fields" };

  const plan = PLANS.find((p) => p.id === planId);
  if (!plan) return { ok: false, error: "unknown_plan" };

  const db = getSupabaseAdmin();

  // 幂等入账：唯一冲突 = 已经处理过同一笔，直接返回
  const { error: orderErr } = await db.from("orders").insert({
    user_id: userId,
    plan: planId,
    provider,
    provider_txn: txnId,
    amount: input.amount,
    currency,
    status: "paid",
  });
  if (orderErr) {
    if (String(orderErr.code) === "23505") return { ok: true, deduped: true };
    throw orderErr;
  }

  // 加额度：不覆盖已有额度，在原值上累加。
  //
  // 这里必须用 update 而不是 upsert：
  //   users.email 是 not null 且无默认值，upsert 只带 id/plan/credits_left 时，
  //   Postgres 会在冲突判定之前先校验 NOT NULL，直接抛
  //   `null value in column "email"`。而订单行此时已经插入成功，
  //   结果是「钱收了、订单记了、额度没加」，且渠道重试会命中 23505 幂等分支
  //   返回 deduped —— 额度永远补不上。第一笔真实付款就撞上了这个。
  const { data: user } = await db
    .from("users")
    .select("credits_left, email")
    .eq("id", userId)
    .maybeSingle();

  if (!user) {
    // metadata.user_id 指向不存在的用户：回滚幂等锁，让渠道重试时报错而不是静默成功
    const { error: rbErr } = await db
      .from("orders")
      .delete()
      .eq("provider", provider)
      .eq("provider_txn", txnId);
    console.error("[payments:grant] 用户不存在，已回滚订单行", {
      provider,
      txnId,
      userId,
      rolledBack: !rbErr,
      rbErr: rbErr?.message,
    });
    throw new Error("user_not_found");
  }

  const creditsLeft = (user.credits_left ?? 0) + plan.chars;
  const { data: updated, error: upErr } = await db
    .from("users")
    .update({ plan: planId, credits_left: creditsLeft })
    .eq("id", userId)
    .select("id");

  if (upErr || !updated?.length) {
    // 额度没加成功就必须把订单行删掉。否则渠道重试时唯一键冲突 → 返回 deduped，
    // 这笔钱对应的额度就永久丢失了。
    const { error: rbErr } = await db
      .from("orders")
      .delete()
      .eq("provider", provider)
      .eq("provider_txn", txnId);
    console.error("[payments:grant] 加额度失败，已回滚订单行", {
      provider,
      txnId,
      userId,
      err: upErr?.message,
      updatedRows: updated?.length ?? 0,
      rolledBack: !rbErr,
      rbErr: rbErr?.message,
    });
    throw upErr ?? new Error("credits_update_no_rows");
  }

  // 付款成功邮件 —— 不阻塞 webhook 响应
  if (user?.email) {
    const resetDate = new Date();
    resetDate.setMonth(resetDate.getMonth() + 1);
    void sendPaymentSuccess(
      user.email,
      plan.name,
      input.amount,
      currency,
      txnId,
      plan.chars,
      resetDate.toISOString().slice(0, 10)
    ).catch((e) => console.error(`[${provider}:email]`, e));
  }

  return { ok: true, deduped: false, plan: planId, creditsLeft };
}
