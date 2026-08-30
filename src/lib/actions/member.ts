"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";

/**
 * Note what a member may NOT edit: their own name.
 *
 * The name is the sign-in identifier, and the account's synthetic auth address
 * is derived from it when the account is created. Letting a member rename
 * themselves here would change the name the login form hashes into an address
 * while leaving `auth.users.email` on the old one — locking them out of their
 * own account. Renaming is a core-team operation that has to move both.
 */
const profileSchema = z.object({
  headline: z.string().max(120).optional(),
  bio: z.string().optional(),
  grade: z.string().optional(),
  github_url: z.string().url().optional().or(z.literal("")),
  linkedin_url: z.string().url().optional().or(z.literal("")),
  website_url: z.string().url().optional().or(z.literal("")),
  phone: z.string().optional(),
});

export async function updateProfileAction(_prev: unknown, formData: FormData) {
  const { user } = await requireUser();

  const parsed = profileSchema.safeParse({
    headline: formData.get("headline") ?? "",
    bio: formData.get("bio") ?? "",
    grade: formData.get("grade") ?? "",
    github_url: formData.get("github_url") ?? "",
    linkedin_url: formData.get("linkedin_url") ?? "",
    website_url: formData.get("website_url") ?? "",
    phone: formData.get("phone") ?? "",
  });
  if (!parsed.success) return { error: "Please check your details and try again." };

  const skills = String(formData.get("skills") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ ...nullify(parsed.data), skills })
    .eq("id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/profile");
  revalidatePath("/team");
  return { success: "Profile updated." };
}

const taskUpdateSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["todo", "in_progress", "blocked", "done"]),
  progress: z.coerce.number().int().min(0).max(100),
});

/**
 * Members update the progress of tasks assigned to them.
 *
 * The `.eq("assignee_id", user.id)` is the authorization: without it, posting
 * someone else's task id would let any member edit any task in the club.
 */
export async function updateTaskProgressAction(formData: FormData) {
  const { user } = await requireUser();

  const parsed = taskUpdateSchema.safeParse({
    id: formData.get("id"),
    status: formData.get("status"),
    progress: formData.get("progress") ?? 0,
  });
  if (!parsed.success) return;

  const supabase = await createClient();
  await supabase
    .from("tasks")
    .update({ status: parsed.data.status, progress: parsed.data.progress })
    .eq("id", parsed.data.id)
    .eq("assignee_id", user.id);

  revalidatePath("/my-tasks");
  revalidatePath("/dashboard");
}

export async function markNotificationReadAction(formData: FormData) {
  const { user } = await requireUser();
  const id = formData.get("id") as string;
  const supabase = await createClient();
  await supabase.from("notifications").update({ read: true }).eq("id", id).eq("recipient_id", user.id);
  revalidatePath("/notifications");
}

export async function markAllNotificationsReadAction() {
  const { user } = await requireUser();
  const supabase = await createClient();
  await supabase.from("notifications").update({ read: true }).eq("recipient_id", user.id).eq("read", false);
  revalidatePath("/notifications");
}

function nullify<T extends Record<string, unknown>>(obj: T) {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) out[k] = v === "" ? null : v;
  return out;
}
