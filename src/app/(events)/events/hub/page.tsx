import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CalendarDays, MapPin, Users } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { listEvents, resolveTheme } from "@/lib/events/engine";
import { eventPhase } from "@/lib/events/rules";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Event Hub",
  description: "Competitions, hackathons and challenges run by the Avinya IT Club.",
};

const PHASE_LABEL: Record<string, string> = {
  upcoming: "Upcoming",
  registration: "Registration open",
  live: "Live now",
  judging: "Judging",
  ended: "Concluded",
};

const PHASE_VARIANT: Record<string, "accent" | "success" | "warning" | "small"> = {
  upcoming: "small",
  registration: "success",
  live: "accent",
  judging: "warning",
  ended: "small",
};

export default async function EventHubPage() {
  const events = await listEvents();

  return (
    <Container className="flex flex-col gap-8 py-14">
      <header className="flex flex-col gap-3">
        <span className="font-mono text-[11px] uppercase tracking-[0.25em] text-zinc-500">
          Avinya IT Club
        </span>
        <h1 className="text-4xl font-semibold tracking-tighter text-white md:text-5xl">
          Event Hub
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-zinc-400">
          Every competition the club runs, on one platform. Each event has its own missions,
          teams, leaderboard and dashboard.
        </p>
      </header>

      {events.length === 0 ? (
        <EmptyState
          title="No events published yet"
          description="When the club opens registration for an event, it will appear here."
        />
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {events.map((event) => {
            const theme = resolveTheme(event);
            const phase = eventPhase(event);

            return (
              <Link key={event.id} href={`/events/hub/${event.slug}`} className="group">
                <Card
                  hoverLift
                  className="relative flex h-full flex-col gap-4 overflow-hidden p-6"
                >
                  <div
                    className="pointer-events-none absolute inset-x-0 top-0 h-px"
                    style={{ background: theme.accent }}
                  />

                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <span
                        className="grid h-10 w-10 place-items-center rounded-xl text-xs font-bold text-white"
                        style={{ background: theme.accent }}
                      >
                        {theme.codename}
                      </span>
                      <div>
                        <h2 className="text-lg font-semibold tracking-tight text-white">
                          {event.name}
                        </h2>
                        {event.tagline && (
                          <p className="text-xs text-zinc-500">{event.tagline}</p>
                        )}
                      </div>
                    </div>
                    <Badge variant={PHASE_VARIANT[phase]}>{PHASE_LABEL[phase]}</Badge>
                  </div>

                  {event.summary && (
                    <p className="line-clamp-3 flex-1 text-sm leading-relaxed text-zinc-400">
                      {event.summary}
                    </p>
                  )}

                  <dl className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-zinc-500">
                    {event.starts_at && (
                      <div className="flex items-center gap-1.5">
                        <CalendarDays className="h-3.5 w-3.5" />
                        <dd>{formatDate(event.starts_at)}</dd>
                      </div>
                    )}
                    {event.venue && (
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5" />
                        <dd className="truncate">{event.venue}</dd>
                      </div>
                    )}
                    {event.capacity && (
                      <div className="flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5" />
                        <dd>{event.capacity} places</dd>
                      </div>
                    )}
                  </dl>

                  <span
                    className="flex items-center gap-1.5 text-xs font-medium"
                    style={{ color: theme.accent }}
                  >
                    Enter event
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </Container>
  );
}
