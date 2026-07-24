import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Crown,
  Users,
  FileText,
  Rocket,
  Award,
  Lock,
  Unlock,
  LogOut,
  Megaphone,
  Trophy,
  ShieldCheck,
} from "lucide-react";
import { Container } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ui/progress";
import { getTeamSession, getTeamDashboardData } from "@/lib/hackathon/team-auth";
import { teamLogoutAction } from "@/lib/hackathon/team-actions";
import { getAnnouncements, getLeaderboard } from "@/lib/hackathon/data";
import { TeamSubmissionForm } from "@/components/hackathon/team-submission-form";
import { timeAgo } from "@/lib/utils";

export const metadata: Metadata = { title: "Team dashboard" };

const ROLE_LABEL: Record<string, string> = {
  captain: "Team Captain",
  frontend: "Frontend Developer",
  backend: "Backend Developer",
  uiux: "UI / UX Designer",
  docs: "Docs & Presentation Lead",
};

const RARITY_STYLE: Record<string, string> = {
  Common: "border-brand-400/30 bg-brand-500/10 text-brand-200",
  Rare: "border-sky-400/30 bg-sky-500/10 text-sky-200",
  Epic: "border-fuchsia-400/30 bg-fuchsia-500/10 text-fuchsia-200",
  Legendary: "border-amber-400/30 bg-amber-500/10 text-amber-200",
};

