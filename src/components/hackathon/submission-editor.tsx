"use client";

import { useActionState } from "react";
import { Github, Save, Rocket } from "lucide-react";
import { saveSubmissionAction } from "@/lib/hackathon/actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const input =
  "w-full rounded-xl border border-white/10 bg-zinc-950/60 px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:border-brand-400/60 focus:outline-none transition-colors";

export function SubmissionEditor({
  teamId,
  submission,
  canEdit,
}: {
  teamId: string;
  submission: any;
  canEdit: boolean;
}) {
  const [state, formAction, pending] = useActionState(saveSubmissionAction, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="teamId" value={teamId} />
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">GitHub repo</span>
          <div className="relative">
            <Github className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600" />
            <input name="github_url" defaultValue={submission?.github_url ?? ""} placeholder="https://github.com/…" disabled={!canEdit} className={cn(input, "pl-9")} />
          </div>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">Live demo</span>
          <input name="demo_url" defaultValue={submission?.demo_url ?? ""} placeholder="https://…" disabled={!canEdit} className={input} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">Presentation</span>
          <input name="presentation_url" defaultValue={submission?.presentation_url ?? ""} placeholder="Slides link" disabled={!canEdit} className={input} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">Documentation</span>
          <input name="docs_url" defaultValue={submission?.docs_url ?? ""} placeholder="Docs link" disabled={!canEdit} className={input} />
        </label>
      </div>
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">Notes for judges</span>
        <textarea name="notes" rows={3} defaultValue={submission?.notes ?? ""} placeholder="What should judges know about your build?" disabled={!canEdit} className={cn(input, "resize-none")} />
      </label>

      {canEdit ? (
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" name="submit" value="false" variant="secondary" size="sm" disabled={pending} className="rounded-full">
            <Save className="h-4 w-4" /> Save draft
          </Button>
          <Button type="submit" name="submit" value="true" variant="brand" size="sm" disabled={pending} className="rounded-full">
            <Rocket className="h-4 w-4" /> Submit project
          </Button>
          {state?.error && <p className="text-sm text-red-400">{state.error}</p>}
          {state?.success && <p className="text-sm text-accent-400">{state.success}</p>}
        </div>
      ) : (
        <p className="text-xs text-zinc-500">Only the team captain can edit the submission.</p>
      )}
    </form>
  );
}
