/**
 * POST /api/health/email —— 生产环境发信探针
 *
 * 为什么需要它：
 *   `/api/health` 只能判断 RESEND_API_KEY「存在」，判断不了它「有效」。
 *   而 key 一旦被重新生成，旧值在 Vercel 里仍会让探针显示 email: true，
 *   真正发信时才 401，且 lib/emails.ts 只打一行日志就吞掉——
 *   直到第一个真实用户付完钱收不到收据才会发现。
 *
 * 安全边界（刻意设得很死）：
 *   - 收件人固定为本站 support 邮箱，请求体不参与，无法被拿来给第三方发垃圾邮件
 *   - 必须带 `x-probe-token`，值与 SUPABASE_SERVICE_ROLE_KEY 相同才有权限
 *   - 未授权一律 404，不对探测者确认这个路由存在
 *   - 响应只回 Resend 的状态码与邮件 id，不回 key、不回长度
 */
import { NextResponse, connection } from "next/server";
import { SITE } from "@/lib/constants";

const TO = `support@${new URL(SITE.url).hostname.replace(/^www\./, "")}`;

export async function POST(req: Request) {
  await connection();

  const required = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ?? "";
  const given = req.headers.get("x-probe-token")?.trim() ?? "";
  if (!required || given !== required) {
    return new NextResponse("Not Found", { status: 404 });
  }

  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) {
    return NextResponse.json({ ok: false, error: "resend_not_configured" }, { status: 503 });
  }

  const from = process.env.RESEND_FROM?.trim() || `Voiclu <noreply@${new URL(SITE.url).hostname.replace(/^www\./, "")}>`;

  let res: Response;
  try {
    res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: TO,
        subject: "Voiclu production email probe",
        text: [
          "Production probe: this message is sent from the deployed Vercel function,",
          "not from a local machine.",
          "",
          "Receiving it means RESEND_API_KEY in the Production environment is valid",
          "and the sending domain passes Resend's checks.",
        ].join("\n"),
      }),
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: "resend_unreachable", detail: String(e).slice(0, 120) }, { status: 502 });
  }

  const text = await res.text().catch(() => "");
  if (!res.ok) {
    console.error(`[health:email] ${res.status} ${text.slice(0, 300)}`);
    return NextResponse.json(
      { ok: false, status: res.status, error: text.slice(0, 200) },
      { status: 502 }
    );
  }

  let id = "";
  try {
    id = (JSON.parse(text) as { id?: string }).id ?? "";
  } catch {
    /* 忽略 */
  }
  return NextResponse.json({ ok: true, id, to: TO, from });
}
