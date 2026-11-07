/**
 * GET /api/health —— 部署自检探针
 *
 * 用途：生产环境的密钥类变量（ElevenLabs / R2 / Supabase）在 Vercel 面板配完后，
 * 从外部无从判断函数进程是否真的读到了值——所有业务接口都要登录态。
 * 这个接口只回布尔值，不暴露任何密钥、长度或前缀。
 *
 * 安全边界：
 *   - 只输出 true / false，不含变量值、不含服务名之外的细节
 *   - robots.txt 已屏蔽 /api/，且设为 no-store，不进任何缓存
 *   - 若担心暴露「哪项没配」，可把 `detail` 关掉，只留 ok
 *
 * 刻意不透出的项：SUPABASE_SERVICE_ROLE_KEY 是否存在（等价于告诉外人能不能绕过 RLS）。
 */
import { NextResponse, connection } from "next/server";
import { elevenlabsConfigured } from "@/lib/elevenlabs";

// 注意：本项目开了 nextConfig.cacheComponents，route segment 的
// `export const dynamic` / `revalidate` 在此模式下不被允许（构建会直接失败）。
// 要「每次请求都重新读环境变量」，用 connection() 显式进入动态渲染。

function has(...names: string[]): boolean {
  return names.every((n) => Boolean(process.env[n]?.trim()));
}

export async function GET() {
  await connection();
  const checks = {
    // 真实生成的核心依赖
    elevenlabs: elevenlabsConfigured(),
    // 音频转存；缺了会出现「合成成功但播不出来」
    storage: has("S3_ENDPOINT", "S3_BUCKET", "S3_ACCESS_KEY_ID", "S3_SECRET_ACCESS_KEY", "S3_PUBLIC_URL"),
    // 登录与数据库
    supabase: has("NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    // 可选能力
    email: has("RESEND_API_KEY"),
    payments: has("CREEM_WEBHOOK_SECRET"),
  };

  // 这一项为 true 是「坏事」：付费账号下它会跳过真实克隆
  const demoVoiceOverride = has("ELEVENLABS_DEMO_VOICE_ID");

  return NextResponse.json(
    {
      ok: checks.elevenlabs && checks.storage && checks.supabase,
      checks,
      demoVoiceOverride,
      commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? null,
      env: process.env.VERCEL_ENV ?? "local",
    },
    { headers: { "Cache-Control": "no-store, max-age=0" } }
  );
}
