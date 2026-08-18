import { cn } from "@/lib/utils";
import { Icon } from "./icons";

/**
 * Card visuals.
 *
 * The reference board's cards each carry a small piece of interface under the
 * text — a floating panel stack, a chart, a week grid, an orbit of people —
 * and that is what stops a page of cards reading as a page of paragraphs.
 *
 * All of them are rebuilt here as inline SVG and CSS rather than images:
 *   • resolution-independent, so they stay crisp at any density
 *   • no network request, no layout shift, nothing to lazy-load
 *   • themable from the same tokens as the rest of the module
 *
 * People are drawn as initials in tinted circles, never photographs — this is
 * a school event and the visuals must not imply real students.
 */

/* ── Shared background texture ──────────────────────────────────────────── */

/**
 * The faint quatrefoil lattice sitting behind the reference cards. Rendered
 * once as a <pattern> and referenced by id, so repeating it across a page
 * costs nothing.
 */
export function LatticeDefs({ id = "lattice" }: { id?: string }) {
  return (
    <defs>
      {/* A soft quatrefoil, drawn as four arcs on a diamond — the reference's
          texture. Kept very faint: it should register as grain, not as a
          pattern competing with the content in front of it. */}
      <pattern id={id} width="34" height="34" patternUnits="userSpaceOnUse">
        <path
          d="M17 5 Q22 12 29 17 Q22 22 17 29 Q12 22 5 17 Q12 12 17 5Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.7"
          opacity="0.75"
        />
      </pattern>
      <linearGradient id={`${id}-fade`} x1="0" y1="0" x2="0.3" y2="1">
        <stop offset="0%" stopColor="white" stopOpacity="0.32" />
        <stop offset="60%" stopColor="white" stopOpacity="0.12" />
        <stop offset="100%" stopColor="white" stopOpacity="0" />
      </linearGradient>
      <mask id={`${id}-mask`}>
        <rect width="100%" height="100%" fill={`url(#${id}-fade)`} />
      </mask>
    </defs>
  );
}

function Lattice({ id }: { id: string }) {
  return (
    <>
      <LatticeDefs id={id} />
      <rect
        width="100%"
        height="100%"
        fill={`url(#${id})`}
        mask={`url(#${id}-mask)`}
        className="text-white/[0.05]"
      />
    </>
  );
}

/* ── 1. Floating panel stack ────────────────────────────────────────────── */

/**
 * Two overlapping panels with a gradient hero figure — the reference's
 * "Next Call · 2H 13M" motif, reused here for the moment the envelopes open.
 */
export function PanelStack({
  topLabel = "Envelope opens",
  figure = "9:20 AM",
  backLabel = "Your team",
  initials = ["AK", "RS", "MP", "TV", "JD"],
  className,
}: {
  topLabel?: string;
  figure?: string;
  backLabel?: string;
  initials?: string[];
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 340 190"
      className={cn("h-auto w-full", className)}
      role="img"
      aria-label={`${topLabel} ${figure}`}
    >
      <Lattice id="ps-lat" />

      <defs>
        <linearGradient id="ps-hero" x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0%" stopColor="#7c3aed" />
          <stop offset="100%" stopColor="#4c1d95" />
        </linearGradient>
      </defs>

      {/* Back panel */}
      <g>
        <rect
          x="8"
          y="52"
          width="196"
          height="124"
          rx="14"
          fill="#111116"
          stroke="rgba(255,255,255,0.09)"
        />
        <text x="26" y="80" className="fill-zinc-400" fontSize="11">
          {backLabel}
        </text>
        <path
          d="M181 71 l8 0 0 8 M189 71 l-9 9"
          stroke="rgba(255,255,255,0.45)"
          strokeWidth="1.4"
          fill="none"
          strokeLinecap="round"
        />
        <line x1="26" y1="94" x2="186" y2="94" stroke="rgba(255,255,255,0.07)" />

        {/* Avatar cluster */}
        {initials.map((t, i) => (
          <g key={t} transform={`translate(${26 + i * 26}, 118)`}>
            <circle
              cx="14"
              cy="14"
              r="15"
              fill="#111116"
              stroke="rgba(255,255,255,0.10)"
              strokeWidth="1.5"
            />
            <circle cx="14" cy="14" r="13" fill={i === 2 ? "#8b5cf6" : "rgba(139,92,246,0.16)"} />
            <text
              x="14"
              y="18"
              textAnchor="middle"
              fontSize="10"
              fontWeight="600"
              fill={i === 2 ? "#fff" : "#c4b5fd"}
            >
              {t}
            </text>
          </g>
        ))}
      </g>

      {/* Front panel */}
      <g>
        <rect
          x="150"
          y="14"
          width="182"
          height="122"
          rx="14"
          fill="#15151b"
          stroke="rgba(255,255,255,0.11)"
        />
        <text x="168" y="42" className="fill-zinc-300" fontSize="11">
          {topLabel}
        </text>
        <path
          d="M309 33 l8 0 0 8 M317 33 l-9 9"
          stroke="rgba(255,255,255,0.55)"
          strokeWidth="1.4"
          fill="none"
          strokeLinecap="round"
        />
        <line x1="168" y1="56" x2="314" y2="56" stroke="rgba(255,255,255,0.07)" />
        <rect x="150" y="66" width="182" height="70" rx="14" fill="url(#ps-hero)" />
        <text
          x="241"
          y="112"
          textAnchor="middle"
          fontSize="27"
          fontWeight="700"
          fill="#fff"
          letterSpacing="-0.5"
        >
          {figure}
        </text>
      </g>
    </svg>
  );
}

