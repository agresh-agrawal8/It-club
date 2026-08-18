import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { PassportCard, RarityLegend } from "@/components/hackathon/achievement-card";
import { CardBody, Eyebrow, HackCard, IconTile, SectionHead } from "@/components/hackathon/card";
import {
  ACHIEVEMENTS,
  PASSPORT_MAX,
  RARITY_ORDER,
  type Rarity,
} from "@/lib/hackathon/content";

export const metadata: Metadata = {
  title: "Developer Passport",
  description:
    "The twenty Infinium achievement cards — Common, Rare, Epic and Legendary — earned on paper through the build day.",
};

export const dynamic = "force-static";

const COUNTS = RARITY_ORDER.reduce(
  (acc, r) => ({ ...acc, [r]: ACHIEVEMENTS.filter((c) => c.rarity === r).length }),
  {} as Record<Rarity, number>,
);

const POINTS_BY_RARITY: Record<Rarity, number> = {
  Common: 10,
  Rare: 20,
  Epic: 40,
  Legendary: 75,
};

export default function PassportPage() {
  return (
    <Container className="flex flex-col gap-12 py-14">
      <SectionHead
        section="Section 06 / Adapt & Achieve"
        eyebrow="The developer passport"
        icon="ticket"
        title="Twenty Cards."
        accent="Earned, Not Given."
        lead="Achievement cards reward the engineering habits that make a project real — version control, working features, tests, docs, portability. You collect them on paper as you hit each milestone, and they are counted into your final score at the close."
        align="center"
      />

      {/* ── How they work ──────────────────────────────────────── */}
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          {
            icon: "pen",
            title: "Claimed on paper",
            body: "Show a coordinator the milestone on your machine. They sign the card and hand it to you.",
            tone: "brand" as const,
          },
          {
            icon: "power",
            title: "All fully offline",
            body: "Nothing is awarded, tracked or calculated on this website — the whole passport lives on your desk.",
            tone: "danger" as const,
          },
          {
            icon: "trophy",
            title: "Counted at the close",
            body: `Cards are collected at wrap-up and added to your final score. Up to ${PASSPORT_MAX} points are on the table.`,
            tone: "amber" as const,
          },
        ].map((c) => (
          <HackCard key={c.title} tone={c.tone} className="flex flex-col gap-3">
            <IconTile name={c.icon} tone={c.tone} />
            <h3 className="text-[15px] font-semibold tracking-tight text-white">{c.title}</h3>
            <CardBody className="text-[13px]">{c.body}</CardBody>
          </HackCard>
        ))}
      </div>

      {/* ── Legend ─────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <RarityLegend counts={COUNTS} />
        <span className="text-[12px] text-zinc-500">
          Points scale with complexity — {POINTS_BY_RARITY.Common} to {POINTS_BY_RARITY.Legendary}{" "}
          per card
        </span>
      </div>

      {/* ── The cards, grouped by rarity ───────────────────────── */}
      {RARITY_ORDER.map((rarity) => {
        const cards = ACHIEVEMENTS.filter((c) => c.rarity === rarity);
        return (
          <section key={rarity} className="flex flex-col gap-5">
            <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-white/[0.07] pb-3">
              <div className="flex items-baseline gap-3">
                <h2 className="text-xl font-semibold tracking-tight text-white">{rarity}</h2>
                <Eyebrow tone="default">
                  {cards.length} cards · +{POINTS_BY_RARITY[rarity]} each
                </Eyebrow>
              </div>
              <span className="font-mono text-[11px] text-zinc-600">
                {cards[0].code.slice(0, 5)}…
              </span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {cards.map((c) => (
                <PassportCard key={c.code} card={c} />
              ))}
            </div>
          </section>
        );
      })}

      <p className="text-center text-[11px] uppercase tracking-[0.18em] text-zinc-600">
        {ACHIEVEMENTS.length} cards · {PASSPORT_MAX} points maximum · Infinium IT Fest 2026
      </p>
    </Container>
  );
}
