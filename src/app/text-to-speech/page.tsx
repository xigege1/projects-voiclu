import type { Metadata } from "next";
import Link from "next/link";
import ToolCard from "@/components/ToolCard";
import DemoSection from "@/components/DemoSection";
import { LANG_COUNT_LABEL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "AI Voice Clone Text to Speech — Type Text, Hear Your Own Voice",
  description:
    "Turn any text into audio in your own cloned voice. Paste a script, pick a language, download the file. Works for articles, videos, podcasts and course narration.",
};

const FAQ = [
  {
    q: "How long can the text be?",
    a: "Up to 10,000 characters per generation on paid plans. Longer scripts are split into chunks automatically. The free run is 150 characters.",
  },
  {
    q: "Can I control speed and pauses?",
    a: "Speed yes — slow, normal, fast. Pauses via punctuation: a comma is a short beat, a full stop is a longer one.",
  },
  {
    q: "Does it keep my accent?",
    a: "Cloning captures the accent of the sample you upload. Upload a sample in the accent you want the output to have.",
  },
  {
    q: "What file do I get?",
    a: "MP3 on all plans. WAV on Creator plans.",
  },
  {
    q: "Is there an API?",
    a: "Not yet — see the pricing page for the current limits. It is on the roadmap.",
  },
];

export default function TextToSpeechPage() {
  return (
    <div>
      <section className="border-b border-border/60 py-14">
        <div className="mx-auto max-w-6xl px-4 lg:flex lg:items-start lg:gap-12">
          <div className="lg:max-w-xl">
            <h1 className="text-4xl font-bold tracking-tight">AI Voice Clone Text to Speech</h1>
            <p className="mt-4 text-lg leading-8 text-muted-foreground">
              Type text, hear your own voice. Paste a script, pick a language, download the
              file — works for articles, videos, podcasts and course narration.
            </p>
            <div className="mt-8 text-sm leading-7 text-foreground/90">
              <h2 className="text-base font-bold text-foreground">How it works</h2>
              <ol className="mt-2 list-decimal space-y-1 pl-5">
                <li>Clone your voice once from 30 seconds of clean audio</li>
                <li>Paste any text and pick one of {LANG_COUNT_LABEL} languages</li>
                <li>Download the MP3 — your voice, your pacing, your accent</li>
              </ol>
              <p className="mt-4">
                Same text, same voice, twice? The second run is served from cache and never
                billed.{" "}
                <Link href="/" className="text-[var(--brand)] underline">Clone a voice first</Link>.
              </p>
            </div>
          </div>
          <div className="mt-10 flex-1 lg:mt-0">
            <ToolCard />
          </div>
        </div>
      </section>

      <DemoSection />

      <section className="py-14">
        <div className="mx-auto max-w-3xl px-4">
          <h2 className="text-xl font-bold">FAQ</h2>
          <div className="mt-4 divide-y divide-border/60 rounded-xl border border-border/60">
            {FAQ.map((f) => (
              <details key={f.q} className="p-4">
                <summary className="cursor-pointer font-medium">{f.q}</summary>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
