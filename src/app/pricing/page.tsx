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
      <section className="border-b border-border/60 py-14 text-center">
        <h1 className="text-4xl font-bold tracking-tight">Pricing</h1>
        <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
          One free generation to judge the quality. Then flat monthly pricing — your cost never
          moves when you rewrite a script.
        </p>
      </section>

      <PricingSection />

      <section className="container-gutter mx-auto max-w-6xl pb-20">
        <div className="max-w-3xl">
        <h2 className="text-2xl font-semibold tracking-tight">Pricing questions</h2>
        <div className="mt-5 divide-y divide-border/60 rounded-xl border border-border/60">
          {FAQ_HOME.filter((_, i) => [0, 2, 4, 7].includes(i)).map((f) => (
            <details key={f.q} className="p-4">
              <summary className="cursor-pointer font-medium">{f.q}</summary>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{f.a}</p>
            </details>
          ))}
          <details className="p-4">
            <summary className="cursor-pointer font-medium">
              What counts as a character?
            </summary>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Every character in the text you submit. We bill the same way our upstream provider
              bills us — 1 character = 1 credit, 1,000 characters ≈ 1 minute of finished audio —
              so the math is transparent.
            </p>
          </details>
        </div>
        </div>
      </section>
    </div>
  );
}
