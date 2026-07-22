import type { Metadata, Viewport } from "next";
import { InstallPrompt } from "@/components/pwa/install-prompt";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Avinya — The IT & AI Club of Emerald Heights International School",
    template: "%s · Avinya",
  },
  description:
    "Avinya — the official IT & AI Club of Emerald Heights International School. Student projects, events, competitions, achievements and a community of makers. Where ideas compile into reality.",
  keywords: [
    "Avinya",
    "IT Club",
    "AI Club",
    "Emerald Heights",
    "student projects",
    "coding",
    "artificial intelligence",
    "robotics",
    "hackathon",
  ],
  openGraph: {
    type: "website",
    siteName: "Avinya",
    title: "Avinya — The IT & AI Club of Emerald Heights International School",
    description:
      "Where ideas compile into reality — projects, events, competitions and achievements from the Avinya IT & AI Club.",
    url: siteUrl,
  },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Avinya",
    statusBarStyle: "black-translucent",
  },
  icons: {
    apple: "/icons/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#8b5cf6",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${mono.variable}`} suppressHydrationWarning>
      <body className="min-h-screen bg-surface-0 text-zinc-100 antialiased">
        {children}
        <InstallPrompt />
      </body>
    </html>
  );
}
