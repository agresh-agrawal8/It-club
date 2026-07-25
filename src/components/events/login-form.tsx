"use client";

import { useActionState } from "react";
import { KeyRound, LogIn } from "lucide-react";
import { eventTeamLoginAction } from "@/lib/events/actions/registration";
import { Button } from "@/components/ui/button";

const input =
  "w-full rounded-xl border border-white/10 bg-zinc-950/60 px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:border-[var(--ev-accent)] focus:outline-none transition-colors";

export function EventLoginForm({ eventSlug, codeHint }: { eventSlug: string; codeHint: string }) {
  const [state, formAction, pending] = useActionState(eventTeamLoginAction, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="event_slug" value={eventSlug} />

      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">Team ID</span>
        <div className="relative">
          <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <input
            name="login_code"
            required
            autoComplete="username"
            placeholder={codeHint}
            className={`${input} pl-9 font-mono uppercase`}
          />
        </div>
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">Password</span>
        <input
          name="password"
          type="password"
          required
          autoComplete="current-password"
          placeholder="••••••••"
          className={input}
        />
      </label>

      <Button type="submit" variant="brand" disabled={pending} className="mt-1 rounded-full">
        <LogIn className="h-4 w-4" /> {pending ? "Signing in…" : "Enter dashboard"}
      </Button>

      {state?.error && (
        <p className="text-sm text-red-400" role="alert">
          {state.error}
        </p>
      )}
    </form>
  );
}
