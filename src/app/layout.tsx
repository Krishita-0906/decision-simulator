import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Decision Simulator — Multi-Agent AI Engine",
  description:
    "Three AI advisors debate your decision in parallel. One synthesis tells you what to do.",
  openGraph: {
    title: "Decision Simulator",
    description: "Multi-agent AI debate engine for better decisions.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
