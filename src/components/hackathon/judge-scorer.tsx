"use client";

import { useActionState, useState } from "react";
import { Gavel } from "lucide-react";
import { saveScoreAction } from "@/lib/hackathon/actions";
import { Button } from "@/components/ui/button";

const CRITERIA = [
  { name: "innovation", label: "Innovation" },
  { name: "execution", label: "Execution" },
  { name: "impact", label: "Impact" },
  { name: "presentation", label: "Presentation" },
] as const;

function Slider({ name, label, initial }: { name: string; label: string; initial: number }) {
  const [v, setV] = useState(initial);
  return (
    <label className="flex flex-col gap-1.5">
      <span className="flex items-center justify-between text-xs text-zinc-400">
        {label}
        <span className="font-mono tabular-nums text-white">{v}/10</span>
      </span>
      <input
        type="range"
        name={name}
        min={0}
        max={10}
        value={v}
        onChange={(e) => setV(Number(e.target.value))}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-zinc-800 accent-brand-500"
      />
    </label>
  );
}

export function JudgeScorer({
  teamId,
  judgeId,
  existing,
}: {
  teamId: string;
  judgeId: string;
  existing?: { criteria?: Record<string, number>; comments?: string } | null;
}) {
  const [state, formAction, pending] = useActionState(saveScoreAction, undefined);
  const c = existing?.criteria ?? {};

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="teamId" value={teamId} />
      <input type="hidden" name="judgeId" value={judgeId} />
      <div className="grid gap-4 sm:grid-cols-2">
        {CRITERIA.map((cr) => (
          <Slider key={cr.name} name={cr.name} label={cr.label} initial={Number(c[cr.name] ?? 5)} />
        ))}
      </div>
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">Comments</span>
        <textarea
          name="comments"
          rows={2}
          defaultValue={existing?.comments ?? ""}
          placeholder="Feedback for the team…"
          className="w-full resize-none rounded-xl border border-white/10 bg-zinc-950/60 px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:border-brand-400/60 focus:outline-none"
        />
      </label>
      <div className="flex items-center gap-3">
        <Button type="submit" variant="brand" size="sm" disabled={pending} className="rounded-full">
          <Gavel className="h-4 w-4" /> {existing ? "Update score" : "Submit score"}
        </Button>
        {state?.error && <p className="text-sm text-red-400">{state.error}</p>}
        {state?.success && <p className="text-sm text-accent-400">{state.success}</p>}
      </div>
    </form>
  );
}
