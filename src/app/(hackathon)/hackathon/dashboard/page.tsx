import type { Metadata } from "next";
import Link from "next/link";
import {
  Users,
  Github,
  Trophy,
  Award,
  Megaphone,
  Gavel,
  Rocket,
  ShieldCheck,
  Lock,
  Unlock,
  Star,
  Crown,
  BarChart3,
} from "lucide-react";
import { Container } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { ProgressBar } from "@/components/ui/progress";
import { RoleSwitcher } from "@/components/hackathon/role-switcher";
import { SubmissionEditor } from "@/components/hackathon/submission-editor";
import { JudgeScorer } from "@/components/hackathon/judge-scorer";
import { AnnouncementPoster } from "@/components/hackathon/announcement-poster";
import { getHackIdentity, getMyTeam } from "@/lib/hackathon/identity";
import {
  getParticipants,
  getAnnouncements,
  getAchievements,
  getUnlockedAchievementIds,
  getTeams,
  getScores,
  getProblems,
  getLeaderboard,
  getHackStats,
} from "@/lib/hackathon/data";
import { toggleProblemReleaseAction, setTeamStatusAction } from "@/lib/hackathon/actions";
import { timeAgo } from "@/lib/utils";

export const metadata: Metadata = { title: "Dashboard" };

const statusVariant: Record<string, "success" | "accent" | "warning" | "danger" | "small"> = {
  submitted: "success",
  active: "accent",
  forming: "warning",
  disqualified: "danger",
};

