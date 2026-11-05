/**
 * POST /api/auth/request-code
 * body: { email } → Supabase signInWithOtp 发送验证码邮件
 * 生产前在 Supabase Auth 设置里限制发送频率（默认已有）。
 */
import { NextResponse } from "next/server";
import { getSupabaseAuth } from "@/lib/supabase";


export async function POST(req: Request) {
  const { email } = (await req.json()) as { email?: string };
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json({ error: "invalid_email" }, { status: 400 });
  }

  const auth = getSupabaseAuth();
  const { error } = await auth.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: true },
  });

  if (error) {
    return NextResponse.json({ error: "otp_failed", message: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
