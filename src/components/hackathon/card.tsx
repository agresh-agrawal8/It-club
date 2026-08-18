import React from "react";
import { cn } from "@/lib/utils";
import { Icon } from "./icons";

/**
 * Infinium's card system.
 *
 * One surface definition, used by every card on every /hackathon page. The
 * shape is taken from the guide PDF and the reference board: a near-black
 * panel, a hairline border that brightens on hover, a generous 20px radius,
 * and a soft radial tint in the corner that hints at the section's colour.
 *
 * Before this existed each page hand-rolled its own `rounded-2xl border ...`
 * string, so radii, borders and padding drifted from page to page. Anything
 * that looks like a card should be built from `HackCard` — if a new variant is
 * needed, add a tone here rather than styling in place.
 */

export type Tone = "default" | "brand" | "accent" | "danger" | "amber" | "sky";

const TONE_TINT: Record<Tone, string> = {
  default: "",
  brand: "before:bg-[radial-gradient(120%_100%_at_100%_0%,rgba(139,92,246,0.14),transparent_60%)]",
  accent: "before:bg-[radial-gradient(120%_100%_at_100%_0%,rgba(34,197,94,0.12),transparent_60%)]",
  danger: "before:bg-[radial-gradient(120%_100%_at_100%_0%,rgba(239,68,68,0.13),transparent_60%)]",
  amber: "before:bg-[radial-gradient(120%_100%_at_100%_0%,rgba(245,158,11,0.13),transparent_60%)]",
  sky: "before:bg-[radial-gradient(120%_100%_at_100%_0%,rgba(59,130,246,0.13),transparent_60%)]",
};

export const TONE_TEXT: Record<Tone, string> = {
  default: "text-zinc-400",
  brand: "text-brand-300",
  accent: "text-accent-400",
  danger: "text-red-300",
  amber: "text-amber-300",
  sky: "text-sky-300",
};

export const TONE_ICON_BG: Record<Tone, string> = {
  default: "bg-white/[0.06] text-zinc-300",
  brand: "bg-brand-500/15 text-brand-300",
  accent: "bg-accent-500/15 text-accent-400",
  danger: "bg-red-500/15 text-red-300",
  amber: "bg-amber-500/15 text-amber-300",
  sky: "bg-sky-500/15 text-sky-300",
};

export interface HackCardProps extends React.HTMLAttributes<HTMLDivElement> {
  tone?: Tone;
  /** Adds the hover treatment. Use for cards that are links or buttons. */
  interactive?: boolean;
  /** Drop the default padding when the card manages its own internal layout. */
  bare?: boolean;
}

