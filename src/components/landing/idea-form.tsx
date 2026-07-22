"use client";

import { useActionState } from "react";
import { ArrowUpRight } from "lucide-react";
import { contactAction } from "@/lib/actions/public";

const field =
  "w-full rounded-lg border border-white/10 bg-zinc-950/60 px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:border-brand-400/60 focus:outline-none transition-colors";
const label = "text-[11px] text-zinc-500";

/**
 * "Got a great idea?" enquiry form — compact two-column layout matching the
 * reference. Posts to the same contact_messages table as /contact.
 */
export function IdeaForm() {
  const [state, formAction, pending] = useActionState(contactAction, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-3.5">
      <div className="grid gap-3.5 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="idea-name" className={label}>
            Your name
          </label>
          <input id="idea-name" name="name" required placeholder="Aarav" className={field} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="idea-email" className={label}>
            Your email
          </label>
          <input
            id="idea-email"
            name="email"
            type="email"
            required
            placeholder="you@school.edu"
            className={field}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="idea-subject" className={label}>
          What are you interested in?
        </label>
        <select id="idea-subject" name="subject" defaultValue="Joining the club" className={field}>
          <option>Joining the club</option>
          <option>Collaborating on a project</option>
          <option>Hosting a workshop</option>
          <option>Sponsorship or partnership</option>
          <option>Something else</option>
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="idea-message" className={label}>
          Tell us more about your idea
        </label>
        <textarea
          id="idea-message"
          name="message"
          rows={4}
          required
          minLength={10}
          placeholder="Write here…"
          className={`${field} resize-none`}
        />
      </div>

      {state?.error && <p className="text-xs text-red-400">{state.error}</p>}
      {state?.success && <p className="text-xs text-emerald-400">{state.success}</p>}

      <button
        type="submit"
        disabled={pending}
        className="mt-1 flex w-full items-center justify-center gap-2 rounded-lg bg-brand-500 py-3 text-sm font-medium text-white shadow-[0_8px_28px_-10px_var(--color-brand-500)] transition-all hover:bg-brand-400 disabled:opacity-50"
      >
        {pending ? "Sending…" : "Submit the request"}
        <ArrowUpRight className="h-4 w-4" />
      </button>
    </form>
  );
}
