/**
 * POST /api/health/orders/replay —— 单笔交易重放（运维用）
 *
 * 用途：某笔交易已经写进 orders，但加额度那一步失败了。
 * 此时订单的唯一键会命中幂等分支，渠道再怎么重试都不会补额度——
 * 只能在删掉那行订单后重新执行一次入账。
 *
 * 安全边界：
 *   - 必须带 `x-probe-token`，值与 SUPABASE_SERVICE_ROLE_KEY 相同
 *   - 未授权一律 404
 *   - 只允许重放已经存在于 orders 表里的交易，不能凭空造单
 *   - 重放前先删订单行，grantPlan 会用同一 txn 重新插入，因此不会重复加额度
 *     （删不掉就中止，不会出现「加了额度但订单没了」）
 */
import { NextResponse, connection } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { grantPlan, type PaymentProvider } from "@/lib/payments";

export async function POST(req: Request) {
  await connection();

  const required = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ?? "";
  const given = req.headers.get("x-probe-token")?.trim() ?? "";
  if (!required || given !== required) {
    return new NextResponse("Not Found", { status: 404 });
  }

  let txn = "";
  try {
    txn = String(((await req.json()) as { txn?: string }).txn ?? "").trim();
  } catch {
    /* 留空，下面报错 */
  }
  if (!txn) {
    return NextResponse.json({ ok: false, error: "txn_required" }, { status: 400 });
  }

  const db = getSupabaseAdmin();

  const { data: order, error: findErr } = await db
    .from("orders")
    .select("id, user_id, plan, provider, provider_txn, amount, currency, status")
    .eq("provider_txn", txn)
    .maybeSingle();

  if (findErr) {
    return NextResponse.json({ ok: false, error: "query_failed", detail: findErr.message }, { status: 500 });
  }
  if (!order) {
    return NextResponse.json({ ok: false, error: "order_not_found" }, { status: 404 });
  }

  const { error: delErr } = await db.from("orders").delete().eq("id", order.id);
  if (delErr) {
    // 删不掉就中止：否则重放会命中幂等分支，静默什么都不做
    return NextResponse.json({ ok: false, error: "delete_failed", detail: delErr.message }, { status: 500 });
  }

  let result;
  try {
    result = await grantPlan({
      provider: order.provider as PaymentProvider,
      txnId: order.provider_txn,
      userId: order.user_id,
      planId: order.plan,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (e) {
    console.error("[orders:replay] 重放失败", { txn, err: String(e).slice(0, 200) });
    return NextResponse.json({ ok: false, error: "replay_failed", detail: String(e).slice(0, 200) }, { status: 500 });
  }

  const { data: user } = await db
    .from("users")
    .select("plan, credits_left")
    .eq("id", order.user_id)
    .maybeSingle();

  return NextResponse.json({ ok: true, replayed: txn, result, user });
}
