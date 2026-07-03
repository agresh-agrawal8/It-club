import { cn } from "@/lib/utils";

/** Loading placeholder with the on-brand shimmer sweep. */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("shimmer rounded-xl bg-zinc-800/60", className)} />;
}
