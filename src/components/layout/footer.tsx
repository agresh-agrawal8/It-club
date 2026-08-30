import Link from "next/link";
import { Github, Mail, MapPin } from "lucide-react";
import { Container } from "@/components/ui/container";
import { SubscribeForm } from "@/components/features/subscribe-form";
import { SITE } from "@/lib/site";
import { Logo } from "./logo";

/**
 * Site footer.
 *
 * Every link here goes somewhere real. There is no Instagram or Twitter icon,
 * because the club has no published account on either — an icon linking to
 * `instagram.com` is a dead link dressed up as a social presence.
 */

const EXPLORE = [
  ["Events", "/events"],
  ["Gallery", "/gallery"],
  ["Team", "/team"],
  ["Contact", "/contact"],
] as const;

const MORE = [
  ["Achievements", "/achievements"],
  ["Infinium Hackathon", "/hackathon"],
  ["Search", "/search"],
  ["Member sign in", "/login"],
] as const;

export function Footer() {
  return (
    <footer className="relative mt-28 border-t border-white/10">
      <div className="glow-club pointer-events-none absolute inset-x-0 top-0 h-64 opacity-40" aria-hidden />

      <Container className="relative grid gap-12 py-16 md:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1.4fr]">
        <div className="flex flex-col gap-5">
          <Logo size={44} showTagline />
          <p className="max-w-xs text-sm leading-relaxed text-ink-3">
            The student-run IT &amp; AI Club of {SITE.school}. We build, we compete, and we teach
            each other what we learn.
          </p>
          <address className="flex items-start gap-2.5 not-italic text-sm text-ink-3">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-300" aria-hidden />
            <span>
              {SITE.school}
              <br />
              {SITE.city}, {SITE.region}
            </span>
          </address>
        </div>

        <nav aria-label="Explore" className="flex flex-col gap-3">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-4">Explore</h2>
          {EXPLORE.map(([label, href]) => (
            <Link key={href} href={href} className="text-sm text-ink-3 transition-colors hover:text-white">
              {label}
            </Link>
          ))}
        </nav>

        <nav aria-label="More" className="flex flex-col gap-3">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-4">More</h2>
          {MORE.map(([label, href]) => (
            <Link key={href} href={href} className="text-sm text-ink-3 transition-colors hover:text-white">
              {label}
            </Link>
          ))}
        </nav>

        <div className="flex flex-col gap-4">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-4">
            Stay in the loop
          </h2>
          <p className="text-sm text-ink-3">
            One message when something is happening. Nothing else.
          </p>
          <SubscribeForm />
        </div>
      </Container>

      {/* Oversized wordmark bleeding off the baseline. */}
      <div className="relative overflow-hidden" aria-hidden>
        <Container>
          <div className="watermark headline select-none whitespace-nowrap text-center text-[clamp(3.5rem,19vw,17rem)]">
            Avinya
          </div>
        </Container>
      </div>

      <div className="border-t border-white/10">
        <Container className="flex flex-col items-center justify-between gap-4 py-6 sm:flex-row">
          <p className="font-mono text-[11px] text-ink-4">
            © {new Date().getFullYear()} {SITE.name} · {SITE.tagline}
          </p>
          <div className="flex items-center gap-1">
            <a
              href={`mailto:${SITE.contact.email}`}
              aria-label="Email the club"
              className="flex h-11 w-11 items-center justify-center rounded-xl text-ink-4 transition-colors hover:bg-white/5 hover:text-white"
            >
              <Mail className="h-4 w-4" aria-hidden />
            </a>
            <a
              href={SITE.contact.github}
              aria-label="The club on GitHub"
              rel="noopener noreferrer"
              target="_blank"
              className="flex h-11 w-11 items-center justify-center rounded-xl text-ink-4 transition-colors hover:bg-white/5 hover:text-white"
            >
              <Github className="h-4 w-4" aria-hidden />
            </a>
          </div>
        </Container>
      </div>
    </footer>
  );
}
