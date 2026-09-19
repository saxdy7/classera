import type { Metadata } from "next";
import localFont from "next/font/local";

/**
 * Fonts are SELF-HOSTED via @fontsource rather than fetched with
 * next/font/google.
 *
 * next/font/google downloads font files from fonts.gstatic.com at compile time.
 * When that fetch fails (it was returning 404s for stale file URLs here), the
 * generated font module fails to resolve, which breaks THIS layout - and a
 * broken root layout blocks every route in the app, leaving pages stuck on
 * loading.tsx indefinitely. Self-hosting removes that build-time network
 * dependency entirely, so the app no longer depends on a CDN to boot.
 *
 * The families are unchanged: Inter for UI, JetBrains Mono for code/metrics,
 * Plus Jakarta Sans retained for legacy body usage.
 */
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/jetbrains-mono/400.css";
import "@fontsource/jetbrains-mono/500.css";
import "@fontsource/plus-jakarta-sans/400.css";
import "@fontsource/plus-jakarta-sans/500.css";
import "@fontsource/plus-jakarta-sans/600.css";

import "./globals.css";
import { Providers } from "./providers";
import { FloatingAI } from "@/components/shared/FloatingAI";

// ClashDisplay ships in /public, so it was never affected by the CDN failure.
const displayFont = localFont({
  src: "../../public/ClashDisplay-Variable.ttf",
  weight: "100 500",
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Classera - Learn & Connect Together",
  description: "Modern learning platform combining video conferencing with intelligent learning management",
  keywords: "education, learning, video conferencing, LMS, online classes",
  authors: [{ name: "Classera Team" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`scroll-smooth ${displayFont.variable}`}
      suppressHydrationWarning
    >
      <body className="antialiased" suppressHydrationWarning>
        <Providers>
          {children}
          <FloatingAI />
        </Providers>
      </body>
    </html>
  );
}
