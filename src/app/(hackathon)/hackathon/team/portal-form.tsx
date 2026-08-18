"use client";

import { useActionState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { openPortalAction } from "@/lib/hackathon/portal-actions";

/**
 * Portal entry.
 *
 * A plain text field, not a picker: publishing a list of every team name would
 * let anyone open any team's portal and read a roster of children's names and
 * classes. You have to already know your team's name — which your team does.
 */
export function PortalForm() {
  const [state, formAction, pending] = useActionState(openPortalAction, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <label className="flex flex-col gap-2">
        <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500">
          Team name
        </span>
        <input
          name="team_name"
          required
          minLength={2}
          autoComplete="off"
          autoFocus
          placeholder="Type your exact team name"
          className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white placeholder:text-zinc-600 transition-colors focus:border-brand-400/60 focus:outline-none"
        />
      </label>

      {state?.error && (
        <p className="rounded-xl border border-red-400/25 bg-red-500/10 px-4 py-3 text-[13px] text-red-200">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-brand-500 disabled:opacity-60"
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {pending ? "Opening…" : "Open my portal"}
        {!pending && <ArrowRight className="h-4 w-4" />}
      </button>
    </form>
  );
}
