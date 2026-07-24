import { notFound } from "next/navigation";
import { Trophy, Lock } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { getEvent, getEventSettings, resolveTheme } from "@/lib/events/engine";
import { getLeaderboard } from "@/lib/events/queries";
import { leaderboardVisible } from "@/lib/events/rules";
import { readEventSession } from "@/lib/events/session";

export const metadata = { title: "Leaderboard" };

export default async function LeaderboardPage({
  params,
}: {
  params: Promise<{ event: string }>;
}) {
  const { event: slug } = await params;
  const event = await getEvent(slug);
  if (!event) notFound();

  const settings = await getEventSettings(event.id);
  const participantId = await readEventSession(event.slug).catch(() => null);
  const viewer = participantId ? "participant" : "guest";

  // Visibility is an event setting, enforced here and by RLS on the view.
  if (!leaderboardVisible(settings, viewer)) {
    return (
      <Container className="py-14">
        <EmptyState
          icon={<Lock className="h-6 w-6" />}
          title="Leaderboard is not public"
          description="The organisers have restricted the standings for this event."
        />
      </Container>
    );
  }

  const rows = await getLeaderboard(event.id, settings.leaderboard_subject);
  const theme = resolveTheme(event);
  const max = rows[0]?.points ?? 0;

  return (
    <Container className="flex flex-col gap-8 py-14">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tighter text-white md:text-4xl">
            Leaderboard
          </h1>
          <p className="mt-2 text-sm text-zinc-400">
            {settings.leaderboard_subject === "team" ? "Team" : "Individual"} standings, updated as
            points are awarded.
          </p>
        </div>
        <Trophy className="h-8 w-8" style={{ color: theme.accent }} />
      </header>

      {rows.length === 0 ? (
        <EmptyState
          title="No standings yet"
          description="Rankings appear here once the first points are awarded."
        />
      ) : (
        <Card className="divide-y divide-white/[0.06] overflow-hidden p-0">
          {rows.map((row) => (
            <div
              key={`${row.subject_kind}-${row.subject_id}`}
              className="relative flex items-center gap-4 px-5 py-4"
            >
              {/* Score bar, drawn behind the row */}
              <div
                className="pointer-events-none absolute inset-y-0 left-0 opacity-[0.07]"
                style={{
                  background: theme.accent,
                  width: max > 0 ? `${(row.points / max) * 100}%` : "0%",
                }}
                aria-hidden
              />

              <span
                className="relative w-8 shrink-0 font-mono text-sm tabular-nums"
                style={{ color: row.rank <= 3 ? theme.accent : undefined }}
              >
                {String(row.rank).padStart(2, "0")}
              </span>

              <div className="relative min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-white">{row.display_name}</div>
                <div className="font-mono text-[11px] text-zinc-500">
                  {row.missions_done} mission{row.missions_done === 1 ? "" : "s"} cleared
                </div>
              </div>

              <span className="relative font-mono text-base font-semibold tabular-nums text-white">
                {row.points.toLocaleString()}
              </span>
            </div>
          ))}
        </Card>
      )}
    </Container>
  );
}
