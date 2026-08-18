import { cn } from "@/lib/utils";
import type { AchievementCard, Rarity } from "@/lib/hackathon/content";
import { Icon } from "./icons";

/**
 * A single Developer Passport card.
 *
 * This is the printed card from `Cards.pdf` translated to the site's dark
 * surface: rarity bar across the top, icon tile and points badge on the header
 * row, then title, description and the "how to earn" footnote. Cards are earned
 * on paper during the event — this component is a catalogue, never a control.
 */

const RARITY: Record<
  Rarity,
  { bar: string; text: string; pill: string; badge: string; tile: string; glow: string }
> = {
  Common: {
    bar: "bg-brand-500",
    text: "text-brand-300",
    pill: "border-brand-400/40 text-brand-300",
    badge: "bg-brand-600 text-white",
    tile: "bg-brand-500/12 text-brand-300",
    glow: "before:bg-[radial-gradient(120%_90%_at_100%_0%,rgba(139,92,246,0.13),transparent_62%)]",
  },
  Rare: {
    bar: "bg-blue-500",
    text: "text-blue-300",
    pill: "border-blue-400/40 text-blue-300",
    badge: "bg-blue-600 text-white",
    tile: "bg-blue-500/12 text-blue-300",
    glow: "before:bg-[radial-gradient(120%_90%_at_100%_0%,rgba(59,130,246,0.13),transparent_62%)]",
  },
  Epic: {
    bar: "bg-red-500",
    text: "text-red-300",
    pill: "border-red-400/40 text-red-300",
    badge: "bg-red-600 text-white",
    tile: "bg-red-500/12 text-red-300",
    glow: "before:bg-[radial-gradient(120%_90%_at_100%_0%,rgba(239,68,68,0.13),transparent_62%)]",
  },
  Legendary: {
    bar: "bg-amber-500",
    text: "text-amber-300",
    pill: "border-amber-400/40 text-amber-300",
    badge: "bg-amber-500 text-black",
    tile: "bg-amber-500/12 text-amber-300",
    glow: "before:bg-[radial-gradient(120%_90%_at_100%_0%,rgba(245,158,11,0.14),transparent_62%)]",
  },
};

export function PassportCard({ card, className }: { card: AchievementCard; className?: string }) {
  const r = RARITY[card.rarity];

  return (
    <article
      className={cn(
        "group relative isolate flex flex-col overflow-hidden rounded-[18px] border border-white/[0.07] bg-[#0d0d11]",
        "before:pointer-events-none before:absolute before:inset-0 before:-z-10",
        r.glow,
        "transition-[border-color,transform] duration-200 ease-[cubic-bezier(0.25,1,0.5,1)] hover:-translate-y-0.5 hover:border-white/[0.15] motion-reduce:hover:translate-y-0",
        className,
      )}
    >
      <span className={cn("h-[3px] w-full shrink-0", r.bar)} aria-hidden />

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-start justify-between gap-3">
          <span className={cn("flex h-10 w-10 items-center justify-center rounded-xl", r.tile)}>
            <Icon name={card.icon} className="h-[18px] w-[18px]" />
          </span>
          <span
            className={cn(
              "flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-full leading-none",
              r.badge,
            )}
          >
            <span className="text-[15px] font-bold tracking-tight">+{card.points}</span>
            <span className="text-[7px] font-semibold uppercase tracking-[0.12em] opacity-80">
              pts
            </span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={cn(
              "rounded-full border px-2 py-[3px] text-[9px] font-semibold uppercase tracking-[0.14em]",
              r.pill,
            )}
          >
            {card.rarity}
          </span>
          <span className="font-mono text-[10px] text-zinc-600">#{card.no}</span>
        </div>

        <h3 className="text-[17px] font-semibold leading-tight tracking-tight text-white">
          {card.title}
        </h3>
        <p className="text-[13px] leading-relaxed text-zinc-400">{card.desc}</p>

        <div className="mt-auto pt-4">
          <div className="mb-2 h-px w-full bg-white/[0.07]" />
          <span
            className={cn(
              "text-[9px] font-semibold uppercase tracking-[0.16em]",
              r.text,
            )}
          >
            How to earn
          </span>
          <p className="mt-1 text-[12px] leading-relaxed text-zinc-500">{card.howTo}</p>
        </div>

        <div className="flex items-center justify-between pt-1">
          <span className="text-[8.5px] uppercase tracking-[0.16em] text-zinc-600">
            Infinium Hackathon
          </span>
          <span className="font-mono text-[8.5px] text-zinc-700">{card.code}</span>
        </div>
      </div>
    </article>
  );
}

/** Small legend used above the passport grid. */
export function RarityLegend({ counts }: { counts: Record<Rarity, number> }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {(Object.keys(RARITY) as Rarity[]).map((rar) => (
        <span
          key={rar}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px]",
            RARITY[rar].pill,
          )}
        >
          <span className={cn("h-1.5 w-1.5 rounded-full", RARITY[rar].bar)} />
          {rar}
          <span className="text-zinc-600">{counts[rar]}</span>
        </span>
      ))}
    </div>
  );
}
