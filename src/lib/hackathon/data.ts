import "server-only";
import { cache } from "react";
import { unstable_cache } from "next/cache";
import { createPublicClient } from "@/lib/supabase/server";

/**
 * Infinium Hackathon — read-only data access.
 *
 * Completely separate from the club data layer. All reads use the public
 * anon client (hack_* tables are public-read); writes live in actions.ts and
 * go through the service-role client. Nothing here touches profiles/auth.
 *
 * ── Caching ────────────────────────────────────────────────────────────────
 * Every read here is public and identical for all visitors, so each one is
 * cached twice over:
 *
 *   • `cache()`          — dedupes within a single render. The landing page
 *                          used to issue ~6 separate Supabase requests, some
 *                          for the same rows (getProblems was fetched by the
 *                          page and again inside getLeaderboard).
 *   • `unstable_cache()` — shares the result across requests, so a repeat
 *                          visitor is served without touching Supabase at all.
 *
 * Writes call `revalidateHackData()` (see actions), which drops the tag below,
 * so edits still appear immediately — the cache never serves stale data after
 * an organiser change.
 */

export const HACK_TAG = "hack-data";

async function safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch {
    return fallback;
  }
}

/**
 * Wrap a public read so it is deduped per render and shared across requests.
 * `revalidate` is a backstop only — tag invalidation is the primary mechanism.
 */
function publicRead<T>(key: string, fn: () => Promise<T>, revalidate = 60) {
  return cache(unstable_cache(fn, [key], { tags: [HACK_TAG], revalidate }));
}

export interface HackEvent {
  name: string;
  tagline: string;
  edition: string;
  starts_at: string;
  ends_at: string;
  blackout_at: string;
  venue: string;
  prize_pool: string;
}

export const getHackEvent = publicRead<HackEvent>(
  "hack-event",
  async () =>
    safe(async () => {
      const supabase = createPublicClient();
      const { data } = await supabase
        .from("hack_settings")
        .select("value")
        .eq("key", "event")
        .single();
      return (data?.value as HackEvent) ?? ({} as HackEvent);
    }, {} as HackEvent),
  300,
);

export const getProblems = publicRead<any[]>(
  "hack-problems",
  async () =>
    safe(async () => {
      const supabase = createPublicClient();
      const { data } = await supabase
        .from("hack_problems")
        .select("*")
        .order("code", { ascending: true });
      return data ?? [];
    }, [] as any[]),
  120,
);

export const getSchedule = publicRead<any[]>(
  "hack-schedule",
  async () =>
    safe(async () => {
      const supabase = createPublicClient();
      const { data } = await supabase
        .from("hack_schedule")
        .select("*")
        .order("starts_at", { ascending: true });
      return data ?? [];
    }, [] as any[]),
  300,
);

export const getAnnouncements = publicRead<any[]>(
  "hack-announcements",
  async () =>
    safe(async () => {
      const supabase = createPublicClient();
      const { data } = await supabase
        .from("hack_announcements")
        .select("*")
        .order("pinned", { ascending: false })
        .order("created_at", { ascending: false });
      return data ?? [];
    }, [] as any[]),
  30,
);

export const getAchievements = publicRead<any[]>(
  "hack-achievements",
  async () =>
    safe(async () => {
      const supabase = createPublicClient();
      const { data } = await supabase
        .from("hack_achievements")
        .select("*")
        .order("position", { ascending: true });
      return data ?? [];
    }, [] as any[]),
  300,
);

/** Per-participant, so deliberately NOT shared across requests. */
export const getUnlockedAchievementIds = cache(async (participantId: string | null) => {
  if (!participantId) return [] as string[];
  return safe(async () => {
    const supabase = createPublicClient();
    const { data } = await supabase
      .from("hack_participant_achievements")
      .select("achievement_id")
      .eq("participant_id", participantId);
    return (data ?? []).map((r: { achievement_id: string }) => r.achievement_id);
  }, [] as string[]);
});

export const getParticipants = publicRead<any[]>(
  "hack-participants",
  async () =>
    safe(async () => {
      const supabase = createPublicClient();
      const { data } = await supabase
        .from("hack_participants")
        .select("*")
        .order("role", { ascending: true })
        .order("name", { ascending: true });
      return data ?? [];
    }, [] as any[]),
  30,
);

export const getTeams = publicRead<any[]>(
  "hack-teams",
  async () =>
    safe(async () => {
      const supabase = createPublicClient();
      const { data } = await supabase
        .from("hack_teams")
        .select("*")
        .order("created_at", { ascending: true });
      return data ?? [];
    }, [] as any[]),
  30,
);

export const getTeamMembers = publicRead<any[]>(
  "hack-team-members",
  async () =>
    safe(async () => {
      const supabase = createPublicClient();
      const { data } = await supabase.from("hack_team_members").select("*");
      return data ?? [];
    }, [] as any[]),
  60,
);

export const getSubmissions = publicRead<any[]>(
  "hack-submissions",
  async () =>
    safe(async () => {
      const supabase = createPublicClient();
      const { data } = await supabase.from("hack_submissions").select("*");
      return data ?? [];
    }, [] as any[]),
  30,
);

export const getScores = publicRead<any[]>(
  "hack-scores",
  async () =>
    safe(async () => {
      const supabase = createPublicClient();
      const { data } = await supabase.from("hack_scores").select("*");
      return data ?? [];
    }, [] as any[]),
  30,
);

export interface LeaderRow {
  team_id: string;
  name: string;
  tagline: string | null;
  status: string;
  avg: number;
  judges: number;
  problem_code: string | null;
}

/** Live leaderboard: teams ranked by average judge total. */
export async function getLeaderboard(): Promise<LeaderRow[]> {
  const [teams, scores, problems] = await Promise.all([getTeams(), getScores(), getProblems()]);
  const byTeam = new Map<string, number[]>();
  for (const s of scores) {
    const arr = byTeam.get(s.team_id) ?? [];
    arr.push(Number(s.total));
    byTeam.set(s.team_id, arr);
  }
  const problemCode = new Map(problems.map((p: any) => [p.id, p.code]));
  return teams
    .map((t: any) => {
      const arr = byTeam.get(t.id) ?? [];
      const avg = arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
      return {
        team_id: t.id,
        name: t.name,
        tagline: t.tagline,
        status: t.status,
        avg: Math.round(avg * 10) / 10,
        judges: arr.length,
        problem_code: problemCode.get(t.problem_id) ?? null,
      };
    })
    .sort((a, b) => b.avg - a.avg);
}

export interface HackStats {
  teams: number;
  participants: number;
  submissions: number;
  judges: number;
}

export async function getHackStats(): Promise<HackStats> {
  const [teams, participants, submissions] = await Promise.all([
    getTeams(),
    getParticipants(),
    getSubmissions(),
  ]);
  return {
    teams: teams.length,
    participants: participants.length,
    submissions: submissions.filter((s: any) => s.status === "submitted").length,
    judges: participants.filter((p: any) => p.role === "judge").length,
  };
}
