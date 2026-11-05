import { createClient, SupabaseClient } from "@supabase/supabase-js";

/**
 * 服务端 Supabase 客户端（service_role，绕过 RLS，只在服务端用）
 * 环境变量见 .env.example
 *
 * ⚠️ 必须分成两个独立实例：
 * supabase-js 的客户端在 signIn / verifyOtp 之后会把「用户 session」记在实例上，
 * 之后这个实例发出的 PostgREST 请求就会带上用户 JWT（角色 authenticated），
 * RLS 立刻生效 → 写库报 "new row violates row-level security policy"。
 *
 * 又因为客户端是模块级单例（同进程所有请求共享），一个用户登录后
 * 会影响后续其他请求。所以：认证操作只走 authClient，数据库操作只走 dbClient。
 */

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function assertEnv() {
  if (!URL || !SERVICE_KEY) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY — see .env.example"
    );
  }
}

let _db: SupabaseClient | null = null;
let _auth: SupabaseClient | null = null;

/** 数据客户端：只用于 from(...) / rpc(...)，始终保持 service_role 身份 */
export function getSupabaseAdmin(): SupabaseClient {
  if (_db) return _db;
  assertEnv();
  _db = createClient(URL!, SERVICE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  return _db;
}

/** 认证客户端：只用于 signInWithOtp / verifyOtp / getUser，不碰业务表 */
export function getSupabaseAuth(): SupabaseClient {
  if (_auth) return _auth;
  assertEnv();
  _auth = createClient(URL!, SERVICE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  return _auth;
}
