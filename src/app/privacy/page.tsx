import type { Metadata } from "next";
import { SITE, LEGAL_UPDATED } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Privacy Policy — Voiclu",
  description: "What Voiclu collects, why, and how to have it deleted.",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 text-sm leading-7 text-gray-700">
      <h1 className="text-3xl font-bold text-gray-900">Privacy Policy</h1>
      <p className="mt-2 text-xs text-gray-400">Last updated: {LEGAL_UPDATED}</p>

      <div className="mt-8 space-y-8">
        <section>
          <h2 className="text-base font-bold text-gray-900">What we collect</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Your email address (login codes only — we never ask for a password)</li>
            <li>Voice samples you upload, and the audio we generate from them</li>
            <li>Your IP address, logged with consent confirmations and for rate limiting</li>
            <li>Basic analytics (page views, tool interactions — no cross-site tracking)</li>
          </ul>
          <p className="mt-2">
            Payments are processed by our Merchant of Record (Creem / Paddle). We never see or
            store your card number.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-900">Audio samples — how long we keep them</h2>
          <p className="mt-2">
            For the lifetime of your account, and deleted within 30 days after you delete your
            account. We keep a subset of samples beyond that only when required to handle an
            abuse or takedown report.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-900">Who processes your data</h2>
          <p className="mt-2">
            To clone a voice and generate speech, your sample and text are sent to a
            third-party TTS provider (currently ElevenLabs). This is required for the service to
            work. Storage is on [Cloudflare R2 / 选定区域]. We do not sell your data to anyone.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-900">Your rights (GDPR, LGPD and friends)</h2>
          <p className="mt-2">
            You can request a copy of your data, correct it, or have it deleted. Brazil&apos;s
            LGPD gives you the same rights, and Brazilian users are covered by the same process.
            Email{" "}
            <a className="text-[var(--brand)] underline" href={`mailto:${SITE.supportEmail}`}>{SITE.supportEmail}</a>{" "}
            and we respond within 30 days (usually much faster). You may also complain to your
            local data protection authority.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-900">Cookies</h2>
          <p className="mt-2">
            We set one cookie to remember your free-tier usage and, if you sign in, your
            session. Analytics run on [Umami / GA4 — 上线前定], which uses a single first-party
            cookie. No advertising cookies, no cross-site trackers.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-900">Children</h2>
          <p className="mt-2">
            The service is not for anyone under 16, and we do not knowingly collect their data.
            We do not process voice samples of minors.
          </p>
        </section>

        <p className="text-gray-500">Contact: <a className="text-[var(--brand)] underline" href={`mailto:${SITE.supportEmail}`}>{SITE.supportEmail}</a></p>
      </div>
    </div>
  );
}