/* ── 2. Line chart ──────────────────────────────────────────────────────── */

/**
 * The reference's productivity curve, reused as the arc of the build day:
 * planning, three sprints, the surprise task dip, then the final climb.
 */
export function CurveChart({
  badge = "100%",
  caption,
  className,
}: {
  badge?: string;
  caption?: string;
  className?: string;
}) {
  // Hand-placed so the shape tells the day's story rather than being noise.
  const pts = [
    [0, 74], [26, 70], [52, 62], [78, 64], [104, 52], [130, 44], [156, 40],
    [182, 42], [208, 38], [222, 56], [238, 30], [264, 22], [290, 18], [316, 20], [340, 14],
  ];
  const line = pts.map(([x, y], i) => `${i ? "L" : "M"}${x} ${y + 26}`).join(" ");
  const area = `${line} L340 150 L0 150 Z`;

  return (
    <svg
      viewBox="0 0 340 150"
      className={cn("h-auto w-full", className)}
      role="img"
      aria-label={caption ?? "Progress through the build day"}
    >
      <Lattice id="cc-lat" />
      <defs>
        <linearGradient id="cc-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="cc-stroke" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#6d28d9" />
          <stop offset="100%" stopColor="#a78bfa" />
        </linearGradient>
      </defs>

      <path d={area} fill="url(#cc-fill)" />
      <path
        d={line}
        fill="none"
        stroke="url(#cc-stroke)"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Freeze marker */}
      <line x1="278" y1="30" x2="278" y2="150" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" />

      {/* Badge */}
      <g transform="translate(236, 2)">
        <rect width="66" height="24" rx="12" fill="#f4f4f5" />
        <text x="22" y="16" textAnchor="middle" fontSize="11" fontWeight="600" fill="#18181b">
          {badge}
        </text>
        <circle cx="50" cy="12" r="7" fill="#18181b" />
        <path
          d="M47 12 l2.2 2.2 L53 10.5"
          stroke="#fff"
          strokeWidth="1.6"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
}

/* ── 3. Day grid ────────────────────────────────────────────────────────── */

/**
 * The week-planner grid, retimed to Infinium's parallel tracks: what the three
 * builders are doing while the two quiz reps are out of the room.
 */
