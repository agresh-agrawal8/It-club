import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Crown,
  Users,
  Trophy,
  Megaphone,
  LogOut,
  Target,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { Container } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ui/progress";
import { getEvent, getEventSettings, can } from "@/lib/events/engine";
import {
  getTeamOverview,
  getParticipantMissions,
  getMissionDeps,
  getAnnouncements,
  getLeaderboard,
} from "@/lib/events/queries";
import { requireEventParticipant } from "@/lib/events/auth";
import { missionState } from "@/lib/events/rules";
import type { MissionProgress, MissionState } from "@/lib/events/types";
import { eventLogoutAction } from "@/lib/events/actions/registration";
import { EventMark } from "@/components/events/shell/event-mark";
import { timeAgo } from "@/lib/utils";

export const metadata = { title: "Dashboard" };

const SEV_VARIANT: Record<string, "accent" | "success" | "warning" | "danger" | "small"> = {
  info: "small",
  success: "success",
  warning: "warning",
  critical: "danger",
};

export default async function EventDashboardPage({
  params,
}: {
  params: Promise<{ event: string }>;
}) {
  const { event: slug } = await params;
  const event = await getEvent(slug);
  if (!event) notFound();

  // Redirects to the event login when there is no verified session.
  const actor = await requireEventParticipant(event.id, event.slug);
  const settings = await getEventSettings(event.id);
  const base = `/events/hub/${event.slug}`;

  const [overview, missions, deps, announcements, leaderboard] = await Promise.all([
    actor.participantId ? getTeamOverview(actor.participantId) : Promise.resolve(null),
    getParticipantMissions(event.id),
    getMissionDeps(event.id),
    getAnnouncements(event.id, 5),
    getLeaderboard(event.id, settings.leaderboard_subject),
  ]);

  // A club admin without a team row still reaches this page; send them to the
  // organiser console rather than showing an empty participant dashboard.
  if (!overview) {
    return (
      <Container className="flex min-h-[60vh] flex-col items-center justify-center gap-4 py-14 text-center">
        <span className="grid h-14 w-14 place-items-center rounded-full bg-white/[0.06] text-zinc-300">
          <ShieldCheck className="h-6 w-6" />
        </span>
        <h1 className="text-2xl font-semibold tracking-tight text-white">No team on this account</h1>
        <p className="max-w-sm text-sm text-zinc-400">
          You&apos;re signed in with organiser access, which has no participant team. Register a team
          or open the organiser console.
        </p>
        <div className="mt-2 flex flex-wrap justify-center gap-3">
          <Link
            href={`${base}/register`}
            className="rounded-full px-5 py-2.5 text-sm font-semibold text-white"
            style={{ background: "var(--ev-accent)" }}
          >
            Register a team
          </Link>
          <Link
            href={`${base}/admin`}
            className="rounded-full border border-white/15 px-5 py-2.5 text-sm text-white transition-colors hover:bg-white/[0.06]"
          >
            Organiser console
          </Link>
        </div>
      </Container>
    );
  }

  const completed = overview.progress.filter((p) => p.state === "completed").length;
  const rank = leaderboard.findIndex((r) => r.subject_id === overview.team.id);

  // Resolve each mission's true state through the same rule the missions page
  // and the server use — a mission with unmet prerequisites must read "locked",
  // not "available".
  const progressByMission = new Map<string, MissionProgress>(
    overview.progress.map((p) => [
      p.mission_id,
      {
        id: p.mission_id,
        mission_id: p.mission_id,
        participant_id: null,
        team_id: overview.team.id,
        state: p.state as MissionState,
        attempts: p.attempts,
        score: p.score,
        started_at: p.started_at,
        completed_at: null,
      },
    ]),
  );
  const missionById = new Map(missions.map((m) => [m.id, m]));
  const depsByMission = new Map<string, string[]>();
  for (const d of deps) {
    depsByMission.set(d.mission_id, [...(depsByMission.get(d.mission_id) ?? []), d.depends_on_id]);
  }
  const stateOf = (missionId: string) => {
    const m = missionById.get(missionId);
    if (!m) return "locked" as MissionState;
    const missionDeps = (depsByMission.get(missionId) ?? [])
      .map((id) => missionById.get(id))
      .filter((x): x is NonNullable<typeof x> => Boolean(x));
    return missionState(m, missionDeps, progressByMission);
  };

  return (
    <Container className="flex flex-col gap-6 py-10 md:gap-8">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <EventMark title={event.name} className="h-12 w-12 rounded-xl" />
          <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="font-mono text-sm" style={{ color: "var(--ev-accent)" }}>
              {event.name}
            </span>
            <Badge variant={overview.team.status === "active" ? "accent" : "small"}>
              {overview.team.status}
            </Badge>
          </div>
          <h1 className="mt-1.5 text-3xl font-semibold tracking-tighter text-white md:text-4xl">
            {overview.team.name}
          </h1>
          {overview.team.tagline && (
            <p className="mt-1 text-sm text-zinc-400">{overview.team.tagline}</p>
          )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {rank >= 0 && (
            <div className="glass flex items-center gap-2.5 rounded-full px-4 py-2">
              <Crown className="h-4 w-4 text-amber-300" />
              <div className="text-right">
                <div className="text-sm font-semibold text-white">#{rank + 1}</div>
                <div className="text-[10px] text-zinc-500">{overview.team.points} pts</div>
              </div>
            </div>
          )}
          <form action={eventLogoutAction}>
            <input type="hidden" name="event_slug" value={slug} />
            <button className="flex items-center gap-1.5 rounded-full border border-white/10 px-3.5 py-2 text-xs text-zinc-400 transition-colors hover:border-red-400/40 hover:text-red-300">
              <LogOut className="h-3.5 w-3.5" /> Sign out
            </button>
          </form>
        </div>
      </div>

      {/* Stat strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Points", value: overview.team.points },
          { label: "Missions cleared", value: `${completed}/${missions.length}` },
          { label: "Team size", value: overview.members.length },
          { label: "Rank", value: rank >= 0 ? `#${rank + 1}` : "—" },
        ].map(({ label, value }) => (
          <Card key={label} className="flex flex-col gap-1 p-4">
            <span className="font-mono text-2xl font-semibold text-white">{value}</span>
            <span className="text-[11px] uppercase tracking-wide text-zinc-500">{label}</span>
          </Card>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        <div className="flex flex-col gap-5">
          {/* Missions */}
          {can(settings, "missions_enabled") && (
            <Card className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-sm font-semibold text-white">
                  <Target className="h-4 w-4" style={{ color: "var(--ev-accent)" }} /> Your missions
                </h2>
                <Link
                  href={`${base}/missions`}
                  className="flex items-center gap-1 text-xs text-zinc-400 transition-colors hover:text-white"
                >
                  All missions <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
              {missions.length === 0 ? (
                <p className="py-6 text-sm text-zinc-500">
                  No missions released yet. They appear here the moment the organisers open them.
                </p>
              ) : (
                <ul className="flex flex-col divide-y divide-white/[0.06]">
                  {missions.slice(0, 6).map((m) => {
                    const state = stateOf(m.id);
                    return (
                      <li key={m.id} className="flex items-center gap-3 py-3">
                        <span className="font-mono text-xs text-zinc-500">{m.code}</span>
                        <span
                          className={`min-w-0 flex-1 truncate text-sm ${
                            state === "locked" ? "text-zinc-500" : "text-white"
                          }`}
                        >
                          {m.title}
                        </span>
                        <Badge
                          variant={
                            state === "completed"
                              ? "success"
                              : state === "available"
                                ? "accent"
                                : "small"
                          }
                        >
                          {state.replace("_", " ")}
                        </Badge>
                        <span className="font-mono text-xs text-zinc-400">{m.points}</span>
                      </li>
                    );
                  })}
                </ul>
              )}

              <div className="mt-5">
                <div className="mb-1.5 flex items-center justify-between text-xs text-zinc-400">
                  <span>Overall progress</span>
                  <span className="font-mono">
                    {missions.length ? Math.round((completed / missions.length) * 100) : 0}%
                  </span>
                </div>
                <ProgressBar
                  value={missions.length ? Math.round((completed / missions.length) * 100) : 0}
                />
              </div>
            </Card>
          )}
        </div>

        <div className="flex flex-col gap-5">
          {/* Roster */}
          <Card className="p-6">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
              <Users className="h-4 w-4" style={{ color: "var(--ev-accent)" }} /> Your team (
              {overview.members.length})
            </h2>
            <ul className="flex flex-col gap-2">
              {overview.members.map((m) => (
                <li
                  key={m.id}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-white/[0.07] bg-zinc-950/50 px-3.5 py-2.5"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate text-sm font-medium text-white">{m.name}</span>
                      {m.is_leader && <Crown className="h-3.5 w-3.5 text-amber-300" />}
                    </div>
                    {m.role_label && (
                      <div className="text-[11px] text-zinc-500">{m.role_label}</div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </Card>

          {/* Announcements */}
          <Card className="p-6">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
              <Megaphone className="h-4 w-4" style={{ color: "var(--ev-accent)" }} /> Announcements
            </h2>
            {announcements.length === 0 ? (
              <p className="text-sm text-zinc-500">Nothing yet.</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {announcements.map((a) => (
                  <li key={a.id}>
                    <div className="flex flex-wrap items-center gap-2">
                      {a.pinned && <Badge variant="accent">Pinned</Badge>}
                      <Badge variant={SEV_VARIANT[a.severity]}>{a.severity}</Badge>
                      <span className="text-sm font-medium text-white">{a.title}</span>
                    </div>
                    {a.body && <p className="mt-0.5 text-xs text-zinc-400">{a.body}</p>}
                    <span className="text-[10px] text-zinc-600">{timeAgo(a.published_at)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Link
            href={`${base}/leaderboard`}
            className="glass glass-hover flex items-center justify-between rounded-2xl p-4"
          >
            <span className="flex items-center gap-2.5 text-sm text-white">
              <Trophy className="h-4 w-4 text-amber-300" /> Live leaderboard
            </span>
            <ArrowRight className="h-4 w-4 text-zinc-500" />
          </Link>
        </div>
      </div>
    </Container>
  );
}
