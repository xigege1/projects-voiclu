import type { Metadata } from "next";
import { SITE, LEGAL_UPDATED, GOVERNING_LAW } from "@/lib/constants";

export const metadata: Metadata = {
  alternates: { canonical: "/terms" },
  title: "Terms of Service — Voiclu",
  description: "Terms of service for Voiclu AI voice cloning and text to speech.",
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 text-sm leading-7 text-foreground/90">
      <h1 className="text-3xl font-bold text-foreground">Terms of Service</h1>
      <p className="mt-2 text-xs text-muted-foreground/70">Last updated: {LEGAL_UPDATED}</p>

      <div className="mt-8 space-y-8">
        <section>
          <h2 className="text-base font-bold text-foreground">1. The service</h2>
          <p className="mt-2">
            Voiclu provides AI voice cloning and text-to-speech generation. Capacity is metered
            in characters: 1,000 characters is approximately one minute of finished audio. Plans
            and limits are listed on the pricing page.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-foreground">2. Your account</h2>
          <p className="mt-2">
            One account is for one person. Sharing accounts or reselling your character
            allowance is not permitted. You are responsible for activity under your account.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-foreground">3. Acceptable use (the part that matters)</h2>
          <p className="mt-2">You may NOT use Voiclu to:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Clone a voice without the written permission of the speaker — every clone requires an explicit consent confirmation, which we log with a timestamp and IP</li>
            <li>Impersonate another person or imply their endorsement</li>
            <li>Commit fraud, generate fake news, or produce political disinformation</li>
            <li>Generate content involving the voice of a minor</li>
            <li>Harass, defame, or threaten anyone</li>
          </ul>
          <p className="mt-2">
            Voices reported through our{" "}
            <a href="/voice-removal" className="text-[var(--brand)] underline">removal page</a>{" "}
            are suspended while we review and removed if the uploader cannot show consent.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-foreground">4. Ownership</h2>
          <p className="mt-2">
            You own the samples you upload and the audio you generate, subject to the plan&apos;s
            commercial license terms. We retain the right to store samples and generated audio
            for compliance review, abuse detection, and to honor takedown requests.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-foreground">5. Termination</h2>
          <p className="mt-2">
            We may suspend or terminate an account immediately for violations of Section 3.
            Remaining character allowance on a terminated account is not refunded. You may cancel
            a subscription at any time; it stays active until the end of the paid period.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-foreground">6. Refunds</h2>
          <p className="mt-2">
            30-day money-back guarantee — see the{" "}
            <a href="/refund" className="text-[var(--brand)] underline">refund policy</a> for the
            two exceptions.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-foreground">7. Limitation of liability</h2>
          <p className="mt-2">
            The service is provided “as is”. To the maximum extent permitted by law, our total
            liability is limited to the amount you paid us in the 12 months before the claim.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-foreground">8. Governing law</h2>
          <p className="mt-2">
            These terms are governed by the laws of {GOVERNING_LAW}. Disputes go to the courts of
            that jurisdiction.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-foreground">9. Changes</h2>
          <p className="mt-2">
            If we change these terms we notify registered users by email and update the date on
            this page. Continued use after the effective date means acceptance.
          </p>
        </section>

        <p className="text-muted-foreground">Questions: <a className="text-[var(--brand)] underline" href={`mailto:${SITE.supportEmail}`}>{SITE.supportEmail}</a></p>
      </div>
    </div>
  );
}
