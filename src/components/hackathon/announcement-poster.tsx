"use client";

import { useActionState } from "react";
import { Megaphone } from "lucide-react";
import { postAnnouncementAction } from "@/lib/hackathon/actions";
import { Button } from "@/components/ui/button";

const input =
  "w-full rounded-xl border border-white/10 bg-zinc-950/60 px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:border-brand-400/60 focus:outline-none transition-colors";

export function AnnouncementPoster() {
  const [state, formAction, pending] = useActionState(postAnnouncementAction, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input name="title" placeholder="Announcement title" className={input} required />
      <textarea name="body" rows={2} placeholder="Details (optional)" className={`${input} resize-none`} />
      <label className="flex items-center gap-2 text-xs text-zinc-400">
        <input type="checkbox" name="pinned" value="true" className="accent-brand-500" /> Pin to top
      </label>
      <div className="flex items-center gap-3">
        <Button type="submit" variant="brand" size="sm" disabled={pending} className="rounded-full">
          <Megaphone className="h-4 w-4" /> Post announcement
        </Button>
        {state?.error && <p className="text-sm text-red-400">{state.error}</p>}
        {state?.success && <p className="text-sm text-accent-400">{state.success}</p>}
      </div>
    </form>
  );
}
