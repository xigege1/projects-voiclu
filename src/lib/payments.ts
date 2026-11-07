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

  const { data, error } = await getSupabaseAdmin().rpc("grant_plan", {
    p_provider: provider,
    p_txn_id: txnId,
    p_user_id: userId,
    p_plan: planId,
    p_amount: input.amount,
    p_currency: currency,
    p_chars: plan.chars,
  });
  if (error) throw error;
  const row = data?.[0] as
    | { applied: boolean; balance: number; user_email: string | null }
    | undefined;
  if (!row) throw new Error("grant_plan returned no result");
  if (!row.applied) return { ok: true, deduped: true };

  // 付款成功邮件 —— 不阻塞 webhook 响应
  if (row.user_email) {
    const resetDate = new Date();
    resetDate.setMonth(resetDate.getMonth() + 1);
    void sendPaymentSuccess(
      row.user_email,
      plan.name,
      input.amount,
      currency,
      txnId,
      plan.chars,
      resetDate.toISOString().slice(0, 10)
    ).catch((e) => console.error(`[${provider}:email]`, e));
  }

  return { ok: true, deduped: false, plan: planId, creditsLeft: row.balance };
}