export function HackCard({
  tone = "default",
  interactive = false,
  bare = false,
  className,
  children,
  ...props
}: HackCardProps) {
  return (
    <div
      className={cn(
        "relative isolate overflow-hidden rounded-[20px] border border-white/[0.07] bg-[#0d0d11]",
        // The tint lives on a pseudo-element so it never intercepts pointers
        // and never fights with the card's own background colour.
        "before:pointer-events-none before:absolute before:inset-0 before:-z-10",
        TONE_TINT[tone],
        !bare && "p-6 sm:p-7",
        interactive &&
          "transition-[border-color,transform] duration-200 ease-[cubic-bezier(0.25,1,0.5,1)] hover:-translate-y-0.5 hover:border-white/[0.16] motion-reduce:hover:translate-y-0",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

/* ─────────────────────────── Card internals ─────────────────────────── */

/** Small tinted icon tile — the guide uses one at the top of most cards. */
export function IconTile({
  name,
  tone = "brand",
  className,
}: {
  name: string;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
        TONE_ICON_BG[tone],
        className,
      )}
    >
      <Icon name={name} className="h-[18px] w-[18px]" />
    </span>
  );
}

export function CardTitle({
  children,
  className,
  as: As = "h3",
}: {
  children: React.ReactNode;
  className?: string;
  as?: "h2" | "h3" | "h4";
}) {
  return (
    <As className={cn("text-[17px] font-semibold tracking-tight text-white", className)}>
      {children}
    </As>
  );
}

export function CardBody({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p className={cn("text-[13.5px] leading-relaxed text-zinc-400", className)}>{children}</p>
  );
}

/** Uppercase, letter-spaced micro-label. The PDF uses these everywhere. */
export function Eyebrow({
  children,
  tone = "brand",
  className,
}: {
  children: React.ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "text-[10px] font-medium uppercase tracking-[0.18em]",
        TONE_TEXT[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/* ─────────────────────────── Composed cards ─────────────────────────── */

/**
 * Numbered feature card — the six-up grid in Section 01, with the oversized
 * ghost numeral sitting behind the top-right corner.
 */
export function FeatureCard({
  n,
  icon,
  title,
  desc,
  tone = "brand",
}: {
  n: string;
  icon: string;
  title: string;
  desc: string;
  tone?: Tone;
}) {
  return (
    <HackCard tone={tone} interactive className="flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <IconTile name={icon} tone={tone} />
        <span
          className="select-none text-[38px] font-semibold leading-none tracking-tighter text-white/[0.06]"
          aria-hidden
        >
          {n}
        </span>
      </div>
      <CardTitle className="mt-1">{title}</CardTitle>
      <CardBody>{desc}</CardBody>
    </HackCard>
  );
}

/** Compact figure tile used for the at-a-glance strip. */
export function StatTile({
  icon,
  label,
  value,
  sub,
}: {
  icon: string;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <HackCard tone="brand" className="flex flex-col gap-2 p-5">
      <span className="flex items-center gap-2 text-zinc-500">
        <Icon name={icon} className="h-3.5 w-3.5" />
        <span className="text-[10px] uppercase tracking-[0.16em]">{label}</span>
      </span>
      <span className="text-2xl font-semibold tracking-tight text-white">{value}</span>
      {sub && <span className="text-[11px] text-zinc-500">{sub}</span>}
    </HackCard>
  );
}

/** Pill used for the tech-stack row and topic lists. */
export function Chip({
  children,
  tone = "default",
}: {
  children: React.ReactNode;
  tone?: Tone;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-1.5 text-[12.5px]",
        tone === "default" ? "text-zinc-300" : TONE_TEXT[tone],
      )}
    >
      {children}
    </span>
  );
}

/** Checklist row — the guide's tick lists. */
export function CheckRow({ children, tone = "brand" }: { children: React.ReactNode; tone?: Tone }) {
  return (
    <li className="flex items-start gap-2.5 text-[13.5px] leading-relaxed text-zinc-300">
      <Icon name="check" className={cn("mt-[3px] h-3.5 w-3.5 shrink-0", TONE_TEXT[tone])} />
      <span>{children}</span>
    </li>
  );
}

/* ─────────────────────────── Section header ─────────────────────────── */

/**
 * The PDF's section header: a hairline rule with the wordmark on the left and
 * the section label on the right, then an eyebrow, then a two-tone headline.
 */
export function SectionHead({
  section,
  eyebrow,
  icon,
  title,
  accent,
  lead,
  align = "left",
  tone = "brand",
}: {
  section?: string;
  eyebrow?: string;
  icon?: string;
  title: string;
  accent?: string;
  lead?: string;
  align?: "left" | "center";
  tone?: Tone;
}) {
  const centered = align === "center";
  return (
    <div className={cn("flex flex-col gap-4", centered && "items-center text-center")}>
      {section && (
        <div className="flex w-full items-center gap-4">
          <span className="text-[10px] font-semibold uppercase tracking-[0.28em] text-white">
            INFI<span className="text-brand-400">N</span>IUM
          </span>
          <span className="h-px flex-1 bg-gradient-to-r from-brand-500/40 via-white/10 to-transparent" />
          <span className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">{section}</span>
        </div>
      )}

      {eyebrow && (
        <span className={cn("flex items-center gap-2", centered && "justify-center")}>
          {icon && <Icon name={icon} className={cn("h-4 w-4", TONE_TEXT[tone])} />}
          <Eyebrow tone={tone}>{eyebrow}</Eyebrow>
        </span>
      )}

      <h2
        className={cn(
          "text-balance text-3xl font-semibold leading-[1.06] tracking-tighter text-white sm:text-4xl md:text-[42px]",
          centered && "mx-auto max-w-3xl",
        )}
      >
        {title}
        {accent && (
          <>
            {" "}
            <span className="text-brand-400">{accent}</span>
          </>
        )}
      </h2>

      {lead && (
        <p
          className={cn(
            "max-w-3xl text-[14.5px] leading-relaxed text-zinc-400",
            centered && "mx-auto",
          )}
        >
          {lead}
        </p>
      )}
    </div>
  );
}
