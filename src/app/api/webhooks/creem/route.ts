/**
 * POST /api/webhooks/creem
 * Creem（Merchant of Record）支付回调。
 * 幂等：orders.provider_txn 唯一约束 —— 同一交易重复回调只加一次额度。
 * 换 Paddle 时改签名校验部分即可，入账逻辑一致。
 */
import { NextResponse } from "next/server";
import crypto from "crypto";
import { getSupabaseAdmin } from "@/lib/supabase";
import { PLANS } from "@/lib/constants";
import { sendPaymentSuccess } from "@/lib/emails";


function verifyCreemSignature(rawBody: string, signature: string): boolean {
  const secret = process.env.CREEM_WEBHOOK_SECRET;
  if (!secret) return false;
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  const raw = await req.text();
  const signature = req.headers.get("creem-signature") ?? "";

  if (!verifyCreemSignature(raw, signature)) {
    return NextResponse.json({ error: "bad_signature" }, { status: 401 });
  }

  let event: { eventType?: string; object?: Record<string, unknown> };
  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "bad_json" }, { status: 400 });
  }

  if (event.eventType !== "checkout.completed" && event.eventType !== "payment.succeeded") {
    return NextResponse.json({ ok: true }); // 其余事件直接确认
  }

  const obj = event.object ?? {};
  const txnId = String(obj.id ?? "");
  const metadata = (obj.metadata ?? {}) as Record<string, string>;
  const userId = metadata.user_id;
  const planId = metadata.plan; // starter | creator | onetime
  const plan = PLANS.find((p) => p.id === planId);
  const amount = Number(obj.amount ?? 0) / 100; // Creem 金额为分

  if (!txnId || !userId || !plan) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }

  const db = getSupabaseAdmin();

  // 幂等入账：唯一冲突 = 已处理过，直接 ok
  const { error: orderErr } = await db.from("orders").insert({
    user_id: userId,
    plan: planId,
    provider_txn: txnId,
    amount,
    currency: String(obj.currency ?? "USD"),
    status: "paid",
  });
  if (orderErr) {
    if (String(orderErr.code) === "23505") return NextResponse.json({ ok: true, deduped: true });
    throw orderErr;
  }

  // 加额度：users.upsert credits_left
  const { data: user } = await db
    .from("users")
    .select("credits_left, email")
    .eq("id", userId)
    .maybeSingle();
  const newCredits = (user?.credits_left ?? 0) + plan.chars;
  const { error: upErr } = await db
    .from("users")
    .upsert({ id: userId, plan: planId, credits_left: newCredits }, { onConflict: "id" });
  if (upErr) throw upErr;

  // 付款成功邮件（day1 邮件 3）—— 不阻塞 webhook 响应
  if (user?.email) {
    const resetDate = new Date();
    resetDate.setMonth(resetDate.getMonth() + 1);
    void sendPaymentSuccess(
      user.email,
      plan.name,
      amount,
      String(obj.currency ?? "USD"),
      txnId,
      plan.chars,
      resetDate.toISOString().slice(0, 10)
    ).catch((e) => console.error("[creem:email]", e));
  }

  return NextResponse.json({ ok: true });
}
