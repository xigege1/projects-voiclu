#!/usr/bin/env node
/**
 * Resend 账号自查（+ 可选发一封真邮件）
 *
 * 用法（项目根目录）：
 *   node scripts/check-resend.mjs                     # 只查 key 与域名状态
 *   node scripts/check-resend.mjs --send you@qq.com   # 再发一封测试邮件
 *
 * 为什么需要这个脚本：
 *   缺 RESEND_API_KEY 时 lib/emails.ts 会静默跳过（`[email:skipped]`），
 *   于是「付款成功邮件没收到」看起来像 bug，其实是没配 key。
 *   配了 key 但域名没验证，Resend 会返回 403 —— 这两种失败的日志长得不一样，
 *   提前分清楚，比上线后翻 Vercel 日志省事。
 *
 * 只读：除了 --send 那一封，不会改动任何东西。
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const ENV_FILE = [".env.local", ".env"].map((f) => path.join(ROOT, f)).find((p) => fs.existsSync(p));

if (!ENV_FILE) {
  console.error("找不到 .env.local —— 请在项目根目录运行。");
  process.exit(1);
}

const raw = fs.readFileSync(ENV_FILE, "utf8");

function envValue(name) {
  const line = raw.split(/\r?\n/).find((l) => l.trim().startsWith(`${name}=`));
  if (!line) return "";
  return line.slice(line.indexOf("=") + 1).trim().replace(/^["']|["']$/g, "");
}

const KEY = process.env.RESEND_API_KEY || envValue("RESEND_API_KEY");
const FROM = process.env.RESEND_FROM || envValue("RESEND_FROM") || "Voiclu <noreply@voiclu.com>";

if (!KEY) {
  console.error("RESEND_API_KEY 为空。");
  console.error("→ 去 https://resend.com/api-keys 建一个（权限选 Sending access 即可），");
  console.error("  然后写进 .env.local 与 Vercel 环境变量，再重跑本脚本。");
  process.exit(1);
}

const auth = { Authorization: `Bearer ${KEY}` };

function fromDomain(addr) {
  const m = /@([^>\s]+)/.exec(addr);
  return m ? m[1] : "";
}

async function main() {
  console.log(`key 前缀：${KEY.slice(0, 6)}…  （长度 ${KEY.length}）`);
  console.log(`发件人：${FROM}`);
  console.log("");

  // 1) key 是否有效 + 域名列表
  const res = await fetch("https://api.resend.com/domains", { headers: auth });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error(`✘ 查域名失败：HTTP ${res.status} ${text.slice(0, 300)}`);
    console.error("  401 = key 无效；403 = key 权限不足（换成 Full access 或 Sending access）。");
    process.exit(1);
  }

  const data = await res.json();
  const domains = data?.data ?? [];
  if (!domains.length) {
    console.log("账号下还没有域名 —— 只能发到自己的注册邮箱（onboarding@resend.dev），无法发给用户。");
  } else {
    console.log("域名：");
    for (const d of domains) {
      const mark = d.status === "verified" ? "✔" : "✘";
      console.log(`  ${mark} ${d.name}  status=${d.status}  region=${d.region ?? "-"}`);
    }
  }

  const want = fromDomain(FROM);
  const hit = domains.find((d) => d.name === want);
  console.log("");
  if (!hit) {
    console.error(`✘ 发件域 ${want || "(解析失败)"} 不在账号下 —— 发信必然 403。`);
    console.error("  → 先在 Resend 添加域名，再到 Cloudflare 加它给的 MX/SPF/DKIM 记录。");
    process.exit(1);
  }
  if (hit.status !== "verified") {
    console.error(`✘ ${want} 状态是 ${hit.status}，还没验证通过 —— 发信会 403。`);
    console.error("  → 去 Resend 域名页看缺哪条 DNS 记录（DKIM 最常见），在 Cloudflare 补上。");
    process.exit(1);
  }
  console.log(`✔ ${want} 已验证，可以发信。`);

  // 2) 可选：真发一封
  const idx = process.argv.indexOf("--send");
  const to = idx > -1 ? process.argv[idx + 1] : null;
  if (!to) {
    console.log("");
    console.log("要验证投递，加参数：node scripts/check-resend.mjs --send 你的邮箱");
    return;
  }

  const sendRes = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { ...auth, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: FROM,
      to,
      subject: "Voiclu transactional email test",
      text: [
        "This is a deliverability test from the Voiclu backend.",
        "",
        "If you can read this, the Resend key and the sending domain are both working,",
        "so payment receipts and free-generation emails will reach customers.",
      ].join("\n"),
    }),
  });
  const out = await sendRes.text();
  if (!sendRes.ok) {
    console.error(`✘ 发送失败：HTTP ${sendRes.status} ${out.slice(0, 300)}`);
    process.exit(1);
  }
  let id = "";
  try {
    id = JSON.parse(out).id ?? "";
  } catch {
    /* 忽略 */
  }
  console.log(`✔ 已交给 Resend，id=${id || "(未返回)"}，收件人 ${to}`);
  console.log("  没收到就查垃圾箱，并在 Resend → Logs 看这笔的投递状态。");
}

main().catch((e) => {
  console.error("脚本异常：", e);
  process.exit(1);
});
