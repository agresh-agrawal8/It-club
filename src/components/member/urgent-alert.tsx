"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertTriangle, X } from "lucide-react";
import { markNotificationReadAction } from "@/lib/actions/content";
import { Button } from "@/components/ui/button";
import { timeAgo } from "@/lib/utils";

export interface UrgentNotice {
  id: string;
  title: string;
  body: string | null;
  link: string | null;
  created_at: string;
}

/**
 * Modal shown when a member opens their dashboard with unread urgent
 * notices from the core team. Dismissing marks the notice read so it
 * won't reappear.
 */
export function UrgentAlert({ notices }: { notices: UrgentNotice[] }) {
  const [queue, setQueue] = useState(notices);
  const [busy, setBusy] = useState(false);
  const current = queue[0];
  if (!current) return null;

  /**
   * Persist the read flag BEFORE advancing the queue — advancing first
   * unmounts this component and cancels the in-flight server action, which
   * would leave the notice unread and pop up again on the next visit.
   */
  async function dismiss() {
    if (busy) return;
    setBusy(true);
    const fd = new FormData();
    fd.set("id", current.id);
    try {
      await markNotificationReadAction(fd);
    } catch {
      /* keep going — worst case it reappears next load */
    }
    setQueue((q) => q.slice(1));
    setBusy(false);
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="urgent-title"
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm animate-fade-in" onClick={dismiss} />

      <div className="glass-deep animate-scale-in relative w-full max-w-md rounded-3xl border border-red-400/25 p-7 shadow-[0_0_80px_-20px_rgba(248,113,113,0.35)]">
        <button
          onClick={dismiss}
          aria-label="Dismiss"
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-zinc-500 transition-colors hover:bg-white/5 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>

        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/15 text-red-300">
          <AlertTriangle className="h-6 w-6" />
        </span>

        <p className="mt-5 text-[11px] font-medium uppercase tracking-[2px] text-red-300">
          Urgent · from the core team
        </p>
        <h2 id="urgent-title" className="mt-2 text-xl font-semibold tracking-tight text-white">
          {current.title}
        </h2>
        {current.body && (
          <p className="mt-2.5 whitespace-pre-wrap text-sm leading-relaxed text-zinc-300">
            {current.body}
          </p>
        )}
        <p className="mt-3 text-[11px] text-zinc-600">{timeAgo(current.created_at)}</p>

        <div className="mt-6 flex items-center gap-3">
          <Button onClick={dismiss} disabled={busy} variant="brand" size="sm" className="rounded-full">
            {busy ? "Dismissing…" : "Got it"}
          </Button>
          {current.link && (
            <Link
              href={current.link}
              onClick={dismiss}
              className="text-sm text-brand-300 underline-offset-4 hover:underline"
            >
              Open details
            </Link>
          )}
          {queue.length > 1 && (
            <span className="ml-auto text-[11px] text-zinc-600">
              {queue.length - 1} more
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
