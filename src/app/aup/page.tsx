import type { Metadata } from "next";
import { SITE, LEGAL_UPDATED } from "@/lib/constants";

/**
 * 独立的 Acceptable Use Policy。
 *
 * 为什么不并进 /terms：Creem 的 AI 类商户审核要求站点上有**单独的、可见的**
 * Acceptance Use Policy；把它藏在 ToS 第 3 条里，审核员按标题找不到就判缺失。
 * 内容与 /terms 保持一致（改一处要同步另一处），但这里写得更细、更能被逐条核对。
 */
export const metadata: Metadata = {
  alternates: { canonical: "/aup" },
  title: "Acceptable Use Policy — Voiclu",
  description: "What Voiclu allows, what it prohibits, and how reports are handled.",
};

export default function AupPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 text-sm leading-7 text-foreground/90">
      <h1 className="text-3xl font-bold text-foreground">Acceptable Use Policy</h1>
      <p className="mt-2 text-xs text-muted-foreground/70">Last updated: {LEGAL_UPDATED}</p>

      <p className="mt-6">
        This policy applies to everyone who uses Voiclu, free or paid. It is part of our{" "}
        <a className="text-[var(--brand)] underline" href="/terms">
          Terms of Service
        </a>
        : breaking it is a breach of those terms, and we enforce it the same way.
      </p>

      <div className="mt-8 space-y-8">
        <section>
          <h2 className="text-base font-bold text-foreground">1. Consent — the one rule behind everything</h2>
          <p className="mt-2">
            You may only clone a voice that is your own, or one you have explicit written permission
            to use. Every clone requires you to tick a consent confirmation, which we log with a
            timestamp and IP address. If a voice is reported and you cannot show that consent, the
            voice is removed.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-foreground">2. What you may not do</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Impersonate a real person, or imply their endorsement of anything</li>
            <li>Create audio of a public figure that could be mistaken for a real statement</li>
            <li>Commit fraud, fabricate evidence, or generate political disinformation</li>
            <li>Harass, threaten, defame, or demean anyone</li>
            <li>Clone or generate the voice of a minor, under any circumstance</li>
            <li>Resell your character allowance, share one account between people, or resell API access</li>
            <li>Use the service for anything illegal where you or we are located</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-bold text-foreground">3. Sexually explicit and other NSFW content — prohibited</h2>
          <p className="mt-2">
            Voiclu is not an adult-content product. The following is prohibited outright, whether the
            voice is cloned or taken from our library:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Erotic audio, sexual role-play, and sexual moaning or breathing</li>
            <li>Any sexual content featuring a real person&apos;s voice, even with their consent</li>
            <li>
              Any sexual content involving a minor — zero tolerance. Removed immediately, account
              terminated, and reported to the relevant authorities
            </li>
            <li>Graphic violence, or audio intended to degrade someone on the basis of who they are</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-bold text-foreground">4. How this is enforced</h2>
          <p className="mt-2">
            We do not run automated classification on every generation, so enforcement is
            report-driven and account-level. Reported accounts are reviewed within one business day.
            Confirmed violations mean the content is deleted, the account is terminated, and any
            remaining character allowance is not refunded.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-foreground">5. How to report something</h2>
          <p className="mt-2">
            Email{" "}
            <a className="text-[var(--brand)] underline" href={`mailto:${SITE.supportEmail}`}>
              {SITE.supportEmail}
            </a>{" "}
            with the share link of the audio and, if the issue is an unconsented clone, the voice it
            copies. For voice takedown requests there is also a dedicated{" "}
            <a className="text-[var(--brand)] underline" href="/voice-removal">
              removal page
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-foreground">6. Changes</h2>
          <p className="mt-2">
            If this policy changes materially we update the date at the top and notify registered
            users by email.
          </p>
        </section>

        <p className="text-muted-foreground">
          Questions about this policy: <a className="text-[var(--brand)] underline" href={`mailto:${SITE.supportEmail}`}>{SITE.supportEmail}</a>
        </p>
      </div>
    </div>
  );
}
