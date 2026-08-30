import Link from "next/link";
import { ArrowLeft, Search } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Logo } from "@/components/layout/logo";

/**
 * 404.
 *
 * Also what a visitor gets for the routes this cleanup removed — the
 * applications, messages and projects pages no longer exist in the route tree,
 * so Next.js renders this rather than an empty shell of the old interface.
 */
export default function NotFound() {
  return (
    <div className="relative flex min-h-screen items-center">
      <div className="glow-club pointer-events-none absolute inset-0 -z-10" aria-hidden />
      <div
        className="dot-grid beam-mask pointer-events-none absolute inset-0 -z-10 opacity-[0.12]"
        aria-hidden
      />

      <Container className="flex flex-col items-center gap-8 py-32 text-center">
        <Logo size={56} showWordmark={false} />

        <p className="headline text-[clamp(4rem,3rem+8vw,9rem)] leading-none text-club-gradient">
          404
        </p>

        <div className="flex flex-col gap-3">
          <h1 className="headline text-2xl text-white">Page not found</h1>
          <p className="max-w-md text-balance text-sm leading-relaxed text-ink-3">
            This page doesn&apos;t exist, or it moved. The links below will get you back to
            somewhere real.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="/"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-white px-7 py-3.5 text-sm font-medium text-zinc-950 transition-transform hover:-translate-y-px"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Back home
          </Link>
          <Link
            href="/search"
            className="hairline-gradient inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl px-7 py-3.5 text-sm font-medium text-white transition-colors hover:bg-white/5"
          >
            <Search className="h-4 w-4" aria-hidden />
            Search the site
          </Link>
        </div>
      </Container>
    </div>
  );
}
