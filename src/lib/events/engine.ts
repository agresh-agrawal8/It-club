import "server-only";
import { cache } from "react";
import { unstable_cache } from "next/cache";
import { createPublicClient } from "@/lib/supabase/server";
import type {
  EventCapability,
  EventRecord,
  EventSettings,
  EventTheme,
} from "./types";

/**
 * The Event Engine.
 *
 * Resolves an event, its settings and its theme from a slug. Nothing in this
 * file knows what any particular event is — that is the whole point. Adding an
 * event is a database row, not a code change.
 */

/**
 * Every read tolerates a missing schema.
 *
 * The ev_* migrations may not have been applied yet in a given environment,
 * and a marketing page should degrade to an empty state rather than 500. This
 * mirrors the `safe()` pattern the club side already uses.
 */
async function safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch {
    return fallback;
  }
}

/** Invalidated by every organiser write — see lib/events/actions/admin.ts. */
export const EVENT_TAG = "event-data";

/**
 * Wrap a PUBLIC event read so it is deduped per render and shared across
 * requests. Uses the cookieless client, because `cookies()` inside a cache
 * scope throws — and because a value shared between visitors must not depend
 * on any one visitor's session.
 *
 * Only for tables whose RLS grants public read. Anything participant- or
 * staff-scoped must stay on the request-bound client.
 */
function publicRead<T>(key: string, fn: () => Promise<T>, revalidate = 60) {
  return cache(unstable_cache(fn, [key], { tags: [EVENT_TAG], revalidate }));
}

export const DEFAULT_SETTINGS: EventSettings = {
  registration_mode: "closed",
  teams_enabled: true,
  missions_enabled: true,
  qr_enabled: false,
  certificates_enabled: false,
  inventory_enabled: false,
  badges_enabled: true,
  gallery_enabled: false,
  leaderboard_visibility: "public",
  leaderboard_subject: "team",
  ai_assistant_enabled: false,
};

const DEFAULT_THEME: EventTheme = {
  accent: "#6366f1",
  accentSoft: "#a5b4fc",
  surface: "#09090b",
  grid: "rgba(99,102,241,0.08)",
  mode: "mission-control",
  motion: "high",
  codename: "EV",
};

/** All events visible on the hub, newest first. */
export const listEvents = publicRead<EventRecord[]>(
  "ev-events-list",
  async () =>
    safe(async () => {
      const supabase = createPublicClient();
      const { data } = await supabase
        .from("ev_events")
        .select("*")
        .neq("status", "draft")
        .neq("status", "archived")
        .order("starts_at", { ascending: true, nullsFirst: false });
      return (data ?? []) as EventRecord[];
    }, []),
  120,
);

/**
 * One event by slug, or null.
 *
 * Cached per slug. Only publicly visible events are readable here (the RLS
 * policy on ev_events restricts the anon role to visibility='public' and a
 * non-draft status), so nothing unpublished can leak through the shared cache.
 */
export const getEvent = cache(
  async (slug: string): Promise<EventRecord | null> =>
    unstable_cache(
      async () =>
        safe(async () => {
          const supabase = createPublicClient();
          const { data } = await supabase
            .from("ev_events")
            .select("*")
            .eq("slug", slug)
            .maybeSingle();
          return (data as EventRecord) ?? null;
        }, null),
      ["ev-event", slug],
      { tags: [EVENT_TAG], revalidate: 120 },
    )(),
);

/**
 * Capability flags, merged over defaults so a missing row is never a crash.
 * Values are stored as jsonb, so they arrive already parsed.
 */
export const getEventSettings = cache(
  async (eventId: string): Promise<EventSettings> =>
    unstable_cache(
      async () =>
        safe(async () => {
          const supabase = createPublicClient();
          const { data } = await supabase
            .from("ev_event_settings")
            .select("key,value")
            .eq("event_id", eventId);

          const merged = { ...DEFAULT_SETTINGS } as Record<string, unknown>;
          for (const row of (data ?? []) as { key: string; value: unknown }[]) {
            if (row.key.startsWith("private.")) continue; // staff-only, never in page props
            merged[row.key] = row.value;
          }
          return merged as unknown as EventSettings;
        }, DEFAULT_SETTINGS),
      ["ev-settings", eventId],
      { tags: [EVENT_TAG], revalidate: 120 },
    )(),
);

/** Theme merged over defaults. */
export function resolveTheme(event: EventRecord | null): EventTheme {
  return { ...DEFAULT_THEME, ...(event?.theme ?? {}) } as EventTheme;
}

/**
 * Theme → CSS custom properties, applied on the event layout element. This is
 * how one component tree renders in a different visual identity per event
 * without a single conditional on the event slug.
 */
export function themeVars(theme: EventTheme): React.CSSProperties {
  return {
    ["--ev-accent" as string]: theme.accent,
    ["--ev-accent-soft" as string]: theme.accentSoft,
    ["--ev-surface" as string]: theme.surface,
    ["--ev-grid" as string]: theme.grid,
  };
}

/** Is a capability switched on for this event? */
export function can(settings: EventSettings, capability: EventCapability): boolean {
  return Boolean(settings[capability]);
}

/**
 * How many participants are registered (for capacity rules).
 *
 * Deliberately short-lived: this gates registration, so a stale count could
 * let a team register into a full event.
 */
export const countRegistered = cache(
  async (eventId: string): Promise<number> =>
    unstable_cache(
      async () =>
        safe(async () => {
          // Via RPC, not a table read: ev_participants is not public-read (it
          // joins to PII), so counting rows through the anon client always
          // returned 0. ev_registered_count exposes only the aggregate.
          const supabase = createPublicClient();
          const { data } = await supabase.rpc("ev_registered_count", { p_event_id: eventId });
          return Number(data ?? 0);
        }, 0),
      ["ev-registered-count", eventId],
      { tags: [EVENT_TAG], revalidate: 15 },
    )(),
);

export { safe as safeEventRead };
