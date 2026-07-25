import { notFound } from "next/navigation";
import Link from "next/link";
import { Lock, Unlock, CheckCircle2, Clock, Hourglass, Target } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { getEvent, getEventSettings, can } from "@/lib/events/engine";
import {
  getParticipantMissions,
  getMissionDeps,
  getMissionCategories,
  getTeamOverview,
} from "@/lib/events/queries";
import { getEventActor } from "@/lib/events/auth";
import { missionState } from "@/lib/events/rules";
import type { MissionProgress, MissionState } from "@/lib/events/types";

export const metadata = { title: "Missions" };

const STATE_META: Record<
  MissionState,
  { label: string; icon: typeof Lock; variant: "accent" | "success" | "warning" | "small" }
> = {
  locked: { label: "Locked", icon: Lock, variant: "small" },
  available: { label: "Available", icon: Unlock, variant: "accent" },
  in_progress: { label: "In progress", icon: Clock, variant: "warning" },
  submitted: { label: "Submitted", icon: Hourglass, variant: "warning" },
  under_review: { label: "Under review", icon: Hourglass, variant: "warning" },
  completed: { label: "Completed", icon: CheckCircle2, variant: "success" },
  rejected: { label: "Rejected", icon: Lock, variant: "small" },
};

const DIFFICULTY_DOTS: Record<string, number> = {
  easy: 1,
  medium: 2,
  hard: 3,
  legendary: 4,
};

export default async function MissionsPage({
  params,
}: {
  params: Promise<{ event: string }>;
}) {
  const { event: slug } = await params;
  const event = await getEvent(slug);
  if (!event) notFound();

  const settings = await getEventSettings(event.id);
  if (!can(settings, "missions_enabled")) notFound();

  const actor = await getEventActor(event.id, event.slug);
  const base = `/events/hub/${event.slug}`;

  const [missions, deps, categories] = await Promise.all([
    getParticipantMissions(event.id),
    getMissionDeps(event.id),
    getMissionCategories(event.id),
  ]);

  // A signed-in team sees its own progress folded into each mission's state.
  const overview = actor.participantId ? await getTeamOverview(actor.participantId) : null;
  const progressByMission = new Map<string, MissionProgress>(
    (overview?.progress ?? []).map((p) => [
      p.mission_id,
      {
        id: p.mission_id,
        mission_id: p.mission_id,
        participant_id: null,
        team_id: overview?.team.id ?? null,
        state: p.state as MissionState,
        attempts: p.attempts,
        score: p.score,
        started_at: p.started_at,
        completed_at: null,
      },
    ]),
  );

  const depsByMission = new Map<string, string[]>();
  for (const d of deps) {
    depsByMission.set(d.mission_id, [...(depsByMission.get(d.mission_id) ?? []), d.depends_on_id]);
  }
  const missionById = new Map(missions.map((m) => [m.id, m]));
  const categoryById = new Map(categories.map((c) => [c.id, c]));

  return (
    <Container className="flex flex-col gap-8 py-14">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tighter text-white md:text-4xl">Missions</h1>
          <p className="mt-2 text-sm text-zinc-400">
            {overview
              ? `Progress for ${overview.team.name}. Missions unlock as you clear their prerequisites.`
              : "Sign in with your Team ID to track progress and submit work."}
          </p>
        </div>
        {!overview && (
          <Link
            href={`${base}/login`}
            className="rounded-full px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: "var(--ev-accent)" }}
          >
            Team sign in
          </Link>
        )}
      </header>

      {missions.length === 0 ? (
        <EmptyState
          icon={<Target className="h-6 w-6" />}
          title="No missions released yet"
          description="Missions appear here the moment the organisers release them."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {missions.map((m) => {
            const missionDeps = (depsByMission.get(m.id) ?? [])
              .map((id) => missionById.get(id))
              .filter((x): x is NonNullable<typeof x> => Boolean(x));
            const state = missionState(m, missionDeps, progressByMission);
            const meta = STATE_META[state];
            const StateIcon = meta.icon;
            const category = m.category_id ? categoryById.get(m.category_id) : null;
            const dots = DIFFICULTY_DOTS[m.difficulty] ?? 2;
            const isLocked = state === "locked";

            return (
              <Card
                key={m.id}
                className={`flex flex-col gap-3 p-5 transition-opacity ${isLocked ? "opacity-60" : ""}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-zinc-500">{m.code}</span>
                    {category && (
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ background: category.colour ?? "var(--ev-accent)" }}
                        title={category.name}
                      />
                    )}
                  </div>
                  <Badge variant={meta.variant}>
                    <StateIcon className="mr-1 inline h-3 w-3" />
                    {meta.label}
                  </Badge>
                </div>

                <div>
                  <h2 className="text-base font-semibold tracking-tight text-white">{m.title}</h2>
                  {m.brief && (
                    <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-zinc-400">
                      {m.brief}
                    </p>
                  )}
                </div>

                <div className="mt-auto flex items-center justify-between gap-2 pt-1">
                  <span className="flex items-center gap-1" aria-label={`Difficulty: ${m.difficulty}`}>
                    {Array.from({ length: 4 }, (_, i) => (
                      <span
                        key={i}
                        className="h-1.5 w-1.5 rounded-full"
                        style={{
                          background:
                            i < dots ? "var(--ev-accent)" : "color-mix(in oklab, white 12%, transparent)",
                        }}
                      />
                    ))}
                  </span>
                  <span className="font-mono text-sm font-semibold text-white">{m.points} pts</span>
                </div>

                {isLocked && missionDeps.length > 0 && (
                  <p className="border-t border-white/[0.06] pt-2 text-[11px] text-zinc-500">
                    Needs {missionDeps.map((d) => d.code).join(", ")}
                  </p>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </Container>
  );
}
