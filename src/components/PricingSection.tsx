import Link from "next/link";
import { PLANS, ANNUAL_NOTE } from "@/lib/constants";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export default function PricingSection({ compact = false }: { compact?: boolean }) {
  return (
    <section id="pricing" className={compact ? "" : "section-pad"}>
      <div className="container-gutter mx-auto max-w-6xl">
        <h2 className="text-center text-3xl font-bold tracking-tight sm:text-4xl">Simple pricing</h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-muted-foreground">
          Pay per character, never per minute of silence. 1,000 characters ≈ 1 minute of audio.
        </p>
        <p className="mt-1 text-center text-sm text-muted-foreground">{ANNUAL_NOTE}</p>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {PLANS.map((p) => (
            <Card
              key={p.id}
              className={cn(
                "relative",
                p.highlight && "border-primary shadow-lg shadow-primary/10 ring-1 ring-primary"
              )}
            >
              {p.highlight && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                  Most popular
                </Badge>
              )}
              <CardHeader>
                <CardTitle className="text-base font-semibold text-muted-foreground">
                  {p.name}
                </CardTitle>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold">${p.price}</span>
                  <span className="text-muted-foreground">{p.period}</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2.5 text-sm text-muted-foreground">
                  {p.features.map((f) => (
                    <li key={f} className="flex gap-2.5">
                      <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                      {f}
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                {/* TODO(checkout): 接入 Creem 后把 href 换成对应 checkout 链接 */}
                <Button asChild className="w-full" variant={p.highlight ? "default" : "outline"}>
                  <a href="/pricing">{p.id === "onetime" ? "Buy once" : "Subscribe"}</a>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          30-day money-back guarantee · Commercial license on all paid plans ·{" "}
          <Link href="/refund" className="underline">Refund policy</Link>
        </p>
      </div>
    </section>
  );
}
