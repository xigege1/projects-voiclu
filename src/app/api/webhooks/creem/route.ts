/**
 * POST /api/webhooks/creem
 * Creem（Merchant of Record）支付回调 —— 只做验签 + 事件归一化。
 *
 * 入账逻辑（幂等 / 加额度 / 发邮件）在 `@/lib/payments` 的 grantPlan()，
 * 与渠道无关。加 Stripe / Paddle 时新建一个同结构的 route 即可，
 * 不要复制这份入账代码。
 *
 * 三个容易踩的坑（都踩过了，别再踩）：
 *   1. Creem 没有 `payment.succeeded` 这个事件。续费发的是 `subscription.paid`，
 *      只处理 checkout.completed 会导致「第二个月付了钱、额度不加」。
 *   2. 首付会同时触发 checkout.completed 和 subscription.paid。两边的交易号
 *      必须取同一个（order.transaction / last_transaction.id），否则会重复加额度。
 *   3. 金额在 `order.amount_paid` / `last_transaction.amount_paid`，单位是分；
 *      不是顶层 object.amount。
 */
import { NextResponse } from "next/server";
import crypto from "crypto";
import { grantPlan } from "@/lib/payments";
import { planForProductId } from "@/lib/creem";
import { getSupabaseAdmin } from "@/lib/supabase";

type Json = Record<string, unknown>;

const asObj = (v: unknown): Json =>
  v && typeof v === "object" && !Array.isArray(v) ? (v as Json) : {};
const asStr = (v: unknown): string => (typeof v === "string" ? v : v == null ? "" : String(v));
const asNum = (v: unknown): number => (typeof v === "number" && Number.isFinite(v) ? v : 0);

function verifyCreemSignature(rawBody: string, signature: string): boolean {
  const secret = process.env.CREEM_WEBHOOK_SECRET;
  if (!secret || !signature) return false;
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

/** metadata 没带上 user_id 时的兜底：按邮箱找已注册用户 */
async function userIdByEmail(email: string): Promise<string> {
  if (!email) return "";
  const { data } = await getSupabaseAdmin()
    .from("users")
    .select("id")
    .eq("email", email)
    .maybeSingle();
  return data?.id ?? "";
}

async function credit(opts: {
  txnId: string;
  userId: string;
  planId: string;
  amountMinor: number;
  currency: string;
  source: string;
}) {
  const { txnId, userId, planId, amountMinor, currency, source } = opts;

  if (!txnId || !userId || !planId) {
    // 入不了账说明配置或 metadata 有问题，返回 400 让它显示为失败（Creem 会重试 5 次），
    // 不要返回 200 把问题藏起来 —— 钱已经收了，账必须能对。
    console.error(`[creem:${source}] 无法入账`, { txnId, userId, planId });
    return NextResponse.json(
      {
        error: "missing_fields",
        got: { txnId: Boolean(txnId), userId: Boolean(userId), planId: Boolean(planId) },
      },
      { status: 400 }
    );
  }

  let result;
  try {
    result = await grantPlan({
      provider: "creem",
      txnId,
      userId,
      planId,
      amount: amountMinor / 100, // Creem 金额单位为分
      currency,
    });
  } catch (e) {
    // grantPlan 内部已回滚订单行，这里回 500，让 Creem 重试时能真正重新入账
    console.error(`[creem:${source}] 入账异常`, { txnId, userId, planId, err: String(e).slice(0, 200) });
    return NextResponse.json({ error: "grant_failed" }, { status: 500 });
  }

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json(result.deduped ? { ok: true, deduped: true } : { ok: true });
}

/** checkout.completed —— 一次性购买，以及订阅首付 */
async function handleCheckoutCompleted(object: Json) {
  const order = asObj(object.order);
  const product = asObj(object.product);
  const metadata = asObj(object.metadata);

  // 以产品为准反查套餐，metadata.plan 只作兜底（防止产品 ID 配错时无声无息）
  const planId = planForProductId(asStr(product.id)) ?? asStr(metadata.plan);

  // 首付时 order.transaction 与 subscription.paid 的 last_transaction.id 相同，靠它对齐去重
  const txnId = asStr(order.transaction) || asStr(order.id) || asStr(object.id);

  return credit({
    txnId,
    userId: asStr(metadata.user_id),
    planId,
    amountMinor: asNum(order.amount_paid) || asNum(order.amount),
    currency: asStr(order.currency) || "USD",
    source: "checkout.completed",
  });
}

/** subscription.paid —— 首付 + 每次续费。只处理首付的话，第二个月就断供 */
async function handleSubscriptionPaid(object: Json) {
  const metadata = asObj(object.metadata);
  const product = asObj(object.product);
  const customer = asObj(object.customer);
  const tx = asObj(object.last_transaction);

  const planId = planForProductId(asStr(product.id)) ?? asStr(metadata.plan);
  let userId = asStr(metadata.user_id);
  if (!userId) userId = await userIdByEmail(asStr(customer.email));

  // 注意：last_transaction.customer 在这个事件里是 null，客户信息只能从 object.customer 读
  const txnId = asStr(tx.id) || asStr(object.id);

  return credit({
    txnId,
    userId,
    planId,
    // 订阅事件没有 order 对象，金额在 last_transaction.amount_paid
    amountMinor: asNum(tx.amount_paid) || asNum(tx.amount),
    currency: asStr(tx.currency) || "USD",
    source: "subscription.paid",
  });
}

/**
 * refund.created —— 只标记订单状态，不自动扣额度。
 * 扣额度是不可逆动作，且可能把余额打成负数；留给人工按 /refund 的条款处理。
 */
async function handleRefund(object: Json) {
  const tx = asObj(object.transaction);
  const order = asObj(object.order);
  const ids = [asStr(order.id), asStr(tx.id), asStr(object.id)].filter(Boolean);

  if (ids.length === 0) return NextResponse.json({ ok: true, ignored: "refund_no_ids" });

  const { error } = await getSupabaseAdmin()
    .from("orders")
    .update({ status: "refunded" })
    .eq("provider", "creem")
    .in("provider_txn", ids);

  if (error) {
    console.error("[creem:refund]", error);
    return NextResponse.json({ error: "refund_update_failed" }, { status: 500 });
  }
  console.warn("[creem:refund] 已标记退款，额度未自动回收，需人工处理", { ids });
  return NextResponse.json({ ok: true });
}

export async function POST(req: Request) {
  const raw = await req.text();
  const signature = req.headers.get("creem-signature") ?? "";

  if (!verifyCreemSignature(raw, signature)) {
    return NextResponse.json({ error: "bad_signature" }, { status: 401 });
  }

  let event: Json;
  try {
    event = JSON.parse(raw) as Json;
  } catch {
    return NextResponse.json({ error: "bad_json" }, { status: 400 });
  }

  const type = asStr(event.eventType);
  const object = asObj(event.object);

  switch (type) {
    case "checkout.completed":
      return handleCheckoutCompleted(object);
    case "subscription.paid":
      return handleSubscriptionPaid(object);
    case "refund.created":
      return handleRefund(object);
    default:
      // 其余事件（subscription.active / canceled / past_due 等）直接确认，避免反复重投
      return NextResponse.json({ ok: true, ignored: type });
  }
}
