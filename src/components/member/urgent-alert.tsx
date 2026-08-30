"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AlertTriangle, X } from "lucide-react";
import { markNotificationReadAction } from "@/lib/actions/member";
import { timeAgo } from "@/lib/utils";

export interface UrgentNotice {
  id: string;
  title: string;
  body: string | null;
  link: string | null;
  created_at: string;
}

/**
 * Modal shown when a member opens their dashboard with unread urgent notices.
 * Dismissing marks the notice read so it does not reappear.
 */
export function UrgentAlert({ notices }: { notices: UrgentNotice[] }) {
  const [queue, setQueue] = useState(notices);
  const [busy, setBusy] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const current = queue[0];

  // Focus the dismiss control when a notice appears, so a keyboard user is
  // inside the dialog rather than still somewhere on the page behind it.
  const currentId = current?.id;
  useEffect(() => {
    if (currentId) closeRef.current?.focus();
  }, [currentId]);

  useEffect(() => {
    if (!currentId) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [currentId]);

  if (!current) return null;

  /**
   * Persist the read flag BEFORE advancing the queue — advancing first
   * unmounts this component and cancels the in-flight server action, leaving
   * the notice unread so it pops up again on the next visit.
   */
  async function dismiss() {
    if (busy) return;
    setBusy(true);
    const fd = new FormData();
    fd.set("id", current.id);
    try {
      await markNotificationReadAction(fd);
    } catch {
      // Worst case it reappears next load — better than losing the dismissal.
    }
    setQueue((q) => q.slice(1));
    setBusy(false);
  }

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="urgent-title"
      onKeyDown={(e) => {
        if (e.key === "Escape") dismiss();
      }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
    >
      <button
        type="button"
        aria-label="Dismiss notice"
        onClick={dismiss}
        className="animate-fade-in absolute inset-0 bg-zinc-950/85 backdrop-blur-sm"
      />

      <div className="glass-deep animate-scale-in relative w-full max-w-md rounded-3xl border border-red-400/25 p-7 shadow-[0_0_80px_-20px_rgba(248,113,113,0.35)]">
        <button
          ref={closeRef}
          type="button"
          onClick={dismiss}
          aria-label="Dismiss notice"
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full text-ink-4 transition-colors hover:bg-white/5 hover:text-white"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>

        <span
          aria-hidden
          className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/15 text-red-300"
        >
          <AlertTriangle className="h-6 w-6" />
        </span>

        <p className="mt-5 font-mono text-[10px] uppercase tracking-[0.2em] text-red-300">
          Urgent · from the core team
        </p>
        <h2 id="urgent-title" className="mt-2 text-xl font-semibold tracking-tight text-white">
          {current.title}
        </h2>
        {current.body && (
          <p className="mt-2.5 whitespace-pre-wrap text-sm leading-relaxed text-ink-2">
            {current.body}
          </p>
        )}
        <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.16em] text-ink-4">
          {timeAgo(current.created_at)}
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={dismiss}
            disabled={busy}
            className="min-h-11 rounded-2xl bg-gradient-to-b from-brand-400 to-brand-600 px-6 py-3 text-sm font-medium text-white disabled:opacity-60"
          >
            {busy ? "Dismissing…" : "Got it"}
          </button>
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
            <span className="ml-auto font-mono text-[10px] uppercase tracking-[0.16em] text-ink-4">
              {queue.length - 1} more
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
