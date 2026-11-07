import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/lib/constants";

/**
 * 支付成功落地页（Creem success_url 指向这里）。
 *
 * 只做三件事：确认收款、告诉他额度已在路上、给一条回产品的路。
 * 额度是 webhook 异步入账的，所以文案不能写「已到账」——通常几秒，但可能更久。
 *
 * noindex：这是交易后页面，没有搜索价值，也不该出现在 sitemap 里。
 */
export const metadata: Metadata = {
  title: "Payment received — Voiclu",
  description: "Your Voiclu payment went through.",
  robots: { index: false, follow: false },
  alternates: { canonical: "/success" },
};

export default function SuccessPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <p className="text-sm font-medium text-[var(--brand)]">Payment received</p>
      <h1 className="mt-2 text-3xl font-bold text-foreground">You&rsquo;re all set</h1>
      <p className="mt-4 leading-8 text-foreground/90">
        Thanks for subscribing. Your credits are added automatically as soon as the payment
        confirmation reaches us — usually within a few seconds.
      </p>

      <div className="mt-8 space-y-4 rounded-2xl border border-border/60 p-6 text-sm leading-7 text-foreground/90">
        <p>
          <strong className="font-semibold text-foreground">Receipt.</strong> Creem, our merchant
          of record, emails the receipt and handles any sales tax. It comes from Creem, not from
          Voiclu.
        </p>
        <p>
          <strong className="font-semibold text-foreground">Credits.</strong> If your balance still
          shows the old number after a minute, refresh the page. Still wrong? Email{" "}
          <a className="underline" href={`mailto:${SITE.supportEmail}`}>
            {SITE.supportEmail}
          </a>{" "}
          with the email you paid with and we will sort it out.
        </p>
        <p>
          <strong className="font-semibold text-foreground">Cancelling.</strong> Subscriptions can
          be cancelled any time from the Creem customer portal link in your receipt. Refund terms
          are on our{" "}
          <Link className="underline" href="/refund">
            refund policy
          </Link>
          .
        </p>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/text-to-speech"
          className="rounded-lg bg-[var(--brand)] px-5 py-2.5 text-sm font-semibold text-white"
        >
          Start generating
        </Link>
        <Link
          href="/"
          className="rounded-lg border border-border px-5 py-2.5 text-sm font-semibold text-foreground"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
