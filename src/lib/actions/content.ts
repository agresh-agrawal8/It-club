"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { slugify } from "@/lib/utils";

/**
 * Core Team Panel actions. All of these run as the signed-in admin through
 * the regular client — RLS policies (is_admin()) are the enforcement layer,
 * so no service key is required for content management.
 */

function fail(message: string) {
  return { error: message };
}

/* ── Events ────────────────────────────────────────────────── */

const eventSchema = z.object({
  title: z.string().min(3, "Title needs at least 3 characters"),
  description: z.string().optional(),
  starts_at: z.string().min(1, "Start date/time is required"),
  ends_at: z.string().optional(),
  venue: z.string().optional(),
  registration_url: z.string().url().optional().or(z.literal("")),
  banner_url: z.string().url().optional().or(z.literal("")),
  status: z.enum(["upcoming", "ongoing", "past", "cancelled"]).default("upcoming"),
});

export async function createEventAction(formData: FormData) {
  await requireAdmin();
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
    registration_url: d.registration_url || null,
    banner_url: d.banner_url || null,
    status: d.status,
  });
  if (error) return fail(error.message);

  revalidatePath("/admin/events");
  revalidatePath("/events");
  revalidatePath("/");
  return { success: true };
}

export async function deleteEventAction(formData: FormData) {
  await requireAdmin();
  const id = formData.get("id") as string;
  if (!id) return;
  const supabase = await createClient();
  const { error } = await supabase.from("events").delete().eq("id", id);
  if (error) return;
  revalidatePath("/admin/events");
  revalidatePath("/events");
  revalidatePath("/");
  return;
}

/* ── Competitions ──────────────────────────────────────────── */

const competitionSchema = z.object({
  title: z.string().min(3, "Title needs at least 3 characters"),
  description: z.string().optional(),
  organizer: z.string().optional(),
  location: z.string().optional(),
  starts_at: z.string().optional(),
  result: z.string().optional(),
  registration_url: z.string().url().optional().or(z.literal("")),
  banner_url: z.string().url().optional().or(z.literal("")),
  status: z.enum(["upcoming", "ongoing", "past", "cancelled"]).default("upcoming"),
});

export async function createCompetitionAction(formData: FormData) {
  await requireAdmin();
  const parsed = competitionSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fail(parsed.error.errors[0]?.message ?? "Invalid competition");

  const d = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase.from("competitions").insert({
    slug: `${slugify(d.title)}-${Date.now().toString(36)}`,
    title: d.title,
    description: d.description || null,
    organizer: d.organizer || null,
    location: d.location || null,
    starts_at: d.starts_at ? new Date(d.starts_at).toISOString() : null,
    result: d.result || null,
    registration_url: d.registration_url || null,
    banner_url: d.banner_url || null,
    status: d.status,
  });
  if (error) return fail(error.message);

  revalidatePath("/admin/competitions");
  revalidatePath("/competitions");
  return { success: true };
}

export async function deleteCompetitionAction(formData: FormData) {
  await requireAdmin();
  const id = formData.get("id") as string;
  if (!id) return;
  const supabase = await createClient();
  const { error } = await supabase.from("competitions").delete().eq("id", id);
  if (error) return;
  revalidatePath("/admin/competitions");
  revalidatePath("/competitions");
  return;
}

/* ── Achievements ──────────────────────────────────────────── */

const achievementSchema = z.object({
  title: z.string().min(3, "Title needs at least 3 characters"),
  description: z.string().optional(),
  category: z.string().optional(),
  awarded_on: z.string().optional(),
  image_url: z.string().url().optional().or(z.literal("")),
});

export async function createAchievementAction(formData: FormData) {
  await requireAdmin();
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
  await requireAdmin();
  const id = formData.get("id") as string;
  if (!id) return;
  const supabase = await createClient();
  const { error } = await supabase.from("achievements").delete().eq("id", id);
  if (error) return;
  revalidatePath("/admin/achievements");
  revalidatePath("/achievements");
  revalidatePath("/");
  return;
}

/* ── Gallery ───────────────────────────────────────────────── */

const gallerySchema = z.object({
  image_url: z.string().url("A valid image URL is required"),
  title: z.string().optional(),
  caption: z.string().optional(),
  album: z.string().optional(),
});

export async function addGalleryItemAction(formData: FormData) {
  await requireAdmin();
  const parsed = gallerySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fail(parsed.error.errors[0]?.message ?? "Invalid gallery item");

  const d = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase.from("gallery_items").insert({
    image_url: d.image_url,
    title: d.title || null,
    caption: d.caption || null,
    album: d.album || null,
  });
  if (error) return fail(error.message);

  revalidatePath("/admin/gallery");
  revalidatePath("/gallery");
  return { success: true };
}

export async function deleteGalleryItemAction(formData: FormData) {
  await requireAdmin();
  const id = formData.get("id") as string;
  if (!id) return;
  const supabase = await createClient();
  const { error } = await supabase.from("gallery_items").delete().eq("id", id);
  if (error) return;
  revalidatePath("/admin/gallery");
  revalidatePath("/gallery");
  return;
}

/* ── Contact messages ──────────────────────────────────────── */

export async function toggleMessageHandledAction(formData: FormData) {
  await requireAdmin();
  const id = formData.get("id") as string;
  const handled = formData.get("handled") === "true";
  if (!id) return;
  const supabase = await createClient();
  const { error } = await supabase
    .from("contact_messages")
    .update({ handled: !handled })
    .eq("id", id);
  if (error) return;
  revalidatePath("/admin/messages");
  return;
}

export async function deleteMessageAction(formData: FormData) {
  await requireAdmin();
  const id = formData.get("id") as string;
  if (!id) return;
  const supabase = await createClient();
  const { error } = await supabase.from("contact_messages").delete().eq("id", id);
  if (error) return;
  revalidatePath("/admin/messages");
  return;
}

/* ── Member management (role / active) ─────────────────────── */

export async function setMemberRoleAction(formData: FormData) {
  const { user } = await requireAdmin();
  const id = formData.get("id") as string;
  const role = formData.get("role") as string;
  if (!id || !["member", "admin"].includes(role)) return;
  // Nobody can change a super_admin from the UI, and you can't demote yourself.
  if (id === user.id) return;

  const supabase = await createClient();
  const { data: target } = await supabase.from("profiles").select("role").eq("id", id).single();
  if (target?.role === "super_admin") return;

  const { error } = await supabase.from("profiles").update({ role }).eq("id", id);
  if (error) return;
  revalidatePath("/admin/members");
  return;
}

export async function toggleMemberActiveAction(formData: FormData) {
  const { user } = await requireAdmin();
  const id = formData.get("id") as string;
  const isActive = formData.get("is_active") === "true";
  if (!id) return;
  if (id === user.id) return;

  const supabase = await createClient();
  const { data: target } = await supabase.from("profiles").select("role").eq("id", id).single();
  if (target?.role === "super_admin") return;

  const { error } = await supabase.from("profiles").update({ is_active: !isActive }).eq("id", id);
  if (error) return;
  revalidatePath("/admin/members");
  revalidatePath("/team");
  return;
}
