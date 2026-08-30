import React from "react";

export interface StatCardProps {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  hint?: string;
}

/**
 * A single real number. These show counts of actual rows — a zero renders as
 * a zero rather than being hidden or padded, because a dashboard that flatters
 * you is not a dashboard.
 */
export function StatCard({ label, value, icon, hint }: StatCardProps) {
  return (
    <div className="surface flex items-center gap-4 rounded-2xl p-5">
      {icon && (
        <span
          aria-hidden
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-500/12 text-brand-300"
        >
          {icon}
        </span>
      )}
      <div className="min-w-0">
        <div className="headline text-2xl text-white">{value}</div>
        <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.16em] text-ink-3">
          {label}
        </div>
        {hint && <div className="mt-1 text-xs text-ink-4">{hint}</div>}
      </div>
    </div>
  );
}
