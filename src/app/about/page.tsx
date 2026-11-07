import type { Metadata } from "next";
import Link from "next/link";
import { SITE, LANG_COUNT_LABEL } from "@/lib/constants";

export const metadata: Metadata = {
  alternates: { canonical: "/about" },
  title: "About Voiclu — Who builds it and why",
  description:
    "Voiclu is a small, independent voice cloning tool. Here is who runs it, what it does with your audio, and how to reach us.",
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 text-sm leading-7 text-foreground/90">
      <h1 className="text-3xl font-bold text-foreground">About Voiclu</h1>
      <p className="mt-2 text-xs text-muted-foreground/70">A small, independent tool — not a venture-backed platform.</p>

      <div className="mt-8 space-y-8">
        <section>
          <h2 className="text-base font-bold text-foreground">What this is</h2>
          <p className="mt-2">
            Voiclu clones a voice from 30 seconds of clean speech and lets that voice speak{" "}
            {LANG_COUNT_LABEL} languages. You record once, then type anything — the accent and
            timbre stay yours. It exists because dubbing a single video into five languages used to
            mean five recording sessions, five schedules and five invoices.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-foreground">Who runs it</h2>
          <p className="mt-2">
            Voiclu is built and operated by a small independent team. We are deliberately not
            pretending to be a large company: there is no sales department, no enterprise tier, and
            no account manager. Support email goes to the same people who write the code.
          </p>
          <p className="mt-2">
            That has one practical consequence for you: if something breaks, it gets fixed rather
            than escalated. It also means we would rather turn down a use case than quietly allow
            something we cannot stand behind.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-foreground">How it works, plainly</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>
              Your audio sample is sent to a third-party speech provider that builds the voice
              model. We do not train models ourselves.
            </li>
            <li>
              Generated audio is stored on our own object storage and served from a CDN. Every file
              is marked as AI-generated.
            </li>
            <li>
              Every clone requires an explicit consent confirmation, which we log with a timestamp
              and IP address. Details are in the{" "}
              <Link href="/privacy" className="text-[var(--brand)] underline">
                privacy policy
              </Link>
              .
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-bold text-foreground">What we will not do</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Clone a voice without the speaker&apos;s permission.</li>
            <li>Clone public figures, celebrities or politicians.</li>
            <li>Sell or share your voice samples with anyone beyond the speech provider above.</li>
            <li>Keep generating audio for an account that has been reported for abuse.</li>
          </ul>
          <p className="mt-2">
            If you believe a voice on this site is yours and was cloned without permission, use the{" "}
            <Link href="/voice-removal" className="text-[var(--brand)] underline">
              voice removal page
            </Link>{" "}
            — we respond within 48 hours.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-foreground">Get in touch</h2>
          <p className="mt-2">
            Anything at all:{" "}
            <a href={`mailto:${SITE.supportEmail}`} className="text-[var(--brand)] underline">
              {SITE.supportEmail}
            </a>
            . We reply within one business day. For billing, takedown or abuse reports, the{" "}
            <Link href="/contact" className="text-[var(--brand)] underline">
              contact page
            </Link>{" "}
            routes you faster.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-foreground">The rest of the site</h2>
          <p className="mt-2">
            <Link href="/" className="text-[var(--brand)] underline">
              Clone your voice
            </Link>{" "}
            ·{" "}
            <Link href="/pricing" className="text-[var(--brand)] underline">
              Pricing
            </Link>{" "}
            ·{" "}
            <Link href="/alternatives" className="text-[var(--brand)] underline">
              ElevenLabs alternatives
            </Link>{" "}
            ·{" "}
            <Link href="/terms" className="text-[var(--brand)] underline">
              Terms
            </Link>{" "}
            ·{" "}
            <Link href="/refund" className="text-[var(--brand)] underline">
              Refund policy
            </Link>
          </p>
        </section>
      </div>
    </div>
  );
}
