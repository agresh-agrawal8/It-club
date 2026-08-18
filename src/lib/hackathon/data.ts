import "server-only";
import { cache } from "react";
import { unstable_cache } from "next/cache";
import { createAdminClient, hasServiceRole } from "@/lib/supabase/server";

/**
 * Infinium — read-only data access.
 *
 * ── Why every read is service-role ─────────────────────────────────────────
 * The hack_* tables carry no anon or authenticated grant any more (migration
 * 0020). Nothing in a browser can reach them: team rosters, envelope
 * assignments and unpublished results are only ever assembled here, on the
 * server, and shipped as rendered HTML. That is what stops one team from
 * reading another's data now that the portal has no password.
 *
 * ── Why that is still fast ─────────────────────────────────────────────────
 * These reads are wrapped twice:
 *
 *   • `cache()`          — dedupes within a single render.
 *   • `unstable_cache()` — shares the result across requests, so repeat
 *                          visitors are served without touching Supabase.
 *
 * Writes call `revalidateHack()` (actions.ts), which drops the tag below, so
 * organiser edits appear immediately and the cache is never stale after one.
 *
 * The fixed event content — schedule, envelopes, achievement cards, rules —
 * is NOT here. It lives in `content.ts` as constants, so the public pages
 * render statically with no database access at all.
 */

export const HACK_TAG = "hack-data";

async function safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  if (!hasServiceRole()) return fallback;
  try {
    return await fn();
  } catch {
    return fallback;
  }
}

function publicRead<T>(key: string, fn: () => Promise<T>, revalidate = 60) {
  return cache(unstable_cache(fn, [key], { tags: [HACK_TAG], revalidate }));
}

/* ─────────────────────────── Types ─────────────────────────── */

export interface Team {
  id: string;
  name: string;
  team_code: string | null;
  team_no: number | null;
  tagline: string | null;
  school: string | null;
  status: string;
  envelope_no: number | null;
  created_at: string;
}

export interface Member {
  id: string;
  name: string;
  class_section: string | null;
  member_role: string;
  is_quiz_rep: boolean;
  team_id: string;
}

export interface Result {
  team_id: string;
  final_score: number | null;
  remarks: string | null;
  sheet_path: string | null;
  published: boolean;
  updated_at: string;
}

export interface Announcement {
  id: string;
  title: string;
  body: string | null;
  pinned: boolean;
  created_at: string;
}

const TEAM_COLUMNS = "id,name,team_code,team_no,tagline,school,status,envelope_no,created_at";
const MEMBER_COLUMNS = "id,name,class_section,member_role,is_quiz_rep,team_id";

/* ─────────────────────────── Reads ─────────────────────────── */

export const getTeams = publicRead<Team[]>(
  "hack-teams",
  async () =>
    safe(async () => {
      const { data } = await createAdminClient()
        .from("hack_teams")
        .select(TEAM_COLUMNS)
        .order("team_no", { ascending: true });
      return (data ?? []) as Team[];
    }, []),
  30,
);

export const getMembers = publicRead<Member[]>(
  "hack-members",
  async () =>
    safe(async () => {
      const { data } = await createAdminClient()
        .from("hack_participants")
        .select(MEMBER_COLUMNS)
        .order("member_role", { ascending: true });
      return (data ?? []) as Member[];
    }, []),
  30,
);

