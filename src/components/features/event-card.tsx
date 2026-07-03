import Link from "next/link";
import Image from "next/image";
import { CalendarDays, MapPin, Clock } from "lucide-react";
import type { EventRow } from "@/types/database";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatTime } from "@/lib/utils";

const statusVariant = {
  upcoming: "accent",
  ongoing: "success",
  past: "small",
  cancelled: "danger",
} as const;

export function EventCard({ event }: { event: EventRow }) {
  return (
    <Link href={`/events/${event.slug}`} className="group block">
      <Card hoverLift className="flex h-full flex-col gap-4 overflow-hidden p-0">
        <div className="relative aspect-[16/9] w-full overflow-hidden bg-zinc-950">
          {event.banner_url ? (
            <Image
              src={event.banner_url}
              alt={event.title}
              fill
              sizes="(max-width:768px) 100vw, 33vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="glow-violet flex h-full w-full items-center justify-center">
              <CalendarDays className="h-10 w-10 text-white/10" />
            </div>
          )}
          <div className="absolute left-3 top-3">
            <Badge variant={statusVariant[event.status]}>{event.status}</Badge>
          </div>
        </div>
        <div className="flex flex-1 flex-col gap-3 p-6 pt-0">
          <h3 className="text-lg font-semibold tracking-tight text-white">{event.title}</h3>
          {event.description && (
            <p className="line-clamp-2 text-sm text-zinc-400">{event.description}</p>
          )}
          <div className="mt-auto flex flex-col gap-1.5 pt-2 text-xs text-zinc-400">
            <span className="flex items-center gap-2">
              <CalendarDays className="h-3.5 w-3.5 text-brand-300" /> {formatDate(event.starts_at)}
              <Clock className="ml-1 h-3.5 w-3.5 text-brand-300" /> {formatTime(event.starts_at)}
            </span>
            {event.venue && (
              <span className="flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5 text-brand-300" /> {event.venue}
              </span>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );
}
