import "server-only";
import { createClient, createPublicClient } from "@/lib/supabase/server";
import type {
  Achievement,
  EventRow,
  GalleryItem,
  Notification,
  Profile,
  TaskRow,
} from "@/types/database";

/**
 * Server-side data access. Every function is defensive: if Supabase is not
 * configured (or a query errors) it returns a safe empty value, so pages render
 * their empty states instead of crashing.
 *
 * Two clients, deliberately:
 *
 *   createPublicClient()  cookie-free, anon key. Used for everything a logged
 *                         -out visitor can see. Because it never reads cookies,
 *                         the pages calling it stay statically renderable and
 *                         are served from the ISR cache instead of hitting
 *                         Postgres on every request. RLS still applies — anon
 *                         only ever sees what its policies and column grants
 *                         allow.
 *
 *   createClient()        cookie-bound. Only for per-user data, where the
 *                         answer depends on who is asking.
 */

async function safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch {
    return fallback;
  }
}

export async function getEvents(): Promise<EventRow[]> {
  return safe(async () => {
    const supabase = createPublicClient();
    const { data } = await supabase
      .from("events")
      .select("*")
      .order("starts_at", { ascending: false });
    return (data as EventRow[]) ?? [];
  }, []);
}

export async function getUpcomingEvents(limit = 3): Promise<EventRow[]> {
  return safe(async () => {
    const supabase = createPublicClient();
    const { data } = await supabase
      .from("events")
      .select("*")
      .gte("starts_at", new Date().toISOString())
      .order("starts_at", { ascending: true })
      .limit(limit);
    return (data as EventRow[]) ?? [];
  }, []);
}

/**
 * The public team list.
 *
 * Columns are named explicitly rather than `select("*")`: a bare star on
 * `profiles` would ship `must_change_password` and `phone` to an anonymous
 * visitor the moment either column is added to the table.
 */
export type PublicProfile = Pick<
  Profile,
  | "id"
  | "full_name"
  | "role"
  | "avatar_url"
  | "headline"
  | "bio"
  | "grade"
  | "skills"
  | "github_url"
  | "linkedin_url"
  | "website_url"
>;

export async function getTeam(): Promise<PublicProfile[]> {
  return safe(async () => {
    const supabase = createPublicClient();
    const { data } = await supabase
      .from("profiles")
      .select(
        "id, full_name, role, avatar_url, headline, bio, grade, skills, github_url, linkedin_url, website_url",
      )
      .eq("is_active", true)
      // core_team sorts before member alphabetically, which is also the order
      // we want them displayed in.
      .order("role", { ascending: true })
      .order("full_name", { ascending: true });
    return (data as PublicProfile[]) ?? [];
  }, []);
}

export async function getGallery(): Promise<GalleryItem[]> {
  return safe(async () => {
    const supabase = createPublicClient();
    const { data } = await supabase
      .from("gallery_items")
      .select("*")
      .order("position", { ascending: true })
      .order("created_at", { ascending: false });
    return (data as GalleryItem[]) ?? [];
  }, []);
}

export async function getAchievements(): Promise<Achievement[]> {
  return safe(async () => {
    const supabase = createPublicClient();
    const { data } = await supabase
      .from("achievements")
      .select("*")
      .order("awarded_on", { ascending: false, nullsFirst: false });
    return (data as Achievement[]) ?? [];
  }, []);
}

export async function getMyTasks(userId: string): Promise<TaskRow[]> {
  return safe(async () => {
    const supabase = await createClient();
    const { data } = await supabase
      .from("tasks")
      .select("*")
      .eq("assignee_id", userId)
      .order("deadline", { ascending: true, nullsFirst: false });
    return (data as TaskRow[]) ?? [];
  }, []);
}

export async function getMyNotifications(userId: string): Promise<Notification[]> {
  return safe(async () => {
    const supabase = await createClient();
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("recipient_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);
    return (data as Notification[]) ?? [];
  }, []);
}

export interface PlatformStats {
  members: number;
  activeMembers: number;
  events: number;
  achievements: number;
  gallery: number;
}

const EMPTY_STATS: PlatformStats = {
  members: 0,
  activeMembers: 0,
  events: 0,
  achievements: 0,
  gallery: 0,
};

/**
 * Counts for the Core Team overview. These are real counts of real rows —
 * nothing here is padded, and the dashboard shows a zero as a zero.
 */
export async function getPlatformStats(): Promise<PlatformStats> {
  return safe(async () => {
    const supabase = await createClient();
    const countOf = (table: string, activeOnly = false) => {
      const q = supabase.from(table).select("id", { count: "exact", head: true });
      return (activeOnly ? q.eq("is_active", true) : q).then(
        (r: { count: number | null }) => r.count ?? 0,
      );
    };

    const [members, activeMembers, events, achievements, gallery] =
      await Promise.all([
        countOf("profiles"),
        countOf("profiles", true),
        countOf("events"),
        countOf("achievements"),
        countOf("gallery_items"),
      ]);

    return { members, activeMembers, events, achievements, gallery };
  }, EMPTY_STATS);
}

