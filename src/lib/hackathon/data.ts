import "server-only";
import { createClient } from "@/lib/supabase/server";

/**
 * Infinium Hackathon — read-only data access.
 *
 * Completely separate from the club data layer. All reads use the public
 * anon client (hack_* tables are public-read); writes live in actions.ts and
 * go through the service-role client. Nothing here touches profiles/auth.
 */

async function safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch {
    return fallback;
  }
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

export async function getHackEvent(): Promise<HackEvent> {
  return safe(async () => {
    const supabase = await createClient();
    const { data } = await supabase.from("hack_settings").select("value").eq("key", "event").single();
    return (data?.value as HackEvent) ?? ({} as HackEvent);
  }, {} as HackEvent);
}

export async function getProblems() {
  return safe(async () => {
    const supabase = await createClient();
    const { data } = await supabase
      .from("hack_problems")
      .select("*")
      .order("code", { ascending: true });
    return data ?? [];
  }, [] as any[]);
}

export async function getSchedule() {
  return safe(async () => {
    const supabase = await createClient();
    const { data } = await supabase
      .from("hack_schedule")
      .select("*")
      .order("starts_at", { ascending: true });
    return data ?? [];
  }, [] as any[]);
}

export async function getAnnouncements() {
  return safe(async () => {
    const supabase = await createClient();
    const { data } = await supabase
      .from("hack_announcements")
      .select("*")
      .order("pinned", { ascending: false })
      .order("created_at", { ascending: false });
    return data ?? [];
  }, [] as any[]);
}

export async function getAchievements() {
  return safe(async () => {
    const supabase = await createClient();
    const { data } = await supabase
      .from("hack_achievements")
      .select("*")
      .order("position", { ascending: true });
    return data ?? [];
  }, [] as any[]);
}

export async function getUnlockedAchievementIds(participantId: string | null) {
  if (!participantId) return [] as string[];
  return safe(async () => {
    const supabase = await createClient();
    const { data } = await supabase
      .from("hack_participant_achievements")
      .select("achievement_id")
      .eq("participant_id", participantId);
    return (data ?? []).map((r: { achievement_id: string }) => r.achievement_id);
  }, [] as string[]);
}

export async function getParticipants() {
  return safe(async () => {
    const supabase = await createClient();
    const { data } = await supabase
      .from("hack_participants")
      .select("*")
      .order("role", { ascending: true })
      .order("name", { ascending: true });
    return data ?? [];
  }, [] as any[]);
}

export async function getTeams() {
  return safe(async () => {
    const supabase = await createClient();
    const { data } = await supabase
      .from("hack_teams")
      .select("*")
      .order("created_at", { ascending: true });
    return data ?? [];
  }, [] as any[]);
}

export async function getTeamMembers() {
  return safe(async () => {
    const supabase = await createClient();
    const { data } = await supabase.from("hack_team_members").select("*");
    return data ?? [];
  }, [] as any[]);
}

export async function getSubmissions() {
  return safe(async () => {
    const supabase = await createClient();
    const { data } = await supabase.from("hack_submissions").select("*");
    return data ?? [];
  }, [] as any[]);
}

export async function getScores() {
  return safe(async () => {
    const supabase = await createClient();
    const { data } = await supabase.from("hack_scores").select("*");
    return data ?? [];
  }, [] as any[]);
}

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
