import Link from "next/link";
import { SITE } from "@/lib/constants";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/#clone", label: "AI Voice Cloning" },
  { href: "/text-to-speech", label: "Text to Speech" },
  { href: "/pricing", label: "Pricing" },
  { href: "/free", label: "Free" },
];

export default function Nav() {
  return (
    <header className="sticky top-0 z-40 border-b border-gray-100 bg-white/90 backdrop-blur">
      <div className="container-gutter mx-auto flex h-14 max-w-6xl items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold tracking-tight">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[var(--brand)] text-sm text-white">V</span>
          {SITE.name}
        </Link>
        <nav className="hidden items-center gap-6 text-sm text-gray-600 md:flex">
          {NAV_LINKS.map((l) => (
            <Link key={l.label} href={l.href} className="hover:text-gray-900">
              {l.label}
            </Link>
          ))}
          <Link
            href="/#clone"
            className="rounded-full bg-[var(--brand)] px-4 py-1.5 text-sm text-white hover:bg-[#5b21b6]"
          >
            Try free
          </Link>
        </nav>
      </div>
    </header>
  );
}
