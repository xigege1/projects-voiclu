import type { Metadata } from "next";
import Link from "next/link";
import { LANG_COUNT_LABEL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "11 Best ElevenLabs Alternatives for Voice Cloning (2026)",
  description:
    "Looking for an ElevenLabs alternative? Here are 11 options compared on price per minute, cloning quality, language support and licensing, plus which one fits which use case.",
};

/**
 * ⚠️ 上线前必须做的事：每个条目的 [实测填写] 字段注册试用后填写。
 * 优先收录：Voiclu（自家，要标注）、KikiVoice、CloneVoice.ai、Fish Audio、
 * Vocloner、Uberduck、LALAL.AI、Murf、Play.ht、Resemble AI、Speechify
 */
const ALTS = [
  { name: "Voiclu", best: "flat monthly pricing for solo dubbing", ours: true, fields: { cloneFrom: "30 seconds of audio", langs: LANG_COUNT_LABEL, price: "$9.9/mo · 20,000 chars", free: "1 full generation, no sign-up", license: "yes, all paid plans", limit: "Not built for real-time voice changing" } },
  { name: "KikiVoice", best: "[实测填写]", ours: false, fields: { cloneFrom: "[实测填写]", langs: "claims 75+", price: "[实测填写]", free: "[实测填写]", license: "[实测填写]", limit: "[实测填写]" } },
  { name: "CloneVoice.ai", best: "[实测填写]", ours: false, fields: { cloneFrom: "[实测填写]", langs: "[实测填写]", price: "one-time, 30-day refund", free: "[实测填写]", license: "[实测填写]", limit: "[实测填写]" } },
  { name: "Fish Audio", best: "[实测填写]", ours: false, fields: { cloneFrom: "[实测填写]", langs: "[实测填写]", price: "[实测填写]", free: "[实测填写]", license: "[实测填写]", limit: "[实测填写]" } },
  { name: "Vocloner", best: "[实测填写]", ours: false, fields: { cloneFrom: "[实测填写]", langs: "[实测填写]", price: "[实测填写]", free: "[实测填写]", license: "[实测填写]", limit: "[实测填写]" } },
  { name: "Uberduck", best: "[实测填写]", ours: false, fields: { cloneFrom: "[实测填写]", langs: "[实测填写]", price: "[实测填写]", free: "[实测填写]", license: "[实测填写]", limit: "[实测填写]" } },
  { name: "LALAL.AI", best: "[实测填写]", ours: false, fields: { cloneFrom: "[实测填写]", langs: "[实测填写]", price: "[实测填写]", free: "[实测填写]", license: "[实测填写]", limit: "[实测填写]" } },
  { name: "Murf", best: "[实测填写]", ours: false, fields: { cloneFrom: "[实测填写]", langs: "[实测填写]", price: "[实测填写]", free: "[实测填写]", license: "[实测填写]", limit: "[实测填写]" } },
  { name: "Play.ht", best: "[实测填写]", ours: false, fields: { cloneFrom: "[实测填写]", langs: "[实测填写]", price: "[实测填写]", free: "[实测填写]", license: "[实测填写]", limit: "[实测填写]" } },
  { name: "Resemble AI", best: "[实测填写]", ours: false, fields: { cloneFrom: "[实测填写]", langs: "[实测填写]", price: "[实测填写]", free: "[实测填写]", license: "[实测填写]", limit: "[实测填写]" } },
  { name: "Speechify", best: "[实测填写]", ours: false, fields: { cloneFrom: "[实测填写]", langs: "[实测填写]", price: "[实测填写]", free: "[实测填写]", license: "[实测填写]", limit: "[实测填写]" } },
];

export default function AlternativesPage() {
  return (
    <div>
      <section className="bg-[var(--brand-soft)] py-14 text-center">
        <h1 className="text-4xl font-bold tracking-tight">ElevenLabs Alternatives</h1>
        <p className="mx-auto mt-3 max-w-xl text-gray-600">
          11 options compared on price per minute, cloning quality, language support and
          licensing — plus which one fits which use case.
        </p>
      </section>

      <article className="mx-auto max-w-4xl px-4 py-12">
        <p className="leading-8 text-gray-700">
          ElevenLabs is the reference point for AI voice cloning, and for good reason — it
          is the tool most other tools are compared against. But it is also the wrong tool for
          some jobs: if you only need one voice in one language, if you need a fixed monthly
          cost rather than per-character credits, or if you need a commercial license without an
          enterprise conversation, there are cheaper routes. Below are 11 alternatives, what each
          is genuinely better at, and where each one falls short.
        </p>

        <div className="mt-10 space-y-8">
          {ALTS.map((a) => (
            <section key={a.name} className="rounded-2xl border border-gray-100 p-5">
              <h2 className="text-lg font-bold">
                {a.name} — best for {a.best}
                {a.ours && (
                  <span className="ml-2 rounded-full bg-[var(--brand-soft)] px-2 py-0.5 text-xs font-medium text-[var(--brand)]">
                    our product
                  </span>
                )}
              </h2>
              <dl className="mt-3 grid gap-x-6 gap-y-1 text-sm text-gray-600 sm:grid-cols-2">
                <div className="flex gap-2"><dt className="font-medium text-gray-800">Cloning from:</dt><dd>{a.fields.cloneFrom}</dd></div>
                <div className="flex gap-2"><dt className="font-medium text-gray-800">Languages:</dt><dd>{a.fields.langs}</dd></div>
                <div className="flex gap-2"><dt className="font-medium text-gray-800">Price:</dt><dd>{a.fields.price}</dd></div>
                <div className="flex gap-2"><dt className="font-medium text-gray-800">Free tier:</dt><dd>{a.fields.free}</dd></div>
                <div className="flex gap-2"><dt className="font-medium text-gray-800">Commercial license:</dt><dd>{a.fields.license}</dd></div>
                <div className="flex gap-2"><dt className="font-medium text-gray-800">Limitation:</dt><dd>{a.fields.limit}</dd></div>
              </dl>
            </section>
          ))}
        </div>

        <section className="mt-12 rounded-2xl bg-[var(--brand-soft)] p-6">
          <h2 className="text-lg font-bold">If you are cloning your own voice for dubbing</h2>
          <p className="mt-2 text-sm leading-7 text-gray-700">
            Voiclu is built for that one job: clone once from 30 seconds of audio, then output
            the same voice in {LANG_COUNT_LABEL} languages. $9.9/month, 20,000 characters,
            commercial license included.{" "}
            <Link href="/" className="font-medium text-[var(--brand)] underline">Try it free</Link>.
          </p>
        </section>

        <p className="mt-8 text-sm text-gray-500">
          Want the full comparison table instead? See{" "}
          <Link href="/best" className="text-[var(--brand)] underline">best AI voice clone tools</Link>.
        </p>
      </article>
    </div>
  );
}
