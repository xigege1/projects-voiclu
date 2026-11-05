import type { Metadata } from "next";
import Link from "next/link";
import ToolCard from "@/components/ToolCard";
import DemoSection from "@/components/DemoSection";
import StepsAndUseCases from "@/components/StepsAndUseCases";
import ExplainSection from "@/components/ExplainSection";
import PricingSection from "@/components/PricingSection";
import FaqSection from "@/components/FaqSection";
import FaqJsonLd from "@/components/FaqJsonLd";
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

export default function HomePage() {
  return (
    <div>
      {/* 1. H1 + 副标题：首屏不谈价格，谈结果 */}
      <section className="bg-gradient-to-b from-[var(--brand-soft)] to-white py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 lg:flex lg:items-start lg:gap-12">
          <div className="lg:max-w-xl">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">AI Voice Cloning</h1>
            <p className="mt-4 text-lg leading-8 text-gray-600">
              30 seconds of audio → your voice speaking {LANG_COUNT_LABEL} languages.
              Clone once, dub everything, never re-record.
            </p>
            <p className="mt-3 text-sm text-gray-500">
              Free to try · No sign-up · No credit card ·{" "}
              <Link href="/free" className="font-medium text-[var(--brand)] underline">
                how the free tier works
              </Link>
            </p>
            <div className="mt-6 flex flex-wrap gap-2 text-xs text-gray-500">
              <span className="rounded-full bg-white px-3 py-1 shadow-sm">Commercial license on paid plans</span>
              <span className="rounded-full bg-white px-3 py-1 shadow-sm">Consent required on every clone</span>
              <span className="rounded-full bg-white px-3 py-1 shadow-sm">30-day money-back</span>
            </div>
          </div>
          {/* 2. 工具卡 */}
          <div className="mt-10 flex-1 lg:mt-0">
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
