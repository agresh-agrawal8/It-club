import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Logo } from "@/components/layout/logo";
import { SITE } from "@/lib/site";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Sign in",
  description: `Sign in to the ${SITE.name} member area.`,
  // The sign-in page has nothing to offer a search result, and indexing it
  // just puts a login form in front of people looking for the club.
  robots: { index: false, follow: true },
};

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen items-center">
      <div className="glow-club pointer-events-none absolute inset-0 -z-10" aria-hidden />
      <div
        className="dot-grid beam-mask pointer-events-none absolute inset-0 -z-10 opacity-[0.12]"
        aria-hidden
      />

      <Container className="flex justify-center py-16">
        <main id="main" className="w-full max-w-md">
          <Link
            href="/"
            className="mb-10 inline-flex w-fit items-center gap-2 font-mono text-[11px] uppercase tracking-[0.16em] text-ink-3 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden /> Back to site
          </Link>

          <div className="mb-8 flex flex-col items-center gap-5 text-center">
            <Logo size={64} showWordmark={false} href={null} />
            <div className="flex flex-col gap-2">
              <h1 className="headline text-3xl text-white">Member sign in</h1>
              <p className="text-sm leading-relaxed text-ink-3">
                Sign in with your name and the password the core team gave you.
              </p>
            </div>
          </div>

          <div className="glass-deep hairline-gradient rounded-3xl p-8">
            {/* useSearchParams needs a Suspense boundary to keep this route
                statically renderable rather than forcing it dynamic. */}
            <Suspense fallback={<div className="h-64" aria-hidden />}>
              <LoginForm />
            </Suspense>
          </div>

          <p className="mt-6 text-center text-xs leading-relaxed text-ink-4">
            Accounts are created by the core team. Forgotten your password? Ask them to reset it —
            they can issue a new one, but nobody can look up your old one.
          </p>
        </main>
      </Container>
    </div>
  );
}
