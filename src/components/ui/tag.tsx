import React from "react";
import { cn } from "@/lib/utils";

export interface TagProps extends React.HTMLAttributes<HTMLSpanElement> {
  active?: boolean;
}

export function Tag({ active = false, className, ...props }: TagProps) {
  return (
    <span
      className={cn(
        "inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-colors",
        active
          ? "border-brand-400/50 bg-brand-500/20 text-brand-300"
          : "border-white/10 bg-transparent text-zinc-400 hover:border-white/20 hover:text-zinc-200",
        className,
      )}
      {...props}
    />
  );
}
