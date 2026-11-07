import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import "./globals.css";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import HashAuth from "@/components/HashAuth";
import { Analytics } from "@vercel/analytics/next";
import { SITE } from "@/lib/constants";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: "AI Voice Cloning — Clone Your Voice in Minutes, 75+ Languages",
    template: "%s",
  },
  description:
    "Clone your voice from 30 seconds of audio and dub it into 75+ languages. Free to try, no sign-up, commercial license included.",
  openGraph: {
    type: "website",
    siteName: SITE.name,
    url: SITE.url,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const umamiSrc = process.env.NEXT_PUBLIC_UMAMI_SRC;
  const umamiId = process.env.NEXT_PUBLIC_UMAMI_ID;
  return (
    <html lang="en" className={cn("h-full", "antialiased", "dark", GeistSans.variable, "font-sans")}>
      <body className="flex min-h-full flex-col">
        {/* Umami 埋点：填了 NEXT_PUBLIC_UMAMI_SRC / _ID 才加载，没填零开销 */}
        {umamiSrc && umamiId && (
          <script defer src={umamiSrc} data-website-id={umamiId} />
        )}
        <Nav />
        <HashAuth />
        <main className="flex-1">{children}</main>
        <Footer />
        {/*
          Vercel Web Analytics：只在 Vercel 部署环境注入 /_vercel/insights/script.js，
          本地 dev / 自托管不会发出请求，也不影响 LCP（defer 加载）。
          Hobby 计划含 50,000 events/月，超出只暂停收集、不扣费。
          与下面的 Umami 二选一即可：Umami 变量为空时不会加载，两套并存会双计事件。
        */}
        <Analytics />
      </body>
    </html>
  );
}
