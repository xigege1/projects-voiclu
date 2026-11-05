import type { Metadata } from "next";
import PricingSection from "@/components/PricingSection";
import { FAQ_HOME } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Pricing — Voiclu AI Voice Cloning Plans from $9.9/month",
  description:
    "Simple flat pricing: Starter $9.9/mo (~20 min), Creator $29/mo (~80 min), or a $49 one-time pack. Commercial license included, 30-day money-back guarantee.",
};

export default function PricingPage() {
  return (
    <div>
      <section className="bg-[var(--brand-soft)] py-14 text-center">
        <h1 className="text-4xl font-bold tracking-tight">Pricing</h1>
        <p className="mx-auto mt-3 max-w-xl text-gray-600">
          One free generation to judge the quality. Then flat monthly pricing — your cost never
          moves when you rewrite a script.
        </p>
      </section>

      <PricingSection />

      <section className="mx-auto max-w-3xl px-4 pb-16">
        <h2 className="text-xl font-bold">Pricing questions</h2>
        <div className="mt-4 divide-y divide-gray-100 rounded-xl border border-gray-100">
          {FAQ_HOME.filter((_, i) => [0, 2, 4, 7].includes(i)).map((f) => (
            <details key={f.q} className="p-4">
              <summary className="cursor-pointer font-medium">{f.q}</summary>
              <p className="mt-2 text-sm leading-6 text-gray-600">{f.a}</p>
            </details>
          ))}
          <details className="p-4">
            <summary className="cursor-pointer font-medium">
              What counts as a character?
            </summary>
            <p className="mt-2 text-sm leading-6 text-gray-600">
              Every character in the text you submit. We bill the same way our upstream provider
              bills us — 1 character = 1 credit, 1,000 characters ≈ 1 minute of finished audio —
              so the math is transparent.
            </p>
          </details>
        </div>
      </section>
    </div>
  );
}
