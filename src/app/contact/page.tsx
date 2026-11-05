import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Contact Voiclu — Support, billing, takedown",
  description:
    "Reach the Voiclu team for support, billing questions, voice takedown requests or abuse reports. Replies within one business day.",
};

const CHANNELS = [
  {
    tag: "General",
    subject: "Question about Voiclu",
    title: "Product & technical support",
    desc: "Something not working, a clone that sounds off, a language that is missing. Include the browser and what you were doing — it saves a round trip.",
    sla: "Within 1 business day",
  },
  {
    tag: "Billing",
    subject: "Billing question",
    title: "Payments, invoices, refunds",
    desc: "Wrong plan, duplicate charge, receipt needed for accounting, or a refund request under our 30-day policy. Include the email you paid with.",
    sla: "Within 1 business day",
  },
  {
    tag: "Takedown",
    subject: "Voice removal request",
    title: "My voice was cloned without permission",
    desc: "Tell us the URL of the audio and why the voice is yours. We suspend the voice while we review, and remove it if consent cannot be shown.",
    sla: "Within 48 hours (suspended on receipt)",
  },
  {
    tag: "Abuse",
    subject: "Report abuse",
    title: "Impersonation, fraud, prohibited use",
    desc: "Impersonating a public figure, fraud, harassment, or anything that violates our terms. Send links or screenshots if you have them.",
    sla: "Within 24 hours",
  },
] as const;

function mailto(subject: string): string {
  return `mailto:${SITE.supportEmail}?subject=${encodeURIComponent(subject)}`;
}

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 text-sm leading-7 text-gray-700">
      <h1 className="text-3xl font-bold text-gray-900">Contact us</h1>
      <p className="mt-2 text-gray-500">
        One inbox, read by the people who build the product. Pick the closest topic so it reaches the
        right queue.
      </p>

      <p className="mt-6 rounded-xl bg-[var(--brand-soft)] px-4 py-3">
        <span className="font-semibold text-gray-900">Email:</span>{" "}
        <a href={`mailto:${SITE.supportEmail}`} className="font-medium text-[var(--brand)] underline">
          {SITE.supportEmail}
        </a>
        <br />
        <span className="text-xs text-gray-600">
          No ticket portal, no chatbot. A real reply, usually the same day.
        </span>
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {CHANNELS.map((c) => (
          <div key={c.tag} className="rounded-2xl border border-gray-200 p-5">
            <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
              {c.tag}
            </span>
            <h2 className="mt-3 text-base font-bold text-gray-900">{c.title}</h2>
            <p className="mt-2 text-sm leading-6 text-gray-600">{c.desc}</p>
            <p className="mt-3 text-xs text-gray-400">{c.sla}</p>
            <a
              href={mailto(c.subject)}
              className="mt-3 inline-block rounded-lg bg-[var(--brand)] px-4 py-2 text-xs font-semibold text-white hover:bg-[#5b21b6]"
            >
              Email about this
            </a>
          </div>
        ))}
      </div>

      <section className="mt-10">
        <h2 className="text-base font-bold text-gray-900">Before you write</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>
            Refund terms are on the{" "}
            <Link href="/refund" className="text-[var(--brand)] underline">
              refund policy
            </Link>{" "}
            page — 30 days, no questions asked for first-time purchases.
          </li>
          <li>
            What we collect and how to have it deleted is on the{" "}
            <Link href="/privacy" className="text-[var(--brand)] underline">
              privacy policy
            </Link>{" "}
            page.
          </li>
          <li>
            If your voice was cloned without permission, use the{" "}
            <Link href="/voice-removal" className="text-[var(--brand)] underline">
              voice removal form
            </Link>{" "}
            instead — it creates a record we are obliged to act on.
          </li>
          <li>We cannot help with cloning a third party&apos;s voice, including public figures.</li>
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="text-base font-bold text-gray-900">Business details</h2>
        <p className="mt-2">
          Voiclu is operated as an independent online service and sells worldwide. Payments are
          handled by a third-party payment provider — we never see or store card numbers. For
          invoices or tax documents, email the billing address above with the email you paid with.
        </p>
      </section>
    </div>
  );
}
