/**
 * GET /api/billing/portal
 * → { url }  （前端拿到后 window.location.href = url）
 *
 * 为什么是一个接口而不是普通链接：
 *   登录态在 sessionStorage 的 Bearer token 里，`<a href>` 带不上 Authorization 头，
 *   服务端认不出是谁，就取不到该用哪个邮箱去 Creem 反查客户。
 *
 * 为什么按邮箱查而不是存 customer_id：
 *   Creem 支持 `GET /v1/customers?email=`，而我们本来就有用户邮箱。
 *   存第三方 ID 只会多一个会和渠道不同步的字段。
 */
import { NextResponse } from "next/server";
import { resolveIdentity } from "@/lib/identity";
import { getSupabaseAdmin } from "@/lib/supabase";
import { customerPortalLink } from "@/lib/creem";

export async function GET(req: Request) {
  const identity = await resolveIdentity(req);
  if (!identity.authed) {
    return NextResponse.json({ error: "login_required" }, { status: 401 });
  }

  let email: string | null = null;
  try {
    const { data } = await getSupabaseAdmin()
      .from("users")
      .select("email")
      .eq("id", identity.userId)
      .maybeSingle();
    email = data?.email ?? null;
  } catch {
    /* 落下去走 no_email */
  }

  if (!email) {
    return NextResponse.json({ error: "no_email" }, { status: 400 });
  }

  const result = await customerPortalLink(email);
  if (!result.ok) {
    // not_found 的语义是「这个邮箱还没买过东西」，前端据此换个说法，不当成报错
    const status = result.error === "not_found" ? 404 : result.error === "not_configured" ? 503 : 502;
    return NextResponse.json({ error: result.error }, { status });
  }

  return NextResponse.json({ url: result.url });
}
