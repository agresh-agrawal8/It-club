import "server-only";
import { createClient } from "@/lib/supabase/server";
import type {
  Achievement,
  Competition,
  EventRow,
  GalleryItem,
  Notification,
  Profile,
  Project,
  ProjectMedia,
  TaskRow,
} from "@/types/database";

/**
 * Server-side data access. Every function is defensive: if Supabase is not yet
 * configured (or a query errors), it returns a safe empty value so pages render
 * their empty states instead of crashing. This lets the UI ship before the DB
 * is connected and keeps the app resilient.
 */

async function safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch {
    return fallback;
  }
}

export async function getFeaturedProjects(limit = 6): Promise<Project[]> {
  return safe(async () => {
    const supabase = await createClient();
    const { data } = await supabase
      .from("projects")
      .select("*")
      .neq("status", "draft")
      .order("featured", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(limit);
    return (data as Project[]) ?? [];
  }, []);
}

export async function getProjects(): Promise<Project[]> {
  return safe(async () => {
    const supabase = await createClient();
    const { data } = await supabase
      .from("projects")
      .select("*")
      .neq("status", "draft")
      .order("created_at", { ascending: false });
    return (data as Project[]) ?? [];
  }, []);
}

export async function getProjectBySlug(slug: string) {
  return safe<{ project: Project; media: ProjectMedia[]; authors: Profile[] } | null>(
    async () => {
      const supabase = await createClient();
      const { data: project } = await supabase
        .from("projects")
        .select("*")
        .eq("slug", slug)
        .single();
      if (!project) return null;

      const [{ data: media }, { data: authorLinks }] = await Promise.all([
        supabase.from("project_media").select("*").eq("project_id", project.id).order("position"),
        supabase.from("project_authors").select("profile_id").eq("project_id", project.id),
      ]);

      const authorIds = (authorLinks ?? []).map((a: { profile_id: string }) => a.profile_id);
      const { data: authors } = authorIds.length
        ? await supabase.from("profiles").select("*").in("id", authorIds)
        : { data: [] };

      return {
        project: project as Project,
        media: (media as ProjectMedia[]) ?? [],
        authors: (authors as Profile[]) ?? [],
      };
    },
    null,
  );
}

export async function getEvents(): Promise<EventRow[]> {
  return safe(async () => {
    const supabase = await createClient();
    const { data } = await supabase
      .from("events")
      .select("*")
      .order("starts_at", { ascending: false });
    return (data as EventRow[]) ?? [];
  }, []);
}

export async function getUpcomingEvents(limit = 3): Promise<EventRow[]> {
  return safe(async () => {
    const supabase = await createClient();
    const { data } = await supabase
      .from("events")
      .select("*")
      .gte("starts_at", new Date().toISOString())
      .order("starts_at", { ascending: true })
      .limit(limit);
    return (data as EventRow[]) ?? [];
  }, []);
}

export async function getCompetitions(): Promise<Competition[]> {
  return safe(async () => {
    const supabase = await createClient();
    const { data } = await supabase
      .from("competitions")
      .select("*")
      .order("starts_at", { ascending: false });
    return (data as Competition[]) ?? [];
  }, []);
}

export async function getTeam(): Promise<Profile[]> {
  return safe(async () => {
    const supabase = await createClient();
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("is_active", true)
      .order("role", { ascending: true })
      .order("full_name", { ascending: true });
    return (data as Profile[]) ?? [];
  }, []);
}

export async function getGallery(): Promise<GalleryItem[]> {
  return safe(async () => {
    const supabase = await createClient();
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
    const supabase = await createClient();
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

export async function getMyProjects(userId: string): Promise<Project[]> {
  return safe(async () => {
    const supabase = await createClient();
    const { data } = await supabase
      .from("projects")
      .select("*")
      .eq("owner_id", userId)
      .order("updated_at", { ascending: false });
    return (data as Project[]) ?? [];
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
  projects: number;
  events: number;
  competitions: number;
  achievements: number;
  visitors: number;
}

export async function getPlatformStats(): Promise<PlatformStats> {
  return safe(async () => {
    const supabase = await createClient();
    const count = (q: any) => q.then((r: { count: number | null }) => r.count ?? 0);
    const [members, activeMembers, projects, events, competitions, achievements, visitors] =
      await Promise.all([
        count(supabase.from("profiles").select("*", { count: "exact", head: true })),
        count(
          supabase
            .from("profiles")
            .select("*", { count: "exact", head: true })
            .eq("is_active", true),
        ),
        count(
          supabase
            .from("projects")
            .select("*", { count: "exact", head: true })
            .neq("status", "draft"),
        ),
        count(supabase.from("events").select("*", { count: "exact", head: true })),
        count(supabase.from("competitions").select("*", { count: "exact", head: true })),
        count(supabase.from("achievements").select("*", { count: "exact", head: true })),
        count(supabase.from("page_views").select("*", { count: "exact", head: true })),
      ]);
    return { members, activeMembers, projects, events, competitions, achievements, visitors };
  }, { members: 0, activeMembers: 0, projects: 0, events: 0, competitions: 0, achievements: 0, visitors: 0 });
}

export async function getHomepageContent() {
  return safe<Record<string, string>>(async () => {
    const supabase = await createClient();
    const { data } = await supabase.from("settings").select("value").eq("key", "homepage").single();
    return (data?.value as Record<string, string>) ?? {};
  }, {});
}
