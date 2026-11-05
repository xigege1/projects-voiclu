import { cookies } from "next/headers";
import crypto from "crypto";

/**
 * 身份解析：
 *   1. 优先从 Supabase session（Authorization bearer 或 sb cookie）取登录用户
 *   2. 未登录 → 发一个 voiclu_aid 匿名 cookie（uuid），匿名免费次数记库
 * 额度永远记在数据库（usage 表），清缓存换浏览器只能绕过匿名次数，
 * 注册后的账号次数绕不过 —— 这是「免注册可试 1 次」与「注册送额度」的折中。
 */
const ANON_COOKIE = "voiclu_aid";

export async function resolveIdentity(req: Request): Promise<{ userId: string; authed: boolean }> {
  // 1) Bearer token（前端 fetch 带 access_token）
  const auth = req.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) {
    const token = auth.slice(7);
    const user = await getUserFromToken(token);
    if (user) return { userId: user, authed: true };
  }

  // 2) 匿名 cookie
  const store = await cookies();
  let aid = store.get(ANON_COOKIE)?.value;
  if (!aid || !/^[\w-]{8,64}$/.test(aid)) {
    aid = crypto.randomUUID();
    // 注意：在 route handler 里 cookies().set 可直接生效
    store.set(ANON_COOKIE, aid, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 365,
    });
  }
  return { userId: `anon:${aid}`, authed: false };
}

async function getUserFromToken(token: string): Promise<string | null> {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const res = await fetch(`${url}/auth/v1/user`, {
      headers: { Authorization: `Bearer ${token}`, apikey: key },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { id?: string };
    return data.id ?? null;
  } catch {
    return null;
  }
}
