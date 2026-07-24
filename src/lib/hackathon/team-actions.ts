"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/server";
import {
  TEAM_COOKIE,
  hashPassword,
  verifyPassword,
  generatePassword,
} from "./team-auth";

const MAX_TEAMS = 10;

/* ─────────────────────────── REGISTRATION ─────────────────────────── */

const memberSchema = z.object({
  name: z.string().trim().min(2),
  class_section: z.string().trim().min(1),
});

/**
 * Public team registration.
 *
 * Enforces the event rules: up to 5 members, exactly one captain, each of the
 * five roles owned once, exactly 2 quiz representatives, max 10 teams, and
 * — critically — no student may already appear on another team.
 */
export async function registerTeamAction(_prev: unknown, formData: FormData) {
  const teamName = String(formData.get("team_name") ?? "").trim();
  const school = String(formData.get("school") ?? "").trim();
  const tagline = String(formData.get("tagline") ?? "").trim();
  if (teamName.length < 3) return { error: "Give your team a name (3+ characters)." };

  // Collect the member rows (index 0..4)
  const roles = ["captain", "frontend", "backend", "uiux", "docs"] as const;
  const members: { name: string; class_section: string; role: string; quiz: boolean }[] = [];
  for (let i = 0; i < 5; i++) {
    const name = String(formData.get(`m${i}_name`) ?? "").trim();
    const cls = String(formData.get(`m${i}_class`) ?? "").trim();
    const role = String(formData.get(`m${i}_role`) ?? "").trim();
    const quiz = formData.get(`m${i}_quiz`) === "on" || formData.get(`m${i}_quiz`) === "true";
    if (!name && !cls) continue; // blank row — team may be smaller than 5
    const parsed = memberSchema.safeParse({ name, class_section: cls });
    if (!parsed.success) return { error: `Member ${i + 1}: enter both name and class/section.` };
    if (!roles.includes(role as (typeof roles)[number]))
      return { error: `Member ${i + 1}: pick a valid role.` };
    members.push({ name, class_section: cls, role, quiz });
  }

  if (members.length < 2) return { error: "A team needs at least 2 members." };
  if (members.length > 5) return { error: "A team can have at most 5 members." };

  const captains = members.filter((m) => m.role === "captain");
  if (captains.length !== 1) return { error: "Pick exactly one Team Captain." };

  const roleSet = new Set(members.map((m) => m.role));
  if (roleSet.size !== members.length) return { error: "Each member needs a different role." };

  const quizReps = members.filter((m) => m.quiz);
  if (quizReps.length !== 2) return { error: "Select exactly 2 Quiz Representatives." };

  // Duplicate members *within* this form
  const keys = members.map((m) => `${m.name.toLowerCase()}|${m.class_section.toLowerCase()}`);
  if (new Set(keys).size !== keys.length)
    return { error: "The same student is listed twice in this team." };

  const supabase = createAdminClient();

  // Capacity
  const { count } = await supabase
    .from("hack_teams")
    .select("*", { count: "exact", head: true })
    .neq("reg_status", "rejected");
  if ((count ?? 0) >= MAX_TEAMS)
    return { error: `Registration is full — the maximum of ${MAX_TEAMS} teams has been reached.` };

  // Team name uniqueness
  const { data: nameClash } = await supabase
    .from("hack_teams")
    .select("id")
    .ilike("name", teamName)
    .maybeSingle();
  if (nameClash) return { error: "A team with that name already exists. Pick another." };

  // ── No student may be on two teams ──
  const { data: existing } = await supabase
    .from("hack_participants")
    .select("name,class_section")
    .not("team_id", "is", null);
  const taken = new Set(
    (existing ?? []).map(
      (p: { name: string; class_section: string | null }) =>
        `${p.name.toLowerCase()}|${(p.class_section ?? "").toLowerCase()}`,
    ),
  );
  const clash = members.find((m) =>
    taken.has(`${m.name.toLowerCase()}|${m.class_section.toLowerCase()}`),
  );
  if (clash)
    return {
      error: `${clash.name} (${clash.class_section}) is already registered with another team. Each student can only join one team.`,
    };

  // Create the team (pending approval)
  const { data: team, error: teamErr } = await supabase
    .from("hack_teams")
    .insert({
      name: teamName,
      tagline: tagline || null,
      school: school || null,
      reg_status: "pending",
      status: "forming",
    })
    .select("id")
    .single();
  if (teamErr || !team) return { error: teamErr?.message ?? "Could not create the team." };

  const rows = members.map((m) => ({
    name: m.name,
    class_section: m.class_section,
    member_role: m.role,
    is_quiz_rep: m.quiz,
    role: "student" as const,
    team_id: team.id,
  }));
  const { error: memErr } = await supabase.from("hack_participants").insert(rows);
  if (memErr) {
    // Roll back the team so a failed member insert never leaves an orphan.
    await supabase.from("hack_teams").delete().eq("id", team.id);
    if (memErr.code === "23505")
      return { error: "One of these students is already registered with another team." };
    return { error: memErr.message };
  }

  revalidatePath("/hackathon/register");
  revalidatePath("/hackathon/dashboard");
  return {
    success:
      "Registration received! The core team will review it and issue your Team ID and password.",
  };
}

