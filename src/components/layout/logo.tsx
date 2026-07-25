import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * Avinya identity — geometric "A" logomark + wordmark.
 *
 * The mark is a chevron apex (the "A") sitting inside a rounded aperture, with
 * a single node cut into the crossbar — reading as both a letterform and a
 * forward/uplink glyph, which suits an IT & AI club. It is pure SVG with an
 * inline gradient (no external asset), scales crisply, and animates on hover:
 * the aperture ring rotates and the node pulses.
 *
 * A distinct `gradientId` avoids duplicate-id collisions when several logos
 * render on one page (nav + footer).
 */
export function AvinyaMark({
  className,
  gradientId = "avinya-mark",
}: {
  className?: string;
  gradientId?: string;
}) {
  return (
    <svg viewBox="0 0 40 40" fill="none" role="img" aria-label="Avinya" className={className}>
      <defs>
        <linearGradient
          id={gradientId}
          x1="6"
          y1="4"
          x2="34"
          y2="36"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#c4b5fd" />
          <stop offset="0.55" stopColor="#8b5cf6" />
          <stop offset="1" stopColor="#6d28d9" />
        </linearGradient>
      </defs>

      {/* Aperture ring — rotates on hover */}
      <rect
        x="3.5"
        y="3.5"
        width="33"
        height="33"
        rx="10"
        stroke={`url(#${gradientId})`}
        strokeOpacity="0.35"
        strokeWidth="1.5"
        className="origin-center transition-transform duration-700 ease-out group-hover:rotate-90"
      />

      {/* The "A": two legs meeting at an apex */}
      <path
        d="M20 9.5 L29.5 30.5 L24.8 30.5 L20 19.4 L15.2 30.5 L10.5 30.5 Z"
        fill={`url(#${gradientId})`}
      />

      {/* Crossbar with a node gap — the circuit tell */}
      <rect x="16.4" y="24.4" width="7.2" height="2.6" rx="1.3" fill="#0a0a0c" />
      <circle
        cx="20"
        cy="25.7"
        r="1.7"
        fill={`url(#${gradientId})`}
        className="origin-center transition-transform duration-500 group-hover:scale-125"
      />
    </svg>
  );
}

export function Logo({
  className,
  onClick,
  size = "md",
  showTagline = false,
}: {
  className?: string;
  onClick?: () => void;
  size?: "sm" | "md" | "lg";
  showTagline?: boolean;
}) {
  const markSize = size === "lg" ? "h-9 w-9" : size === "sm" ? "h-6 w-6" : "h-7 w-7";
  const wordSize = size === "lg" ? "text-lg" : size === "sm" ? "text-[14px]" : "text-[15px]";

  return (
    <Link
      href="/"
      onClick={onClick}
      aria-label="Avinya — IT & AI Club home"
      className={cn("group inline-flex items-center gap-2.5", className)}
    >
      <AvinyaMark
        className={cn(
          markSize,
          "shrink-0 transition-transform duration-500 ease-out group-hover:-translate-y-0.5",
        )}
      />
      <span className="flex flex-col leading-none">
        <span className={cn("font-semibold tracking-tight text-white", wordSize)}>
          Avinya<span className="text-brand-300">.</span>
        </span>
        {showTagline && (
          <span className="mt-1 text-[10px] font-medium uppercase tracking-[0.16em] ink-3">
            IT &amp; AI Club
          </span>
        )}
      </span>
    </Link>
  );
}
