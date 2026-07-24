"use client";

import { useEffect, useState } from "react";

/**
 * Countdown to an ISO timestamp.
 *
 * Renders nothing until mounted so the server and client markup agree — a
 * ticking clock is the classic hydration-mismatch source.
 */
export function Countdown({ to, label }: { to: string | null; label?: string }) {
  const [left, setLeft] = useState<number | null>(null);

  useEffect(() => {
    if (!to) return;
    const target = new Date(to).getTime();
    const tick = () => setLeft(Math.max(0, target - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [to]);

  if (!to || left === null) {
    return <div className="h-[74px]" aria-hidden />;
  }

  const s = Math.floor(left / 1000);
  const units = [
    { value: Math.floor(s / 86400), label: "DAYS" },
    { value: Math.floor((s % 86400) / 3600), label: "HRS" },
    { value: Math.floor((s % 3600) / 60), label: "MIN" },
    { value: s % 60, label: "SEC" },
  ];

  return (
    <div>
      {label && (
        <div className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">
          {label}
        </div>
      )}
      <div className="flex gap-2" role="timer" aria-live="off">
        {units.map((u) => (
          <div
            key={u.label}
            className="min-w-[58px] rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-center"
          >
            <div className="font-mono text-xl font-semibold tabular-nums text-white">
              {String(u.value).padStart(2, "0")}
            </div>
            <div className="font-mono text-[9px] tracking-[0.15em] text-zinc-500">{u.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
