"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";

const profileSchema = z.object({
  full_name: z.string().min(2),
  headline: z.string().optional(),
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
    full_name: formData.get("full_name"),
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

/** Members update the progress/status of tasks assigned to them. */
export async function updateTaskProgressAction(formData: FormData) {
  const { user } = await requireUser();
  const id = formData.get("id") as string;
  const status = formData.get("status") as string;
  const progress = Number(formData.get("progress") ?? 0);

  const supabase = await createClient();
  await supabase
    .from("tasks")
    .update({ status, progress: Math.max(0, Math.min(100, progress)) })
    .eq("id", id)
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
