"use client";

import { useActionState } from "react";
import { Github, Save, Rocket, Globe, Presentation, FileText } from "lucide-react";
import { saveTeamSubmissionAction } from "@/lib/hackathon/team-actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const input =
  "w-full rounded-xl border border-white/10 bg-zinc-950/60 px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:border-brand-400/60 focus:outline-none transition-colors";

const FIELDS = [
  { name: "github_url", label: "GitHub repository", icon: Github, placeholder: "https://github.com/…" },
  { name: "demo_url", label: "Live demo", icon: Globe, placeholder: "https://your-demo.app" },
  { name: "presentation_url", label: "Presentation deck", icon: Presentation, placeholder: "Slides link" },
  { name: "docs_url", label: "Documentation", icon: FileText, placeholder: "README / docs link" },
];

export function TeamSubmissionForm({ submission }: { submission: any }) {
  const [state, formAction, pending] = useActionState(saveTeamSubmissionAction, undefined);

  // No team id is sent: the server resolves it from the signed session cookie.
  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        {FIELDS.map(({ name, label, icon: Icon, placeholder }) => (
          <label key={name} className="flex flex-col gap-1.5">
            <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">{label}</span>
            <div className="relative">
              <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600" />
              <input
                name={name}
                defaultValue={submission?.[name] ?? ""}
                placeholder={placeholder}
                className={cn(input, "pl-9")}
              />
            </div>
          </label>
        ))}
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          Notes for the judges
        </span>
        <textarea
          name="notes"
          rows={3}
          defaultValue={submission?.notes ?? ""}
          placeholder="What should the judges know? Trade-offs, what works, what you'd do next…"
          className={cn(input, "resize-none")}
        />
      </label>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="submit"
          name="submit"
          value="false"
          variant="secondary"
          size="sm"
          disabled={pending}
          className="rounded-full"
        >
          <Save className="h-4 w-4" /> Save draft
        </Button>
        <Button
          type="submit"
          name="submit"
          value="true"
          variant="brand"
          size="sm"
          disabled={pending}
          className="rounded-full"
        >
          <Rocket className="h-4 w-4" /> Submit to judges
        </Button>
        {state?.error && <p className="text-sm text-red-400">{state.error}</p>}
        {state?.success && <p className="text-sm text-accent-400">{state.success}</p>}
      </div>
      <p className="text-[11px] text-zinc-600">
        You can save a draft any time and keep updating it until the deadline.
      </p>
    </form>
  );
}
