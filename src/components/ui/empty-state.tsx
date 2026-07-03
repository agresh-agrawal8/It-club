import React from "react";
import { cn } from "@/lib/utils";

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-white/10 bg-zinc-900/40 px-8 py-20 text-center",
        className,
      )}
    >
      {icon && (
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-500/15 text-brand-300">
          {icon}
        </div>
      )}
      <h3 className="text-xl font-semibold tracking-tight text-white">{title}</h3>
      {description && <p className="max-w-md text-sm text-zinc-400">{description}</p>}
      {action}
    </div>
  );
}
