import Image from "next/image";
import { Award } from "lucide-react";
import type { Achievement } from "@/types/database";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

export function AchievementCard({ achievement }: { achievement: Achievement }) {
  return (
    <Card hoverLift className="flex h-full gap-4 p-6" glass>
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-brand-500/15">
        {achievement.image_url ? (
          <Image src={achievement.image_url} alt={achievement.title} fill className="object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-amber-300">
            <Award className="h-7 w-7" />
          </div>
        )}
      </div>
      <div className="flex flex-col gap-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-base font-semibold tracking-tight text-white">{achievement.title}</h3>
          {achievement.category && <Badge variant="accent">{achievement.category}</Badge>}
        </div>
        {achievement.description && (
          <p className="line-clamp-3 text-sm text-zinc-400">{achievement.description}</p>
        )}
        {achievement.awarded_on && (
          <span className="text-xs text-zinc-500">{formatDate(achievement.awarded_on)}</span>
        )}
      </div>
    </Card>
  );
}
