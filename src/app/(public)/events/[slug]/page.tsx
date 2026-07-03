import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, Clock, MapPin, ExternalLink } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { formatDate, formatTime } from "@/lib/utils";
import type { EventRow } from "@/types/database";

async function getEvent(slug: string): Promise<EventRow | null> {
  try {
    const supabase = await createClient();
    const { data } = await supabase.from("events").select("*").eq("slug", slug).single();
    return (data as EventRow) ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const event = await getEvent(slug);
  return event ? { title: event.title, description: event.description ?? undefined } : { title: "Event" };
}

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const event = await getEvent(slug);
  if (!event) notFound();

  return (
    <article className="pb-24">
      <div className="relative h-[40vh] min-h-[300px] w-full overflow-hidden bg-zinc-950">
        {event.banner_url ? (
          <Image src={event.banner_url} alt={event.title} fill priority className="object-cover" />
        ) : (
          <div className="glow-violet h-full w-full" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-surface-0 via-surface-0/40 to-transparent" />
      </div>

      <Container className="-mt-24 flex flex-col gap-10">
        <Link href="/events" className="flex w-fit items-center gap-2 text-sm text-zinc-400 hover:text-white">
          <ArrowLeft className="h-4 w-4" /> Back to events
        </Link>
        <Badge variant="accent" className="w-fit">{event.status}</Badge>
        <h1 className="max-w-4xl text-4xl font-semibold tracking-tighter text-white md:text-6xl">
          {event.title}
        </h1>

        <div className="grid gap-12 lg:grid-cols-[2fr_1fr]">
          <div className="flex flex-col gap-10">
            {event.description && (
              <p className="whitespace-pre-wrap text-base leading-relaxed text-zinc-300">
                {event.description}
              </p>
            )}
            {event.schedule?.length > 0 && (
              <section className="flex flex-col gap-4">
                <h2 className="text-lg font-semibold tracking-tight text-white">Schedule</h2>
                <ol className="flex flex-col gap-3">
                  {event.schedule.map((item, i) => (
                    <li key={i} className="flex gap-4 rounded-2xl border border-white/10 bg-zinc-900 p-4">
                      <span className="text-sm font-medium text-brand-300">{item.time}</span>
                      <div>
                        <div className="text-sm font-medium text-white">{item.title}</div>
                        {item.speaker && <div className="text-xs text-zinc-500">{item.speaker}</div>}
                      </div>
                    </li>
                  ))}
                </ol>
              </section>
            )}
          </div>

          <aside className="flex h-fit flex-col gap-4 rounded-3xl border border-white/10 bg-zinc-900 p-6">
            <div className="flex items-center gap-3 text-sm text-zinc-300">
              <CalendarDays className="h-4 w-4 text-brand-300" /> {formatDate(event.starts_at)}
            </div>
            <div className="flex items-center gap-3 text-sm text-zinc-300">
              <Clock className="h-4 w-4 text-brand-300" /> {formatTime(event.starts_at)}
              {event.ends_at && ` – ${formatTime(event.ends_at)}`}
            </div>
            {event.venue && (
              <div className="flex items-center gap-3 text-sm text-zinc-300">
                <MapPin className="h-4 w-4 text-brand-300" /> {event.venue}
              </div>
            )}
            {event.registration_url && (
              <ButtonLink href={event.registration_url} target="_blank" className="mt-2 w-full">
                Register <ExternalLink className="h-4 w-4" />
              </ButtonLink>
            )}
          </aside>
        </div>
      </Container>
    </article>
  );
}
