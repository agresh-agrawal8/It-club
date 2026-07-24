import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { safeEventRead as safe } from "./engine";
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
  safe(async () => {
    const supabase = await createClient();
    const { data } = await supabase
      .from("ev_schedule")
      .select("*")
      .eq("event_id", eventId)
      .order("starts_at", { ascending: true });
    return (data ?? []) as ScheduleItem[];
  }, []),
);

export const getMissionCategories = cache(async (eventId: string): Promise<MissionCategory[]> =>
  safe(async () => {
    const supabase = await createClient();
    const { data } = await supabase
      .from("ev_mission_categories")
      .select("*")
      .eq("event_id", eventId)
      .order("position", { ascending: true });
    return (data ?? []) as MissionCategory[];
  }, []),
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

export const getBadges = cache(async (eventId: string): Promise<Badge[]> =>
  safe(async () => {
    const supabase = await createClient();
    const { data } = await supabase
      .from("ev_badges")
      .select("*")
      .eq("event_id", eventId)
      .order("position", { ascending: true });
    return (data ?? []) as Badge[];
  }, []),
);

export const getAnnouncements = cache(async (eventId: string, limit = 10): Promise<Announcement[]> =>
  safe(async () => {
    const supabase = await createClient();
    const { data } = await supabase
      .from("ev_announcements")
      .select("*")
      .eq("event_id", eventId)
      .order("pinned", { ascending: false })
      .order("published_at", { ascending: false })
      .limit(limit);
    return (data ?? []) as Announcement[];
  }, []),
);

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
    safe(async () => {
      const supabase = await createClient();
      const { data } = await supabase
        .from("ev_leaderboard_public")
        .select("*")
        .eq("event_id", eventId)
        .eq("subject_kind", subject)
        .order("rank", { ascending: true })
        .limit(limit);
      return (data ?? []) as LeaderboardRow[];
    }, []),
);
