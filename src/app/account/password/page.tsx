import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ShieldAlert } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Logo } from "@/components/layout/logo";
import { requireUserAllowingPasswordChange } from "@/lib/auth";
import { homeForRole } from "@/lib/utils";
import { PasswordForm } from "./password-form";

export const metadata: Metadata = {
  title: "Change password",
  robots: { index: false, follow: false },
};

/**
 * Change password — also the gate a forced reset lands on.
 *
 * `requireUserAllowingPasswordChange` is used rather than `requireUser`
 * because the latter redirects accounts flagged `must_change_password` here;
 * using it on this page would send the page to itself in a loop.
 */
export default async function PasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ forced?: string }>;
}) {
  const { profile } = await requireUserAllowingPasswordChange();
  const params = await searchParams;

  // ?forced=1 alone is not trusted — the banner shows only if the database
  // actually has the account flagged.
  const forced = params.forced === "1" && profile.must_change_password;

  return (
    <div className="relative flex min-h-screen items-center">
      <div className="glow-club pointer-events-none absolute inset-0 -z-10" aria-hidden />

      <Container className="flex justify-center py-16">
        <main id="main" className="w-full max-w-md">
          {!profile.must_change_password && (
            <Link
              href={homeForRole(profile.role)}
              className="mb-10 inline-flex w-fit items-center gap-2 font-mono text-[11px] uppercase tracking-[0.16em] text-ink-3 transition-colors hover:text-white"
            >
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden /> Back
            </Link>
          )}

          <div className="mb-8 flex flex-col items-center gap-5 text-center">
            <Logo size={56} showWordmark={false} href={null} />
            <div className="flex flex-col gap-2">
              <h1 className="headline text-3xl text-white">
                {forced ? "Set your password" : "Change password"}
              </h1>
              <p className="text-sm leading-relaxed text-ink-3">
                Signed in as {profile.full_name}.
              </p>
            </div>
          </div>

          {forced && (
            <p
              role="status"
              className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-400/25 bg-amber-500/10 px-4 py-3.5 text-sm leading-relaxed text-amber-100"
            >
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              Your password was reset by the core team. Choose a new one to carry on — the rest of
              the member area stays locked until you do.
            </p>
          )}

          <div className="glass-deep hairline-gradient rounded-3xl p-8">
            <PasswordForm forced={forced} />
          </div>
        </main>
      </Container>
    </div>
  );
}
