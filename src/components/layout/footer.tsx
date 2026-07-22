import Link from "next/link";
import { Github, Instagram, Mail } from "lucide-react";
import { Container } from "@/components/ui/container";
import { SubscribeForm } from "@/components/features/subscribe-form";
import { Logo } from "./logo";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-white/10 bg-zinc-950">
      <Container className="grid gap-12 py-16 md:grid-cols-[1.5fr_1fr_1fr_1.5fr]">
        <div className="flex flex-col gap-4">
          <Logo showTagline />
          <p className="max-w-xs text-sm leading-relaxed text-zinc-400">
            The student-run IT &amp; AI Club of Emerald Heights International School. Where ideas
            compile into reality.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Explore</h4>
          {[
            ["Projects", "/projects"],
            ["Events", "/events"],
            ["Competitions", "/competitions"],
            ["Team", "/team"],
          ].map(([label, href]) => (
            <Link key={href} href={href} className="text-sm text-zinc-400 transition-colors hover:text-white">
              {label}
            </Link>
          ))}
        </div>

        <div className="flex flex-col gap-3">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">More</h4>
          {[
            ["Gallery", "/gallery"],
            ["Achievements", "/achievements"],
            ["Search", "/search"],
            ["Member login", "/login"],
          ].map(([label, href]) => (
            <Link key={href} href={href} className="text-sm text-zinc-400 transition-colors hover:text-white">
              {label}
            </Link>
          ))}
        </div>

        <div className="flex flex-col gap-4">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Stay in the loop
          </h4>
          <p className="text-sm text-zinc-400">Get notified about new events and competitions.</p>
          <SubscribeForm />
        </div>
      </Container>

      {/* Oversized wordmark — bleeds off the baseline like the reference */}
      <div className="relative overflow-hidden" aria-hidden>
        <Container>
          <div className="watermark select-none whitespace-nowrap text-center text-[clamp(3.5rem,19vw,17rem)] font-bold">
            Avinya
          </div>
        </Container>
      </div>

      <div className="border-t border-white/10">
        <Container className="flex flex-col items-center justify-between gap-4 py-6 sm:flex-row">
          <p className="font-mono text-xs text-zinc-500">
            © {new Date().getFullYear()} Avinya · EHIS IT &amp; AI Club. All rights reserved.
          </p>
          <div className="flex items-center gap-3">
            <a href="mailto:agresh@agreshagrawal.com" aria-label="Email" className="text-zinc-500 hover:text-white">
              <Mail className="h-4 w-4" />
            </a>
            <a href="https://github.com" aria-label="GitHub" className="text-zinc-500 hover:text-white">
              <Github className="h-4 w-4" />
            </a>
            <a href="https://instagram.com" aria-label="Instagram" className="text-zinc-500 hover:text-white">
              <Instagram className="h-4 w-4" />
            </a>
          </div>
        </Container>
      </div>
    </footer>
  );
}
