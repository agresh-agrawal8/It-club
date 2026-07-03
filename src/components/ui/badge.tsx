import React from "react";
import { cn } from "@/lib/utils";

export type BadgeVariant = "small" | "large" | "accent" | "success" | "warning" | "danger";

const variantClasses: Record<BadgeVariant, string> = {
  small: "bg-zinc-950 border border-zinc-700 text-zinc-300 px-3 py-1 text-[10px]",
  large: "bg-white/90 text-zinc-900 px-4 py-1 text-xs",
  accent: "bg-brand-500/20 border border-brand-400/50 text-brand-300 px-4 py-1 text-xs",
  success: "bg-emerald-500/15 border border-emerald-400/40 text-emerald-300 px-3 py-1 text-[10px]",
  warning: "bg-amber-500/15 border border-amber-400/40 text-amber-300 px-3 py-1 text-[10px]",
  danger: "bg-red-500/15 border border-red-400/40 text-red-300 px-3 py-1 text-[10px]",
};

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export function Badge({ variant = "small", className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-medium uppercase tracking-wide",
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  );
}
