/**
 * 对象存储（Cloudflare R2 / 任何 S3 兼容端点）
 * 音频写入 R2，公开 URL 走绑定域名（如 cdn.voiclu.com）
 */
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

let _s3: S3Client | null = null;

export function getS3(): S3Client {
  if (_s3) return _s3;
  const endpoint = process.env.S3_ENDPOINT;
  const region = process.env.S3_REGION ?? "auto";
  if (!endpoint || !process.env.S3_ACCESS_KEY_ID || !process.env.S3_SECRET_ACCESS_KEY) {
    throw new Error("Missing S3_* env vars — see .env.example");
  }
  _s3 = new S3Client({
    region,
    endpoint,
    forcePathStyle: true, // R2 需要 path-style
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
    },
  });
  return _s3;
}

export async function putAudio(key: string, body: Buffer, contentType: string): Promise<string> {
  const bucket = process.env.S3_BUCKET!;
  const cmd = new PutObjectCommand({ Bucket: bucket, Key: key, Body: body, ContentType: contentType });
  await getS3().send(cmd);
  const base = process.env.S3_PUBLIC_URL!.replace(/\/$/, "");
  return `${base}/${key}`;
}

export function audioKey(prefix: string, ext = "mp3"): string {
  const d = new Date();
  const ym = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
  return `audio/${ym}/${prefix}-${crypto.randomUUID()}.${ext}`;
}
