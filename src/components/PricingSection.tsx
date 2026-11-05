import Link from "next/link";
import { PLANS, ANNUAL_NOTE } from "@/lib/constants";

export default function PricingSection({ compact = false }: { compact?: boolean }) {
  return (
    <section id="pricing" className={compact ? "" : "section-pad"}>
      <div className="container-gutter mx-auto max-w-6xl">
        <h2 className="text-center text-3xl font-bold tracking-tight">Simple pricing</h2>
        <p className="mt-2 text-center text-gray-500">
          Pay per character, never per minute of silence. 1,000 characters ≈ 1 minute of audio.
        </p>
        <p className="mt-1 text-center text-sm text-gray-400">{ANNUAL_NOTE}</p>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {PLANS.map((p) => (
            <div
              key={p.id}
              className={`relative rounded-xl border p-6 sm:p-8 ${
                p.highlight
                  ? "border-[var(--brand)] shadow-lg ring-1 ring-[var(--brand)]"
                  : "border-gray-200"
              }`}
            >
              {p.highlight && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[var(--brand)] px-3 py-0.5 text-xs font-semibold text-white">
                  Most popular
                </span>
              )}
              <div className="text-sm font-semibold text-gray-500">{p.name}</div>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-4xl font-bold">${p.price}</span>
                <span className="text-gray-400">{p.period}</span>
              </div>
              <ul className="mt-5 space-y-2 text-sm text-gray-600">
                {p.features.map((f) => (
                  <li key={f} className="flex gap-2">
                    <span className="text-[var(--brand)]">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              {/* TODO(checkout): 接入 Creem 后把 href 换成对应 checkout 链接（metadata 带 user_id + plan） */}
              <a
                href="/pricing"
                className={`mt-6 block w-full text-center ${
                  p.highlight ? "btn-primary" : "btn-secondary"
                }`}
              >
                {p.id === "onetime" ? "Buy once" : "Subscribe"}
              </a>
            </div>
          ))}
        </div>

        <p className="mt-6 text-center text-xs text-gray-400">
          30-day money-back guarantee · Commercial license on all paid plans ·{" "}
          <Link href="/refund" className="underline">Refund policy</Link>
        </p>
      </div>
    </section>
  );
}
