import React from "react";
import { Card } from "./card";

export interface StatCardProps {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  hint?: string;
}

export function StatCard({ label, value, icon, hint }: StatCardProps) {
  return (
    <Card className="flex items-center gap-5 p-6" glass hoverLift>
      {icon && (
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-500/15 text-brand-300">
          {icon}
        </div>
      )}
      <div className="min-w-0">
        <div className="text-3xl font-semibold tracking-tighter text-white">{value}</div>
        <div className="mt-0.5 text-xs uppercase tracking-wide text-zinc-400">{label}</div>
        {hint && <div className="mt-1 text-xs text-zinc-500">{hint}</div>}
      </div>
    </Card>
  );
}
