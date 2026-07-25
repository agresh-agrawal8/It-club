"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, Copy, Check, KeyRound, ShieldAlert, ArrowRight } from "lucide-react";

/**
 * Shown once, immediately after a team registers.
 *
 * These credentials cannot be recovered from this screen later — the password
 * is only readable here and by the core team — so the panel pushes hard on
 * copying/screenshotting before continuing.
 */
export function CredentialsPanel({
  teamCode,
  password,
  message,
}: {
  teamCode: string;
  password: string;
  message?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copyAll() {
    try {
      await navigator.clipboard.writeText(`Team ID: ${teamCode}\nPassword: ${password}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      // Clipboard blocked (insecure context / permissions) — the values are
      // on screen anyway, so fail quietly rather than throwing.
      setCopied(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-6 py-10 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-accent-500/15 text-accent-400">
        <CheckCircle2 className="h-7 w-7" />
      </span>

      <div>
        <h3 className="text-2xl font-semibold tracking-tight text-white">You&apos;re registered</h3>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-zinc-400">
          {message ?? "Save these credentials — you need them to sign in."}
        </p>
      </div>

      {/* Credentials */}
      <div className="w-full max-w-md rounded-2xl border border-brand-400/30 bg-brand-500/[0.07] p-5">
        <div className="mb-4 flex items-center justify-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-brand-200">
          <KeyRound className="h-3.5 w-3.5" /> Your team credentials
        </div>

        <dl className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-zinc-950/60 px-4 py-3">
            <dt className="text-[11px] uppercase tracking-wide text-zinc-500">Team ID</dt>
            <dd className="font-mono text-lg font-semibold tracking-tight text-white">{teamCode}</dd>
          </div>
          <div className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-zinc-950/60 px-4 py-3">
            <dt className="text-[11px] uppercase tracking-wide text-zinc-500">Password</dt>
            <dd className="font-mono text-lg font-semibold tracking-tight text-white">{password}</dd>
          </div>
        </dl>

        <button
          type="button"
          onClick={copyAll}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] px-4 py-2.5 text-sm text-white transition-colors hover:border-brand-400/50 hover:bg-white/[0.08]"
        >
          {copied ? (
            <>
              <Check className="h-4 w-4 text-accent-400" /> Copied
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" /> Copy Team ID &amp; password
            </>
          )}
        </button>
      </div>

      <p className="flex max-w-md items-start gap-2 text-left text-xs leading-relaxed text-amber-300/90">
        <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
        Screenshot this or write it down now. The password is not shown again — if you lose it, the
        core team can reset it for you.
      </p>

      <Link
        href="/hackathon/login"
        className="inline-flex items-center gap-2 rounded-full bg-brand-500 px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
      >
        Sign in to your dashboard <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
