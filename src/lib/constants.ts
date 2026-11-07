/**
 * 全局常量 —— 价格、额度、语言数
 * 依据方案：字符计费（1 字符 = 1 credit，1000 字符 ≈ 1 分钟音频）
 * 换算：20 分钟 = 20,000 字符 / 80 分钟 = 80,000 字符 / 40 分钟 = 40,000 字符
 * 注意：LANG_COUNT 必须 ≤ 当前 TTS 模型真实支持的语言数，
 * 页面文案里的 "75+" 不得超出产品真实能力（见下方 TTS 配置说明）。
 */
export const SITE = {
  name: "Voiclu",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://voiclu.com",
  supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "support@voiclu.com",
};

/**
 * 内容最后更新日（手动维护，改文案/加页面时更新这里）
 * 不要用 new Date()：sitemap 的 lastmod 每次请求都变成"现在"，
 * 等于告诉 Google 全站每秒都在变，lastmod 会被判定不可靠而忽略。
 */
export const CONTENT_UPDATED = "2026-11-05";

/**
 * 2026-11-06 新增 /about、/contact，并把 /terms、/privacy 的占位符清干净。
 * sitemap 按页面分别记 lastmod，新增页用这个日期，不再全站共用 CONTENT_UPDATED。
 */
export const PAGES_ADDED = "2026-11-06";

/**
 * 条款适用法域 + 政策更新时间。
 *
 * GOVERNING_LAW 默认 Singapore（SaaS 出海最常见的注册地，Creem / Paddle 都支持）。
 * ⚠️ 上线收款前必须按实际经营主体确认：
 *   - 新加坡公司 → "Singapore"
 *   - 美国主体   → "the State of Delaware, United States"
 * 改这里或用环境变量 NEXT_PUBLIC_GOVERNING_LAW 覆盖，改完要重新部署（页面是静态预渲染）。
 */
export const GOVERNING_LAW = process.env.NEXT_PUBLIC_GOVERNING_LAW || "Singapore";

/**
 * 法务页显示用（sitemap 用的 CONTENT_UPDATED 是机器口径，这个是给人看的）
 *
 * 2026-11-08 更新：Creem 商户审核要求 — /privacy 补真实处理方与存储区域，
 * /terms 增加 3.1 NSFW 内容禁令。改条款必须同步这个日期。
 */
export const LEGAL_UPDATED = "November 8, 2026";

/**
 * 法务页正文最后改动日（sitemap lastmod 用）。
 *
 * 2026-11-08：Creem 审核打回后改 /privacy（补真实处理方与区域）、/terms（加 3.1
 * NSFW 禁令）、新增 /aup。三条 URL 共用这一天，因为确实同一天改的。
 */
export const LEGAL_REVISED = "2026-11-08";

/**
 * TTS 能力与对外文案的一致性（2026-11-07 核对 ElevenLabs 官方 models 文档）
 *
 * 旧配置 eleven_multilingual_v2 只有 29 种语言，全站却写 "75+" —— 名不副实。
 * 现改用 eleven_v4：官方标称 90+ languages、单次上限 10,000 字符，
 * 与 /api/tts 的 10,000 校验一致。于是 "75+" 变成保守的下限表述，
 * 不需要改动任何页面文案。模型可在服务端用 ELEVENLABS_MODEL_ID 覆盖。
 *
 * 换模型时必需同步确认：新模型语言数 ≥ LANG_COUNT，否则下调文案。
 */
export const TTS_MODEL_LANGS = 90;
export const TTS_MODEL_MAX_CHARS = 10_000;

/** 对外文案用保守值：真实能力 90+，写 75+ 不会失真 */
export const LANG_COUNT = 75;
export const LANG_COUNT_LABEL = "75+";

export const FREE_CHARS = 150; // 免费生成 1 次，≤150 字符（约 30 秒）

export const MAX_UPLOAD_MB = 10;
export const MIN_AUDIO_SEC = 30;
export const MAX_AUDIO_SEC = 180;

export const PLANS = [
  {
    id: "starter",
    name: "Starter",
    price: 9.9,
    period: "/mo",
    chars: 20_000,
    minutes: 20,
    highlight: false,
    features: [
      "20,000 characters / month (~20 min)",
      `All ${LANG_COUNT_LABEL} languages`,
      "Commercial license",
      "Voice re-cloning",
      "No watermark",
    ],
  },
  {
    id: "creator",
    name: "Creator",
    price: 29,
    period: "/mo",
    chars: 80_000,
    minutes: 80,
    highlight: true,
    features: [
      "80,000 characters / month (~80 min)",
      `All ${LANG_COUNT_LABEL} languages`,
      "Commercial license",
      "Voice re-cloning",
      "No watermark",
    ],
  },
  {
    id: "onetime",
    name: "One-time",
    price: 49,
    period: " once",
    chars: 40_000,
    minutes: 40,
    highlight: false,
    features: [
      "40,000 characters, one-time (~40 min)",
      "No subscription, never renews",
      `All ${LANG_COUNT_LABEL} languages`,
      "Commercial license",
      "30-day money-back guarantee",
    ],
  },
] as const;

/** 年付：5 个月价格买 12 个月（LTV +25%，哥飞 2023-12-13 的算法） */
export const ANNUAL_NOTE =
  "Annual plans: pay for 5 months, get 12. Available at checkout.";

export const FAQ_HOME = [
  {
    q: "How much audio do you need to clone my voice?",
    a: "Between 30 seconds and 3 minutes of clean speech — no music, no echo, no other voices. A quiet room and your normal voice are enough.",
  },
  {
    q: "How many languages can my cloned voice speak?",
    a: `${LANG_COUNT_LABEL} languages. You clone once, then type text in any supported language — the voice stays yours.`,
  },
  {
    q: "Is it really free to try?",
    a: "Yes. One full generation, no credit card, no automatic subscription. Sign-up is only needed if you want to keep the voice profile.",
  },
  {
    q: "Can I clone someone else's voice?",
    a: "Only with their written permission. Every clone requires a consent confirmation before it starts, and we log it. Reported voices are taken down.",
  },
  {
    q: "Do I own the audio I generate?",
    a: "You own the samples you upload and the audio you generate. Paid plans include a commercial license. We only store samples for safety review.",
  },
  {
    q: "Is there a watermark?",
    a: "No. Nothing is tagged, free or paid — what you hear in the preview is what you download. Because there is no watermark, our terms ask you to disclose that the voice is synthetic when you publish the audio.",
  },
  {
    q: "What file format do I get?",
    a: "MP3 on every plan. Files download straight from the browser — no queue, no waiting rooms.",
  },
  {
    q: "Can I get my money back?",
    a: "Yes — 30 days, no interview, no form. Email us and the last payment is refunded in full. See the refund page for the two exceptions.",
  },
];
