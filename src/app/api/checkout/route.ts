/**
 * POST /api/checkout
 * body: { plan: "starter" | "creator" | "onetime" }
 * → { url }   （前端拿到后 window.location.href = url，跳到 Creem 收银台）
 *
 * 为什么不用静态支付链接：静态链接无法带 metadata.user_id，
 * webhook 收到付款时就不知道这笔钱该给谁加额度。必须走会话式 checkout。
 *
 * 为什么不用 `<a href>` 直接跳：登录态在 sessionStorage（Bearer token），
 * 普通链接带不上 Authorization 头，服务端认不出用户。所以必须是前端 fetch。
 */
import { NextResponse } from "next/server";
import { resolveIdentity } from "@/lib/identity";
import { getSupabaseAdmin } from "@/lib/supabase";
import { createCheckout, isKnownPlan } from "@/lib/creem";
import { SITE } from "@/lib/constants";

export async function POST(req: Request) {
  let planId = "";
  try {
    const body = (await req.json()) as { plan?: string };
    planId = (body.plan ?? "").trim();
  } catch {
    return NextResponse.json({ error: "bad_json" }, { status: 400 });
  }

  if (!isKnownPlan(planId)) {
    return NextResponse.json({ error: "unknown_plan" }, { status: 400 });
  }

  const identity = await resolveIdentity(req);
  if (!identity.authed) {
    // 未登录时不能创建会话：付款后没有 userId 可入账
    return NextResponse.json({ error: "login_required" }, { status: 401 });
  }

  // 预填邮箱：发票、退款沟通都要用，能少一个手打错误
  let email: string | null = null;
  try {
    const { data } = await getSupabaseAdmin()
      .from("users")
      .select("email")
      .eq("id", identity.userId)
      .maybeSingle();
    email = data?.email ?? null;
  } catch {
    /* 拿不到邮箱不影响结账 */
  }

  const result = await createCheckout({
    planId,
    userId: identity.userId,
    email,
    successUrl: `${SITE.url}/success`,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return NextResponse.json({ url: result.url });
}