/* ─────────────────────────── TEAM LOGIN ─────────────────────────── */

export async function teamLoginAction(_prev: unknown, formData: FormData) {
  const code = String(formData.get("team_code") ?? "").trim().toUpperCase();
  const password = String(formData.get("password") ?? "");
  if (!code || !password) return { error: "Enter your Team ID and password." };

  const supabase = createAdminClient();
  const { data: team } = await supabase
    .from("hack_teams")
    .select("id,password_hash,reg_status")
    .eq("team_code", code)
    .maybeSingle();

  if (!team || !verifyPassword(password, team.password_hash))
    return { error: "Invalid Team ID or password." };
  if (team.reg_status !== "approved")
    return { error: "Your team is still awaiting approval from the core team." };

  const store = await cookies();
  store.set(TEAM_COOKIE, team.id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/hackathon",
    maxAge: 60 * 60 * 24 * 7,
  });
  redirect("/hackathon/dashboard");
}

export async function teamLogoutAction() {
  const store = await cookies();
  store.delete(TEAM_COOKIE);
  redirect("/hackathon/login");
}

/* ─────────────────── CORE TEAM: approve / credentials ─────────────────── */

/** Approve a registration: assign team number, Team ID and password. */
export async function approveTeamAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const supabase = createAdminClient();

  const { data: existing } = await supabase
    .from("hack_teams")
    .select("team_no")
    .not("team_no", "is", null)
    .order("team_no", { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextNo = (existing?.team_no ?? 0) + 1;
  const code = `INF-T${String(nextNo).padStart(2, "0")}`;
  const password = generatePassword();

  await supabase
    .from("hack_teams")
    .update({
      reg_status: "approved",
      status: "active",
      team_no: nextNo,
      team_code: code,
      password_hash: hashPassword(password),
      // Plain password kept only so the core team can hand it over once.
      join_code: password,
      approved_at: new Date().toISOString(),
    })
    .eq("id", id);

  revalidatePath("/hackathon/manage");
  revalidatePath("/hackathon/leaderboard");
}

export async function rejectTeamAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const supabase = createAdminClient();
  await supabase.from("hack_teams").update({ reg_status: "rejected" }).eq("id", id);
  revalidatePath("/hackathon/manage");
}

/** Regenerate a team's password (if students lose it). */
export async function resetTeamPasswordAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const password = generatePassword();
  const supabase = createAdminClient();
  await supabase
    .from("hack_teams")
    .update({ password_hash: hashPassword(password), join_code: password })
    .eq("id", id);
  revalidatePath("/hackathon/manage");
}

/** Assign a unique problem envelope to a team. */
export async function assignProblemAction(formData: FormData) {
  const teamId = String(formData.get("team_id") ?? "");
  const problemId = String(formData.get("problem_id") ?? "");
  if (!teamId) return;
  const supabase = createAdminClient();
  await supabase
    .from("hack_teams")
    .update({ problem_id: problemId || null })
    .eq("id", teamId);
  revalidatePath("/hackathon/manage");
  revalidatePath("/hackathon/dashboard");
}

/* ─────────────────────────── SUBMISSION ─────────────────────────── */

