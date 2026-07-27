import { cn } from "@/lib/utils";

/**
 * Event sentinel mark.
 *
 * The artwork is the supplied `gemini-svg.svg` (a sentinel/robot glyph),
 * rebuilt as a component so it can scale crisply and pick up each event's
 * accent colour instead of being locked to one palette.
 *
 * `variant`:
 *   "brand"    — strokes follow the event accent (`--ev-accent`), so on CODE
 *                RED the mark reads red and matches the rest of the module.
 *                This is the default; it is what keeps one visual system.
 *   "original" — the artwork's own cyan (#00F0FF), for when the mark needs to
 *                stand apart from the surrounding theme.
 *
 * The plate stays dark in both, which is what gives the glyph its contrast on
 * light and dark surfaces alike.
 */
export function EventMark({
  className,
  variant = "brand",
  plate = true,
  title = "Event mark",
}: {
  className?: string;
  variant?: "brand" | "original";
  /** Draw the rounded dark tile behind the glyph. */
  plate?: boolean;
  title?: string;
}) {
  const stroke = variant === "original" ? "#00F0FF" : "var(--ev-accent, #00F0FF)";

  return (
    <svg
      viewBox="0 0 100 100"
      role="img"
      aria-label={title}
      className={cn("shrink-0", className)}
    >
      {plate && <rect x="5" y="5" width="90" height="90" rx="16" fill="#0B0F19" />}

      {/* Left strut */}
      <rect
        x="24"
        y="44"
        width="10"
        height="32"
        rx="5"
        fill="#1E293B"
        stroke={stroke}
        strokeWidth="1.5"
      />

      {/* Body arch */}
      <path
        d="M 32 80 V 38 A 18 18 0 0 1 68 38 V 80"
        fill="#1E293B"
        stroke={stroke}
        strokeWidth="2"
        strokeLinejoin="round"
      />

      {/* Visor */}
      <rect
        x="42"
        y="32"
        width="30"
        height="18"
        rx="9"
        fill="#030712"
        stroke={stroke}
        strokeWidth="2"
      />

      {/* Signal trace + node */}
      <path
        d="M 46 41 H 54 L 58 37 H 64"
        stroke={stroke}
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
      />
      <circle cx="64" cy="37" r="1.5" fill={stroke} />

      {/* Status bar — stays green: it reads as "online" regardless of theme */}
      <line x1="47" y1="45" x2="52" y2="45" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
