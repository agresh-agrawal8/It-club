import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Countdown } from "@/components/hackathon/countdown";
import { getSchedule, getHackEvent } from "@/lib/hackathon/data";
import { formatDate, formatTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Schedule" };

const kindVariant: Record<string, "accent" | "success" | "warning" | "danger" | "small"> = {
  ceremony: "accent",
  session: "success",
  deadline: "danger",
  break: "warning",
  challenge: "danger",
};

export default async function SchedulePage() {
  const [schedule, event] = await Promise.all([getSchedule(), getHackEvent()]);

  // Group by day for a clean agenda.
  const byDay = new Map<string, any[]>();
  for (const s of schedule) {
    const day = formatDate(s.starts_at, { weekday: "long", day: "numeric", month: "long" });
    (byDay.get(day) ?? byDay.set(day, []).get(day)!).push(s);
  }

  return (
    <Container className="flex flex-col gap-10 py-14">
      <div className="flex flex-col items-center gap-4 text-center">
        <span className="eyebrow text-accent-400">Plan your 36 hours</span>
        <h1 className="text-4xl font-semibold tracking-tighter text-white md:text-6xl">Schedule</h1>
        {event.starts_at && <Countdown target={event.starts_at} label="Event begins in" className="items-center" />}
      </div>

      <div className="mx-auto flex w-full max-w-3xl flex-col gap-10">
        {[...byDay.entries()].map(([day, items]) => (
          <div key={day} className="flex flex-col gap-4">
            <h2 className="text-sm font-semibold uppercase tracking-[2px] text-brand-300">{day}</h2>
            <ul className="relative flex flex-col">
              {items.map((s: any, i: number) => (
                <li key={s.id} className="relative flex gap-5 pb-6 last:pb-0">
                  {i < items.length - 1 && (
                    <span className="absolute left-[59px] top-3 h-full w-px border-l border-dashed border-white/12" />
                  )}
                  <div className="w-12 shrink-0 pt-0.5 text-right font-mono text-xs text-zinc-400">
                    {formatTime(s.starts_at)}
                  </div>
                  <span className="relative z-10 mt-1 h-3 w-3 shrink-0 rounded-full border-2 border-brand-400 bg-zinc-950" />
                  <Card className="flex-1 p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium text-white">{s.title}</span>
                      <Badge variant={kindVariant[s.kind] ?? "small"}>{s.kind}</Badge>
                    </div>
                    {s.description && <p className="mt-1 text-xs text-zinc-400">{s.description}</p>}
                  </Card>
                </li>
              ))}
            </ul>
          </div>
        ))}
        {schedule.length === 0 && (
          <Card className="py-16 text-center text-sm text-zinc-500">Schedule coming soon.</Card>
        )}
      </div>
    </Container>
  );
}
