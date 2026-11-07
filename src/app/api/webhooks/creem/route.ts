/**
 * POST /api/webhooks/creem
 * Creem（Merchant of Record）支付回调 —— 只做验签 + 事件归一化。
 *
 * 入账逻辑（幂等 / 加额度 / 发邮件）在 `@/lib/payments` 的 grantPlan()，
 * 与渠道无关。加 Stripe / Paddle 时新建一个同结构的 route 即可，
 * 不要复制这份入账代码。
 */
import { NextResponse } from "next/server";
import crypto from "crypto";
import { grantPlan } from "@/lib/payments";

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
    return NextResponse.json({ ok: true }); // 其余事件直接确认，避免 Creem 反复重投
  }

  const obj = event.object ?? {};
  const metadata = (obj.metadata ?? {}) as Record<string, string>;

  const result = await grantPlan({
    provider: "creem",
    txnId: String(obj.id ?? ""),
    userId: metadata.user_id ?? "",
    planId: metadata.plan ?? "",
    amount: Number(obj.amount ?? 0) / 100, // Creem 金额单位为分
    currency: String(obj.currency ?? "USD"),
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json(result.deduped ? { ok: true, deduped: true } : { ok: true });
}
