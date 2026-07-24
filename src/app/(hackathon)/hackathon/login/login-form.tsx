"use client";

import { useActionState } from "react";
import { KeyRound, LogIn } from "lucide-react";
import { teamLoginAction } from "@/lib/hackathon/team-actions";
import { Button } from "@/components/ui/button";

const input =
  "w-full rounded-xl border border-white/10 bg-zinc-950/60 px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:border-brand-400/60 focus:outline-none transition-colors";

export function TeamLoginForm() {
  const [state, formAction, pending] = useActionState(teamLoginAction, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">Team ID</span>
        <div className="relative">
          <KeyRound className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600" />
          <input
            name="team_code"
            required
            autoComplete="username"
            placeholder="INF-T01"
            className={`${input} pl-10 font-mono uppercase`}
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

      {state?.error && <p className="text-sm text-red-400">{state.error}</p>}

      <Button type="submit" variant="brand" disabled={pending} className="mt-1 rounded-full">
        <LogIn className="h-4 w-4" />
        {pending ? "Signing in…" : "Enter dashboard"}
      </Button>
    </form>
  );
}
