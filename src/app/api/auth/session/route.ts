/**
 * POST /api/auth/session
 * body: { access_token }
 * 用途：用户点邮件里的链接后，Supabase 会把 access_token 放在 URL 的 #hash 里。
 * 前端把它交过来，这里校验 token 真实性、补建业务行、返回用户信息。
 *
 * 注意：users 行用 ignoreDuplicates，绝不能覆盖已有 credits_left，
 * 否则付费用户重新登录会被清零额度。
 */
import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function POST(req: Request) {
  const { access_token } = (await req.json()) as { access_token?: string };
  if (!access_token) {
    return NextResponse.json({ error: "token_required" }, { status: 400 });
  }

  const db = getSupabaseAdmin();
  const { data, error } = await db.auth.getUser(access_token);
  const user = data?.user;

  if (error || !user || !user.email) {
    return NextResponse.json({ error: "invalid_token" }, { status: 401 });
  }

  const { error: upErr } = await db.from("users").upsert(
    { id: user.id, email: user.email, plan: "free", credits_left: 0 },
    { onConflict: "id", ignoreDuplicates: true }
  );
  if (upErr) {
    return NextResponse.json({ error: "db_error", message: upErr.message }, { status: 500 });
  }

  const { data: row } = await db
    .from("users")
    .select("plan, credits_left")
    .eq("id", user.id)
    .maybeSingle();

  return NextResponse.json({
    ok: true,
    user_id: user.id,
    email: user.email,
    plan: row?.plan ?? "free",
    credits_left: row?.credits_left ?? 0,
  });
}
