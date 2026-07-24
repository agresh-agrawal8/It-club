import "server-only";
import { cookies } from "next/headers";
import { createHash, randomBytes } from "crypto";
import { createAdminClient, createClient } from "@/lib/supabase/server";

/**
 * Infinium team authentication.
 *
 * Teams sign in with the Team ID + password issued when the core team
 * approves their registration. This is deliberately separate from club auth:
 * a team is not a club member account.
 */

export const TEAM_COOKIE = "infinium_team";

/** Salted SHA-256 — stored as "salt:hash". */
export function hashPassword(password: string, salt?: string) {
  const s = salt ?? randomBytes(12).toString("hex");
  const h = createHash("sha256").update(`${s}:${password}`).digest("hex");
  return `${s}:${h}`;
}

export function verifyPassword(password: string, stored: string | null) {
  if (!stored || !stored.includes(":")) return false;
  const [salt] = stored.split(":");
  return hashPassword(password, salt) === stored;
}

/** Readable, unambiguous password for handing to students. */
export function generatePassword() {
  const words = ["forge", "build", "spark", "pixel", "logic", "cipher", "vector", "quantum"];
  const w = words[Math.floor(Math.random() * words.length)];
  const n = Math.floor(1000 + Math.random() * 9000);
  return `${w}${n}`;
}

export interface TeamSession {
  id: string;
  name: string;
  team_code: string;
  team_no: number | null;
  status: string;
  reg_status: string;
  problem_id: string | null;
  progress: number;
  github_url: string | null;
  demo_url: string | null;
  tagline: string | null;
  school: string | null;
}

/** The team currently signed in on this browser, if any. */
export async function getTeamSession(): Promise<TeamSession | null> {
  try {
    const store = await cookies();
    const id = store.get(TEAM_COOKIE)?.value;
    if (!id) return null;
    const supabase = await createClient();
    const { data } = await supabase
      .from("hack_teams")
      .select("id,name,team_code,team_no,status,reg_status,problem_id,progress,github_url,demo_url,tagline,school")
      .eq("id", id)
      .single();
    if (!data || data.reg_status !== "approved") return null;
    return data as TeamSession;
  } catch {
    return null;
  }
}

/** Full team record for the dashboard: members, problem, submission, cards. */
export async function getTeamDashboardData(teamId: string) {
  const supabase = createAdminClient();
  const [members, problem, submission, cards, scores, allCards] = await Promise.all([
    supabase
      .from("hack_participants")
      .select("id,name,class_section,member_role,is_quiz_rep")
      .eq("team_id", teamId)
      .order("member_role"),
    supabase.from("hack_teams").select("problem_id").eq("id", teamId).single(),
    supabase.from("hack_submissions").select("*").eq("team_id", teamId).maybeSingle(),
    supabase.from("hack_team_cards").select("achievement_id").eq("team_id", teamId),
    supabase.from("hack_scores").select("*").eq("team_id", teamId),
    supabase.from("hack_achievements").select("*").order("position"),
  ]);

  let problemRow = null;
  const pid = problem.data?.problem_id;
  if (pid) {
    const { data } = await supabase.from("hack_problems").select("*").eq("id", pid).single();
    problemRow = data;
  }

  return {
    members: members.data ?? [],
    problem: problemRow,
    submission: submission.data ?? null,
    awardedCardIds: (cards.data ?? []).map((c: { achievement_id: string }) => c.achievement_id),
    scores: scores.data ?? [],
    allCards: allCards.data ?? [],
  };
}
