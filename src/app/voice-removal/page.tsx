import type { Metadata } from "next";
import { SITE } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Request removal of a cloned voice — Voiclu",
  description: "If someone cloned your voice on Voiclu without permission, request removal here. No account needed.",
};

export default function VoiceRemovalPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold text-foreground">Voice removal request</h1>
      <p className="mt-4 leading-8 text-foreground/90">
        If someone has cloned your voice on Voiclu without your permission, tell us and we will
        take it down. This page is for anyone — you do not need an account.
      </p>

      <div className="mt-10 grid gap-8 md:grid-cols-2">
        <section>
          <h2 className="text-base font-bold text-foreground">What we need</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-7 text-foreground/90">
            <li>The URL of the voice profile or the generated audio</li>
            <li>A way to reach you</li>
            <li>A short statement that the voice is yours and that you did not authorise it</li>
            <li>Optional: a link or recording that helps us confirm it is your voice</li>
          </ul>
        </section>
        <section>
          <h2 className="text-base font-bold text-foreground">What happens next</h2>
          <p className="mt-2 text-sm leading-7 text-foreground/90">
            We acknowledge within 2 business days. Voices reported under this process are
            suspended while we review, and removed permanently if the uploader cannot show
            written consent. We keep a record of every request.
          </p>
        </section>
      </div>

      {/* 表单提交：接 Resend/Formspree/自建 /api/removal 前先用 mailto 兜底，48 小时承诺立即生效 */}
      <form
        className="mt-10 space-y-4 rounded-2xl border border-border/60 p-6"
        action={`mailto:${SITE.supportEmail}`}
        method="post"
        encType="text/plain"
      >
        <div>
          <label className="text-sm font-medium">URL of the voice or audio *</label>
          <input required type="url" name="target_url" placeholder="https://voiclu.com/…" className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="text-sm font-medium">Your email *</label>
          <input required type="email" name="contact" className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="text-sm font-medium">Statement *</label>
          <textarea required rows={4} name="statement" placeholder="The voice at the URL above is mine and I did not authorise its cloning." className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="text-sm font-medium">Evidence (optional)</label>
          <input type="text" name="evidence" placeholder="A link or note that helps us confirm it is your voice" className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm" />
        </div>
        <button type="submit" className="rounded-lg bg-[var(--brand)] px-5 py-2.5 text-sm font-semibold text-white">
          Send removal request
        </button>
      </form>

      <p className="mt-6 text-sm leading-7 text-foreground/90">
        If the voice is being used to impersonate you for fraud, say so in the statement — those
        cases are handled first.
      </p>
    </div>
  );
}
