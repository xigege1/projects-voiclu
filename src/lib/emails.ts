/**
 * 交易邮件 —— 文案来自 day1.md 的 5 封邮件
 * 通过 Resend 发送（https://resend.com，免费档每天 100 封够用）。
 * 没配 RESEND_API_KEY 时静默跳过（本地开发不卡流程）。
 *
 * 5 封对应关系：
 *   1. 验证/欢迎    → Supabase OTP 自带（在 Supabase Auth → Email Templates 自定义文案）
 *   2. 免费生成完成  → sendFreeGenerationDone()，/api/tts 成功后触发（转化邮件）
 *   3. 付款成功     → sendPaymentSuccess()，Creem webhook 入账后触发
 *   4. 额度用到 80% → sendUsage80()，扣额度时检查触发
 *   5. 声音下架受理  → sendRemovalAck()（当前 /voice-removal 走 mailto，接表单后启用）
 */
import { SITE, FREE_CHARS } from "./constants";

const FROM = process.env.RESEND_FROM ?? "Voiclu <noreply@voiclu.com>";

async function send(to: string, subject: string, body: string): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.log(`[email:skipped] to=${to} subject="${subject}"`);
    return;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: FROM,
        to,
        subject,
        text: body,
      }),
    });
    if (!res.ok) {
      console.error(`[email:failed] ${res.status} ${await res.text().catch(() => "")}`);
    }
  } catch (e) {
    console.error("[email:error]", e);
  }
}

/** 邮件 2：免费生成完成（转化邮件，最重要的一封） */
export function sendFreeGenerationDone(to: string, audioLink: string): Promise<void> {
  return send(
    to,
    "Your free generation is done — here is what it sounded like",
    [
      `Your clone finished. Play it here: ${audioLink}`,
      "",
      `Want to keep going? Starter is $9.9/month for 20,000 characters —`,
      "roughly 20 minutes of finished audio, commercial license included.",
      "One thing worth knowing: you will not be charged again unless you upgrade,",
      "and every plan has a 30-day money-back guarantee.",
      "",
      `See plans: ${SITE.url}/pricing`,
    ].join("\n")
  );
}

/** 邮件 3：付款成功 */
export function sendPaymentSuccess(
  to: string,
  plan: string,
  amount: number,
  currency: string,
  invoiceId: string,
  chars: number,
  resetDate: string
): Promise<void> {
  return send(
    to,
    `You're in — ${plan} is active`,
    [
      `Receipt: $${amount.toFixed(2)} ${currency}, invoice ${invoiceId}`,
      `Your balance: ${chars.toLocaleString()} characters, resetting ${resetDate}`,
      "Commercial license: included on this plan. Keep this email as your record.",
      `Manage or cancel anytime: ${SITE.url}/pricing`,
    ].join("\n")
  );
}

/** 邮件 4：额度用到 80% */
export function sendUsage80(to: string, used: number, total: number, resetDate: string): Promise<void> {
  return send(
    to,
    "You've used 80% of your monthly characters",
    [
      `${used.toLocaleString()} of ${total.toLocaleString()} characters used. Resets on ${resetDate}.`,
      "If you need more before then: upgrade (prorated) or buy a one-time pack.",
      `${SITE.url}/pricing`,
    ].join("\n")
  );
}

/** 邮件 5：声音下架请求受理（48 小时承诺） */
export function sendRemovalAck(to: string, ticketId: string): Promise<void> {
  return send(
    to,
    "We received your voice removal request",
    [
      "We have suspended the voice you reported while we review it.",
      `Reference ${ticketId}. We will reply within 2 business days.`,
      "If this is being used to impersonate you for fraud, reply to this email and we",
      "will escalate it immediately.",
    ].join("\n")
  );
}

/** 免费额度提示用（/api/tts 402 时不发邮件 —— 匿名用户没邮箱，转化靠页面弹窗） */
export const FREE_CHARS_NOTE = FREE_CHARS;
