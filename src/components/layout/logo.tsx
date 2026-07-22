import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * Avinya wordmark — a restrained logotype (no clip-art icon). A small
 * rotated violet square reads as a considered brand mark rather than a
 * dev-template glyph. "Avinya" is set in the sans face with a violet
 * accent dot; the sub-label carries the club descriptor.
 */
export function Logo({
  className,
  onClick,
  size = "md",
  showTagline = false,
}: {
  className?: string;
  onClick?: () => void;
  size?: "sm" | "md";
  showTagline?: boolean;
}) {
  return (
    <Link
      href="/"
      onClick={onClick}
      className={cn("group inline-flex items-center gap-2.5", className)}
    >
      <span className="relative flex h-6 w-6 shrink-0 items-center justify-center">
        <span className="absolute inset-0 rotate-45 rounded-[5px] border border-white/25 bg-gradient-to-br from-brand-400/90 to-brand-700 transition-transform duration-500 ease-out group-hover:rotate-[135deg]" />
        <span className="relative h-1.5 w-1.5 rounded-[1px] bg-white" />
      </span>
      <span className="flex flex-col leading-none">
        <span
          className={cn(
            "font-semibold tracking-tight text-white",
            size === "sm" ? "text-[14px]" : "text-[15px]",
          )}
        >
          Avinya<span className="text-brand-300">.</span>
        </span>
        {showTagline && (
          <span className="mt-1 text-[10px] font-medium uppercase tracking-[0.16em] text-zinc-500">
            IT &amp; AI Club
          </span>
        )}
      </span>
    </Link>
  );
}
