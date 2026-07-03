import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";

export interface SearchResult {
  type: "project" | "member" | "event" | "competition" | "achievement" | "task";
  title: string;
  subtitle?: string;
  href: string;
}

/**
 * Global search across public content (+ the member's own tasks when signed in).
 * RLS ensures each query only returns rows the caller is allowed to see.
 */
export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return NextResponse.json({ results: [] });

  const results: SearchResult[] = [];
  try {
    const supabase = await createClient();
    const like = `%${q}%`;

    const [projects, members, events, competitions, achievements] = await Promise.all([
      supabase.from("projects").select("slug,title,summary").neq("status", "draft").ilike("title", like).limit(6),
      supabase.from("profiles").select("id,full_name,headline").ilike("full_name", like).limit(6),
      supabase.from("events").select("slug,title,venue").ilike("title", like).limit(6),
      supabase.from("competitions").select("slug,title,organizer").ilike("title", like).limit(6),
      supabase.from("achievements").select("id,title,category").ilike("title", like).limit(6),
    ]);

    (projects.data ?? []).forEach((p: any) =>
      results.push({ type: "project", title: p.title, subtitle: p.summary, href: `/projects/${p.slug}` }),
    );
    (members.data ?? []).forEach((m: any) =>
      results.push({ type: "member", title: m.full_name, subtitle: m.headline, href: "/team" }),
    );
    (events.data ?? []).forEach((e: any) =>
      results.push({ type: "event", title: e.title, subtitle: e.venue, href: `/events/${e.slug}` }),
    );
    (competitions.data ?? []).forEach((c: any) =>
      results.push({ type: "competition", title: c.title, subtitle: c.organizer, href: "/competitions" }),
    );
    (achievements.data ?? []).forEach((a: any) =>
      results.push({ type: "achievement", title: a.title, subtitle: a.category, href: "/achievements" }),
    );

    // Members can also search their own assigned tasks.
    const current = await getCurrentUser();
    if (current) {
      const { data: tasks } = await supabase
        .from("tasks")
        .select("id,title,status")
        .eq("assignee_id", current.user.id)
        .ilike("title", like)
        .limit(6);
      (tasks ?? []).forEach((t: any) =>
        results.push({ type: "task", title: t.title, subtitle: t.status, href: "/my-tasks" }),
      );
    }
  } catch {
    // Supabase not configured — return empty results gracefully.
  }

  return NextResponse.json({ results });
}
