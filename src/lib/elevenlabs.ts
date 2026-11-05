/**
 * ElevenLabs 集成 —— 只封两个能力：
 *   1. cloneVoice(): Instant Voice Cloning，上传干声 → voice_id
 *   2. synthesize():  Text to Speech，voice_id + 文本 → 音频 Buffer
 * 具体请求/响应字段以官方文档为准（不要照抄博客）：
 *   https://elevenlabs.io/docs/api-reference/voices/add
 *   https://elevenlabs.io/docs/api-reference/text-to-speech/convert
 */
const API = "https://api.elevenlabs.io/v1";

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
 * Text to Speech。模型用 multilingual v2（语言自动检测，无需传 lang 参数）；
 * 缓存键仍带 lang（方案定的口径），未来换按语言路由的模型时不破缓存。
 */
export async function synthesize(voiceId: string, text: string): Promise<Buffer> {
  const res = await fetch(`${API}/text-to-speech/${voiceId}`, {
    method: "POST",
    headers: {
      "xi-api-key": key(),
      "Content-Type": "application/json",
      Accept: "audio/mpeg",
    },
    body: JSON.stringify({
      text,
      model_id: "eleven_multilingual_v2",
      voice_settings: { stability: 0.5, similarity_boost: 0.75 },
    }),
  });
  if (!res.ok) {
    const text2 = await res.text().catch(() => "");
    throw new Error(`ElevenLabs TTS failed (${res.status}): ${text2.slice(0, 300)}`);
  }
  return Buffer.from(await res.arrayBuffer());
}
