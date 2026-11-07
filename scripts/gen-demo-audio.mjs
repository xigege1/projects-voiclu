#!/usr/bin/env node
/**
 * 一键生成 public/demo/ 的全部试听音频
 *
 * 背景：DemoSection 与 /br 页的播放器都指向 public/demo/ 下的固定文件名，
 * 文件缺失时首页只显示 "Sample audio coming soon"。这个脚本负责把那批文件生成出来。
 *
 * 用法（项目根目录）：
 *   node scripts/gen-demo-audio.mjs --dry-run                 # 只看计划与预估 credits，不调接口
 *   node scripts/gen-demo-audio.mjs --voice-id <voice_id>     # 用账号里已有的声音
 *   node scripts/gen-demo-audio.mjs --clone ./my-voice.mp3    # 从样本克隆（需 Starter 及以上）
 *   node scripts/gen-demo-audio.mjs --clone ./v.wav --name "My Voice"
 *
 * 常用选项：
 *   --originals <dir>   该目录下有 original-1.mp3 / original-2.mp3 时，直接复制为「原声」，
 *                       不再用 TTS 合成。原声用真人录音效果最真实（需本人或书面授权）。
 *   --model <id>        TTS 模型，默认取 ELEVENLABS_MODEL_ID，否则 eleven_v4
 *   --emotion-model <id> 情绪样本用的模型（靠音频标签控制情绪），默认 eleven_v3
 *   --only es,zh,ja     只生成指定语言
 *   --force             覆盖已存在的文件
 *   --list-voices       只列出账号可用声音，不生成
 *
 * 只读/写入：.env.local（仅在克隆成功后写 ELEVENLABS_DEMO_VOICE_ID 提示）、
 * public/demo/*.mp3、.demo/voice.json（记住上次用的 voice_id，避免每次重挑）
 */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const ROOT = process.cwd();
const DEMO_DIR = path.join(ROOT, "public", "demo");
const STATE_DIR = path.join(ROOT, ".demo");
const STATE_FILE = path.join(STATE_DIR, "voice.json");
const API = "https://api.elevenlabs.io/v1";

// ---------- 参数解析 ----------
const argv = process.argv.slice(2);
function flag(name) {
  return argv.includes(`--${name}`);
}
function opt(name, fallback = "") {
  const i = argv.indexOf(`--${name}`);
  if (i === -1) return fallback;
  const v = argv[i + 1];
  return v && !v.startsWith("--") ? v : fallback;
}

const DRY = flag("dry-run");
const FORCE = flag("force");
const LIST_ONLY = flag("list-voices");
const SKIP_ORIGINALS = flag("skip-originals");
const CLONE_FILE = opt("clone");
const CLONE_NAME = opt("name", "Voiclu Demo");
const VOICE_ID_ARG = opt("voice-id");
const ORIGINALS_DIR = opt("originals");
const ONLY = opt("only")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

// ---------- 环境变量 ----------
const ENV_FILE = [".env.local", ".env"]
  .map((f) => path.join(ROOT, f))
  .find((p) => fs.existsSync(p));

