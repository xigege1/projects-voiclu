import type { Metadata } from "next";
import Link from "next/link";
import { LANG_COUNT_LABEL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Best AI Voice Clone Tools in 2026 — Tested and Ranked",
  description:
    "We tested the main AI voice cloning tools on audio quality, language coverage, price per minute and free limits. Here is what each one is actually good at.",
  // 占位符 [实测填写] 未填完前先 noindex，避免被 Google 收录后用户看到方括号失去信任。
  robots: { index: false, follow: true },
};

/**
 * ⚠️ 上线前必须做的事（方案 D8-9）：
 * 表中 [实测填写] 的格子必须自己注册试用后填写，不要抄竞品官网宣传语。
 * 这页的排名理由只有一个：真测过。没测过的工具从表里删掉。
 */
const TOOLS: {
  name: string;
  free: string;
  price: string;
  langs: string;
  license: string;
  note: string;
}[] = [
  {
    name: "Voiclu",
    free: "1 generation",
    price: "$9.9/mo · 20,000 chars",
    langs: LANG_COUNT_LABEL,
    license: "Paid plans",
    note: "Our own tool — flat monthly pricing, built for one-person dubbing workflows. We list it with the same scrutiny as the rest.",
  },
  {
    name: "ElevenLabs",
    free: "Free plan exists",
    price: "$6/mo · 30k credits (≈30 min); Creator $22 · 121k; Pro $99 · 600k; overage $0.36→$0.17/min",
    langs: "[实测填写]",
    license: "[实测填写]",
    note: "Industry baseline. Instant Voice Cloning available from the $6 Starter tier. Startup Grants: 12 months / 33M characters by application.",
  },
  {
    name: "KikiVoice",
    free: "Claims no sign-up",
    price: "[实测填写]",
    langs: "Claims 75+",
    license: "[实测填写]",
    note: "Claims 99% similarity and 3-minute cloning. Strong in Brazil (ranks #1 for “clonar voz”).",
  },
  {
    name: "CloneVoice.ai",
    free: "[实测填写]",
    price: "one-time, 30-day refund",
    langs: "[实测填写]",
    license: "[实测填写]",
    note: "Single-page sales model, no free tier in the usual sense, checkout via third-party processor.",
  },
  {
    name: "Fish Audio",
    free: "[实测填写]",
    price: "[实测填写]",
    langs: "[实测填写]",
    license: "[实测填写]",
    note: "Ranks in top 10 for the core term with DR 73.",
  },
  {
    name: "Vocloner",
    free: "[实测填写]",
    price: "[实测填写]",
    langs: "[实测填写]",
    license: "[实测填写]",
    note: "Small site (DR 28) ranking on the homepage — good UX, worth studying.",
  },
  {
    name: "Uberduck",
    free: "[实测填写]",
    price: "[实测填写]",
    langs: "[实测填写]",
    license: "[实测填写]",
    note: "DR 63 but weak engagement on the SERP — beatable.",
  },
  {
    name: "LALAL.AI",
    free: "[实测填写]",
    price: "[实测填写]",
    langs: "[实测填写]",
    license: "[实测填写]",
    note: "Also ranks in the Brazilian SERP with a /pt-br path.",
  },
];

export default function BestPage() {
  return (
    <div>
      <section className="border-b border-border/60 py-14 text-center">
        <h1 className="text-4xl font-bold tracking-tight">Best AI Voice Clone Tools</h1>
        <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
          Tested on the same sample, scored on the same criteria, ranked honestly — including
          where our own tool loses.
        </p>
      </section>

      <article className="mx-auto max-w-4xl px-4 py-12">
        <h2 className="text-xl font-bold">How we tested</h2>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm leading-7 text-foreground/90">
          <li>Same 45-second clean voice sample uploaded to every tool</li>
          <li>Same 60-word English script and the same Portuguese translation</li>
          <li>Scored on: similarity, natural pacing, language coverage, price per finished minute, free-tier limit, commercial license terms</li>
          <li>Tested on [实测填写 date]. Prices are the vendor&apos;s public list price on that date.</li>
        </ul>

        <h2 className="mt-10 text-xl font-bold">The short list</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="py-2 pr-3">Tool</th>
                <th className="py-2 pr-3">Free tier</th>
                <th className="py-2 pr-3">Entry price</th>
                <th className="py-2 pr-3">Languages</th>
                <th className="py-2 pr-3">Commercial license</th>
                <th className="py-2">Our note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 align-top">
              {TOOLS.map((t) => (
                <tr key={t.name}>
                  <td className="py-3 pr-3 font-semibold">{t.name}</td>
                  <td className="py-3 pr-3">{t.free}</td>
                  <td className="py-3 pr-3">{t.price}</td>
                  <td className="py-3 pr-3">{t.langs}</td>
                  <td className="py-3 pr-3">{t.license}</td>
                  <td className="py-3 text-muted-foreground">{t.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h2 className="mt-10 text-xl font-bold">Which one should you pick</h2>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm leading-7 text-foreground/90">
          <li>If you need the cheapest finished minute → [实测填写]</li>
          <li>If you need the widest language coverage → [实测填写]</li>
          <li>
            If you need to clone your own voice for YouTube dubbing →{" "}
            <Link href="/" className="text-[var(--brand)] underline">Voiclu</Link>
          </li>
          <li>If you need an API to build on → [实测填写]</li>
          <li>If you only need a one-off → [实测填写]</li>
        </ul>

        <h2 className="mt-10 text-xl font-bold">What we do not like about our own tool</h2>
        <div className="mt-3 grid gap-4 text-sm leading-7 text-foreground/90 sm:grid-cols-2">
          <p>
            A long-form audiobook at scale is cheaper elsewhere — if you produce 40+ hours a
            month, per-character pricing at volume beats our flat fee.
          </p>
          <p>
            We do not offer real-time voice changing. Our pipeline is upload → generate →
            download, which keeps costs (and your price) predictable.
          </p>
        </div>

        <p className="mt-10 text-sm text-muted-foreground">
          Comparing against the market leader specifically? See{" "}
          <Link href="/alternatives" className="text-[var(--brand)] underline">ElevenLabs alternatives</Link>.
        </p>
      </article>
    </div>
  );
}
