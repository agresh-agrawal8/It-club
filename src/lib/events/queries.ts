import "server-only";
import { cache } from "react";
import { unstable_cache } from "next/cache";
import {
  createAdminClient,
  createClient,
  createPublicClient,
  hasServiceRole,
} from "@/lib/supabase/server";
import { safeEventRead as safe, EVENT_TAG } from "./engine";

/**
 * Shared cache wrapper for PUBLIC event reads, keyed per event.
 * Participant- and staff-scoped reads below deliberately do not use it.
 */
function publicRead<T>(key: string, eventId: string, fn: () => Promise<T>, revalidate = 60) {
  return unstable_cache(fn, [key, eventId], { tags: [EVENT_TAG], revalidate })();
}
import type {
  Announcement,
  Badge,
  LeaderboardRow,
  Mission,
  MissionCategory,
  ScheduleItem,
} from "./types";

/**
 * Every read in the event domain goes through this file.
 *
 * One place to audit what leaves the database, one place to add caching. All
 * reads are RLS-aware: these run as the caller, so a participant physically
 * cannot select another team's submission even if a query forgets a filter.
 */

export const getSchedule = cache(async (eventId: string): Promise<ScheduleItem[]> =>
  publicRead("ev-schedule", eventId, async () =>
    safe(async () => {
      const supabase = createPublicClient();
      const { data } = await supabase
        .from("ev_schedule")
        .select("*")
        .eq("event_id", eventId)
        .order("starts_at", { ascending: true });
      return (data ?? []) as ScheduleItem[];
    }, [] as ScheduleItem[]),
    300,
  ),
);

export const getMissionCategories = cache(async (eventId: string): Promise<MissionCategory[]> =>
  publicRead("ev-categories", eventId, async () =>
    safe(async () => {
      const supabase = createPublicClient();
      const { data } = await supabase
        .from("ev_mission_categories")
        .select("*")
        .eq("event_id", eventId)
        .order("position", { ascending: true });
      return (data ?? []) as MissionCategory[];
    }, [] as MissionCategory[]),
    300,
  ),
);

/**
 * Missions the caller is allowed to see. RLS hides unreleased content from
 * participants entirely, so this returns fewer rows for a student than for a
 * judge — by design, not by filtering here.
 */
export const getMissions = cache(async (eventId: string): Promise<Mission[]> =>
  safe(async () => {
    const supabase = await createClient();
    const { data } = await supabase
      .from("ev_missions")
      .select("*")
      .eq("event_id", eventId)
      .order("position", { ascending: true });
    return (data ?? []) as Mission[];
  }, []),
);

/**
 * Missions visible to a cookie-authenticated participant.
 *
 * Mirrors exactly what the `ev_missions participant read` RLS policy grants —
 * released missions only — but readable by a session that RLS cannot see.
 * Call only after requireEventParticipant(). Unreleased content still never
 * reaches a participant, because the same filter is applied here.
 */
export async function getParticipantMissions(eventId: string): Promise<Mission[]> {
  if (!hasServiceRole()) return getMissions(eventId);
  return safe(async () => {
    const supabase = createAdminClient();
    const nowIso = new Date().toISOString();
    const { data } = await supabase
      .from("ev_missions")
      .select("*")
      .eq("event_id", eventId)
      .eq("status", "open")
      .or(`unlock_at.is.null,unlock_at.lte.${nowIso}`)
      .order("position", { ascending: true });
    return (data ?? []) as Mission[];
  }, []);
}

/**
 * Mission dependency edges for an event (mission_id → depends_on_id).
 *
 * ev_mission_deps has TWO foreign keys into ev_missions (mission_id and
 * depends_on_id), so an unqualified `ev_missions!inner(...)` embed is ambiguous
 * and PostgREST rejects it — the constraint name has to name which FK to join
 * through, or the query silently yields nothing and every mission looks
 * unlocked.
 */
