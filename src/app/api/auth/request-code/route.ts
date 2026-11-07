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
    // Supabase 的原始报错对用户没有意义，且会把 "Error sending confirmation email"
    // 这种 SMTP 故障直接甩到界面上。按可行动性分类后再返回。
    const raw = error.message ?? "";
    console.error("[auth:request-code]", raw);

    if (/only request this after|rate limit|too many/i.test(raw)) {
      return NextResponse.json(
        { error: "rate_limited", message: "Too many attempts. Please wait a minute and try again." },
        { status: 429 }
      );
    }
    if (/sending confirmation|error sending|smtp/i.test(raw)) {
      return NextResponse.json(
        {
          error: "email_undeliverable",
          message: `We could not deliver the code to ${email}. Please try again in a minute, or email support@voiclu.com and we will sign you in manually.`,
        },
        { status: 502 }
      );
    }
    return NextResponse.json({ error: "otp_failed", message: raw }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
