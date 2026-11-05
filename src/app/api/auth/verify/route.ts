/**
 * POST /api/auth/verify
 * body: { email, code } → Supabase verifyOtp
 * 成功 → upsert public.users 行 + 返回 session token（前端存内存/sessionStorage 使用）
 */
import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";


export async function POST(req: Request) {
  const { email, code } = (await req.json()) as { email?: string; code?: string };
  if (!email || !code) {
    return NextResponse.json({ error: "email_and_code_required" }, { status: 400 });
  }

  const db = getSupabaseAdmin();
  const { data, error } = await db.auth.verifyOtp({
    email,
    token: code,
    type: "email",
  });

  if (error || !data.session || !data.user) {
    return NextResponse.json({ error: "invalid_code", message: "Wrong or expired code." }, { status: 401 });
  }

  // 首次登录建业务行（幂等）
  await db.from("users").upsert(
    { id: data.user.id, email, plan: "free", credits_left: 0 },
    { onConflict: "id" }
  );

  return NextResponse.json({
    ok: true,
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
    user_id: data.user.id,
  });
}
