import Link from "next/link";
import { SITE } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { AudioLines } from "lucide-react";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/#clone", label: "AI Voice Cloning" },
  { href: "/text-to-speech", label: "Text to Speech" },
  { href: "/pricing", label: "Pricing" },
  { href: "/free", label: "Free" },
];

export default function Nav() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-lg">
      <div className="container-gutter mx-auto flex h-16 max-w-6xl items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-base font-semibold tracking-tight">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r from-[var(--grad-from)] via-[var(--grad-mid)] to-[var(--grad-to)] text-white">
            <AudioLines className="size-4" />
          </span>
          {SITE.name}
        </Link>
        <nav className="hidden items-center gap-1 text-sm text-muted-foreground md:flex">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.label}
              href={l.href}
              className="rounded-md px-3 py-1.5 transition-colors hover:bg-muted hover:text-foreground"
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <Button asChild size="sm" className="btn-primary h-9">
          <Link href="/#clone">Try free</Link>
        </Button>
      </div>
    </header>
  );
}
