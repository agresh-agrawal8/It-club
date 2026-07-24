"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";

/**
 * Infinium Hackathon organiser actions.
 *
 * Every export in a "use server" module is reachable as a POST endpoint, so
 * each one must authorise for itself — `requireAdmin()` here, and the signed
 * team-session cookie for team-owned writes (see ./team-actions.ts).
 *
 * The demo identity-switcher and the unauthenticated submission/score actions
 * that used to live here were removed: real team auth and the official judge
 * marking sheet replaced them.
 */

export async function postAnnouncementAction(_prev: unknown, formData: FormData) {
  await requireAdmin();

  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const pinned = formData.get("pinned") === "true";
  if (title.length < 3) return { error: "Give the announcement a title." };

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("hack_announcements")
    .insert({ title, body: body || null, pinned });
  if (error) return { error: error.message };

  revalidatePath("/hackathon");
  revalidatePath("/hackathon/dashboard");
  revalidatePath("/hackathon/manage");
  return { success: "Announcement posted." };
}

export async function toggleProblemReleaseAction(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const released = formData.get("released") === "true";
  if (!id) return;

  const supabase = createAdminClient();
  await supabase.from("hack_problems").update({ released: !released }).eq("id", id);

  revalidatePath("/hackathon/dashboard");
  revalidatePath("/hackathon/problems");
  revalidatePath("/hackathon/manage");
}

export async function setTeamStatusAction(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!id || !["forming", "active", "submitted", "disqualified"].includes(status)) return;

  const supabase = createAdminClient();
  await supabase.from("hack_teams").update({ status }).eq("id", id);

  revalidatePath("/hackathon/dashboard");
  revalidatePath("/hackathon/leaderboard");
  revalidatePath("/hackathon/manage");
}
