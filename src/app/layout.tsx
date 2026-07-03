import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "soch.exe — IT Club of Emerald Heights International School",
    template: "%s · soch.exe",
  },
  description:
    "soch.exe — the official IT Club of Emerald Heights International School. Student projects, events, competitions, achievements and a community of makers. Where ideas compile into reality.",
  keywords: ["soch.exe", "IT Club", "Emerald Heights", "student projects", "coding", "robotics", "hackathon"],
  openGraph: {
    type: "website",
    siteName: "soch.exe",
    title: "soch.exe — IT Club of Emerald Heights International School",
    description:
      "Where ideas compile into reality — projects, events, competitions and achievements from the EHIS IT Club.",
    url: siteUrl,
  },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className="min-h-screen bg-surface-0 text-zinc-100 antialiased">{children}</body>
    </html>
  );
}
