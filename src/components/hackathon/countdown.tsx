"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Countdown to a fixed instant.
 *
 * Deliberately small: one interval, four numbers, no animation library. It
 * renders dashes on the server and on the first client paint so the markup
 * matches — a live clock in server HTML is guaranteed to mismatch on hydration.
 */

const UNITS = [
  { key: "d", label: "Days" },
  { key: "h", label: "Hours" },
  { key: "m", label: "Mins" },
  { key: "s", label: "Secs" },
] as const;

function parts(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  return {
    d: Math.floor(total / 86400),
    h: Math.floor((total % 86400) / 3600),
    m: Math.floor((total % 3600) / 60),
    s: total % 60,
  };
}

export function Countdown({
  target,
  label,
  className,
  compact = false,
}: {
  target: string;
  label?: string;
  className?: string;
  compact?: boolean;
}) {
  const [left, setLeft] = useState<ReturnType<typeof parts> | null>(null);

  useEffect(() => {
    const end = new Date(target).getTime();
    if (!Number.isFinite(end)) return;

    const tick = () => setLeft(parts(end - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target]);

  const done = left != null && left.d + left.h + left.m + left.s === 0;

  return (
    <div className={cn("flex flex-col gap-2.5", className)}>
      {label && (
        <span className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">
          {done ? "Underway" : label}
        </span>
      )}
      <div className={cn("flex items-start", compact ? "gap-2" : "gap-2.5 sm:gap-3")}>
        {UNITS.map(({ key, label: unit }) => (
          <div key={key} className="flex flex-col items-center gap-1">
            <span
              className={cn(
                "flex items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03] font-semibold tabular-nums tracking-tight text-white",
                compact ? "h-11 w-11 text-lg" : "h-14 w-14 text-2xl sm:h-16 sm:w-16 sm:text-3xl",
              )}
            >
              {left ? String(left[key]).padStart(2, "0") : "––"}
            </span>
            <span className="text-[9px] uppercase tracking-[0.14em] text-zinc-600">{unit}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
