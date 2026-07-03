"use client";

import { useActionState } from "react";
import { subscribeAction } from "@/lib/actions/public";
import { Button } from "@/components/ui/button";

export function SubscribeForm() {
  const [state, formAction, pending] = useActionState(subscribeAction, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <div className="flex gap-2">
        <input
          type="email"
          name="contact"
          required
          placeholder="you@school.edu"
          className="min-w-0 flex-1 border-b border-white/20 bg-transparent py-2 text-sm text-white placeholder:text-zinc-500 focus:border-brand-400 focus:outline-none"
        />
        <input type="hidden" name="channel" value="email" />
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "…" : "Subscribe"}
        </Button>
      </div>
      {state?.error && <p className="text-xs text-red-400">{state.error}</p>}
      {state?.success && <p className="text-xs text-emerald-400">{state.success}</p>}
    </form>
  );
}
