import Link from "next/link";
import { SITE } from "@/lib/constants";

export default function Footer() {
  return (
    <footer className="border-t border-gray-100 bg-gray-50">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 text-sm text-gray-600 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="font-bold text-gray-900">{SITE.name}</div>
          <p className="mt-2 leading-6">
            Clone your voice from 30 seconds of audio, then let it speak 75+
            languages.
          </p>
        </div>
        <div>
          <div className="mb-2 font-semibold text-gray-900">Product</div>
          <ul className="space-y-1.5">
            <li><Link className="hover:text-gray-900" href="/">AI Voice Cloning</Link></li>
            <li><Link className="hover:text-gray-900" href="/free">Free AI Voice Cloning</Link></li>
            <li><Link className="hover:text-gray-900" href="/text-to-speech">Text to Speech</Link></li>
            <li><Link className="hover:text-gray-900" href="/best">Best AI Voice Clone</Link></li>
            <li><Link className="hover:text-gray-900" href="/alternatives">ElevenLabs Alternatives</Link></li>
            <li><Link className="hover:text-gray-900" href="/pricing">Pricing</Link></li>
          </ul>
        </div>
        <div>
          <div className="mb-2 font-semibold text-gray-900">Legal</div>
          <ul className="space-y-1.5">
            <li><Link className="hover:text-gray-900" href="/terms">Terms of Service</Link></li>
            <li><Link className="hover:text-gray-900" href="/privacy">Privacy Policy</Link></li>
            <li><Link className="hover:text-gray-900" href="/refund">Refund Policy</Link></li>
            <li><Link className="hover:text-gray-900" href="/voice-removal">Voice Removal Request</Link></li>
          </ul>
        </div>
        <div>
          <div className="mb-2 font-semibold text-gray-900">Contact</div>
          <ul className="space-y-1.5">
            <li><a className="hover:text-gray-900" href={`mailto:${SITE.supportEmail}`}>{SITE.supportEmail}</a></li>
            <li>
              {/* 第 3~4 周启用 /br 后打开；与英文页互链是 hreflang 生效的关键 */}
              <Link className="hover:text-gray-900" href="/br">Português (Brasil)</Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-gray-100 py-4 text-center text-xs text-gray-400">
        © 2026 {SITE.name}. Audio output is AI-generated and watermarked.
      </div>
    </footer>
  );
}
