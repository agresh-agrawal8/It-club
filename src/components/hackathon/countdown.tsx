"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/** Live countdown to a target ISO datetime. */
export function Countdown({
  target,
  label,
  compact = false,
  className,
}: {
  target: string;
  label?: string;
  compact?: boolean;
  className?: string;
}) {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const targetMs = new Date(target).getTime();
  const diff = now === null ? 0 : Math.max(0, targetMs - now);
  const done = now !== null && diff === 0;

  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);

  const units = [
    { v: d, l: "days" },
    { v: h, l: "hrs" },
    { v: m, l: "min" },
    { v: s, l: "sec" },
  ];

  // Avoid hydration mismatch: render placeholders until mounted.
  const show = now !== null;

  if (compact) {
    return (
      <span className={cn("font-mono tabular-nums", className)}>
        {show ? `${d}d ${String(h).padStart(2, "0")}h ${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s` : "—"}
      </span>
    );
  }

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {label && (
        <span className="eyebrow text-brand-300">{done ? "Now live" : label}</span>
      )}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {units.map((u, i) => (
          <div key={u.l} className="flex items-center gap-2.5 sm:gap-3">
            <div className="glass flex min-w-[64px] flex-col items-center rounded-2xl px-3 py-2.5 sm:min-w-[80px] sm:py-3">
              <span className="text-2xl font-semibold tabular-nums tracking-tighter text-white sm:text-4xl">
                {show ? String(u.v).padStart(2, "0") : "--"}
              </span>
              <span className="mt-0.5 text-[10px] uppercase tracking-wide text-zinc-500">{u.l}</span>
            </div>
            {i < units.length - 1 && <span className="text-xl text-zinc-600 sm:text-2xl">:</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
