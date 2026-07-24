import "server-only";
import { cookies } from "next/headers";
import { createHash, createHmac, randomBytes, timingSafeEqual } from "crypto";
import { createClient } from "@/lib/supabase/server";

/**
 * Infinium team authentication.
 *
 * Teams sign in with the Team ID + password issued when the core team
 * approves their registration. This is deliberately separate from club auth:
 * a team is not a club member account.
 */

export const TEAM_COOKIE = "infinium_team";

/** Sessions expire after a week; re-login is cheap during a 2-day event. */
const SESSION_MAX_AGE_S = 60 * 60 * 24 * 7;

/**
 * Secret used to sign session cookies. `EVENT_SESSION_SECRET` is preferred;
 * we fall back to the service-role key so existing deployments keep working
 * without new configuration. Both are server-only and never sent to a client.
 */
function sessionSecret() {
  const secret =
    process.env.EVENT_SESSION_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (!secret) {
    throw new Error(
      "Session signing secret missing: set EVENT_SESSION_SECRET (or SUPABASE_SERVICE_ROLE_KEY).",
    );
  }
  return secret;
}

function sign(payload: string) {
  return createHmac("sha256", sessionSecret()).update(payload).digest("base64url");
}

/**
 * Mint a tamper-proof session value: `<teamId>.<issuedAt>.<hmac>`.
 *
 * The team id alone is NOT a credential — `hack_teams` is world-readable, so
 * anyone can list team ids. Signing binds the cookie to a server secret so it
 * cannot be forged by simply crafting a request with someone else's id.
 */
export function createTeamSessionToken(teamId: string) {
  const payload = `${teamId}.${Date.now()}`;
  return `${payload}.${sign(payload)}`;
}

/** Verify a session cookie and return the team id, or null if invalid/expired. */
export function readTeamSessionToken(token: string | undefined): string | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null; // legacy bare-uuid cookies are rejected
  const [teamId, issuedAt, signature] = parts;

  const expected = Buffer.from(sign(`${teamId}.${issuedAt}`));
  const given = Buffer.from(signature);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;

  const age = (Date.now() - Number(issuedAt)) / 1000;
  if (!Number.isFinite(age) || age < 0 || age > SESSION_MAX_AGE_S) return null;

  return teamId;
}

export const TEAM_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  path: "/hackathon",
  maxAge: SESSION_MAX_AGE_S,
} as const;

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
    const id = readTeamSessionToken(store.get(TEAM_COOKIE)?.value);
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

/**
 * The signed-in team, or an error result. Every team-owned write must call
 * this and use the returned id — never a team id taken from the request body.
 */
export async function requireTeamSession(): Promise<
  { team: TeamSession } | { error: string }
> {
  const team = await getTeamSession();
  if (!team) return { error: "Your session has expired. Please sign in again." };
  return { team };
}

/** Full team record for the dashboard: members, problem, submission, cards. */
export async function getTeamDashboardData(teamId: string) {
  // All hack_* tables are public-read, so the anon client is enough here.
  // Keeping the service-role key off this path means the dashboard still
  // renders if that key is ever missing from the deployment.
  const supabase = await createClient();
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
