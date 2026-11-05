/**
 * 全局常量 —— 价格、额度、语言数
 * 依据方案：字符计费（1 字符 = 1 credit，1000 字符 ≈ 1 分钟音频）
 * 换算：20 分钟 = 20,000 字符 / 80 分钟 = 80,000 字符 / 40 分钟 = 40,000 字符
 * 注意：LANG_COUNT 按你最终使用的 TTS 供应商实际支持语言数修改，
 * 页面文案里的 "75+" 必须与产品真实能力一致，不要虚假宣传。
 */
export const SITE = {
  name: "Voiclu",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://voiclu.com",
  supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "support@voiclu.com",
};

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
      "WAV output + priority queue",
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
    a: "Free samples carry a small \"generated with Voiclu\" tag. Paid output has no tag. Every file is marked as AI-generated in its metadata.",
  },
  {
    q: "What file format do I get?",
    a: "MP3 on all plans. WAV on Creator. Files download straight from the browser — no queue, no waiting rooms.",
  },
  {
    q: "Can I get my money back?",
    a: "Yes — 30 days, no interview, no form. Email us and the last payment is refunded in full. See the refund page for the two exceptions.",
  },
];