export async function saveTeamSubmissionAction(_prev: unknown, formData: FormData) {
  const teamId = String(formData.get("team_id") ?? "");
  if (!teamId) return { error: "Missing team." };
  const finalize = formData.get("submit") === "true";

  const supabase = createAdminClient();
  const row = {
    team_id: teamId,
    github_url: String(formData.get("github_url") ?? "") || null,
    demo_url: String(formData.get("demo_url") ?? "") || null,
    presentation_url: String(formData.get("presentation_url") ?? "") || null,
    docs_url: String(formData.get("docs_url") ?? "") || null,
    notes: String(formData.get("notes") ?? "") || null,
    status: finalize ? ("submitted" as const) : ("draft" as const),
    submitted_at: finalize ? new Date().toISOString() : null,
  };
  const { error } = await supabase.from("hack_submissions").upsert(row, { onConflict: "team_id" });
  if (error) return { error: error.message };

  await supabase
    .from("hack_teams")
    .update({
      github_url: row.github_url,
      demo_url: row.demo_url,
      ...(finalize ? { status: "submitted", progress: 100 } : {}),
    })
    .eq("id", teamId);

  revalidatePath("/hackathon/dashboard");
  revalidatePath("/hackathon/judge");
  return { success: finalize ? "Project submitted to the judges." : "Draft saved." };
}

export async function updateProgressAction(formData: FormData) {
  const teamId = String(formData.get("team_id") ?? "");
  const progress = Number(formData.get("progress") ?? 0);
  if (!teamId) return;
  const supabase = createAdminClient();
  await supabase
    .from("hack_teams")
    .update({ progress: Math.max(0, Math.min(100, progress)) })
    .eq("id", teamId);
  revalidatePath("/hackathon/dashboard");
}

/* ─────────────────────────── JUDGING ─────────────────────────── */

/** Official marking sheet: A + B + C + D − penalties (total computed in DB). */
export async function saveOfficialScoreAction(_prev: unknown, formData: FormData) {
  const teamId = String(formData.get("team_id") ?? "");
  const judgeName = String(formData.get("judge_name") ?? "").trim();
  if (!teamId) return { error: "Missing team." };
  if (judgeName.length < 2) return { error: "Enter the judge's name." };

  const num = (k: string, max: number) =>
    Math.max(0, Math.min(max, Number(formData.get(k) ?? 0) || 0));

  const supabase = createAdminClient();

  // One row per (team, judge name) — judges are identified by name here since
  // they do not have accounts in this standalone module yet.
  const { data: existing } = await supabase
    .from("hack_scores")
    .select("id")
    .eq("team_id", teamId)
    .eq("comments", judgeName)
    .maybeSingle();

  const payload = {
    team_id: teamId,
    comments: judgeName,
    innovation: num("innovation", 10),
    practicality: num("practicality", 10),
    uiux: num("uiux", 10),
    working_demo: num("working_demo", 10),
    problem_solving: num("problem_solving", 10),
    presentation: num("presentation", 10),
    task_completion: num("task_completion", 20),
    code_quality: num("code_quality", 10),
    speed_bonus: num("speed_bonus", 10),
    bonus_challenge: num("bonus_challenge", 25),
    penalties: num("penalties", 999),
    notes: String(formData.get("notes") ?? "") || null,
    submitted: true,
  };

  const { error } = existing
    ? await supabase.from("hack_scores").update(payload).eq("id", existing.id)
    : await supabase.from("hack_scores").insert(payload);
  if (error) return { error: error.message };

  revalidatePath("/hackathon/judge");
  revalidatePath("/hackathon/leaderboard");
  return { success: "Score saved." };
}

/** Award / revoke an achievement card (feeds Section A). */
export async function toggleTeamCardAction(formData: FormData) {
  const teamId = String(formData.get("team_id") ?? "");
  const cardId = String(formData.get("card_id") ?? "");
  const has = formData.get("has") === "true";
  if (!teamId || !cardId) return;

  const supabase = createAdminClient();
  if (has) {
    await supabase
      .from("hack_team_cards")
      .delete()
      .eq("team_id", teamId)
      .eq("achievement_id", cardId);
  } else {
    await supabase.from("hack_team_cards").insert({ team_id: teamId, achievement_id: cardId });
  }

  // Recompute Section A + grand total for every judge's sheet on this team.
  await supabase.rpc("hack_recalc_team", { p_team_id: teamId });

  revalidatePath("/hackathon/judge");
  revalidatePath("/hackathon/dashboard");
  revalidatePath("/hackathon/leaderboard");
}