const rawEnv = ENV_FILE ? fs.readFileSync(ENV_FILE, "utf8") : "";
function envValue(name) {
  const m = rawEnv.match(new RegExp(`^\\s*${name}\\s*=\\s*(.*)$`, "m"));
  if (!m) return "";
  return m[1].trim().replace(/^["']|["']$/g, "");
}

const KEY = envValue("ELEVENLABS_API_KEY") || process.env.ELEVENLABS_API_KEY || "";
const MODEL = opt("model", envValue("ELEVENLABS_MODEL_ID") || "eleven_v4");
const EMOTION_MODEL = opt("emotion-model", "eleven_v3");

// ---------- 文案（同一句话的 8 种语言版本）----------
// 长度控制在 90~130 字符：单条 10 秒左右，成本低，试听也够。
const LANGUAGE_LINES = {
  en: "Listen closely. This is the same voice speaking a different language, without a single re-recording.",
  es: "Escucha con atención. Esta es la misma voz hablando otro idioma, sin una sola regrabación.",
  pt: "Ouça com atenção. Esta é a mesma voz falando outro idioma, sem uma única regravação.",
  zh: "仔细听。这是同一个声音在说另一种语言，没有重新录制过一次。",
  ja: "よく聞いてください。これは同じ声が別の言語を話しているところで、録り直しは一度もしていません。",
  ko: "잘 들어보세요. 같은 목소리가 다른 언어로 말하고 있습니다. 다시 녹음한 적은 단 한 번도 없습니다.",
  fr: "Écoutez bien. C'est la même voix qui parle une autre langue, sans un seul nouvel enregistrement.",
  de: "Hören Sie genau hin. Das ist dieselbe Stimme, die eine andere Sprache spricht, ohne eine einzige Neuaufnahme.",
};

// 情绪样本：文本完全相同，只靠 v3 的音频标签换情绪 —— 这样对比的变量只有情绪
const EMOTION_LINE = "I can't believe we actually pulled this off. Three months of work, and it finally works.";
const EMOTION_CLIPS = [
  { id: "excited", tag: "[excited]", stability: null },
  { id: "sad", tag: "[sad]", stability: null },
  { id: "calm", tag: "[calm]", stability: null },
];

// 输出文件清单（与 DemoSection / br 页一一对应）
const LANGUAGE_FILES = [
  "clone-es-1.mp3",
  "clone-zh-1.mp3",
  "clone-ja-1.mp3",
  "clone-ko-1.mp3",
  "clone-fr-1.mp3",
  "clone-de-1.mp3",
  "clone-en-1.mp3",
  "clone-pt-1.mp3",
];
const EMOTION_FILES = EMOTION_CLIPS.map((c) => `clone-${c.id}-2.mp3`);
const ORIGINAL_FILES = ["original-1.mp3", "original-2.mp3"];

// ---------- 工具 ----------
function log(msg) {
  console.log(msg);
}
function die(msg, hint = "") {
  console.error(`\n✗ ${msg}`);
  if (hint) console.error(`  ${hint}`);
  process.exit(1);
}
function humanSize(bytes) {
  return `${(bytes / 1024).toFixed(0)} KB`;
}
function readState() {
  try {
    return JSON.parse(fs.readFileSync(STATE_FILE, "utf8"));
  } catch {
    return {};
  }
}
function writeState(patch) {
  fs.mkdirSync(STATE_DIR, { recursive: true });
  const next = { ...readState(), ...patch };
  fs.writeFileSync(STATE_FILE, JSON.stringify(next, null, 2));
}

async function api(pathname, init = {}) {
  const res = await fetch(`${API}${pathname}`, {
    ...init,
    headers: { "xi-api-key": KEY, ...(init.headers || {}) },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    const err = new Error(`${pathname} → HTTP ${res.status} ${body.slice(0, 300)}`);
    err.status = res.status;
    throw err;
  }
  return res;
}

async function getJson(pathname) {
  const res = await api(pathname);
  return res.json();
}

function hasFfmpeg() {
  const r = spawnSync("ffmpeg", ["-version"], { stdio: "ignore" });
  return r.status === 0;
}

// ---------- 1. 预检 ----------
log("Voiclu demo 音频生成\n" + "─".repeat(56));

// 预估实际调用次数与 credits：
// 无真人原声时，多合成 2 条英文原声（clone-en-1 复用 original-1，不重复花钱）
const langJobs = Object.keys(LANGUAGE_LINES).filter((l) => !ONLY.length || ONLY.includes(l));
const emoJobs = EMOTION_CLIPS.filter((c) => !ONLY.length || ONLY.includes(c.id));
const ttsOriginals = ORIGINALS_DIR || SKIP_ORIGINALS ? 0 : ORIGINAL_FILES.length;
const reuseEn = ttsOriginals > 0 && langJobs.includes("en") ? 1 : 0;
const planned = ttsOriginals + langJobs.length - reuseEn + emoJobs.length;
const estChars =
  langJobs.reduce((n, l) => n + LANGUAGE_LINES[l].length, 0) +
  emoJobs.length * EMOTION_LINE.length +
  (ttsOriginals ? LANGUAGE_LINES.en.length + EMOTION_LINE.length : 0);

log(`  模型        : ${MODEL}（情绪样本 ${EMOTION_MODEL}）`);
log(`  输出目录    : public/demo/`);
log(`  计划生成    : ${planned} 个 mp3，约 ${estChars} 字符 ≈ ${estChars} credits`);
log(
  `  原声来源    : ${
    SKIP_ORIGINALS ? "跳过（只做单条试听）" : ORIGINALS_DIR ? `复制自 ${ORIGINALS_DIR}` : "用同一声音合成英文版"
  }`
);

if (DRY) {
  log("\n→ --dry-run：只列计划，不调接口。");
  log("\n将要写入的文件：");
  for (const f of [...ORIGINAL_FILES, ...LANGUAGE_FILES, ...EMOTION_FILES]) {
    const exists = fs.existsSync(path.join(DEMO_DIR, f));
    log(`   ${exists ? "存在" : "缺失"}  public/demo/${f}`);
  }
  process.exit(0);
}

if (!KEY) {
  die(
    "ELEVENLABS_API_KEY 还是空的。",
    "去 elevenlabs.io → 左下角头像 → API Keys → Create API Key，把 sk_ 开头那串填进 .env.local 的 ELEVENLABS_API_KEY="
  );
}

// ---------- 2. 查账号与额度 ----------
// key 若是「最小权限」（只开 文本转语音 + 音色），/user/subscription 会返回 403。
// 那种情况不影响生成，降级为「不预检额度」继续跑，别把用户挡在门外。
let sub = null;
try {
  sub = await getJson("/user/subscription");
} catch (e) {
  if (e.status === 401) die("key 无效或已被删除（401）。", "重新建一个 API Key 再试。");
  log(`\n  ! 读不到订阅信息（HTTP ${e.status || "网络错误"}）——通常是 key 没开「用户 → 读取」权限。`);
  log("    不影响生成，只是跳过额度预检；生成结束后也统计不到本次消耗。");
}
const tier = sub ? String(sub.tier ?? "unknown") : "unknown";
const beforeUsed = Number(sub?.character_count ?? 0);
const limit = Number(sub?.character_limit ?? 0);
const canClone = tier === "unknown" ? true : !new Set(["free", "trial"]).has(tier.toLowerCase());

if (sub) {
  log(`\n  订阅层级    : ${tier}`);
  log(`  本周期已用  : ${beforeUsed} / ${limit} 字符`);
  if (limit > 0 && estChars > limit - beforeUsed) {
    die(
      `剩余额度不够（还差 ${estChars - (limit - beforeUsed)} 字符）。`,
      "等下一个计费周期，或在 ElevenLabs 后台加购 credits。"
    );
  }
} else {
  log(`\n  订阅层级    : 未知（权限不足，跳过额度预检）`);
}

// ---------- 3. 决定用哪个声音 ----------
let voiceId = VOICE_ID_ARG;
let voiceLabel = VOICE_ID_ARG ? "命令行指定" : "";

if (LIST_ONLY) {
  const data = await getJson("/voices");
  const voices = Array.isArray(data.voices) ? data.voices : [];
  log(`\n可用声音 ${voices.length} 个：`);
  for (const v of voices) {
    log(`   ${v.voice_id}  ${v.name}${v.category ? `  [${v.category}]` : ""}${v.labels?.language ? `  ${v.labels.language}` : ""}`);
  }
  process.exit(0);
}

if (CLONE_FILE) {
  if (!canClone) {
    die(
      `当前是 ${tier} 层级，不支持 Instant Voice Cloning（401）。`,
      "升级到 Starter（$6/月）后重试，或改用 --voice-id <已有声音>。"
    );
  }
  const abs = path.resolve(CLONE_FILE);
  if (!fs.existsSync(abs)) die(`找不到样本文件：${abs}`);
  const buf = fs.readFileSync(abs);
  log(`\n→ 正在克隆声音（样本 ${path.basename(abs)}，${humanSize(buf.length)}）…`);
  const form = new FormData();
  form.append("name", CLONE_NAME);
  form.append("files", new Blob([buf]), path.basename(abs));
  const res = await api("/voices/add", { method: "POST", body: form });
  const data = await res.json();
  voiceId = data.voice_id;
  voiceLabel = `${CLONE_NAME}（克隆）`;
  writeState({ voiceId, voiceLabel, clonedAt: new Date().toISOString() });
  log(`✓ 克隆完成：${voiceId}`);
}

if (!voiceId) {
  const state = readState();
  if (state.voiceId) {
    voiceId = state.voiceId;
    voiceLabel = state.voiceLabel || "上次使用";
  }
}

if (!voiceId) {
  // 没有指定也没有历史：自动挑一个 premade 声音，保证脚本能一条命令跑通
  const data = await getJson("/voices");
  const voices = Array.isArray(data.voices) ? data.voices : [];
  const pick = voices.find((v) => v.category === "premade") ?? voices[0];
  if (!pick) die("账号里一个声音都没有，无法生成。");
  voiceId = pick.voice_id;
  voiceLabel = `${pick.name}（自动选择）`;
  writeState({ voiceId, voiceLabel });
  log(`\n! 未指定声音，自动选用官方预置声音：${pick.name}（${voiceId}）`);
  log("  想换成自己的声音：--clone ./样本.mp3 或 --voice-id <id>");
}

log(`\n  使用声音    : ${voiceLabel} (${voiceId})`);

// ---------- 4. 合成 ----------
fs.mkdirSync(DEMO_DIR, { recursive: true });
const written = [];
const skipped = [];
// v2 / flash 系列才接受 voice_settings；v3 / v4 传了会 400
const legacySettings = { stability: 0.5, similarity_boost: 0.75 };

async function requestAudio(body) {
  const res = await api(`/text-to-speech/${voiceId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "audio/mpeg" },
    body: JSON.stringify(body),
  });
  return Buffer.from(await res.arrayBuffer());
}

async function speak({ file, text, model = MODEL, voiceSettings = null }) {
  const dest = path.join(DEMO_DIR, file);
  if (fs.existsSync(dest) && !FORCE) {
    skipped.push(file);
    log(`   = ${file} 已存在，跳过（--force 可覆盖）`);
    return;
  }
  const body = { text, model_id: model, output_format: "mp3_44100_128" };
  if (voiceSettings) body.voice_settings = voiceSettings;

  process.stdout.write(`   … ${file} 合成中`);
  let buf;
  try {
    buf = await requestAudio(body);
  } catch (e) {
    // 账号/套餐还不支持该模型时会返回 400/403/422 —— 回退到最通用的 multilingual_v2，
    // 而不是让整批生成中断。
    const retryable = [400, 403, 404, 422].includes(e.status) && model !== "eleven_multilingual_v2";
    if (!retryable) throw e;
    process.stdout.write(`\r   ! ${file} 用 ${model} 失败（${e.status}），回退 eleven_multilingual_v2\n`);
    process.stdout.write(`   … ${file} 重新合成中`);
    buf = await requestAudio({
      text,
      model_id: "eleven_multilingual_v2",
      output_format: "mp3_44100_128",
      voice_settings: legacySettings,
    });
  }
  fs.writeFileSync(dest, buf);
  written.push({ file, bytes: buf.length });
  process.stdout.write(`\r   ✓ ${file}  ${humanSize(buf.length)}\n`);
}

// 4a. 原声
let originalsFromDir = false;
if (SKIP_ORIGINALS) {
  log("\n→ 原声：本次跳过（--skip-originals，只做单条试听）");
} else if (ORIGINALS_DIR) {
  for (const f of ORIGINAL_FILES) {
    const src = path.join(path.resolve(ORIGINALS_DIR), f);
    const dest = path.join(DEMO_DIR, f);
    if (!fs.existsSync(src)) die(`缺少原声文件：${src}`);
    if (fs.existsSync(dest) && !FORCE) {
      skipped.push(f);
      log(`   = ${f} 已存在，跳过`);
      continue;
    }
    if (path.extname(src).toLowerCase() === ".mp3") {
      fs.copyFileSync(src, dest);
    } else {
      if (!hasFfmpeg()) die(`${path.basename(src)} 不是 mp3，需要 ffmpeg 转码但本机没装。`);
      const r = spawnSync("ffmpeg", ["-y", "-i", src, "-codec:a", "libmp3lame", "-b:a", "128k", dest], {
        stdio: "ignore",
      });
      if (r.status !== 0) die(`ffmpeg 转码失败：${src}`);
    }
    written.push({ file: f, bytes: fs.statSync(dest).size });
    log(`   ✓ ${f}（复制自原声）`);
  }
  originalsFromDir = true;
} else {
  log("\n→ 原声：用同一声音合成英文版（有真人录音时建议用 --originals 替换）");
  await speak({ file: "original-1.mp3", text: LANGUAGE_LINES.en });
  // original-2 是情绪样本的原声：同样一句话，情绪中性
  await speak({ file: "original-2.mp3", text: EMOTION_LINE });
}

// 4b. 语言样本
log("\n→ 语言样本");
const langMap = {
  es: "clone-es-1.mp3",
  zh: "clone-zh-1.mp3",
  ja: "clone-ja-1.mp3",
  ko: "clone-ko-1.mp3",
  fr: "clone-fr-1.mp3",
  de: "clone-de-1.mp3",
  en: "clone-en-1.mp3",
  pt: "clone-pt-1.mp3",
};
for (const [lang, file] of Object.entries(langMap)) {
  if (ONLY.length && !ONLY.includes(lang)) continue;
  // 英文版与成对：原声就是英文时，clone-en-1 直接复用，省一次 credits
  if (lang === "en" && !originalsFromDir && !SKIP_ORIGINALS) {
    const src = path.join(DEMO_DIR, "original-1.mp3");
    const dest = path.join(DEMO_DIR, file);
    if (fs.existsSync(src) && (!fs.existsSync(dest) || FORCE)) {
      fs.copyFileSync(src, dest);
      written.push({ file, bytes: fs.statSync(dest).size });
      log(`   ✓ ${file}（复用 original-1，未额外消耗 credits）`);
      continue;
    }
  }
  await speak({
    file,
    text: LANGUAGE_LINES[lang],
    voiceSettings: MODEL.startsWith("eleven_v3") || MODEL.startsWith("eleven_v4") ? null : legacySettings,
  });
}

// 4c. 情绪样本（靠 v3 音频标签）
log(`\n→ 情绪样本（${EMOTION_MODEL} + 音频标签）`);
for (const clip of EMOTION_CLIPS) {
  if (ONLY.length && !ONLY.includes(clip.id)) continue;
  const file = `clone-${clip.id}-2.mp3`;
  try {
    await speak({ file, text: `${clip.tag} ${EMOTION_LINE}`, model: EMOTION_MODEL });
  } catch (e) {
    log(`\n   ! ${clip.id} 用 ${EMOTION_MODEL} 失败（${e.status || "?"}）：${e.message.slice(0, 120)}`);
    log(`     回退到 ${MODEL}，情绪表现会弱一些`);
    await speak({ file, text: EMOTION_LINE, model: MODEL });
  }
}

// ---------- 5. 总结 ----------
log("\n" + "─".repeat(56));
let afterUsed = beforeUsed;
let usageKnown = Boolean(sub);
try {
  const s2 = await getJson("/user/subscription");
  afterUsed = Number(s2.character_count ?? beforeUsed);
  usageKnown = true;
} catch {
  /* 统计失败不影响主流程 */
}
const totalBytes = written.reduce((n, w) => n + w.bytes, 0);
log(`生成 ${written.length} 个文件（${humanSize(totalBytes)}），跳过 ${skipped.length} 个`);
if (usageKnown) {
  log(`本次消耗 credits：${afterUsed - beforeUsed}（本周期累计 ${afterUsed} / ${limit || "?"}）`);
} else {
  log(`本次消耗 credits：约 ${estChars}（key 无「用户 → 读取」权限，读不到精确值）`);
}
log(`文件位置：public/demo/`);
log("\n下一步：");
log("  1. 本地预览：npm run dev → 首页「Hear the same voice in 6 languages」应变出播放器");
log("  2. 提交上线：git add public/demo && git commit -m \"feat(demo): add pre-generated voice samples\" && git push");
log("  3. 上线后确认 https://voiclu.com/demo/original-1.mp3 返回 200");
