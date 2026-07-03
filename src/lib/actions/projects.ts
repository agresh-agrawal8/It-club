"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { slugify } from "@/lib/utils";

function parseList(value: FormDataEntryValue | null): string[] {
  return String(value ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

const projectSchema = z.object({
  title: z.string().min(2, "Title is too short"),
  summary: z.string().optional(),
  description: z.string().optional(),
  cover_url: z.string().url().optional().or(z.literal("")),
  github_url: z.string().url().optional().or(z.literal("")),
  demo_url: z.string().url().optional().or(z.literal("")),
  docs_url: z.string().url().optional().or(z.literal("")),
  status: z.enum(["draft", "in_progress", "completed", "archived"]),
});

export async function createProjectAction(_prev: unknown, formData: FormData) {
  const { user } = await requireUser();

  const parsed = projectSchema.safeParse({
    title: formData.get("title"),
    summary: formData.get("summary") ?? "",
    description: formData.get("description") ?? "",
    cover_url: formData.get("cover_url") ?? "",
    github_url: formData.get("github_url") ?? "",
    demo_url: formData.get("demo_url") ?? "",
    docs_url: formData.get("docs_url") ?? "",
    status: (formData.get("status") as string) || "in_progress",
  });
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Invalid project data" };
  }

  const supabase = await createClient();
  const slug = `${slugify(parsed.data.title)}-${Math.random().toString(36).slice(2, 6)}`;

  const { error } = await supabase.from("projects").insert({
    ...emptyToNull(parsed.data),
    slug,
    owner_id: user.id,
    technologies: parseList(formData.get("technologies")),
    tags: parseList(formData.get("tags")),
  });

  if (error) return { error: error.message };

  revalidatePath("/my-projects");
  revalidatePath("/projects");
  redirect("/my-projects");
}

export async function updateProjectAction(_prev: unknown, formData: FormData) {
  const { user } = await requireUser();
  const id = formData.get("id") as string;
  if (!id) return { error: "Missing project id" };

  const parsed = projectSchema.safeParse({
    title: formData.get("title"),
    summary: formData.get("summary") ?? "",
    description: formData.get("description") ?? "",
    cover_url: formData.get("cover_url") ?? "",
    github_url: formData.get("github_url") ?? "",
    demo_url: formData.get("demo_url") ?? "",
    docs_url: formData.get("docs_url") ?? "",
    status: (formData.get("status") as string) || "in_progress",
  });
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Invalid project data" };
  }

  const supabase = await createClient();
  // RLS guarantees only the owner (or admin) can update; scope by owner too.
  const { error } = await supabase
    .from("projects")
    .update({
      ...emptyToNull(parsed.data),
      technologies: parseList(formData.get("technologies")),
      tags: parseList(formData.get("tags")),
    })
    .eq("id", id)
    .eq("owner_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/my-projects");
  revalidatePath("/projects");
  redirect("/my-projects");
}

export async function deleteProjectAction(formData: FormData) {
  const { user } = await requireUser();
  const id = formData.get("id") as string;
  const supabase = await createClient();
  await supabase.from("projects").delete().eq("id", id).eq("owner_id", user.id);
  revalidatePath("/my-projects");
}

function emptyToNull<T extends Record<string, unknown>>(obj: T) {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) out[k] = v === "" ? null : v;
  return out;
}