export default async function HackDashboard() {
  const [identity, participants, announcements] = await Promise.all([
    getHackIdentity(),
    getParticipants(),
    getAnnouncements(),
  ]);

  const role = identity?.role ?? "student";

  return (
    <Container className="flex flex-col gap-8 py-10">
      {/* Header + role switcher */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Avatar name={identity?.name ?? "Guest"} src={identity?.avatar_url} size="lg" />
          <div>
            <p className="text-xs uppercase tracking-wide text-accent-400">{role} dashboard</p>
            <h1 className="text-2xl font-semibold tracking-tighter text-white md:text-3xl">
              {identity?.name ?? "Welcome"}
            </h1>
          </div>
        </div>
        <RoleSwitcher people={participants} currentId={identity?.id ?? null} />
      </div>

      {role === "student" && <StudentView identity={identity} />}
      {role === "judge" && <JudgeView identity={identity} />}
      {(role === "organizer" || role === "admin") && <OrganizerView />}

      {/* Announcements — shown to everyone */}
      <section className="flex flex-col gap-4">
        <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-zinc-400">
          <Megaphone className="h-4 w-4" /> Announcements
        </h2>
        <div className="grid gap-3 md:grid-cols-2">
          {announcements.map((a: any) => (
            <Card key={a.id} className="flex flex-col gap-1.5 p-5">
              <div className="flex items-center gap-2">
                {a.pinned && <Badge variant="accent">Pinned</Badge>}
                <span className="text-sm font-semibold text-white">{a.title}</span>
              </div>
              {a.body && <p className="text-sm text-zinc-400">{a.body}</p>}
              <span className="mt-1 text-[11px] text-zinc-600">{timeAgo(a.created_at)}</span>
            </Card>
          ))}
          {announcements.length === 0 && (
            <p className="text-sm text-zinc-500">No announcements yet.</p>
          )}
        </div>
      </section>
    </Container>
  );
}

/* ─────────────────────────── STUDENT ─────────────────────────── */

async function StudentView({ identity }: { identity: any }) {
  const [team, achievements, unlocked, leaderboard] = await Promise.all([
    getMyTeam(identity?.id ?? null),
    getAchievements(),
    getUnlockedAchievementIds(identity?.id ?? null),
    getLeaderboard(),
  ]);

  const rank = team ? leaderboard.findIndex((r) => r.team_id === team.team.id) : -1;

  return (
    <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
      {/* Team card + submission */}
      <div className="flex flex-col gap-5">
        {team ? (
          <Card deep className="flex flex-col gap-5 p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-semibold tracking-tight text-white">{team.team.name}</h2>
                  <Badge variant={statusVariant[team.team.status] ?? "small"}>{team.team.status}</Badge>
                </div>
                {team.team.tagline && <p className="mt-1 text-sm text-zinc-400">{team.team.tagline}</p>}
              </div>
              {rank >= 0 && leaderboard[rank].judges > 0 && (
                <div className="text-right">
                  <div className="flex items-center gap-1 text-amber-300">
                    <Crown className="h-4 w-4" />
                    <span className="text-lg font-semibold">#{rank + 1}</span>
                  </div>
                  <span className="text-[11px] text-zinc-500">{leaderboard[rank].avg}/40 avg</span>
                </div>
              )}
            </div>

            {/* Progress */}
            <div>
              <div className="mb-1.5 flex items-center justify-between text-xs text-zinc-400">
                <span>Build progress</span>
                <span className="tabular-nums">{team.team.progress}%</span>
              </div>
              <ProgressBar value={team.team.progress} />
            </div>

            {/* Members */}
            <div>
              <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                Team ({team.members.length}/5)
              </span>
              <div className="mt-2 flex flex-wrap gap-2">
                {team.members.map((m: any) => (
                  <span key={m.id} className="glass flex items-center gap-2 rounded-full py-1 pl-1 pr-3">
                    <Avatar name={m.name} src={m.avatar_url} size="sm" />
                    <span className="text-xs text-white">{m.name}</span>
                    {m.is_captain && <ShieldCheck className="h-3.5 w-3.5 text-amber-300" />}
                  </span>
                ))}
              </div>
            </div>

            {/* Submission portal */}
            <div className="border-t border-white/[0.07] pt-5">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
                  <Rocket className="h-4 w-4 text-brand-300" /> Submission
                </h3>
                <Badge variant={team.submission?.status === "submitted" ? "success" : "warning"}>
                  {team.submission?.status === "submitted" ? "Submitted" : "Draft"}
                </Badge>
              </div>
              <SubmissionEditor
                teamId={team.team.id}
                submission={team.submission}
                canEdit={team.isCaptain}
              />
            </div>
          </Card>
        ) : (
          <Card className="flex flex-col items-center gap-3 py-16 text-center">
            <Users className="h-6 w-6 text-zinc-700" />
            <h2 className="text-lg font-semibold text-white">No team yet</h2>
            <p className="max-w-sm text-sm text-zinc-500">
              This participant isn&apos;t on a team. Switch to a team member (e.g. Aarav Sharma) to
              see the full team dashboard, or create teams from the organizer view.
            </p>
          </Card>
        )}
      </div>

      {/* Achievement passport */}
      <Card className="flex flex-col gap-4 p-6">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-white">
            <Award className="h-4 w-4 text-brand-300" /> Achievement passport
          </h2>
          <span className="flex items-center gap-1 text-xs text-amber-300">
            <Star className="h-3.5 w-3.5" /> {identity?.points ?? 0} pts
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {achievements.map((a: any) => {
            const has = unlocked.includes(a.id);
            return (
              <div
                key={a.id}
                className={`flex flex-col gap-1.5 rounded-2xl border p-3.5 transition-colors ${
                  has
                    ? "border-accent-400/30 bg-accent-500/10"
                    : "border-white/[0.07] bg-zinc-950/40 opacity-70"
                }`}
              >
                <span className={has ? "text-accent-400" : "text-zinc-600"}>
                  {has ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                </span>
                <span className="text-xs font-semibold text-white">{a.title}</span>
                <span className="text-[10px] leading-tight text-zinc-500">{a.description}</span>
                <span className="text-[10px] text-amber-300/80">+{a.points} pts</span>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

/* ─────────────────────────── JUDGE ─────────────────────────── */

async function JudgeView({ identity }: { identity: any }) {
  const [teams, problems, scores] = await Promise.all([getTeams(), getProblems(), getScores()]);
  const problemCode = new Map(problems.map((p: any) => [p.id, p.code]));
  const myScores = new Map(
    scores.filter((s: any) => s.judge_id === identity?.id).map((s: any) => [s.team_id, s]),
  );

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Gavel className="h-4 w-4 text-brand-300" />
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">
          Score the teams
        </h2>
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        {teams.map((t: any) => {
          const existing = myScores.get(t.id);
          return (
            <Card key={t.id} className="flex flex-col gap-4 p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-semibold text-white">{t.name}</h3>
                    <Badge variant={statusVariant[t.status] ?? "small"}>{t.status}</Badge>
                  </div>
                  <span className="font-mono text-xs text-accent-400">
                    {problemCode.get(t.problem_id) ?? "—"}
                  </span>
                </div>
                {t.github_url && (
                  <a href={t.github_url} target="_blank" rel="noreferrer" className="text-zinc-400 hover:text-white">
                    <Github className="h-4 w-4" />
                  </a>
                )}
              </div>
              {existing && (
                <span className="w-fit rounded-full bg-accent-500/15 px-2.5 py-1 text-[11px] text-accent-300">
                  Your score: {existing.total}/40
                </span>
              )}
              <JudgeScorer teamId={t.id} judgeId={identity?.id} existing={existing} />
            </Card>
          );
        })}
      </div>
    </section>
  );
}

/* ─────────────────────── ORGANIZER / ADMIN ─────────────────────── */

async function OrganizerView() {
  const [teams, problems, stats, leaderboard, scores] = await Promise.all([
    getTeams(),
    getProblems(),
    getHackStats(),
    getLeaderboard(),
    getScores(),
  ]);

  const tiles = [
    { icon: Users, label: "Participants", value: stats.participants },
    { icon: Rocket, label: "Teams", value: stats.teams },
    { icon: Trophy, label: "Submissions", value: stats.submissions },
    { icon: Gavel, label: "Scores in", value: scores.length },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Analytics */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {tiles.map(({ icon: Icon, label, value }) => (
          <Card key={label} className="p-5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500/15 text-brand-300">
              <Icon className="h-4 w-4" />
            </span>
            <div className="mt-3 text-3xl font-semibold tracking-tighter text-white">{value}</div>
            <div className="mt-1 text-[11px] uppercase tracking-wide text-zinc-500">{label}</div>
          </Card>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.3fr_1fr]">
        {/* Team management */}
        <Card className="flex flex-col gap-4 p-6">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-white">
            <ShieldCheck className="h-4 w-4 text-brand-300" /> Teams
          </h2>
          <div className="flex flex-col gap-2">
            {teams.map((t: any) => (
              <div
                key={t.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/[0.07] bg-zinc-950/50 p-4"
              >
                <div>
                  <div className="text-sm font-medium text-white">{t.name}</div>
                  <div className="text-[11px] text-zinc-500">Progress {t.progress}%</div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={statusVariant[t.status] ?? "small"}>{t.status}</Badge>
                  <form action={setTeamStatusAction} className="flex items-center gap-1">
                    <input type="hidden" name="id" value={t.id} />
                    {t.status !== "disqualified" ? (
                      <>
                        <input type="hidden" name="status" value="disqualified" />
                        <button className="rounded-lg border border-white/10 px-2.5 py-1 text-[11px] text-zinc-300 transition-colors hover:border-red-400/40 hover:text-red-300">
                          Disqualify
                        </button>
                      </>
                    ) : (
                      <>
                        <input type="hidden" name="status" value="active" />
                        <button className="rounded-lg border border-white/10 px-2.5 py-1 text-[11px] text-zinc-300 transition-colors hover:border-accent-400/40 hover:text-accent-300">
                          Reinstate
                        </button>
                      </>
                    )}
                  </form>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Announcement poster + problem release */}
        <div className="flex flex-col gap-5">
          <Card className="flex flex-col gap-4 p-6">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-white">
              <Megaphone className="h-4 w-4 text-brand-300" /> Post announcement
            </h2>
            <AnnouncementPoster />
          </Card>

          <Card className="flex flex-col gap-3 p-6">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-white">
              <BarChart3 className="h-4 w-4 text-brand-300" /> Problem releases
            </h2>
            <div className="flex flex-col gap-2">
              {problems.map((p: any) => (
                <form
                  key={p.id}
                  action={toggleProblemReleaseAction}
                  className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.07] bg-zinc-950/50 px-3.5 py-2.5"
                >
                  <input type="hidden" name="id" value={p.id} />
                  <input type="hidden" name="released" value={String(p.released)} />
                  <span className="flex items-center gap-2 text-sm text-white">
                    <span className="font-mono text-xs text-accent-400">{p.code}</span>
                    {p.title}
                  </span>
                  <button
                    className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] transition-colors ${
                      p.released
                        ? "border-accent-400/30 text-accent-300 hover:border-amber-400/40 hover:text-amber-300"
                        : "border-white/10 text-zinc-400 hover:border-accent-400/40 hover:text-accent-300"
                    }`}
                  >
                    {p.released ? <Unlock className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
                    {p.released ? "Live" : "Release"}
                  </button>
                </form>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
