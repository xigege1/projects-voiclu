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
    <section id="pricing" className={compact ? "" : "section-pad border-t border-border/60"}>
      <div className="container-gutter mx-auto max-w-6xl">
        <h2 className="section-title">Simple pricing</h2>
        <p className="section-lead">
          Pay per character, never per minute of silence. 1,000 characters ≈ 1 minute of audio.
        </p>
        <p className="mt-2 text-center text-sm text-muted-foreground">{ANNUAL_NOTE}</p>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {PLANS.map((p) => (
            <Card
              key={p.id}
              className={cn(
                "relative overflow-visible",
                p.highlight && "border-primary/60 shadow-lg shadow-primary/10"
              )}
            >
              {p.highlight && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground">
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
                <ul className="space-y-3 text-[15px] leading-6 text-muted-foreground">
                  {p.features.map((f) => (
                    <li key={f} className="flex gap-2.5">
                      <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                      {f}
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                {/*
                  TODO(checkout)：拿到渠道产品后，把 href 指向 <a href={checkoutUrl(p.id)}>。
                  checkoutUrl 建议从 env 读（CREEM_CHECKOUT_STARTER / _CREATOR / _ONETIME），
                  这样以后加 Stripe 只需再补一组 STRIPE_PRICE_*，不用改组件。
                  收款侧入账已渠道无关：见 src/lib/payments.ts 的 grantPlan()。
                */}
                <Button
                  asChild
                  className={cn("w-full", p.highlight && "btn-primary")}
                  variant={p.highlight ? "default" : "outline"}
                >
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
