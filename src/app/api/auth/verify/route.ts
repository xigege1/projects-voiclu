/**
 * POST /api/auth/verify
 * body: { email, code } → Supabase verifyOtp
 * 成功 → upsert public.users 行 + 返回 session token（前端存内存/sessionStorage 使用）
 */
import { NextResponse } from "next/server";
import { getSupabaseAdmin, getSupabaseAuth } from "@/lib/supabase";


export async function POST(req: Request) {
  const { email, code } = (await req.json()) as { email?: string; code?: string };
  if (!email || !code) {
    return NextResponse.json({ error: "email_and_code_required" }, { status: 400 });
  }

  // 认证走独立客户端：verifyOtp 会在这个实例上留下用户 session，
  // 若与数据共用实例，后续写库会以 authenticated 身份被 RLS 拦下。
  const auth = getSupabaseAuth();
  const { data, error } = await auth.auth.verifyOtp({
    email,
    token: code,
    type: "email",
  });

  if (error || !data.session || !data.user) {
    return NextResponse.json({ error: "invalid_code", message: "Wrong or expired code." }, { status: 401 });
  }

  // 首次登录建业务行。ignoreDuplicates 保证已存在的行不被覆盖，
  // 否则付费用户每次重新登录都会被重置成 credits_left = 0（等于白送额度）。
  const db = getSupabaseAdmin();
  const { error: upErr } = await db.from("users").upsert(
    { id: data.user.id, email, plan: "free", credits_left: 0 },
    { onConflict: "id", ignoreDuplicates: true }
  );
  if (upErr) {
    // 不能静默失败：建不出业务行会导致后续额度判断全部异常
    console.error("[auth/verify] users upsert failed:", upErr);
    return NextResponse.json(
      { error: "db_error", message: upErr.message, details: upErr.details ?? null, hint: upErr.hint ?? null },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
    user_id: data.user.id,
  });
}
