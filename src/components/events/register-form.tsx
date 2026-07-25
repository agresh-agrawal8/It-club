"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import {
  Users,
  Send,
  Crown,
  CheckCircle2,
  Copy,
  Check,
  KeyRound,
  ShieldAlert,
  ArrowRight,
  Plus,
  Minus,
} from "lucide-react";
import { registerEventTeamAction } from "@/lib/events/actions/registration";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const input =
  "w-full rounded-xl border border-white/10 bg-zinc-950/60 px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:border-[var(--ev-accent)] focus:outline-none transition-colors";

/** Shown once after registering — the password is never displayed again. */
function Issued({
  loginCode,
  password,
  message,
  loginHref,
}: {
  loginCode: string;
  password: string;
  message: string;
  loginHref: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copyAll() {
    try {
      await navigator.clipboard.writeText(`Team ID: ${loginCode}\nPassword: ${password}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-6 py-10 text-center">
      <span
        className="flex h-14 w-14 items-center justify-center rounded-full"
        style={{ background: "color-mix(in oklab, var(--ev-accent) 18%, transparent)", color: "var(--ev-accent)" }}
      >
        <CheckCircle2 className="h-7 w-7" />
      </span>

      <div>
        <h3 className="text-2xl font-semibold tracking-tight text-white">You&apos;re in</h3>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-zinc-400">{message}</p>
      </div>

      <div
        className="w-full max-w-md rounded-2xl p-5"
        style={{
          border: "1px solid color-mix(in oklab, var(--ev-accent) 35%, transparent)",
          background: "color-mix(in oklab, var(--ev-accent) 7%, transparent)",
        }}
      >
        <div className="mb-4 flex items-center justify-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-white">
          <KeyRound className="h-3.5 w-3.5" /> Your team credentials
        </div>

        <dl className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-zinc-950/60 px-4 py-3">
            <dt className="text-[11px] uppercase tracking-wide text-zinc-500">Team ID</dt>
            <dd className="font-mono text-lg font-semibold text-white">{loginCode}</dd>
          </div>
          <div className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-zinc-950/60 px-4 py-3">
            <dt className="text-[11px] uppercase tracking-wide text-zinc-500">Password</dt>
            <dd className="font-mono text-lg font-semibold text-white">{password}</dd>
          </div>
        </dl>

        <button
          type="button"
          onClick={copyAll}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] px-4 py-2.5 text-sm text-white transition-colors hover:bg-white/[0.08]"
        >
          {copied ? (
            <>
              <Check className="h-4 w-4" style={{ color: "var(--ev-accent)" }} /> Copied
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
        organisers can reset it.
      </p>

      <Link
        href={loginHref}
        className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        style={{ background: "var(--ev-accent)" }}
      >
        Sign in to your dashboard <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

export function EventRegisterForm({
  eventSlug,
  teamMin,
  teamMax,
  loginHref,
}: {
  eventSlug: string;
  teamMin: number;
  teamMax: number;
  loginHref: string;
}) {
  const [state, formAction, pending] = useActionState(registerEventTeamAction, undefined);
  const [rows, setRows] = useState(Math.max(teamMin, 2));

  if (state && "loginCode" in state) {
    return (
      <Issued
        loginCode={state.loginCode}
        password={state.password}
        message={state.success}
        loginHref={loginHref}
      />
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-7">
      <input type="hidden" name="event_slug" value={eventSlug} />

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Team name <span style={{ color: "var(--ev-accent)" }}>*</span>
          </span>
          <input name="team_name" required placeholder="e.g. Nightfall" className={input} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Tagline <span className="text-zinc-600">(optional)</span>
          </span>
          <input name="tagline" placeholder="One line about your team" className={input} />
        </label>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
            <Users className="h-4 w-4" style={{ color: "var(--ev-accent)" }} /> Team members
            <span className="text-xs font-normal text-zinc-500">
              ({teamMin}–{teamMax})
            </span>
          </h3>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setRows((r) => Math.max(teamMin, r - 1))}
              disabled={rows <= teamMin}
              aria-label="Remove a member row"
              className="grid h-8 w-8 place-items-center rounded-full border border-white/10 text-zinc-300 transition-colors hover:border-white/30 disabled:opacity-30"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <span className="w-10 text-center font-mono text-sm text-white">{rows}</span>
            <button
              type="button"
              onClick={() => setRows((r) => Math.min(teamMax, r + 1))}
              disabled={rows >= teamMax}
              aria-label="Add a member row"
              className="grid h-8 w-8 place-items-center rounded-full border border-white/10 text-zinc-300 transition-colors hover:border-white/30 disabled:opacity-30"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {Array.from({ length: rows }, (_, i) => (
          <div
            key={i}
            className={cn(
              "rounded-2xl border p-4",
              i === 0 ? "border-amber-400/25 bg-amber-500/[0.04]" : "border-white/10 bg-zinc-950/40",
            )}
          >
            <div className="mb-3 flex items-center gap-2 text-sm font-medium text-white">
              {i === 0 ? (
                <>
                  <Crown className="h-4 w-4 text-amber-300" /> Team leader
                </>
              ) : (
                <>Member {i + 1}</>
              )}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                name={`m${i}_name`}
                placeholder="Full name"
                required={i < teamMin}
                className={input}
              />
              <input
                name={`m${i}_email`}
                type="email"
                placeholder={i === 0 ? "Email (recommended)" : "Email (optional)"}
                className={input}
              />
              <input name={`m${i}_institution`} placeholder="School / institution" className={input} />
              <input name={`m${i}_grade`} placeholder="Class / year" className={input} />
            </div>
          </div>
        ))}

        <p className="text-[11px] leading-relaxed text-zinc-500">
          One person registers the whole team. Your Team ID and password are issued immediately —
          each person may join only one team for this event.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" variant="brand" disabled={pending} className="rounded-full">
          <Send className="h-4 w-4" /> {pending ? "Registering…" : "Register team"}
        </Button>
        {state && "error" in state && state.error && (
          <p className="text-sm text-red-400" role="alert">
            {state.error}
          </p>
        )}
      </div>
    </form>
  );
}
