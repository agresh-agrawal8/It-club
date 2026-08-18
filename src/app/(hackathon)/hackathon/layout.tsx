import type { Metadata } from "next";
import Link from "next/link";
import { HackNav } from "@/components/hackathon/hack-nav";
import { Container } from "@/components/ui/container";
import { EVENT } from "@/lib/hackathon/content";

export const metadata: Metadata = {
  title: {
    default: "Infinium Hackathon",
    template: "%s · Infinium",
  },
  description:
    "Infinium — a one-day, fully offline software hackathon at Emerald Heights International School. 20 teams, one sealed problem each, no internet.",
};

/**
 * The hackathon shell.
 *
 * Deliberately does no authentication. Reading cookies here would opt every
 * page under /hackathon out of static generation, which is exactly what the
 * public pages should be — they are identical for every visitor and now render
 * from constants with no database access. The core team reaches the organiser
 * console through the footer link; those routes authorise themselves.
 */
export default function HackathonLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-[#08080b]">
      <HackNav />
      <main className="flex-1">{children}</main>

      <footer className="mt-20 border-t border-white/[0.07] py-8">
        <Container className="flex flex-col gap-4">
          {/* The rule from the bottom of every page of the printed guide. */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-[10px] uppercase tracking-[0.2em] text-zinc-600">
            <span>Build · Adapt · Innovate</span>
            <span className="hidden sm:inline">Infinium · {EVENT.edition}</span>
            <span>One day · 8:30 AM – 3:00 PM</span>
          </div>
          <div className="h-px w-full bg-white/[0.07]" />
          <div className="flex flex-col items-center justify-between gap-3 text-center sm:flex-row sm:text-left">
            <p className="text-xs text-zinc-500">
              Infinium — the flagship IT Fest of {EVENT.school}, run by{" "}
              <Link href="/" className="text-brand-300 transition-colors hover:text-brand-200">
                Avinya
              </Link>
              .
            </p>
            <div className="flex items-center gap-4">
              <Link
                href="/hackathon/team"
                className="text-xs text-zinc-500 transition-colors hover:text-white"
              >
                Team portal
              </Link>
              <Link
                href="/hackathon/admin"
                className="text-xs text-zinc-600 transition-colors hover:text-white"
              >
                Core team
              </Link>
              <span className="text-[11px] text-zinc-700">
                © {new Date().getFullYear()} Avinya
              </span>
            </div>
          </div>
        </Container>
      </footer>
    </div>
  );
}
