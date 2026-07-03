import Image from "next/image";
import { Trophy, MapPin, CalendarDays } from "lucide-react";
import type { Competition } from "@/types/database";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

const statusVariant = {
  upcoming: "accent",
  ongoing: "success",
  past: "small",
  cancelled: "danger",
} as const;

export function CompetitionCard({ competition }: { competition: Competition }) {
  return (
    <Card hoverLift className="flex h-full flex-col gap-4 overflow-hidden p-0">
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-zinc-950">
        {competition.banner_url ? (
          <Image
            src={competition.banner_url}
            alt={competition.title}
            fill
            sizes="(max-width:768px) 100vw, 33vw"
            className="object-cover"
          />
        ) : (
          <div className="glow-violet flex h-full w-full items-center justify-center">
            <Trophy className="h-10 w-10 text-white/10" />
          </div>
        )}
        <div className="absolute left-3 top-3">
          <Badge variant={statusVariant[competition.status]}>{competition.status}</Badge>
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-6 pt-0">
        <h3 className="text-lg font-semibold tracking-tight text-white">{competition.title}</h3>
        {competition.organizer && (
          <p className="text-xs uppercase tracking-wide text-brand-300">{competition.organizer}</p>
        )}
        {competition.description && (
          <p className="line-clamp-2 text-sm text-zinc-400">{competition.description}</p>
        )}
        {competition.result && (
          <div className="flex items-center gap-2 rounded-xl border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
            <Trophy className="h-3.5 w-3.5" /> {competition.result}
          </div>
        )}
        <div className="mt-auto flex flex-col gap-1.5 pt-2 text-xs text-zinc-400">
          {competition.starts_at && (
            <span className="flex items-center gap-2">
              <CalendarDays className="h-3.5 w-3.5 text-brand-300" /> {formatDate(competition.starts_at)}
            </span>
          )}
          {competition.location && (
            <span className="flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5 text-brand-300" /> {competition.location}
            </span>
          )}
        </div>
      </div>
    </Card>
  );
}
