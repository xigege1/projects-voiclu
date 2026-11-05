import type { Metadata } from "next";
import Link from "next/link";
import ToolCard from "@/components/ToolCard";
import DemoSection from "@/components/DemoSection";
import StepsAndUseCases from "@/components/StepsAndUseCases";
import ExplainSection from "@/components/ExplainSection";
import PricingSection from "@/components/PricingSection";
import FaqSection from "@/components/FaqSection";
import FaqJsonLd from "@/components/FaqJsonLd";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, Check } from "lucide-react";
import { FAQ_HOME, LANG_COUNT_LABEL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "AI Voice Cloning — Clone Your Voice in Minutes, 75+ Languages",
  description:
    "Clone your voice from 30 seconds of audio and dub it into 75+ languages. Free to try, no sign-up, commercial license included.",
  alternates: {
    canonical: "/",
    languages: {
      en: "/",
      "pt-BR": "/br",
      "x-default": "/",
    },
  },
};

const HERO_CHIPS = [
  "Commercial license on paid plans",
  "Consent required on every clone",
  "30-day money-back",
];

export default function HomePage() {
  return (
    <div>
      {/* 1. H1 + 副标题：首屏不谈价格，谈结果 */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(60%_60%_at_50%_0%,var(--brand-soft),transparent)]" />
        <div className="container-gutter mx-auto max-w-6xl py-16 sm:py-24 lg:flex lg:items-center lg:gap-14">
          <div className="lg:max-w-xl">
            <Badge variant="secondary" className="mb-5">
              <Check className="size-3.5" /> Clone once, dub everything
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              AI Voice Cloning
            </h1>
            <p className="mt-5 text-lg leading-8 text-muted-foreground">
              30 seconds of audio → your voice speaking {LANG_COUNT_LABEL} languages.
              Clone once, dub everything, never re-record.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Button asChild size="lg">
                <Link href="/#clone">
                  Clone your voice <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/free">How the free tier works</Link>
              </Button>
            </div>
            <div className="mt-7 flex flex-wrap gap-2">
              {HERO_CHIPS.map((c) => (
                <Badge key={c} variant="outline" className="font-normal text-muted-foreground">
                  {c}
                </Badge>
              ))}
            </div>
          </div>
          {/* 2. 工具卡 */}
          <div className="mt-12 flex-1 lg:mt-0">
            <ToolCard />
          </div>
        </div>
      </section>

      {/* 3. 三步说明（H2: How it works）+ 使用场景（H2: What people build with it） */}
      <StepsAndUseCases />

      {/* 4. 成对试听区（H2: Hear the same voice in 6 languages，预生成，不调 API） */}
      <DemoSection />

      {/* 4.5 首页正文（H2: What is AI voice cloning?）+ 对比表（H2: Voiclu vs ElevenLabs） */}
      <ExplainSection />

      {/* 5. 价格三档 */}
      <PricingSection />

      {/* 7. FAQ 8 条 */}
      <FaqSection />

      {/* FAQ 结构化数据（富摘要） */}
      <FaqJsonLd items={FAQ_HOME} />
    </div>
  );
}