export async function getMissionDeps(
  eventId: string,
): Promise<{ mission_id: string; depends_on_id: string }[]> {
  return safe(async () => {
    const supabase = hasServiceRole() ? createAdminClient() : await createClient();
    const { data, error } = await supabase
      .from("ev_mission_deps")
      .select("mission_id, depends_on_id, ev_missions!ev_mission_deps_mission_id_fkey!inner(event_id)")
      .eq("ev_missions.event_id", eventId);
    if (error) throw error;
    return (data ?? []).map((d: { mission_id: string; depends_on_id: string }) => ({
      mission_id: d.mission_id,
      depends_on_id: d.depends_on_id,
    }));
  }, []);
}

export const getBadges = cache(async (eventId: string): Promise<Badge[]> =>
  publicRead("ev-badges", eventId, async () =>
    safe(async () => {
      const supabase = createPublicClient();
      const { data } = await supabase
        .from("ev_badges")
        .select("*")
        .eq("event_id", eventId)
        .order("position", { ascending: true });
      return (data ?? []) as Badge[];
    }, [] as Badge[]),
    300,
  ),
);

export const getAnnouncements = cache(
  async (eventId: string, limit = 10): Promise<Announcement[]> =>
    publicRead(`ev-announcements-${limit}`, eventId, async () =>
      safe(async () => {
        const supabase = createPublicClient();
        const { data } = await supabase
          .from("ev_announcements")
          .select("*")
          .eq("event_id", eventId)
          .order("pinned", { ascending: false })
          .order("published_at", { ascending: false })
          .limit(limit);
        return (data ?? []) as Announcement[];
      }, [] as Announcement[]),
      30,
    ),
);

export interface TeamOverview {
  team: {
    id: string;
    name: string;
    tagline: string | null;
    status: string;
    points: number;
    progress: number;
  };
  members: {
    id: string;
    name: string;
    role: string;
    role_label: string | null;
    is_leader: boolean;
    points: number;
  }[];
  progress: {
    mission_id: string;
    state: string;
    score: number;
    attempts: number;
    started_at: string | null;
  }[];
}

/**
 * Full team record for the participant dashboard.
 *
 * Call ONLY after the session cookie has been verified (requireEventParticipant).
 * Cookie sessions are invisible to RLS — ev_current_participant() reads a JWT
 * claim — so this reads through the service client, which is why authorisation
 * must already have happened upstream.
 */
export async function getTeamOverview(participantId: string): Promise<TeamOverview | null> {
  if (!hasServiceRole()) return null;
  return safe(async () => {
    const supabase = createAdminClient();
    const { data: participant } = await supabase
      .from("ev_participants")
      .select("team_id")
      .eq("id", participantId)
      .maybeSingle();
    if (!participant?.team_id) return null;

    const { data } = await supabase.rpc("ev_team_overview", { p_team_id: participant.team_id });
    return (data as TeamOverview) ?? null;
  }, null);
}

/**
 * Leaderboard.
 *
 * Reads the `ev_leaderboard_public` view rather than the materialised view
 * itself: RLS does not apply to matviews, so the matview is never granted to
 * anon and the view is what enforces "public events only".
 */
export const getLeaderboard = cache(
  async (
    eventId: string,
    subject: "team" | "participant" = "team",
    limit = 50,
  ): Promise<LeaderboardRow[]> =>
    // Short window: standings are the thing people refresh for.
    publicRead(`ev-leaderboard-${subject}-${limit}`, eventId, async () =>
      safe(async () => {
        const supabase = createPublicClient();
        const { data } = await supabase
          .from("ev_leaderboard_public")
          .select("*")
          .eq("event_id", eventId)
          .eq("subject_kind", subject)
          .order("rank", { ascending: true })
          .limit(limit);
        return (data ?? []) as LeaderboardRow[];
      }, [] as LeaderboardRow[]),
      15,
    ),
);
