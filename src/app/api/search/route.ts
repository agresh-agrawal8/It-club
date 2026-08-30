import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";

export interface SearchResult {
  type: "member" | "event" | "achievement" | "gallery" | "task";
  title: string;
  subtitle?: string;
  href: string;
}

/** Escape PostgREST `ilike` wildcards so a search for "%" is a literal "%". */
function escapeLike(input: string) {
  return input.replace(/[\\%_]/g, (c) => `\\${c}`);
}

/**
 * Global search across public content, plus the signed-in member's own tasks.
 *
 * The queries run through the ordinary Supabase client, so RLS decides what
 * each caller can see — an anonymous visitor gets public rows only, and the
 * task lookup is additionally scoped to the caller's own id.
 */
export async function GET(request: Request) {
  const raw = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  // Cap the term: an unbounded string goes straight into a LIKE pattern that
  // the database has to evaluate against every row.
  const q = raw.slice(0, 64);
  if (q.length < 2) return NextResponse.json({ results: [] });

  const results: SearchResult[] = [];

  try {
    const supabase = await createClient();
    const like = `%${escapeLike(q)}%`;

    const [members, events, achievements, gallery] = await Promise.all([
      supabase
        .from("profiles")
        .select("id, full_name, headline")
        .eq("is_active", true)
        .ilike("full_name", like)
        .limit(6),
      supabase.from("events").select("slug, title, venue").ilike("title", like).limit(6),
      supabase.from("achievements").select("id, title, category").ilike("title", like).limit(6),
      supabase.from("gallery_items").select("id, title").ilike("title", like).limit(6),
    ]);

    for (const m of members.data ?? []) {
      results.push({
        type: "member",
        title: m.full_name,
        subtitle: m.headline ?? undefined,
        href: "/team",
      });
    }
    for (const e of events.data ?? []) {
      results.push({
        type: "event",
        title: e.title,
        subtitle: e.venue ?? undefined,
        href: `/events/${e.slug}`,
      });
    }
    for (const a of achievements.data ?? []) {
      results.push({
        type: "achievement",
        title: a.title,
        subtitle: a.category ?? undefined,
        href: "/achievements",
      });
    }
    for (const g of gallery.data ?? []) {
      results.push({ type: "gallery", title: g.title ?? "Photo", href: "/gallery" });
    }

    const current = await getCurrentUser();
    if (current) {
      const { data: tasks } = await supabase
        .from("tasks")
        .select("id, title, status")
        .eq("assignee_id", current.user.id)
        .ilike("title", like)
        .limit(6);
      for (const t of tasks ?? []) {
        results.push({ type: "task", title: t.title, subtitle: t.status, href: "/my-tasks" });
      }
    }
  } catch {
    return NextResponse.json({ results: [] });
  }

  return NextResponse.json(
    { results },
    // Per-user results (tasks) must never land in a shared cache.
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
