import type { Metadata } from "next";
import "./globals.css";

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
        {children}
      </body>
    </html>
  );
}
