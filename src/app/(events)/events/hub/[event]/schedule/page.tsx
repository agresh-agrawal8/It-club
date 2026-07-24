import { notFound } from "next/navigation";
import { Container } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { getEvent, resolveTheme } from "@/lib/events/engine";
import { getSchedule } from "@/lib/events/queries";
import { formatDate, formatTime } from "@/lib/utils";

export const metadata = { title: "Schedule" };

const KIND_VARIANT: Record<string, "accent" | "success" | "warning" | "danger" | "small"> = {
  ceremony: "accent",
  session: "small",
  deadline: "danger",
  break: "small",
  challenge: "warning",
  judging: "success",
};

export default async function SchedulePage({
  params,
}: {
  params: Promise<{ event: string }>;
}) {
  const { event: slug } = await params;
  const event = await getEvent(slug);
  if (!event) notFound();

  const schedule = await getSchedule(event.id);
  const theme = resolveTheme(event);

  // Group by calendar day so a multi-day event reads as days, not a long list.
  const days = new Map<string, typeof schedule>();
  for (const item of schedule) {
    const key = formatDate(item.starts_at, { weekday: "long", day: "numeric", month: "long" });
    days.set(key, [...(days.get(key) ?? []), item]);
  }

  return (
    <Container className="flex flex-col gap-8 py-14">
      <header>
        <h1 className="text-3xl font-semibold tracking-tighter text-white md:text-4xl">Schedule</h1>
        <p className="mt-2 text-sm text-zinc-400">Run of show for {event.name}.</p>
      </header>

      {schedule.length === 0 ? (
        <EmptyState
          title="Schedule not published yet"
          description="The organisers will publish the run of show closer to the event."
        />
      ) : (
        <div className="flex flex-col gap-10">
          {[...days.entries()].map(([day, items]) => (
            <section key={day} className="flex flex-col gap-4">
              <h2 className="font-mono text-[11px] uppercase tracking-[0.2em] text-zinc-500">
                {day}
              </h2>
              <div className="flex flex-col gap-3">
                {items.map((item) => (
                  <Card key={item.id} className="flex flex-col gap-2 p-5 sm:flex-row sm:items-start sm:gap-6">
                    <div className="flex shrink-0 items-baseline gap-2 font-mono text-sm tabular-nums text-white sm:w-32 sm:flex-col sm:gap-0">
                      <span>{formatTime(item.starts_at)}</span>
                      {item.ends_at && (
                        <span className="text-[11px] text-zinc-500">
                          → {formatTime(item.ends_at)}
                        </span>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <h3 className="text-base font-medium text-white">{item.title}</h3>
                        <Badge variant={KIND_VARIANT[item.kind] ?? "small"}>{item.kind}</Badge>
                      </div>
                      {item.description && (
                        <p className="mt-1 text-sm text-zinc-400">{item.description}</p>
                      )}
                      {item.location && (
                        <p className="mt-1 text-xs" style={{ color: theme.accent }}>
                          {item.location}
                        </p>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </Container>
  );
}