export function DayGrid({ className }: { className?: string }) {
  const cols = [
    { head: "Build", time: "09", cells: ["Plan", null, "Sprint I", "Sprint II"] },
    { head: "Quiz", time: "10", cells: [null, "Round 1", null, "Round 2"] },
    { head: "All", time: "12", cells: ["Surprise", "Sprint III", "Freeze", null] },
  ];

  return (
    <svg
      viewBox="0 0 340 186"
      className={cn("h-auto w-full", className)}
      role="img"
      aria-label="Parallel build and quiz tracks through the day"
    >
      <Lattice id="dg-lat" />

      {/* Floating chips */}
      <g>
        <rect x="4" y="2" width="86" height="26" rx="13" fill="#2e1065" stroke="rgba(167,139,250,0.4)" />
        <circle cx="18" cy="15" r="3.5" fill="#a78bfa" />
        <text x="28" y="19" fontSize="10.5" fill="#ddd6fe">
          Day plan
        </text>
      </g>
      <g>
        <rect x="240" y="16" width="96" height="26" rx="13" fill="#1e1b4b" stroke="rgba(129,140,248,0.35)" />
        <circle cx="254" cy="29" r="3.5" fill="#818cf8" />
        <text x="264" y="33" fontSize="10.5" fill="#c7d2fe">
          Code freeze
        </text>
      </g>

      {/* Grid card */}
      <rect x="14" y="44" width="312" height="138" rx="14" fill="#111116" stroke="rgba(255,255,255,0.09)" />

      {cols.map((c, ci) => {
        const x = 26 + ci * 100;
        return (
          <g key={c.head}>
            <text x={x} y="68" fontSize="12" fontWeight="600" fill="#fafafa">
              {c.head}
            </text>
            <text x={x + 74} y="68" fontSize="10" fill="#71717a" textAnchor="end">
              {c.time}
            </text>
            <line x1={x - 4} y1="78" x2={x + 78} y2="78" stroke="rgba(255,255,255,0.07)" />
            {c.cells.map((cell, ri) => {
              const y = 88 + ri * 24;
              if (!cell) {
                return (
                  <g key={ri}>
                    <rect
                      x={x - 4}
                      y={y}
                      width="82"
                      height="20"
                      rx="6"
                      fill="none"
                      stroke="rgba(255,255,255,0.09)"
                      strokeDasharray="3 3"
                    />
                    <text x={x + 37} y={y + 14} fontSize="9" fill="#52525b" textAnchor="middle">
                      open
                    </text>
                  </g>
                );
              }
              const accent = ci === 1 ? "#fbbf24" : ci === 2 ? "#f87171" : "#a78bfa";
              return (
                <g key={ri}>
                  <rect x={x - 4} y={y} width="82" height="20" rx="6" fill="rgba(255,255,255,0.04)" />
                  <circle cx={x + 4} cy={y + 10} r="2.6" fill={accent} />
                  <text x={x + 12} y={y + 14} fontSize="9.5" fill="#d4d4d8">
                    {cell}
                  </text>
                </g>
              );
            })}
          </g>
        );
      })}
    </svg>
  );
}

/* ── 4. Team orbit ──────────────────────────────────────────────────────── */

/**
 * A glowing core with the five roles orbiting it — the reference's
 * "be productive together" figure, recast as one team of five.
 */
