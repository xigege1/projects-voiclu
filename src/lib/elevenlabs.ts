/**
 * ElevenLabs 集成 —— 只封两个能力：
 *   1. cloneVoice(): Instant Voice Cloning，上传干声 → voice_id
 *   2. synthesize():  Text to Speech，voice_id + 文本 → 音频 Buffer
 * 具体请求/响应字段以官方文档为准（不要照抄博客）：
 *   https://elevenlabs.io/docs/api-reference/voices/add
 *   https://elevenlabs.io/docs/api-reference/text-to-speech/convert
 */
const API = "https://api.elevenlabs.io/v1";

/**
 * 2026-11-07 修：旧代码写死 eleven_multilingual_v2，官方只支持 29 种语言，
 * 但全站文案是 "75+" —— 产品能力与宣传不符。
 * 换成 eleven_v4（官方 90+ languages、单次 10,000 字符，与 /api/tts 上限一致），
 * 于是 "75+" 成为保守下限表述，页面文案无需改动。
 *
 * 用 ELEVENLABS_MODEL_ID 可覆盖；回滚时设回 eleven_multilingual_v2，
 * 但那样必须同步把全站 "75+" 文案下调到 29。
 */
const MODEL_ID = process.env.ELEVENLABS_MODEL_ID || "eleven_v4";

/** 各模型单次请求字符上限（ElevenLabs 官方 models 文档，2026-11 核对） */
const MODEL_MAX_CHARS: Record<string, number> = {
  eleven_v4: 10_000,
  eleven_v4_turbo: 10_000,
  eleven_v3: 5_000,
  eleven_v3_conversational: 5_000,
  eleven_multilingual_v2: 10_000,
  eleven_flash_v2_5: 40_000,
};

/** /api/tts 用它做长度校验，换模型后不会把超长文本发给供应商再吃 400 */
export function maxCharsPerRequest(): number {
  return MODEL_MAX_CHARS[MODEL_ID] ?? 10_000;
}

/**
 * v3 / v4 系列的 voice_settings 语义与 v2 不同，参数不能直接照搬。
 * 保守起见只在 v2 / flash 系列发送 stability / similarity_boost，
 * 避免升级模型后 TTS 接口直接返回 400。
 */
function usesLegacyVoiceSettings(modelId: string): boolean {
  return modelId.startsWith("eleven_multilingual_v2") || modelId.startsWith("eleven_flash");
}

/**
 * 【演示 / 验证模式】
 * ElevenLabs 的 Instant Voice Cloning 需要 Starter（$6/月）及以上，
 * 免费额度（10k credits/月）只能做 TTS，调 /voices/add 会直接 401。
 *
 * 所以设了这个变量后：
 *   - 克隆步骤跳过真实 API，直接返回一个官方预置声音的 voice_id
 *   - TTS 仍然真实调用 ElevenLabs（消耗免费 credits），真实写 R2、真实扣额度
 *   → 上传 → 存库 → 合成 → 转存 → 播放 → 计费 → 缓存 全链路都能零成本验证
 *
 * 不设这个变量 = 真实克隆，生产环境不要设。
 */
const DEMO_VOICE_ID = process.env.ELEVENLABS_DEMO_VOICE_ID?.trim() || "";

/** 当前是否处于「模拟克隆」模式 */
export function demoCloneMode(): boolean {
  return DEMO_VOICE_ID.length > 0;
}

function key(): string {
  const k = process.env.ELEVENLABS_API_KEY;
  if (!k) throw new Error("Missing ELEVENLABS_API_KEY — see .env.example");
  return k;
}

export function elevenlabsConfigured(): boolean {
  return Boolean(process.env.ELEVENLABS_API_KEY);
}

/** Instant Voice Cloning：multipart 上传音频样本，返回 provider voice_id */
export async function cloneVoice(
  file: File,
  name: string
): Promise<string> {
  // 演示模式：不碰 API，直接返回预置声音（免费计划也能跑通全链路）
  if (demoCloneMode()) {
    console.warn(`[elevenlabs] DEMO clone mode — "${name}" mapped to stock voice ${DEMO_VOICE_ID}`);
    return DEMO_VOICE_ID;
  }

  const form = new FormData();
  form.append("name", name);
  form.append("files", file, file.name || "sample.wav");
  // remove_background_noise: true —— 上传侧已要求干声，这里再兜底一次
  const res = await fetch(`${API}/voices/add`, {
    method: "POST",
    headers: { "xi-api-key": key() },
    body: form,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    // 免费/未开通计划调克隆接口 → 401 或 403，给出可操作的提示而不是一坨 JSON
    if (res.status === 401 || res.status === 403) {
      throw new Error(
        "Voice cloning needs an ElevenLabs Starter plan or higher (the free tier only allows text to speech). " +
          "Upgrade the ElevenLabs account, or set ELEVENLABS_DEMO_VOICE_ID to test the flow with a stock voice."
      );
    }
    throw new Error(`ElevenLabs clone failed (${res.status}): ${text.slice(0, 300)}`);
  }
  const data = (await res.json()) as { voice_id: string };
  return data.voice_id;
}

/** 删除声音档案（/voice-removal 下架用） */
export async function deleteVoice(voiceId: string): Promise<void> {
  const res = await fetch(`${API}/voices/${voiceId}`, {
    method: "DELETE",
    headers: { "xi-api-key": key() },
  });
  if (!res.ok && res.status !== 404) {
    throw new Error(`ElevenLabs delete failed (${res.status})`);
  }
}

/**
 * Text to Speech。模型走 MODEL_ID（语言自动检测，无需传 lang 参数）；
 * 缓存键仍带 lang（方案定的口径），未来换按语言路由的模型时不破缓存。
 */
export async function synthesize(voiceId: string, text: string): Promise<Buffer> {
  const body: Record<string, unknown> = { text, model_id: MODEL_ID };
  if (usesLegacyVoiceSettings(MODEL_ID)) {
    body.voice_settings = { stability: 0.5, similarity_boost: 0.75 };
  }

  const res = await fetch(`${API}/text-to-speech/${voiceId}`, {
    method: "POST",
    headers: {
      "xi-api-key": key(),
      "Content-Type": "application/json",
      Accept: "audio/mpeg",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text2 = await res.text().catch(() => "");
    // 免费 credits 用尽 / key 无权限 —— 别把 provider 的 JSON 直接甩给用户
    if (res.status === 401 || res.status === 402 || text2.includes("quota_exceeded")) {
      throw new Error(
        "ElevenLabs credit limit reached for this account. Top up or upgrade the ElevenLabs plan, then retry."
      );
    }
    throw new Error(`ElevenLabs TTS failed (${res.status}): ${text2.slice(0, 300)}`);
  }
  return Buffer.from(await res.arrayBuffer());
}
