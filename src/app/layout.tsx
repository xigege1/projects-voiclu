import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import "./globals.css";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { SITE } from "@/lib/constants";

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: "AI Voice Cloning — Clone Your Voice in Minutes, 75+ Languages",
    template: "%s",
  },
  description:
    "Clone your voice from 30 seconds of audio and dub it into 75+ languages. Free to try, no sign-up, commercial license included.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const umamiSrc = process.env.NEXT_PUBLIC_UMAMI_SRC;
  const umamiId = process.env.NEXT_PUBLIC_UMAMI_ID;
  return (
    <html lang="en" className={`${GeistSans.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        {/* Umami 埋点：填了 NEXT_PUBLIC_UMAMI_SRC / _ID 才加载，没填零开销 */}
        {umamiSrc && umamiId && (
          <script defer src={umamiSrc} data-website-id={umamiId} />
        )}
        <Nav />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
