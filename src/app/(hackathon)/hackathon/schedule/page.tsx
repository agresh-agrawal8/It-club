import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { Countdown } from "@/components/hackathon/countdown";
import { Icon } from "@/components/hackathon/icons";
import { CardBody, Eyebrow, HackCard, IconTile, SectionHead } from "@/components/hackathon/card";
import { EVENT, SCHEDULE, TRACK_LABEL, type ScheduleItem } from "@/lib/hackathon/content";

export const metadata: Metadata = {
  title: "Schedule",
  description:
    "The full one-day Infinium timeline — arrival at 8:30 AM, envelopes at 9:20, code freeze at 2:15 PM, closing by 3:00 PM.",
};

export const dynamic = "force-static";

const TRACK_DOT: Record<string, string> = {
  hack: "border-brand-400",
  quiz: "border-amber-400",
  surprise: "border-red-400",
};

const TRACK_LEGEND_DOT: Record<string, string> = {
  hack: "bg-brand-400",
  quiz: "bg-amber-400",
  surprise: "bg-red-400",
};

/**
 * Pair the two parallel-track rows (build sprint + quiz round) so they read as
 * one moment in the day rather than two separate entries.
 */
function grouped(items: ScheduleItem[]) {
  const rows: { main: ScheduleItem; alongside?: ScheduleItem }[] = [];
  for (let i = 0; i < items.length; i++) {
    const next = items[i + 1];
    if (next?.parallel) {
      rows.push({ main: items[i], alongside: next });
      i++;
    } else {
      rows.push({ main: items[i] });
    }
  }
  return rows;
}

const ROWS = grouped(SCHEDULE);

export default function SchedulePage() {
  return (
    <Container className="flex flex-col gap-12 py-14">
      <SectionHead
        section="Section 04 / The Flow"
        eyebrow="The event flow"
        icon="clock"
        title="One Day,"
        accent="Start to Finish."
        lead={`${EVENT.dateLabel}. Doors at 8:30 AM, closing ceremony by 3:00 PM. Envelopes open at 9:20. The 2 Quiz Reps step out for their rounds while the other 3 keep building, then rejoin. Nobody sits idle, and nothing carries over to a second day.`}
      />

      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-wrap gap-4">
          {(Object.keys(TRACK_LABEL) as (keyof typeof TRACK_LABEL)[]).map((t) => (
            <span key={t} className="flex items-center gap-2 text-[12px] text-zinc-400">
              <span className={`h-2 w-2 rounded-full ${TRACK_LEGEND_DOT[t]}`} />
              {TRACK_LABEL[t]}
            </span>
          ))}
        </div>
        <Countdown target={EVENT.startsAt} label="Envelopes open in" compact />
      </div>

      {/* ── Timeline ───────────────────────────────────────────── */}
      <ol className="flex flex-col">
        {ROWS.map(({ main, alongside }, i) => (
          <li key={`${main.time}-${main.title}`} className="relative flex gap-4 pb-8 last:pb-0 sm:gap-6">
            {i < ROWS.length - 1 && (
              <span className="absolute left-[74px] top-7 hidden h-[calc(100%-12px)] w-px bg-white/[0.08] sm:block" />
            )}

            <span className="hidden w-[58px] shrink-0 pt-1 text-right font-mono text-[12px] text-zinc-400 sm:block">
              {main.time}
            </span>
            <span
              className={`relative z-10 mt-1.5 hidden h-3.5 w-3.5 shrink-0 rounded-full border-2 bg-[#08080b] sm:block ${
                TRACK_DOT[main.track]
              }`}
            />

            <div className="flex min-w-0 flex-1 flex-col gap-3">
              <div className={alongside ? "grid gap-3 lg:grid-cols-2" : ""}>
                <HackCard
                  tone={main.track === "surprise" ? "danger" : "default"}
                  className="flex items-start gap-3.5 p-5"
                >
                  <IconTile
                    name={main.icon}
                    tone={main.track === "surprise" ? "danger" : "brand"}
                    className="h-9 w-9"
                  />
                  <div className="flex min-w-0 flex-col gap-1">
                    <span className="font-mono text-[11px] text-zinc-500 sm:hidden">
                      {main.time}
                    </span>
                    <h3 className="text-[15px] font-semibold tracking-tight text-white">
                      {main.title}
                    </h3>
                    <CardBody className="text-[13px]">{main.desc}</CardBody>
                  </div>
                </HackCard>

                {alongside && (
                  <HackCard tone="amber" className="flex items-start gap-3.5 p-5">
                    <IconTile name={alongside.icon} tone="amber" className="h-9 w-9" />
                    <div className="flex min-w-0 flex-col gap-1">
                      <Eyebrow tone="amber">Quiz track · 2 reps</Eyebrow>
                      <h3 className="text-[15px] font-semibold tracking-tight text-white">
                        {alongside.title}
                      </h3>
                      <CardBody className="text-[13px]">{alongside.desc}</CardBody>
                    </div>
                  </HackCard>
                )}
              </div>
            </div>
          </li>
        ))}
      </ol>

      {/* ── Key moments ────────────────────────────────────────── */}
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          {
            icon: "mail",
            label: "Envelopes open",
            value: "9:20 AM",
            note: "The build clock starts here.",
            tone: "brand" as const,
          },
          {
            icon: "shuffle",
            label: "Surprise task",
            value: "12:05 PM",
            note: "45 minutes to fold it in.",
            tone: "danger" as const,
          },
          {
            icon: "check",
            label: "Code freeze",
            value: "2:15 PM",
            note: "Sharp. No edits after this.",
            tone: "amber" as const,
          },
        ].map((m) => (
          <HackCard key={m.label} tone={m.tone} className="flex flex-col gap-2">
            <span className="flex items-center gap-2">
              <Icon name={m.icon} className="h-4 w-4 text-zinc-400" />
              <Eyebrow tone={m.tone}>{m.label}</Eyebrow>
            </span>
            <span className="text-2xl font-semibold tracking-tight text-white">{m.value}</span>
            <CardBody className="text-[12.5px]">{m.note}</CardBody>
          </HackCard>
        ))}
      </div>

      <p className="text-center text-[11px] uppercase tracking-[0.18em] text-zinc-600">
        One day · 8:30 AM to 3:00 PM · Exact timings confirmed on the day
      </p>
    </Container>
  );
}
