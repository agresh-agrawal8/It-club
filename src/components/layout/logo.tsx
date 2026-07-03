import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * soch.exe wordmark — a restrained logotype (no clip-art icon). A small
 * rotated violet square reads as a considered brand mark rather than a
 * dev-template glyph.
 */
export function Logo({
  className,
  onClick,
  size = "md",
}: {
  className?: string;
  onClick?: () => void;
  size?: "sm" | "md";
}) {
  return (
    <Link href="/" onClick={onClick} className={cn("group inline-flex items-center gap-2.5", className)}>
      <span className="relative flex h-6 w-6 items-center justify-center">
        <span className="absolute inset-0 rotate-45 rounded-[5px] border border-white/25 bg-gradient-to-br from-brand-400/90 to-brand-700 transition-transform duration-500 ease-out group-hover:rotate-[135deg]" />
        <span className="relative h-1.5 w-1.5 rounded-[1px] bg-white" />
      </span>
      <span
        className={cn(
          "font-mono font-medium tracking-tight text-white",
          size === "sm" ? "text-[13px]" : "text-sm",
        )}
      >
        soch<span className="text-brand-300">.exe</span>
      </span>
    </Link>
  );
}
