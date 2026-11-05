#!/usr/bin/env node
/**
 * ElevenLabs 账号自查 + 自动配置演示声音
 *
 * 用法（在项目根目录）：
 *   node scripts/check-elevenlabs.mjs
 *
 * 做四件事：
 *   1. 读 .env.local 里的 ELEVENLABS_API_KEY
 *   2. 查订阅层级和剩余额度 —— 判断能不能真克隆
 *   3. 列出账号可用声音
 *   4. 若 ELEVENLABS_DEMO_VOICE_ID 为空，自动挑一个声音写回 .env.local
 *
 * 只读账号信息，不消耗 credits。
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
  // 从文件里读（不依赖 dotenv）
  const m = raw.match(new RegExp(`^\\s*${name}\\s*=\\s*(.*)$`, "m"));
  if (!m) return "";
  return m[1].trim().replace(/^["']|["']$/g, "");
}

const KEY = envValue("ELEVENLABS_API_KEY");
if (!KEY) {
  console.error(`✗ ${path.basename(ENV_FILE)} 里 ELEVENLABS_API_KEY 还是空的。`);
  console.error("  去 elevenlabs.io → 右下角头像 → API Keys 建一个，填进去再跑这条命令。");
  process.exit(1);
}

const API = "https://api.elevenlabs.io/v1";
const H = { "xi-api-key": KEY };

async function get(p) {
  const res = await fetch(`${API}${p}`, { headers: H });
  const text = await res.text();
  if (!res.ok) throw new Error(`${p} → HTTP ${res.status} ${text.slice(0, 200)}`);
  return JSON.parse(text);
}

console.log("→ 正在查询 ElevenLabs 账号…\n");

let sub;
try {
  sub = await get("/user/subscription");
} catch (e) {
  console.error("✗ 查询订阅信息失败：", e.message);
  console.error("  · 401 一般是 key 写错了或已被删除");
  console.error("  · 网络不通的话，本机需要挂代理再跑（HTTPS_PROXY 环境变量）");
  process.exit(1);
}

const tier = String(sub.tier ?? "unknown");
const used = Number(sub.character_count ?? 0);
const limit = Number(sub.character_limit ?? 0);
const left = Math.max(0, limit - used);

// Instant Voice Cloning 从 Starter 起才有；free / trial 不行
const FREE_TIERS = new Set(["free", "trial", "free_tier"]);
const canClone = !FREE_TIERS.has(tier.toLowerCase());

const lines = [
  `  订阅层级 : ${tier}`,
  `  本周期额度: ${used} / ${limit} 字符`,
  `  剩余额度  : ${left} 字符（约 ${Math.floor(left / 1000)} 分钟朗读稿）`,
  `  真实克隆  : ${canClone ? "✓ 支持（可以清空 ELEVENLABS_DEMO_VOICE_ID）" : "✗ 不支持（免费层级只能 TTS）"}`,
];
console.log(lines.join("\n"));

// ---- 列声音 ----
let voices = [];
try {
  const data = await get("/voices");
  voices = Array.isArray(data.voices) ? data.voices : [];
  console.log(`\n→ 账号里可用声音 ${voices.length} 个：`);
  for (const v of voices.slice(0, 12)) {
    console.log(`   · ${v.voice_id}  ${v.name}${v.category ? `  [${v.category}]` : ""}`);
  }
  if (voices.length > 12) console.log(`   … 其余 ${voices.length - 12} 个省略`);
} catch (e) {
  console.warn("\n! 读取声音列表失败：", e.message);
}

// ---- 自动写 DEMO_VOICE_ID ----
const currentDemo = envValue("ELEVENLABS_DEMO_VOICE_ID");
if (currentDemo) {
  console.log(`\n✓ ELEVENLABS_DEMO_VOICE_ID 已配置：${currentDemo}`);
} else if (voices.length === 0) {
  console.log("\n! 没有拿到声音列表，无法自动配置演示声音。手动填一个 voice_id 到 ELEVENLABS_DEMO_VOICE_ID。");
} else {
  const pick = voices.find((v) => v.category === "premade") ?? voices[0];
  let out = raw;
  if (/^\s*ELEVENLABS_DEMO_VOICE_ID\s*=/m.test(out)) {
    out = out.replace(/^\s*ELEVENLABS_DEMO_VOICE_ID\s*=.*$/m, `ELEVENLABS_DEMO_VOICE_ID=${pick.voice_id}`);
  } else {
    out = out.trimEnd() + `\nELEVENLABS_DEMO_VOICE_ID=${pick.voice_id}\n`;
  }
  fs.writeFileSync(ENV_FILE, out, "utf8");
  console.log(`\n✓ 已自动写入 ${path.basename(ENV_FILE)}：`);
  console.log(`   ELEVENLABS_DEMO_VOICE_ID=${pick.voice_id}   （${pick.name}）`);
  console.log("   现在克隆步骤会跳过真实 API，用这个声音跑通全链路。");
}

// ---- 结论 ----
console.log("\n" + "─".repeat(56));
if (canClone) {
  console.log("结论：账号已支持真实克隆。");
  console.log("      把 ELEVENLABS_DEMO_VOICE_ID 清空 → 重新部署 → 克隆的就是你自己的声音。");
} else {
  console.log("结论：免费层级，真实克隆走不通（会 401）。已配好演示声音。");
  console.log("      可验证：上传/校验、存库、TTS、R2 转存、播放、计费、缓存 —— 全部真实。");
  console.log("      验不了：克隆像不像你。这一步需要 ElevenLabs Starter（$6/月，30k credits）。");
}
console.log(`      额度提醒：剩余 ${left} 字符，够跑约 ${Math.floor(left / 150)} 次 150 字符的免费试听。`);
