import type { Metadata } from "next";
import { CalendarDays } from "lucide-react";
import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { EventCard } from "@/components/features/event-card";
import { getEvents } from "@/lib/data";

export const metadata: Metadata = {
  title: "Events",
  description: "Workshops, talks, hackathons and meetups hosted by the EHIS IT Club.",
};

export default async function EventsPage() {
  const events = await getEvents();
  const now = Date.now();
  const upcoming = events.filter((e) => new Date(e.starts_at).getTime() >= now);
  const past = events.filter((e) => new Date(e.starts_at).getTime() < now);

  return (
    <>
      <PageHeader
        eyebrow="Calendar"
        title="Events"
        description="Everything happening at the club — from beginner workshops to overnight hackathons."
      />
      <Container className="flex flex-col gap-16 py-16">
        <section className="flex flex-col gap-8">
          <h2 className="text-2xl font-semibold tracking-tight text-white">Upcoming</h2>
          {upcoming.length ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {upcoming.map((e) => (
                <EventCard key={e.id} event={e} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<CalendarDays className="h-6 w-6" />}
              title="No upcoming events"
              description="New events are announced regularly — check back soon or subscribe below."
            />
          )}
        </section>

        {past.length > 0 && (
          <section className="flex flex-col gap-8">
            <h2 className="text-2xl font-semibold tracking-tight text-white">Past events</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {past.map((e) => (
                <EventCard key={e.id} event={e} />
              ))}
            </div>
          </section>
        )}
      </Container>
    </>
  );
}
