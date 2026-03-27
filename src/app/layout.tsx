import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { FloatingAI } from "@/components/shared/FloatingAI";

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
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <body className="antialiased" suppressHydrationWarning>
        <Providers>
          {children}
          <FloatingAI />
        </Providers>
      </body>
    </html>
  );
}