export function TeamOrbit({
  labels = ["FE", "BE", "UX", "DOC", "CAP"],
  className,
}: {
  labels?: string[];
  className?: string;
}) {
  const cx = 170;
  const cy = 104;
  const r = 66;

  return (
    <svg
      viewBox="0 0 340 200"
      className={cn("h-auto w-full", className)}
      role="img"
      aria-label="Five roles around one team"
    >
      <defs>
        <radialGradient id="to-glow">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
          <stop offset="35%" stopColor="#c4b5fd" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Concentric rings */}
      {[r + 30, r + 12, r - 14].map((rad, i) => (
        <circle
          key={rad}
          cx={cx}
          cy={cy}
          r={rad}
          fill="none"
          stroke="rgba(255,255,255,0.07)"
          strokeDasharray={i === 1 ? "2 5" : undefined}
        />
      ))}

      {/* Core */}
      <circle cx={cx} cy={cy} r="58" fill="url(#to-glow)" />
      <g transform={`translate(${cx - 15}, ${cy - 17})`}>
        <path
          d="M15 0 L30 10 L30 24 Q30 32 15 34 Q0 32 0 24 L0 10 Z"
          fill="#ffffff"
          opacity="0.96"
        />
        <g stroke="#5b21b6" strokeWidth="2" strokeLinecap="round">
          {Array.from({ length: 8 }).map((_, i) => {
            const a = (i / 8) * Math.PI * 2;
            return (
              <line
                key={i}
                x1={15 + Math.cos(a) * 3.5}
                y1={16 + Math.sin(a) * 3.5}
                x2={15 + Math.cos(a) * 7.5}
                y2={16 + Math.sin(a) * 7.5}
              />
            );
          })}
        </g>
      </g>

      {/* Orbiting roles */}
      {labels.map((label, i) => {
        const a = (i / labels.length) * Math.PI * 2 - Math.PI / 2;
        const x = cx + Math.cos(a) * (r + 12);
        const y = cy + Math.sin(a) * (r + 12) * 0.78;
        return (
          <g key={label} transform={`translate(${x}, ${y})`}>
            <circle r="18" fill="#0d0d11" stroke="rgba(255,255,255,0.10)" strokeWidth="1.5" />
            <circle r="16" fill={i === 4 ? "#8b5cf6" : "rgba(139,92,246,0.16)"} />
            <text
              y="4"
              textAnchor="middle"
              fontSize="10"
              fontWeight="600"
              fill={i === 4 ? "#fff" : "#c4b5fd"}
            >
              {label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/* ── 5. Envelope seal ───────────────────────────────────────────────────── */

/** A sealed envelope with a wax mark — used wherever briefs are still locked. */
export function SealedEnvelope({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 340 180"
      className={cn("h-auto w-full", className)}
      role="img"
      aria-label="A sealed problem envelope"
    >
      <Lattice id="se-lat" />
      <defs>
        <linearGradient id="se-body" x1="0" y1="0" x2="0.5" y2="1">
          <stop offset="0%" stopColor="#1a1a22" />
          <stop offset="100%" stopColor="#101015" />
        </linearGradient>
        <radialGradient id="se-wax">
          <stop offset="0%" stopColor="#a78bfa" />
          <stop offset="100%" stopColor="#6d28d9" />
        </radialGradient>
      </defs>

      <g transform="translate(80, 30)">
        <rect width="180" height="120" rx="10" fill="url(#se-body)" stroke="rgba(255,255,255,0.11)" />
        <path
          d="M0 10 L90 68 L180 10"
          fill="none"
          stroke="rgba(255,255,255,0.11)"
          strokeWidth="1.4"
        />
        <path d="M0 118 L66 66 M180 118 L114 66" stroke="rgba(255,255,255,0.06)" strokeWidth="1.2" />
        <circle cx="90" cy="66" r="21" fill="url(#se-wax)" />
        <text x="90" y="72" textAnchor="middle" fontSize="16" fontWeight="700" fill="#fff">
          I
        </text>
        <text
          x="90"
          y="104"
          textAnchor="middle"
          fontSize="8"
          letterSpacing="2.4"
          fill="rgba(255,255,255,0.35)"
        >
          SEALED
        </text>
      </g>
    </svg>
  );
}

/* ── 6. Card visual frame ───────────────────────────────────────────────── */

/**
 * Inset well that a visual sits in, so every illustrated card shares the same
 * treatment: slightly darker ground, hairline top edge, clipped corners.
 */
export function VisualWell({
  children,
  className,
  pad = true,
}: {
  children: React.ReactNode;
  className?: string;
  pad?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative mt-auto overflow-hidden rounded-xl border border-white/[0.06] bg-black/30",
        pad && "px-4 pt-4",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Small stat pill row used under some visuals. */
export function MiniStats({ items }: { items: { label: string; value: string }[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((s) => (
        <span
          key={s.label}
          className="inline-flex items-baseline gap-1.5 rounded-lg border border-white/[0.07] bg-white/[0.03] px-2.5 py-1.5"
        >
          <span className="text-[13px] font-semibold tracking-tight text-white">{s.value}</span>
          <span className="text-[10px] uppercase tracking-[0.1em] text-zinc-500">{s.label}</span>
        </span>
      ))}
    </div>
  );
}

/** Icon grid used to illustrate "many small things" cards. */
export function IconCloud({ names }: { names: string[] }) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {names.map((n, i) => (
        <span
          key={n + i}
          className={cn(
            "flex aspect-square items-center justify-center rounded-xl border",
            i % 3 === 1
              ? "border-brand-400/25 bg-brand-500/12 text-brand-300"
              : "border-white/[0.06] bg-white/[0.02] text-zinc-500",
          )}
        >
          <Icon name={n} className="h-4 w-4" />
        </span>
      ))}
    </div>
  );
}
