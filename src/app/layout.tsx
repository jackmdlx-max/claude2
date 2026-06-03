import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ST-Streamline — Workflow Auditor",
  description:
    "Internal automated workflow auditor for Severn Trent's capital business. Identify, validate, and quantify manual workflow bottlenecks.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
