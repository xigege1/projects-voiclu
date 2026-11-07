/**
 * GET /api/health/orders?user=<uuid> —— 生产环境只读对账探针
 *
 * 为什么需要它：
 *   收款后的入账结果（orders 行、额度余额、首付是否被重复加额度）
 *   只存在于数据库里。开发机常常连不上 *.supabase.co（TLS 被中间设备重置），
 *   于是「钱收了但额度没加」这类故障只能等用户投诉才发现。
 *
 * 安全边界：
 *   - 必须带 `x-probe-token`，值与 SUPABASE_SERVICE_ROLE_KEY 相同
 *   - 未授权一律 404，不对探测者确认这个路由存在
 *   - 只读，不接受任何写操作
 *   - 只回订单元数据与额度余额，不回邮箱、姓名、支付方式
 */
import { NextResponse, connection } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(req: Request) {
  await connection();

  const required = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ?? "";
  const given = req.headers.get("x-probe-token")?.trim() ?? "";
  if (!required || given !== required) {
    return new NextResponse("Not Found", { status: 404 });
  }

  const userId = new URL(req.url).searchParams.get("user")?.trim() ?? "";
  if (!UUID_RE.test(userId)) {
    return NextResponse.json({ ok: false, error: "user_uuid_required" }, { status: 400 });
  }

  const db = getSupabaseAdmin();

  const { data: user, error: userErr } = await db
    .from("users")
    .select("id, plan, credits_left, created_at")
    .eq("id", userId)
    .maybeSingle();
  if (userErr) {
    return NextResponse.json({ ok: false, error: "users_query_failed", detail: userErr.message }, { status: 500 });
  }

  const { data: orders, error: orderErr } = await db
    .from("orders")
    .select("plan, provider, provider_txn, amount, currency, status, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(5);
  if (orderErr) {
    return NextResponse.json({ ok: false, error: "orders_query_failed", detail: orderErr.message }, { status: 500 });
  }

  const rows = orders ?? [];
  const txns = new Set(rows.map((r) => `${r.provider}:${r.provider_txn}`));

  return NextResponse.json({
    ok: true,
    user: user ?? null,
    orderCount: rows.length,
    orders: rows,
    // 同一笔交易出现多行 = 首付双事件重复入账，是必须立刻发现的事故
    distinctTxns: txns.size,
  });
}
