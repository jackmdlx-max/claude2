import type { Metadata } from "next";
import { Space_Grotesk, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

// Display face for headings/wordmark — geometric, engineered character.
const display = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

// Clean grotesk for body copy — highly legible, modern, not a default.
const body = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Capital AI Idea Generation — Severn Trent",
  description:
    "Capital AI Idea Generation: an internal workflow auditor for Severn Trent's capital business. Identify, validate and quantify manual bottlenecks, then auto-design and cost an automation solution.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body className="font-sans">{children}</body>
    </html>
  );
}
