"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/server";
import { HACK_COOKIE } from "./identity";

/**
 * Infinium Hackathon write actions.
 *
 * Writes use the service-role client (RLS on hack_* allows public read only),
 * so the module is fully interactive without club auth. When real auth lands,
 * gate these by the authenticated hackathon role instead of trusting the
 * demo-identity cookie.
 */

function db() {
  return createAdminClient();
}

/** Switch the active demo participant (role explorer). */
export async function switchIdentityAction(participantId: string) {
  const store = await cookies();
  store.set(HACK_COOKIE, participantId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/hackathon",
    maxAge: 60 * 60 * 24 * 30,
  });
  revalidatePath("/hackathon", "layout");
  return { success: true };
}

/* ── Student: update team project details / submission ── */

const submissionSchema = z.object({
  teamId: z.string().uuid(),
  github_url: z.string().url().optional().or(z.literal("")),
  demo_url: z.string().url().optional().or(z.literal("")),
  presentation_url: z.string().url().optional().or(z.literal("")),
  docs_url: z.string().url().optional().or(z.literal("")),
  notes: z.string().optional(),
  submit: z.string().optional(),
});

export async function saveSubmissionAction(_prev: unknown, formData: FormData) {
  const parsed = submissionSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.errors[0]?.message ?? "Invalid submission" };
  const d = parsed.data;
  const finalize = d.submit === "true";

  const supabase = db();
  const row = {
    team_id: d.teamId,
    github_url: d.github_url || null,
    demo_url: d.demo_url || null,
    presentation_url: d.presentation_url || null,
    docs_url: d.docs_url || null,
    notes: d.notes || null,
    status: finalize ? "submitted" : "draft",
    submitted_at: finalize ? new Date().toISOString() : null,
  };
  const { error } = await supabase.from("hack_submissions").upsert(row, { onConflict: "team_id" });
  if (error) return { error: error.message };

  // Mirror GitHub onto the team + bump status/progress on final submit.
  await supabase
    .from("hack_teams")
    .update({
      github_url: d.github_url || null,
      demo_url: d.demo_url || null,
      ...(finalize ? { status: "submitted", progress: 100 } : {}),
    })
    .eq("id", d.teamId);

  revalidatePath("/hackathon/dashboard");
  revalidatePath("/hackathon/leaderboard");
  return { success: finalize ? "Project submitted! 🎉" : "Draft saved." };
}

/* ── Judge: score a team ── */

const scoreSchema = z.object({
  teamId: z.string().uuid(),
  judgeId: z.string().uuid(),
  innovation: z.coerce.number().min(0).max(10),
  execution: z.coerce.number().min(0).max(10),
  impact: z.coerce.number().min(0).max(10),
  presentation: z.coerce.number().min(0).max(10),
  comments: z.string().optional(),
});

export async function saveScoreAction(_prev: unknown, formData: FormData) {
  const parsed = scoreSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.errors[0]?.message ?? "Invalid score" };
  const d = parsed.data;
  const total = d.innovation + d.execution + d.impact + d.presentation;

  const supabase = db();
  const { error } = await supabase.from("hack_scores").upsert(
    {
      team_id: d.teamId,
      judge_id: d.judgeId,
      criteria: {
        innovation: d.innovation,
        execution: d.execution,
        impact: d.impact,
        presentation: d.presentation,
      },
      total,
      comments: d.comments || null,
    },
    { onConflict: "team_id,judge_id" },
  );
  if (error) return { error: error.message };

  revalidatePath("/hackathon/dashboard");
  revalidatePath("/hackathon/leaderboard");
  return { success: `Scored ${total}/40.` };
}

/* ── Organizer/Admin: announcements + problem release ── */

export async function postAnnouncementAction(_prev: unknown, formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const pinned = formData.get("pinned") === "true";
  if (title.length < 3) return { error: "Give the announcement a title." };

  const supabase = db();
  const { error } = await supabase
    .from("hack_announcements")
    .insert({ title, body: body || null, pinned });
  if (error) return { error: error.message };

  revalidatePath("/hackathon");
  revalidatePath("/hackathon/dashboard");
  return { success: "Announcement posted." };
}

export async function toggleProblemReleaseAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const released = formData.get("released") === "true";
  if (!id) return;
  const supabase = db();
  await supabase.from("hack_problems").update({ released: !released }).eq("id", id);
  revalidatePath("/hackathon/dashboard");
  revalidatePath("/hackathon/problems");
}

export async function setTeamStatusAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!id || !["forming", "active", "submitted", "disqualified"].includes(status)) return;
  const supabase = db();
  await supabase.from("hack_teams").update({ status }).eq("id", id);
  revalidatePath("/hackathon/dashboard");
  revalidatePath("/hackathon/leaderboard");
}
