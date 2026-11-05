import Link from "next/link";
import { SITE } from "@/lib/constants";

export default function Footer() {
  return (
    <footer className="border-t bg-muted/40">
      <div className="container-gutter mx-auto grid max-w-6xl gap-8 py-12 text-sm text-muted-foreground sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="font-semibold text-foreground">{SITE.name}</div>
          <p className="mt-2 leading-6">
            Clone your voice from 30 seconds of audio, then let it speak 75+
            languages.
          </p>
        </div>
        <div>
          <div className="mb-3 font-semibold text-foreground">Product</div>
          <ul className="space-y-2">
            <li><Link className="transition-colors hover:text-foreground" href="/">AI Voice Cloning</Link></li>
            <li><Link className="transition-colors hover:text-foreground" href="/free">Free AI Voice Cloning</Link></li>
            <li><Link className="transition-colors hover:text-foreground" href="/text-to-speech">Text to Speech</Link></li>
            <li><Link className="transition-colors hover:text-foreground" href="/best">Best AI Voice Clone</Link></li>
            <li><Link className="transition-colors hover:text-foreground" href="/alternatives">ElevenLabs Alternatives</Link></li>
            <li><Link className="transition-colors hover:text-foreground" href="/pricing">Pricing</Link></li>
          </ul>
        </div>
        <div>
          <div className="mb-3 font-semibold text-foreground">Legal</div>
          <ul className="space-y-2">
            <li><Link className="transition-colors hover:text-foreground" href="/terms">Terms of Service</Link></li>
            <li><Link className="transition-colors hover:text-foreground" href="/privacy">Privacy Policy</Link></li>
            <li><Link className="transition-colors hover:text-foreground" href="/refund">Refund Policy</Link></li>
            <li><Link className="transition-colors hover:text-foreground" href="/voice-removal">Voice Removal Request</Link></li>
          </ul>
        </div>
        <div>
          <div className="mb-3 font-semibold text-foreground">Company</div>
          <ul className="space-y-2">
            <li><Link className="transition-colors hover:text-foreground" href="/about">About</Link></li>
            <li><Link className="transition-colors hover:text-foreground" href="/contact">Contact</Link></li>
            <li><a className="transition-colors hover:text-foreground" href={`mailto:${SITE.supportEmail}`}>{SITE.supportEmail}</a></li>
            <li><Link className="transition-colors hover:text-foreground" href="/br">Português (Brasil)</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t py-4 text-center text-xs text-muted-foreground">
        © 2026 {SITE.name}. Audio output is AI-generated and watermarked.
      </div>
    </footer>
  );
}
