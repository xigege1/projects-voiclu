import type { Metadata } from "next";
import { SITE } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Refund Policy — Voiclu",
  description: "30-day money-back guarantee. How it works, and the two exceptions.",
};

export default function RefundPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 text-sm leading-7 text-foreground/90">
      <h1 className="text-3xl font-bold text-foreground">Refund Policy</h1>

      <div className="mt-8 space-y-6">
        <p>
          <strong className="text-foreground">30-day money-back guarantee.</strong> Email{" "}
          <a className="text-[var(--brand)] underline" href={`mailto:${SITE.supportEmail}`}>{SITE.supportEmail}</a>{" "}
          within 30 days of the charge and we refund the last payment in full. No interview, no
          form.
        </p>

        <section>
          <h2 className="text-base font-bold text-foreground">Not covered</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Top-up purchases already consumed more than 80%</li>
            <li>Accounts terminated for cloning a voice without permission</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-bold text-foreground">How the money comes back</h2>
          <p>
            Refunds are issued to the original payment method. Our Merchant of Record
            (Creem / Paddle) processes them and it typically takes 5–10 business days to appear
            on your statement.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-foreground">Cancelling a subscription</h2>
          <p>
            Cancelling stops future charges immediately and keeps your plan active until the end
            of the paid period. A cancellation is not a refund — but within the first 30 days you
            can have both.
          </p>
        </section>
      </div>
    </div>
  );
}
