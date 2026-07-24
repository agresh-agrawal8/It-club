import type { Metadata } from "next";
import Link from "next/link";
import { HackNav } from "@/components/hackathon/hack-nav";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = {
  title: {
    default: "Infinium Hackathon",
    template: "%s · Infinium Hackathon",
  },
  description:
    "Infinium Hackathon by Avinya — 36 hours, one idea, infinite outcomes. Teams, problem statements, live leaderboard and more.",
};

export default function HackathonLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <HackNav />
      <main className="flex-1">{children}</main>
      <footer className="mt-16 border-t border-white/10 py-10">
        <Container className="flex flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left">
          <p className="text-xs text-zinc-500">
            Infinium Hackathon — a module of{" "}
            <Link href="/" className="text-brand-300 hover:text-brand-200">
              Avinya
            </Link>
            , the IT &amp; AI Club of Emerald Heights.
          </p>
          <p className="text-[11px] text-zinc-600">© {new Date().getFullYear()} Avinya · Infinium</p>
        </Container>
      </footer>
    </div>
  );
}
