"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getEvent } from "@/lib/events/engine";
import { requireEventAdmin } from "@/lib/events/auth";

/**
 * CODE RED / event organiser actions.
 *
 * Every export is a live POST endpoint, so each one re-resolves the event and
 * calls requireEventAdmin() before touching data. Writes go through the normal
 * RLS-bound client — the ev_* "admin write" policies (ev_is_event_admin) are
 * the enforcement layer, exactly like the club Core Team Panel. No service key.
 */

async function authorise(slug: string) {
  const event = await getEvent(slug);
  if (!event) return { error: "Unknown event." as const };
  await requireEventAdmin(event.id, event.slug);
  return { event };
}

function base(slug: string) {
  return `/events/hub/${slug}`;
}

/* ── Announcements ─────────────────────────────────────────────── */

const announcementSchema = z.object({
  title: z.string().trim().min(3, "Give the announcement a title (3+ characters)."),
  body: z.string().trim().optional(),
  severity: z.enum(["info", "success", "warning", "critical"]).default("info"),
  pinned: z.union([z.literal("on"), z.literal("true"), z.null()]).optional(),
});

export async function postEventAnnouncementAction(_prev: unknown, formData: FormData) {
  const slug = String(formData.get("event_slug") ?? "");
  const auth = await authorise(slug);
  if ("error" in auth) return auth;

  const parsed = announcementSchema.safeParse({
    title: formData.get("title"),
    body: formData.get("body"),
    severity: formData.get("severity") ?? "info",
    pinned: formData.get("pinned"),
  });
  if (!parsed.success) return { error: parsed.error.errors[0]?.message ?? "Invalid announcement." };

  const supabase = await createClient();
  const { error } = await supabase.from("ev_announcements").insert({
    event_id: auth.event.id,
    title: parsed.data.title,
    body: parsed.data.body || null,
    severity: parsed.data.severity,
    pinned: Boolean(parsed.data.pinned),
  });
  if (error) return { error: error.message };

  revalidatePath(base(slug));
  revalidatePath(`${base(slug)}/admin`);
  return { success: "Announcement posted." };
}

export async function deleteEventAnnouncementAction(formData: FormData) {
  const slug = String(formData.get("event_slug") ?? "");
  const auth = await authorise(slug);
  if ("error" in auth) return;

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  await supabase.from("ev_announcements").delete().eq("id", id).eq("event_id", auth.event.id);
  revalidatePath(`${base(slug)}/admin`);
  revalidatePath(base(slug));
}

/* ── Mission release ───────────────────────────────────────────── */

const missionStatuses = ["draft", "scheduled", "open", "closed"] as const;

export async function setMissionStatusAction(formData: FormData) {
  const slug = String(formData.get("event_slug") ?? "");
  const auth = await authorise(slug);
  if ("error" in auth) return;

  const id = String(formData.get("mission_id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!id || !missionStatuses.includes(status as (typeof missionStatuses)[number])) return;

  const supabase = await createClient();
  await supabase
    .from("ev_missions")
    .update({ status })
    .eq("id", id)
    .eq("event_id", auth.event.id);

  revalidatePath(`${base(slug)}/admin`);
  revalidatePath(`${base(slug)}/missions`);
}

/* ── Event status ──────────────────────────────────────────────── */

const eventStatuses = [
  "draft",
  "published",
  "registration",
  "live",
  "judging",
  "closed",
  "archived",
] as const;

export async function setEventStatusAction(formData: FormData) {
  const slug = String(formData.get("event_slug") ?? "");
  const auth = await authorise(slug);
  if ("error" in auth) return;

  const status = String(formData.get("status") ?? "");
  if (!eventStatuses.includes(status as (typeof eventStatuses)[number])) return;

  const supabase = await createClient();
  await supabase.from("ev_events").update({ status }).eq("id", auth.event.id);

  revalidatePath(`${base(slug)}/admin`);
  revalidatePath(base(slug));
  revalidatePath("/events/hub");
}

/* ── Registration review ───────────────────────────────────────── */

export async function setParticipantStatusAction(formData: FormData) {
  const slug = String(formData.get("event_slug") ?? "");
  const auth = await authorise(slug);
  if ("error" in auth) return;

  const id = String(formData.get("participant_id") ?? "");
  const status = String(formData.get("status") ?? "");
  const allowed = ["approved", "rejected", "waitlisted", "checked_in", "disqualified"];
  if (!id || !allowed.includes(status)) return;

  const supabase = await createClient();
  await supabase
    .from("ev_participants")
    .update({
      status,
      approved_at: status === "approved" ? new Date().toISOString() : null,
    })
    .eq("id", id)
    .eq("event_id", auth.event.id);

  revalidatePath(`${base(slug)}/admin`);
}