export default async function TeamDashboard() {
  const team = await getTeamSession();
  if (!team) redirect("/hackathon/login");

  const [data, announcements, leaderboard] = await Promise.all([
    getTeamDashboardData(team.id),
    getAnnouncements(),
    getLeaderboard(),
  ]);

  const rank = leaderboard.findIndex((r) => r.team_id === team.id);
  const myScore = leaderboard[rank];
  const cardPoints = data.allCards
    .filter((c: any) => data.awardedCardIds.includes(c.id))
    .reduce((sum: number, c: any) => sum + (c.points ?? 0), 0);

  return (
    <Container className="flex flex-col gap-6 py-10 md:gap-8">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="font-mono text-sm text-accent-400">{team.team_code}</span>
            <Badge variant={team.status === "submitted" ? "success" : "accent"}>{team.status}</Badge>
          </div>
          <h1 className="mt-1.5 text-3xl font-semibold tracking-tighter text-white md:text-4xl">
            {team.name}
          </h1>
          {team.tagline && <p className="mt-1 text-sm text-zinc-400">{team.tagline}</p>}
        </div>
        <div className="flex items-center gap-3">
          {rank >= 0 && myScore && myScore.judges > 0 && (
            <div className="glass flex items-center gap-2.5 rounded-full px-4 py-2">
              <Crown className="h-4 w-4 text-amber-300" />
              <div className="text-right">
                <div className="text-sm font-semibold text-white">#{rank + 1}</div>
                <div className="text-[10px] text-zinc-500">{myScore.avg} pts</div>
              </div>
            </div>
          )}
          <form action={teamLogoutAction}>
            <button className="flex items-center gap-1.5 rounded-full border border-white/10 px-3.5 py-2 text-xs text-zinc-400 transition-colors hover:border-red-400/40 hover:text-red-300">
              <LogOut className="h-3.5 w-3.5" /> Sign out
            </button>
          </form>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        <div className="flex flex-col gap-5">
          {/* Problem envelope */}
          <Card deep className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-white">
                <FileText className="h-4 w-4 text-brand-300" /> Your problem envelope
              </h2>
              {data.problem && (
                <span className="font-mono text-xs text-accent-400">{data.problem.code}</span>
              )}
            </div>
            {data.problem ? (
              data.problem.released ? (
                <div className="flex flex-col gap-3">
                  <div>
                    <h3 className="text-xl font-semibold tracking-tight text-white">
                      {data.problem.title}
                    </h3>
                    <span className="text-xs text-brand-300">{data.problem.track}</span>
                  </div>
                  <p className="text-sm leading-relaxed text-zinc-300">{data.problem.summary}</p>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-500">
                    {data.problem.description}
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-start gap-2 rounded-2xl border border-dashed border-white/10 bg-zinc-950/40 p-6">
                  <span className="flex items-center gap-2 text-sm text-amber-300">
                    <Lock className="h-4 w-4" /> Sealed until orientation
                  </span>
                  <p className="text-xs text-zinc-500">
                    Your envelope has been assigned. It unlocks at the orientation session, one day
                    before the hackathon.
                  </p>
                </div>
              )
            ) : (
              <p className="py-6 text-sm text-zinc-500">
                No envelope assigned yet — the core team will assign your unique problem before
                orientation.
              </p>
            )}
          </Card>

          {/* Submission portal */}
          <Card className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-white">
                <Rocket className="h-4 w-4 text-brand-300" /> Submission portal
              </h2>
              <Badge variant={data.submission?.status === "submitted" ? "success" : "warning"}>
                {data.submission?.status === "submitted" ? "Submitted" : "Draft"}
              </Badge>
            </div>
            <TeamSubmissionForm teamId={team.id} submission={data.submission} />
          </Card>
        </div>

        <div className="flex flex-col gap-5">
          {/* Team roster */}
          <Card className="p-6">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
              <Users className="h-4 w-4 text-brand-300" /> Your team ({data.members.length}/5)
            </h2>
            <ul className="flex flex-col gap-2">
              {data.members.map((m: any) => (
                <li
                  key={m.id}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-white/[0.07] bg-zinc-950/50 px-3.5 py-2.5"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate text-sm font-medium text-white">{m.name}</span>
                      {m.member_role === "captain" && <Crown className="h-3.5 w-3.5 text-amber-300" />}
                    </div>
                    <div className="text-[11px] text-zinc-500">
                      {ROLE_LABEL[m.member_role] ?? "Member"} · {m.class_section}
                    </div>
                  </div>
                  {m.is_quiz_rep && <Badge variant="accent">Quiz rep</Badge>}
                </li>
              ))}
            </ul>

            {/* Progress */}
            <div className="mt-5">
              <div className="mb-1.5 flex items-center justify-between text-xs text-zinc-400">
                <span>Build progress</span>
                <span className="tabular-nums">{team.progress}%</span>
              </div>
              <ProgressBar value={team.progress} />
            </div>
          </Card>

          {/* Achievement passport */}
          <Card className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-white">
                <Award className="h-4 w-4 text-brand-300" /> Passport
              </h2>
              <span className="text-xs text-amber-300">{cardPoints} pts</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {data.allCards.map((c: any) => {
                const has = data.awardedCardIds.includes(c.id);
                return (
                  <div
                    key={c.id}
                    className={`rounded-xl border p-2.5 transition-colors ${
                      has ? RARITY_STYLE[c.rarity] ?? "" : "border-white/[0.07] bg-zinc-950/40 opacity-50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] uppercase tracking-wide">{c.rarity}</span>
                      {has ? <Unlock className="h-3 w-3" /> : <Lock className="h-3 w-3 text-zinc-600" />}
                    </div>
                    <div className="mt-1 text-[11px] font-semibold leading-tight text-white">
                      {c.title}
                    </div>
                    <div className="text-[9px] text-zinc-500">+{c.points}</div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Announcements */}
          <Card className="p-6">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
              <Megaphone className="h-4 w-4 text-brand-300" /> Announcements
            </h2>
            {announcements.length === 0 ? (
              <p className="text-sm text-zinc-500">Nothing yet.</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {announcements.slice(0, 4).map((a: any) => (
                  <li key={a.id}>
                    <div className="flex items-center gap-2">
                      {a.pinned && <Badge variant="accent">Pinned</Badge>}
                      <span className="text-sm font-medium text-white">{a.title}</span>
                    </div>
                    {a.body && <p className="mt-0.5 text-xs text-zinc-400">{a.body}</p>}
                    <span className="text-[10px] text-zinc-600">{timeAgo(a.created_at)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Link
            href="/hackathon/leaderboard"
            className="glass glass-hover flex items-center justify-between rounded-2xl p-4"
          >
            <span className="flex items-center gap-2.5 text-sm text-white">
              <Trophy className="h-4 w-4 text-amber-300" /> Live leaderboard
            </span>
            <ShieldCheck className="h-4 w-4 text-zinc-600" />
          </Link>
        </div>
      </div>
    </Container>
  );
}
