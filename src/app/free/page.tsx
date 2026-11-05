import type { Metadata } from "next";
import Link from "next/link";
import ToolCard from "@/components/ToolCard";
import FaqJsonLd from "@/components/FaqJsonLd";
import { FREE_CHARS, LANG_COUNT_LABEL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Free AI Voice Cloning Online — No Sign-up, No Watermark",
  description:
    "Try AI voice cloning free. Upload 30 seconds of audio, hear your own voice speak a new language, download the result. No credit card.",
};

const FREE_FAQ = [
  {
    q: "Is the free version really free, or is it a trial that charges later?",
    a: "It is free. No card, no auto-charge, no subscription created.",
  },
  {
    q: "Can I download the free sample?",
    a: 'Yes, with a small "generated with Voiclu" tag. Paid output has no tag.',
  },
  {
    q: "Do I need to sign up to try it?",
    a: "No. Sign-up is only required if you want to keep the voice profile for later.",
  },
  {
    q: "Can I use the free sample commercially?",
    a: "No. Free output is for testing only — paid plans include a commercial license.",
  },
];

export default function FreePage() {
  return (
    <div>
      <section className="bg-gradient-to-b from-[var(--brand-soft)] to-white py-14">
        <div className="mx-auto max-w-6xl px-4 lg:flex lg:items-start lg:gap-12">
          <div className="lg:max-w-xl">
            <h1 className="text-4xl font-bold tracking-tight">Free AI Voice Cloning</h1>
            <p className="mt-4 text-lg leading-8 text-gray-600">
              One free generation, no sign-up, no credit card. Hear your own voice speak{" "}
              {LANG_COUNT_LABEL} languages in about 3 minutes.
            </p>
            <div className="mt-8 space-y-8 text-sm leading-7 text-gray-700">
              <div>
                <h2 className="mb-2 text-base font-bold text-gray-900">What you get for free</h2>
                <ul className="list-disc space-y-1 pl-5">
                  <li>One full generation — up to {FREE_CHARS} characters (roughly 30 seconds of audio)</li>
                  <li>All {LANG_COUNT_LABEL} languages unlocked in the free run</li>
                  <li>No sign-up, no credit card, no watermark on the free sample player</li>
                  <li>Download the audio and use it to test quality before you pay</li>
                </ul>
              </div>
              <div>
                <h2 className="mb-2 text-base font-bold text-gray-900">What happens after your free generation</h2>
                <p>
                  You pick a plan when you want to generate again. Nothing is charged
                  automatically and we do not store a card on the free tier.
                </p>
              </div>
              <div>
                <h2 className="mb-2 text-base font-bold text-gray-900">Why we limit free runs to one</h2>
                <p>
                  Voice cloning costs us money on every generation — the compute is billed per
                  character. One free run lets you judge the quality honestly without turning the
                  free tier into a queue of bots. Paid plans start at $9.9/month.
                </p>
              </div>
            </div>
          </div>
          <div className="mt-10 flex-1 lg:mt-0">
            <ToolCard />
          </div>
        </div>
      </section>

      <section className="py-14">
        <div className="mx-auto max-w-3xl px-4">
          <h2 className="text-xl font-bold">Free vs paid</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-gray-500">
                  <th className="py-2"> </th>
                  <th className="py-2">Free</th>
                  <th className="py-2">Starter $9.9/mo</th>
                  <th className="py-2">Creator $29/mo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr>
                  <td className="py-2 font-medium">Generations</td>
                  <td>1</td>
                  <td>20,000 chars/mo</td>
                  <td>80,000 chars/mo</td>
                </tr>
                <tr>
                  <td className="py-2 font-medium">Languages</td>
                  <td>all</td>
                  <td>all</td>
                  <td>all</td>
                </tr>
                <tr>
                  <td className="py-2 font-medium">Commercial license</td>
                  <td>no</td>
                  <td>yes</td>
                  <td>yes</td>
                </tr>
                <tr>
                  <td className="py-2 font-medium">Voice re-cloning</td>
                  <td>no</td>
                  <td>yes</td>
                  <td>yes</td>
                </tr>
                <tr>
                  <td className="py-2 font-medium">Watermark</td>
                  <td>on sample</td>
                  <td>none</td>
                  <td>none</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-sm text-gray-500">
            Full details on the{" "}
            <Link href="/pricing" className="text-[var(--brand)] underline">pricing page</Link>.
            One-time $49 pack and annual plans are also available there.
          </p>

          <h2 className="mt-12 text-xl font-bold">FAQ</h2>
          <div className="mt-4 divide-y divide-gray-100 rounded-xl border border-gray-100">
            {FREE_FAQ.map((f) => (
              <details key={f.q} className="p-4">
                <summary className="cursor-pointer font-medium">{f.q}</summary>
                <p className="mt-2 text-sm leading-6 text-gray-600">{f.a}</p>
              </details>
            ))}
          </div>
          <FaqJsonLd items={FREE_FAQ} />
        </div>
      </section>
    </div>
  );
}
