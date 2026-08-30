"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireCoreTeam } from "@/lib/auth";
import { slugify } from "@/lib/utils";
import { sendPushToProfiles } from "@/lib/push";

/**
 * Core Team content actions.
 *
 * These run as the signed-in core-team account through the ordinary client, so
 * the RLS policies (`is_admin()`) are the enforcement layer and no service-role
 * key is ever needed on the server. The requireCoreTeam() call in front of each
 * one fails fast with a redirect; RLS is what makes that safe rather than
 * merely tidy.
 */

function fail(message: string) {
  return { error: message };
}

const uuid = z.string().uuid();

/* ── Events ─────────────────────────────────────────────────────────────── */

/**
 * One schema for everything the club runs. A competition is an event with
 * `kind = "competition"`, an organiser and (afterwards) a result — not a
 * second table with a second form behind it.
 */
const eventSchema = z.object({
  title: z.string().trim().min(3, "Title needs at least 3 characters"),
  description: z.string().optional(),
  starts_at: z.string().min(1, "Start date and time are required"),
  ends_at: z.string().optional(),
  venue: z.string().optional(),
  kind: z
    .enum(["workshop", "competition", "hackathon", "talk", "other"])
    .default("workshop"),
  organizer: z.string().optional(),
  result: z.string().optional(),
  registration_url: z.string().url("Enter a valid URL").optional().or(z.literal("")),
  banner_url: z.string().url("Enter a valid URL").optional().or(z.literal("")),
  status: z.enum(["upcoming", "ongoing", "past", "cancelled"]).default("upcoming"),
});

export async function createEventAction(formData: FormData) {
  await requireCoreTeam();
  const parsed = eventSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fail(parsed.error.errors[0]?.message ?? "Invalid event");

  const d = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase.from("events").insert({
    slug: `${slugify(d.title)}-${Date.now().toString(36)}`,
    title: d.title,
    description: d.description || null,
    starts_at: new Date(d.starts_at).toISOString(),
    ends_at: d.ends_at ? new Date(d.ends_at).toISOString() : null,
    venue: d.venue || null,
    kind: d.kind,
    organizer: d.organizer || null,
    result: d.result || null,
    registration_url: d.registration_url || null,
    banner_url: d.banner_url || null,
    status: d.status,
  });
  if (error) return fail(error.message);

  revalidatePath("/admin/events");
  revalidatePath("/events");
  revalidatePath("/");
  revalidatePath("/sitemap.xml");
  return { success: true };
}

export async function deleteEventAction(formData: FormData) {
  await requireCoreTeam();
  const id = String(formData.get("id") ?? "");
  if (!uuid.safeParse(id).success) return;

  const supabase = await createClient();
  await supabase.from("events").delete().eq("id", id);
  revalidatePath("/admin/events");
  revalidatePath("/events");
  revalidatePath("/");
}

/* ── Achievements ───────────────────────────────────────────────────────── */

const achievementSchema = z.object({
  title: z.string().trim().min(3, "Title needs at least 3 characters"),
  description: z.string().optional(),
  category: z.string().optional(),
  awarded_on: z.string().optional(),
  image_url: z.string().url("Enter a valid URL").optional().or(z.literal("")),
});

export async function createAchievementAction(formData: FormData) {
  await requireCoreTeam();
  const parsed = achievementSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fail(parsed.error.errors[0]?.message ?? "Invalid achievement");

  const d = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase.from("achievements").insert({
    title: d.title,
    description: d.description || null,
    category: d.category || null,
    awarded_on: d.awarded_on || null,
    image_url: d.image_url || null,
  });
  if (error) return fail(error.message);

  revalidatePath("/admin/achievements");
  revalidatePath("/achievements");
  revalidatePath("/");
  return { success: true };
}

