import type { Metadata } from "next";
import { CalendarDays } from "lucide-react";
import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { EventCard } from "@/components/features/event-card";
import { getEvents } from "@/lib/data";
import { SITE, absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Events",
  description: `Workshops, talks, hackathons and competitions run by ${SITE.name}, the IT & AI Club of ${SITE.school}.`,
  alternates: { canonical: "/events" },
  openGraph: {
    title: `Events · ${SITE.name}`,
    description: `Workshops, talks, hackathons and competitions run by ${SITE.name}.`,
    url: absoluteUrl("/events"),
  },
};

/**
 * Public content changes when the core team publishes something, and the
 * mutating actions call revalidatePath() for exactly that. Between those
 * events this page is served from the cache instead of re-querying Postgres
 * on every visit — which is what makes navigation feel instant rather than
 * waiting on a round-trip per page.
 */
export const revalidate = 300;


/**
 * One list for everything the club runs.
 *
 * Competitions used to live on their own route with their own table; they are
 * now events with `kind = 'competition'`. A visitor looking for "what is the
 * club doing" should not have to check two pages to find out.
 */
export default async function EventsPage() {
  const events = await getEvents();
  const now = Date.now();
  const upcoming = events.filter((e) => new Date(e.starts_at).getTime() >= now);
  const past = events.filter((e) => new Date(e.starts_at).getTime() < now);

  return (
    <>
      <PageHeader
        eyebrow="Calendar"
        title="Events & competitions"
        description="Everything the club runs — beginner workshops, talks, overnight hackathons and the competitions we enter."
      />

      <Container className="flex flex-col gap-16 py-16">
        <section className="flex flex-col gap-8">
          <h2 className="headline text-2xl text-white">Upcoming</h2>
          {upcoming.length ? (
            <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {upcoming.map((e) => (
                <li key={e.id}>
                  <EventCard event={e} />
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              icon={<CalendarDays className="h-6 w-6" aria-hidden />}
              title="Nothing scheduled yet"
              description="The next workshop, hackathon or competition will be announced here first."
            />
          )}
        </section>

        {past.length > 0 && (
          <section className="flex flex-col gap-8">
            <h2 className="headline text-2xl text-white">Past</h2>
            <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {past.map((e) => (
                <li key={e.id}>
                  <EventCard event={e} />
                </li>
              ))}
            </ul>
          </section>
        )}
      </Container>
    </>
  );
}
