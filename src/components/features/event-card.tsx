import Link from "next/link";
import Image from "next/image";
import { CalendarDays, MapPin, Clock, Trophy } from "lucide-react";
import type { EventRow, EventKind } from "@/types/database";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatTime } from "@/lib/utils";

const STATUS_VARIANT = {
  upcoming: "accent",
  ongoing: "success",
  past: "small",
  cancelled: "danger",
} as const;

/**
 * Competitions are events, so they share this card. The kind is a label on
 * the entry rather than a separate card, a separate page and a separate table.
 */
const KIND_LABEL: Record<EventKind, string> = {
  workshop: "Workshop",
  competition: "Competition",
  hackathon: "Hackathon",
  talk: "Talk",
  other: "Event",
};

export function EventCard({ event }: { event: EventRow }) {
  const isCompetition = event.kind === "competition";

  return (
    <Link href={`/events/${event.slug}`} className="group block h-full">
      <article className="glass glass-hover hairline-gradient flex h-full flex-col overflow-hidden rounded-3xl">
        <div className="relative aspect-[16/9] w-full overflow-hidden bg-black/40">
          {event.banner_url ? (
            <Image
              src={event.banner_url}
              alt=""
              aria-hidden
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
              loading="lazy"
              className="object-cover transition-transform duration-[var(--duration-slow)] ease-[var(--ease-out-soft)] group-hover:scale-[1.04]"
            />
          ) : (
            <div className="glow-club flex h-full w-full items-center justify-center">
              {isCompetition ? (
                <Trophy className="h-10 w-10 text-white/10" aria-hidden />
              ) : (
                <CalendarDays className="h-10 w-10 text-white/10" aria-hidden />
              )}
            </div>
          )}
          <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
            <Badge variant={STATUS_VARIANT[event.status]}>{event.status}</Badge>
            {event.kind !== "workshop" && (
              <Badge variant="small">{KIND_LABEL[event.kind]}</Badge>
            )}
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-3 p-6">
          <h3 className="text-lg font-semibold tracking-tight text-white">{event.title}</h3>

          {event.description && (
            <p className="line-clamp-2 text-sm leading-relaxed text-ink-3">{event.description}</p>
          )}

          {event.organizer && (
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-4">
              By {event.organizer}
            </p>
          )}

          <div className="mt-auto flex flex-col gap-2 pt-3 text-xs text-ink-3">
            <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5 text-brand-300" aria-hidden />
                <time dateTime={event.starts_at}>{formatDate(event.starts_at)}</time>
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-brand-300" aria-hidden />
                {formatTime(event.starts_at)}
              </span>
            </span>
            {event.venue && (
              <span className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-brand-300" aria-hidden />
                {event.venue}
              </span>
            )}
            {event.result && (
              <span className="flex items-center gap-1.5 text-emerald-300">
                <Trophy className="h-3.5 w-3.5" aria-hidden />
                {event.result}
              </span>
            )}
          </div>
        </div>
      </article>
    </Link>
  );
}