export async function deleteAchievementAction(formData: FormData) {
  await requireCoreTeam();
  const id = String(formData.get("id") ?? "");
  if (!uuid.safeParse(id).success) return;

  const supabase = await createClient();
  await supabase.from("achievements").delete().eq("id", id);
  revalidatePath("/admin/achievements");
  revalidatePath("/achievements");
  revalidatePath("/");
}

/* ── Submissions inbox ──────────────────────────────────────────────────── */

export async function toggleSubmissionHandledAction(formData: FormData) {
  await requireCoreTeam();
  const id = String(formData.get("id") ?? "");
  const handled = formData.get("handled") === "true";
  if (!uuid.safeParse(id).success) return;

  const supabase = await createClient();
  await supabase.from("submissions").update({ handled: !handled }).eq("id", id);
  revalidatePath("/admin/submissions");
}

export async function deleteSubmissionAction(formData: FormData) {
  await requireCoreTeam();
  const id = String(formData.get("id") ?? "");
  if (!uuid.safeParse(id).success) return;

  const supabase = await createClient();
  await supabase.from("submissions").delete().eq("id", id);
  revalidatePath("/admin/submissions");
}

/* ── Notifications ──────────────────────────────────────────────────────── */

const notifySchema = z.object({
  title: z.string().trim().min(3, "Give the notification a title"),
  body: z.string().optional(),
  link: z.string().optional(),
  type: z.enum(["info", "task", "event", "achievement", "system"]).default("info"),
  audience: z.enum(["all", "members", "core_team"]).default("all"),
  urgent: z.string().optional(),
});

/**
 * Broadcast to members. Urgent notices pop up the next time the recipient
 * opens their dashboard, and are pushed to any registered device.
 */
export async function sendNotificationAction(formData: FormData) {
  await requireCoreTeam();
  const parsed = notifySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fail(parsed.error.errors[0]?.message ?? "Invalid notification");

  const d = parsed.data;
  const urgent = d.urgent === "on" || d.urgent === "true";

  // Only relative links — an outbound absolute URL in a broadcast notification
  // is a phishing primitive aimed at the whole club.
  const link = d.link && d.link.startsWith("/") && !d.link.startsWith("//") ? d.link : null;

  const supabase = await createClient();
  let query = supabase.from("profiles").select("id").eq("is_active", true);
  if (d.audience === "members") query = query.eq("role", "member");
  if (d.audience === "core_team") query = query.eq("role", "core_team");

  const { data: recipients, error: recErr } = await query;
  if (recErr) return fail(recErr.message);
  if (!recipients?.length) return fail("No one matches that audience.");

  const rows = recipients.map((r: { id: string }) => ({
    recipient_id: r.id,
    type: d.type,
    title: d.title,
    body: d.body || null,
    link,
    urgent,
  }));

  const { error } = await supabase.from("notifications").insert(rows);
  if (error) return fail(error.message);

  // Best effort: a push failure must not fail a broadcast already saved.
  const push = await sendPushToProfiles(
    recipients.map((r: { id: string }) => r.id),
    {
      title: urgent ? `Urgent: ${d.title}` : d.title,
      body: d.body || "Open Avinya for details.",
      url: link || "/notifications",
      urgent,
      tag: `avinya-${Date.now()}`,
    },
  );

  revalidatePath("/admin/notifications");
  revalidatePath("/notifications");
  revalidatePath("/dashboard");
  return { success: true, pushed: push.sent, recipients: rows.length };
}

export async function deleteNotificationAction(formData: FormData) {
  await requireCoreTeam();
  const id = String(formData.get("id") ?? "");
  if (!uuid.safeParse(id).success) return;

  const supabase = await createClient();
  await supabase.from("notifications").delete().eq("id", id);
  revalidatePath("/admin/notifications");
}

// Marking a notification read belongs to the member who received it, and
// lives in actions/member.ts where it is scoped by recipient_id. It is not
// duplicated here: the copy that used to sit in this file filtered on the
// notification id alone, which let any signed-in account clear someone
// else's urgent notice by guessing an id.
