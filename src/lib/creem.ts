/**
 * Creem（Merchant of Record）REST 客户端。
 *
 * 职责只有两件：
 *   1. 按套餐创建 checkout session（把 user_id 放进 metadata，webhook 靠它找到用户）
 *   2. 把 Creem 的 product_id 反查回站内 plan id（以产品为准，不轻信 metadata）
 *
 * 不做任何入账。入账（幂等 / 加额度 / 发邮件）在 `@/lib/payments` 的 grantPlan()，
 * 与收款渠道无关；以后接 Stripe 只需再写一个同结构的路由。
 */
import { PLANS } from "@/lib/constants";

/** 每个套餐对应的环境变量名。Creem 后台建好产品后把 prod_xxx 填进来。 */
const PRODUCT_ENV: Record<string, string> = {
  starter: "CREEM_PRODUCT_STARTER",
  creator: "CREEM_PRODUCT_CREATOR",
  onetime: "CREEM_PRODUCT_ONETIME",
};

export function isKnownPlan(planId: string): boolean {
  return PLANS.some((p) => p.id === planId);
}

export function productIdFor(planId: string): string | null {
  const envName = PRODUCT_ENV[planId];
  if (!envName) return null;
  const v = process.env[envName]?.trim();
  return v || null;
}

/** 反向映射：webhook 里只信产品，不信 metadata */
export function planForProductId(productId: string | undefined | null): string | null {
  if (!productId) return null;
  for (const planId of Object.keys(PRODUCT_ENV)) {
    if (process.env[PRODUCT_ENV[planId]]?.trim() === productId) return planId;
  }
  return null;
}

/**
 * Creem API 的 base：
 *   - 测试 key 一律 `creem_test_` 开头，走 test-api（不会真扣钱）
 *   - 生产 key 走 api
 * 这样本地拿测试 key 也能跑通全链路，不需要额外开关，避免「测试 key 打生产端点」这种事故。
 */
function apiBase(): string {
  const override = process.env.CREEM_API_BASE?.trim();
  if (override) return override.replace(/\/$/, "");
  return (process.env.CREEM_API_KEY ?? "").trim().startsWith("creem_test_")
    ? "https://test-api.creem.io"
    : "https://api.creem.io";
}

export function creemConfigured(): boolean {
  return Boolean(process.env.CREEM_API_KEY?.trim()) && PLANS.every((p) => productIdFor(p.id));
}

/**
 * 分段自检结果：只回布尔，不回值、不回前缀。
 *
 * 收不到钱时最常卡在三处——key 没填、产品 ID 少一个、webhook 密钥没填。
 * 合成一个 payments: false 无法定位，所以拆开给 /api/health 用。
 * testMode 的作用是提醒「现在打的是 test-api，不会真扣钱」。
 */
export function creemConfigStatus() {
  const key = process.env.CREEM_API_KEY?.trim() ?? "";
  return {
    apiKey: Boolean(key),
    testMode: key.startsWith("creem_test_"),
    webhookSecret: Boolean(process.env.CREEM_WEBHOOK_SECRET?.trim()),
    products: Object.fromEntries(
      PLANS.map((p) => [p.id, Boolean(productIdFor(p.id))])
    ) as Record<string, boolean>,
  };
}

/**
 * 生成 Creem 客户门户的一次性登录链接。
 *
 * 为什么需要：Creem 的商户约定里有一条——用户必须能在产品内自助取消订阅。
 * 收据邮件里虽然有门户链接，但用户删了邮件就找不回来，所以站内要能直接进。
 *
 * 这里不存 customer_id：Creem 允许按邮箱反查客户，而我们本来就有用户邮箱。
 * 少存一份第三方 ID，就少一处会不一致的地方。
 */
export async function customerPortalLink(
  email: string
): Promise<{ ok: true; url: string } | { ok: false; error: "not_found" | "creem_error" | "not_configured" }> {
  const key = process.env.CREEM_API_KEY?.trim();
  if (!key) return { ok: false, error: "not_configured" };

  const base = apiBase();
  try {
    const cRes = await fetch(`${base}/v1/customers?email=${encodeURIComponent(email)}`, {
      headers: { "x-api-key": key },
    });
    // 404 = 这个邮箱还没在 Creem 下过单，不是故障
    if (cRes.status === 404) return { ok: false, error: "not_found" };
    if (!cRes.ok) {
      console.error(`[creem:portal] customer ${cRes.status} ${(await cRes.text()).slice(0, 200)}`);
      return { ok: false, error: "creem_error" };
    }
    const customer = (await cRes.json()) as { id?: string };
    if (!customer.id) return { ok: false, error: "not_found" };

    const bRes = await fetch(`${base}/v1/customers/billing`, {
      method: "POST",
      headers: { "x-api-key": key, "Content-Type": "application/json" },
      body: JSON.stringify({ customer_id: customer.id }),
    });
    if (!bRes.ok) {
      console.error(`[creem:portal] billing ${bRes.status} ${(await bRes.text()).slice(0, 200)}`);
      return { ok: false, error: "creem_error" };
    }
    const data = (await bRes.json()) as { customer_portal_link?: string };
    if (!data.customer_portal_link) return { ok: false, error: "creem_error" };
    return { ok: true, url: data.customer_portal_link };
  } catch (e) {
    console.error("[creem:portal] network", e);
    return { ok: false, error: "creem_error" };
  }
}

export type CheckoutResult = { ok: true; url: string } | { ok: false; error: string; status: number };

/**
 * 创建 checkout session。
 * metadata 会原样出现在 `checkout.completed` 的 `object.metadata` 里，
 * webhook 用 metadata.user_id 定位用户、metadata.plan 兜底校验套餐。
 */
export async function createCheckout(opts: {
  planId: string;
  userId: string;
  email?: string | null;
  successUrl: string;
}): Promise<CheckoutResult> {
  const key = process.env.CREEM_API_KEY?.trim();
  if (!key) return { ok: false, error: "creem_not_configured", status: 503 };

  const productId = productIdFor(opts.planId);
  if (!productId) return { ok: false, error: "plan_not_configured", status: 503 };

  let res: Response;
  try {
    res = await fetch(`${apiBase()}/v1/checkouts`, {
      method: "POST",
      headers: {
        "x-api-key": key,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        product_id: productId,
        success_url: opts.successUrl,
        // 用户已登录才有邮箱；预填可以减少结账时手打错邮箱（发票和退款都要用）
        ...(opts.email ? { customer: { email: opts.email } } : {}),
        metadata: { user_id: opts.userId, plan: opts.planId },
      }),
    });
  } catch (e) {
    console.error("[creem:checkout] network", e);
    return { ok: false, error: "creem_unreachable", status: 502 };
  }

  const text = await res.text();
  if (!res.ok) {
    console.error(`[creem:checkout] ${res.status} ${text.slice(0, 400)}`);
    return { ok: false, error: "creem_rejected", status: 502 };
  }

  let data: { checkout_url?: string; url?: string };
  try {
    data = JSON.parse(text) as { checkout_url?: string; url?: string };
  } catch {
    return { ok: false, error: "creem_bad_response", status: 502 };
  }

  const url = data.checkout_url ?? data.url;
  if (!url) return { ok: false, error: "creem_no_url", status: 502 };
  return { ok: true, url };
}