export const getAnnouncements = publicRead<Announcement[]>(
  "hack-announcements",
  async () =>
    safe(async () => {
      const { data } = await createAdminClient()
        .from("hack_announcements")
        .select("id,title,body,pinned,created_at")
        .order("pinned", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(20);
      return (data ?? []) as Announcement[];
    }, []),
  30,
);

export const getResults = publicRead<Result[]>(
  "hack-results",
  async () =>
    safe(async () => {
      const { data } = await createAdminClient()
        .from("hack_results")
        .select("team_id,final_score,remarks,sheet_path,published,updated_at");
      return (data ?? []) as Result[];
    }, []),
  30,
);

/**
 * How many of the 20 places are taken.
 *
 * A `head: true` count never transfers rows, so the registration page can show
 * remaining capacity without pulling the roster.
 */
export const getTeamCount = publicRead<number>(
  "hack-team-count",
  async () =>
    safe(async () => {
      const { count } = await createAdminClient()
        .from("hack_teams")
        .select("id", { count: "exact", head: true });
      return count ?? 0;
    }, 0),
  30,
);

/* ─────────────────────────── Standings ─────────────────────────── */

export interface StandingRow {
  team_id: string;
  name: string;
  team_code: string | null;
  school: string | null;
  score: number;
  rank: number;
}

/**
 * Final standings, built from the scores the core team types in after judging.
 *
 * Only published results appear — an unpublished row is a draft the organisers
 * are still entering and must not leak before the closing ceremony.
 */
export async function getStandings(): Promise<StandingRow[]> {
  const [teams, results] = await Promise.all([getTeams(), getResults()]);
  const byTeam = new Map(results.filter((r) => r.published).map((r) => [r.team_id, r]));

  const rows = teams
    .filter((t) => byTeam.has(t.id) && t.status !== "disqualified")
    .map((t) => ({
      team_id: t.id,
      name: t.name,
      team_code: t.team_code,
      school: t.school,
      score: Number(byTeam.get(t.id)!.final_score ?? 0),
    }))
    .sort((a, b) => b.score - a.score);

  // Standard competition ranking: equal scores share a rank, and the next
  // rank skips accordingly (1, 2, 2, 4).
  let lastScore = Number.NaN;
  let lastRank = 0;
  return rows.map((r, i) => {
    const rank = r.score === lastScore ? lastRank : i + 1;
    lastScore = r.score;
    lastRank = rank;
    return { ...r, rank };
  });
}

/* ─────────────────────────── Portal ─────────────────────────── */

export interface TeamPortalData {
  team: Team;
  members: Member[];
  result: Result | null;
  /** Short-lived signed URL for the scanned sheet, or null. */
  sheetUrl: string | null;
}

/** How long a scanned-sheet link stays valid. */
const SHEET_URL_TTL_S = 60 * 10;

/**
 * Everything one team's portal shows.
 *
 * Deliberately not wrapped in `unstable_cache`: the signed sheet URL expires,
 * so caching it across requests would hand out dead links. The three queries
 * are keyed and cheap.
 */
export const getTeamPortal = cache(async (teamId: string): Promise<TeamPortalData | null> => {
  if (!hasServiceRole()) return null;
  const supabase = createAdminClient();

  const [teamRes, membersRes, resultRes] = await Promise.all([
    supabase.from("hack_teams").select(TEAM_COLUMNS).eq("id", teamId).maybeSingle(),
    supabase
      .from("hack_participants")
      .select(MEMBER_COLUMNS)
      .eq("team_id", teamId)
      .order("member_role", { ascending: true }),
    supabase
      .from("hack_results")
      .select("team_id,final_score,remarks,sheet_path,published,updated_at")
      .eq("team_id", teamId)
      .maybeSingle(),
  ]);

  const team = teamRes.data as Team | null;
  if (!team) return null;

  const result = (resultRes.data as Result | null) ?? null;

  // The bucket is private, so the scan is handed over as a signed URL that
  // expires. A public URL would be guessable and permanent.
  let sheetUrl: string | null = null;
  if (result?.published && result.sheet_path) {
    const { data } = await supabase.storage
      .from("hack-sheets")
      .createSignedUrl(result.sheet_path, SHEET_URL_TTL_S);
    sheetUrl = data?.signedUrl ?? null;
  }

  return {
    team,
    members: (membersRes.data ?? []) as Member[],
    result,
    sheetUrl,
  };
});

/**
 * Resolve a team by its exact name (case- and space-insensitive).
 *
 * This is how the portal is opened now that there is no password. `lower(name)`
 * is uniquely indexed, so a match can only ever be one team — two teams cannot
 * collide onto the same portal.
 */
export async function findTeamByName(name: string): Promise<Team | null> {
  const trimmed = name.trim().replace(/\s+/g, " ");
  if (trimmed.length < 2 || !hasServiceRole()) return null;

  const { data } = await createAdminClient()
    .from("hack_teams")
    .select(TEAM_COLUMNS)
    .ilike("name", trimmed)
    .maybeSingle();

  return (data as Team | null) ?? null;
}

/* ─────────────────────────── Admin overview ─────────────────────────── */

export interface AdminStats {
  teams: number;
  members: number;
  envelopesAssigned: number;
  resultsEntered: number;
  resultsPublished: number;
}

export async function getAdminStats(): Promise<AdminStats> {
  const [teams, members, results] = await Promise.all([getTeams(), getMembers(), getResults()]);
  return {
    teams: teams.length,
    members: members.length,
    envelopesAssigned: teams.filter((t) => t.envelope_no != null).length,
    resultsEntered: results.filter((r) => r.final_score != null).length,
    resultsPublished: results.filter((r) => r.published).length,
  };
}
