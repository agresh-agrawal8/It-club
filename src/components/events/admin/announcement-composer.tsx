"use client";

import { useActionState, useRef, useEffect } from "react";
import { Megaphone, Send } from "lucide-react";
import { postEventAnnouncementAction } from "@/lib/events/actions/admin";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const field =
  "w-full rounded-xl border border-white/10 bg-zinc-950/60 px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:border-[var(--ev-accent)] focus:outline-none transition-colors";

export function AnnouncementComposer({ eventSlug }: { eventSlug: string }) {
  const [state, formAction, pending] = useActionState(postEventAnnouncementAction, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  // Clear the form after a successful post.
  useEffect(() => {
    if (state && "success" in state && state.success) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="event_slug" value={eventSlug} />

      <div className="flex items-center gap-2 text-sm font-semibold text-white">
        <Megaphone className="h-4 w-4" style={{ color: "var(--ev-accent)" }} />
        Broadcast an announcement
      </div>

      <input name="title" placeholder="Title" className={field} required />
      <textarea name="body" rows={2} placeholder="Message (optional)" className={cn(field, "resize-none")} />

      <div className="flex flex-wrap items-center gap-3">
        <select name="severity" className={cn(field, "w-auto")} defaultValue="info" aria-label="Severity">
          <option value="info">Info</option>
          <option value="success">Success</option>
          <option value="warning">Warning</option>
          <option value="critical">Critical</option>
        </select>

        <label className="flex items-center gap-2 text-xs text-zinc-400">
          <input type="checkbox" name="pinned" className="accent-[var(--ev-accent)]" /> Pin
        </label>

        <Button
          type="submit"
          variant="brand"
          size="sm"
          disabled={pending}
          className="ev-cta ml-auto rounded-full"
        >
          <Send className="h-4 w-4" /> {pending ? "Posting…" : "Post"}
        </Button>
      </div>

      {state && "error" in state && state.error && (
        <p className="text-sm text-red-400" role="alert">
          {state.error}
        </p>
      )}
      {state && "success" in state && state.success && (
        <p className="text-sm" style={{ color: "var(--ev-accent)" }}>
          {state.success}
        </p>
      )}
    </form>
  );
}
