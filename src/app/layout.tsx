import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import { Inter, JetBrains_Mono, Orbitron } from "next/font/google";
import { InstallPrompt } from "@/components/pwa/install-prompt";
import { SITE } from "@/lib/site";
import "./globals.css";

/**
 * Fonts are self-hosted by next/font at build time — no request ever leaves
 * for fonts.googleapis.com, so there is no render-blocking third-party round
 * trip and no CLS from a late swap. `display: swap` shows text immediately in
 * the fallback; the size-adjust metrics next/font emits keep the swap from
 * shifting the layout.
 */
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
  weight: ["400", "500"],
});

/**
 * Display face. Only the two weights the design actually uses are requested —
 * Orbitron's full variable range would be a needless ~40 KB on first paint for
 * weights nothing renders.
 */
const orbitron = Orbitron({
  subsets: ["latin"],
  variable: "--font-orbitron",
  display: "swap",
  weight: ["700", "800"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.name} — ${SITE.tagline}`,
    template: `%s · ${SITE.name}`,
  },
  description: SITE.description,
  applicationName: SITE.name,
  // Canonical for the site root; every page sets its own relative canonical.
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: SITE.name,
    locale: "en_IN",
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.description,
    url: SITE.url,
    images: [
      {
        url: SITE.ogImage,
        width: SITE.ogImageWidth,
        height: SITE.ogImageHeight,
        alt: `${SITE.name} — ${SITE.tagline}`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.description,
    images: [SITE.ogImage],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: SITE.name, statusBarStyle: "black-translucent" },
  // Icons come from the app/ file conventions (icon.png, apple-icon.png,
  // favicon.ico) rather than being declared here as well. Declaring both
  // emitted two competing sets of <link rel="icon"> tags for the same
  // artwork. public/icons/* stays — the web manifest still points at it.
};

export const viewport: Viewport = {
  themeColor: "#0a0a0c",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${mono.variable} ${orbitron.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-surface-0 text-ink-1 antialiased">
        {/*
          Skip link — the first thing a keyboard or screen-reader user meets.
          Visually hidden until focused, then it lands on the page's <main>.
        */}
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-xl focus:bg-brand-500 focus:px-4 focus:py-2.5 focus:text-sm focus:font-medium focus:text-white"
        >
          Skip to content
        </a>
        {children}
        <InstallPrompt />
        {/* Vercel Web Analytics — page views only, no cookies. */}
        <Analytics />
      </body>
    </html>
  );
}
