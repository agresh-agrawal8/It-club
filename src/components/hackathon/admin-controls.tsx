"use client";

import { useActionState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  deleteAnnouncementAction,
  publishAllResultsAction,
  toggleBriefsReleasedAction,
  toggleSubmissionsOpenAction,
} from "@/lib/hackathon/actions";

/**
 * Organiser controls that must report what happened.
 *
 * These were plain `<form action={…}>` posts against actions that returned
 * void and discarded their write errors — so a failed flip looked exactly like
 * a successful one: the page re-rendered unchanged. On the two buttons that
 * matter most (releasing the sealed briefs at 9:20, closing submissions at
 * code freeze) that is the difference between a working event and a silently
 * broken one, so each now carries its own action state and says so.
 */

type Result = { error?: string; success?: string } | undefined;

function Feedback({ state, className }: { state: Result; className?: string }) {
  if (!state) return null;
  return (
    <p
      className={cn(
        "text-[12px] leading-relaxed",
        state.error ? "text-red-300" : "text-accent-400",
        className,
      )}
    >
      {state.error ?? state.success}
    </p>
  );
}

export function BriefsSwitch({ released }: { released: boolean }) {
  const [state, action, pending] = useActionState(toggleBriefsReleasedAction, undefined);
  return (
    <form action={action} className="mt-auto flex flex-col gap-2">
      <input type="hidden" name="released" value={String(released)} />
      <button
        disabled={pending}
        className={cn(
          "inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-medium transition-opacity hover:opacity-90 disabled:opacity-60",
          released ? "border border-white/12 text-white" : "bg-brand-600 text-white",
        )}
      >
        {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
        {released ? "Re-seal briefs" : "Release briefs (9:20 AM)"}
      </button>
      <Feedback state={state} />
    </form>
  );
}

export function SubmissionsSwitch({ open }: { open: boolean }) {
  const [state, action, pending] = useActionState(toggleSubmissionsOpenAction, undefined);
  return (
    <form action={action} className="mt-auto flex flex-col gap-2">
      <input type="hidden" name="open" value={String(open)} />
      <button
        disabled={pending}
        className={cn(
          "inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-medium transition-opacity hover:opacity-90 disabled:opacity-60",
          open ? "border border-white/12 text-white" : "bg-amber-500 text-black",
        )}
      >
        {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
        {open ? "Close at code freeze" : "Open submissions"}
      </button>
      <Feedback state={state} />
    </form>
  );
}

export function PublishAllButton({ entered }: { entered: number }) {
  const [state, action, pending] = useActionState(publishAllResultsAction, undefined);
  return (
    <form action={action} className="flex shrink-0 flex-col items-end gap-2">
      <button
        disabled={pending || entered === 0}
        className="inline-flex items-center gap-2 rounded-full bg-amber-500 px-5 py-2.5 text-[13px] font-medium text-black transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
        Publish all {entered} result{entered === 1 ? "" : "s"}
      </button>
      <Feedback state={state} className="text-right" />
    </form>
  );
}

export function DeleteAnnouncementButton({ id }: { id: string }) {
  const [state, action, pending] = useActionState(deleteAnnouncementAction, undefined);
  return (
    <form action={action} className="flex shrink-0 flex-col items-end gap-1">
      <input type="hidden" name="id" value={id} />
      <button
        disabled={pending}
        aria-label="Delete announcement"
        className="text-[11.5px] text-zinc-600 transition-colors hover:text-red-300 disabled:opacity-60"
      >
        {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
      </button>
      {state?.error && <span className="text-[11px] text-red-300">{state.error}</span>}
    </form>
  );
}
