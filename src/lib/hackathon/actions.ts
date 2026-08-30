"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { requireCoreTeam } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { HACK_TAG } from "./data";
import { ENVELOPES, type MemberRole } from "./content";

/**
 * Infinium — core team (organiser) actions.
 *
 * Every export of a `"use server"` module is a live POST endpoint, so each one
 * authorises for itself with `requireCoreTeam()`. There is no judge role and no
 * team-side write anywhere in this module: after the move to offline judging,
 * the only people who write hackathon data are club admins.
 */

const MEMBER_ROLES: MemberRole[] = ["captain", "frontend", "backend", "uiux", "docs"];
const TEAM_STATUSES = ["forming", "active", "submitted", "disqualified"];

/**
 * Public reads are cached across requests, so every write must drop the tag or
 * an organiser's change would not appear until the cache expired.
 */
function revalidateHack() {
  revalidateTag(HACK_TAG);
  for (const p of [
    "/hackathon",
    "/hackathon/admin",
    "/hackathon/manage",
    "/hackathon/envelopes",
    "/hackathon/team",
    "/hackathon/leaderboard",
    "/hackathon/register",
  ]) {
    revalidatePath(p);
  }
}

/* ─────────────────────────── Announcements ─────────────────────────── */

export async function postAnnouncementAction(_prev: unknown, formData: FormData) {
  await requireCoreTeam();

  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const pinned = formData.get("pinned") === "on" || formData.get("pinned") === "true";
  if (title.length < 3) return { error: "Give the announcement a title." };

  const { error } = await createAdminClient()
    .from("hack_announcements")
    .insert({ title, body: body || null, pinned });
  if (error) return { error: error.message };

  revalidateHack();
  return { success: "Announcement posted." };
}

/* ─────────────────────────── Teams ─────────────────────────── */

export async function updateTeamDetailsAction(_prev: unknown, formData: FormData) {
  await requireCoreTeam();
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Missing team." };

  const name = String(formData.get("name") ?? "").trim();
  const school = String(formData.get("school") ?? "").trim();
  const tagline = String(formData.get("tagline") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim();

  if (name.length < 3) return { error: "Team name needs at least 3 characters." };
  if (!TEAM_STATUSES.includes(status)) return { error: "Pick a valid team status." };

  const supabase = createAdminClient();

  // Names must stay unique — the portal resolves a team by its name, so a
  // duplicate would make one of the two unreachable.
  const { data: clash } = await supabase
    .from("hack_teams")
    .select("id")
    .ilike("name", name)
    .neq("id", id)
    .maybeSingle();
  if (clash) return { error: "Another team already uses that name." };

  const { error } = await supabase
    .from("hack_teams")
    .update({
      name,
      school: school || null,
      tagline: tagline || null,
      status,
    })
    .eq("id", id);
  if (error) return { error: error.message };

  revalidateHack();
  return { success: "Team details saved." };
}

/**
 * Permanently delete a team. Members and results go with it via ON DELETE
 * CASCADE, so the exact team name is required as confirmation.
 */
export async function deleteTeamAction(_prev: unknown, formData: FormData) {
  await requireCoreTeam();
  const id = String(formData.get("id") ?? "");
  const confirmName = String(formData.get("confirm_name") ?? "").trim();
  if (!id) return { error: "Missing team." };

  const supabase = createAdminClient();
  const { data: team } = await supabase.from("hack_teams").select("name").eq("id", id).maybeSingle();
  if (!team) return { error: "That team no longer exists." };

  if (confirmName.toLowerCase() !== team.name.toLowerCase()) {
    return { error: `Type the team name exactly ("${team.name}") to confirm deletion.` };
  }

  const { error } = await supabase.from("hack_teams").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidateHack();
  return { success: `"${team.name}" and all its data were deleted.` };
}

/* ─────────────────────────── Envelopes ─────────────────────────── */

/**
 * Postgres RAISE messages arrive prefixed with context; show just the sentence
 * the function actually wrote for the organiser.
 */
function humanise(message: string) {
  return message.replace(/^.*?:\s*/, "").trim() || "Something went wrong.";
}

/**
 * Assign, swap or clear a team's sealed envelope.
 *
 * All the decision-making is in `hack_assign_envelope` (migration 0022), which
 * holds an advisory lock for the duration — so two organisers working at once
 * cannot both claim the same envelope, and a swap cannot momentarily violate
 * the unique index. This used to be a bare UPDATE whose error was discarded,
 * which meant a rejected assignment looked identical to a successful one.
 */
export async function assignEnvelopeAction(_prev: unknown, formData: FormData) {
  await requireCoreTeam();
  const teamId = String(formData.get("team_id") ?? "");
  const raw = String(formData.get("envelope_no") ?? "").trim();
  if (!teamId) return { error: "Missing team." };

  const no = raw === "" ? null : Number(raw);
  if (no !== null && (!Number.isInteger(no) || !ENVELOPES.some((e) => e.no === no))) {
    return { error: "Pick a valid envelope." };
  }

  const { data, error } = await createAdminClient().rpc("hack_assign_envelope", {
    p_team_id: teamId,
    p_envelope_no: no,
  });
  if (error) return { error: humanise(error.message) };

  revalidateHack();

  const r = data as { action: string; team: string; with?: string };
  switch (r.action) {
    case "cleared":
      return { success: `Cleared ${r.team}'s envelope.` };
    case "unchanged":
      return { success: `${r.team} already had that envelope.` };
    case "swapped":
      return { success: `Swapped envelopes between ${r.team} and ${r.with}.` };
    default:
      return { success: `Assigned to ${r.team}.` };
  }
}

/**
 * Draw envelopes for every team that does not have one yet.
 *
 * This is the briefing-day operation: a fair random draw from whatever is
 * still free, done in one transaction so it cannot half-complete.
 */
export async function drawEnvelopesAction(_prev: unknown, _formData: FormData) {
  await requireCoreTeam();

  const { data, error } = await createAdminClient().rpc("hack_draw_envelopes");
  if (error) return { error: humanise(error.message) };

  revalidateHack();

  const r = data as { assigned: number; skipped: number };
  if (r.assigned === 0 && r.skipped === 0) {
    return { success: "Every team already has an envelope." };
  }
  const tail = r.skipped > 0 ? ` ${r.skipped} team(s) left over — only 20 envelopes exist.` : "";
  return { success: `Drew ${r.assigned} envelope${r.assigned === 1 ? "" : "s"}.${tail}` };
}

/** Unassign every envelope — a reset before a fresh draw. */
export async function clearEnvelopesAction(_prev: unknown, _formData: FormData) {
  await requireCoreTeam();

  const { data, error } = await createAdminClient().rpc("hack_clear_envelopes");
  if (error) return { error: humanise(error.message) };

  revalidateHack();
  const r = data as { cleared: number };
  return { success: `Cleared ${r.cleared} assignment${r.cleared === 1 ? "" : "s"}.` };
}

/* ─────────────────────────── Members ─────────────────────────── */

/**
 * Keep a team inside the event rules: at most 5 members, each of the five
 * roles held at most once, at most 2 quiz representatives.
 */
async function checkComposition(
  supabase: ReturnType<typeof createAdminClient>,
  teamId: string,
  change: { memberId?: string; role?: MemberRole; quiz?: boolean },
) {
  const { data } = await supabase
    .from("hack_participants")
    .select("id,member_role,is_quiz_rep")
    .eq("team_id", teamId);

  const rows = (data ?? []).map((m: { id: string; member_role: string; is_quiz_rep: boolean }) => ({
    id: m.id,
    role: m.member_role,
    quiz: Boolean(m.is_quiz_rep),
  }));

  if (change.memberId) {
    const target = rows.find((r) => r.id === change.memberId);
    if (target) {
      if (change.role) target.role = change.role;
      if (change.quiz !== undefined) target.quiz = change.quiz;
    }
  } else if (change.role) {
    rows.push({ id: "new", role: change.role, quiz: Boolean(change.quiz) });
  }

  if (rows.length > 5) return "A team can have at most 5 members.";

  const counts = new Map<string, number>();
  for (const r of rows) counts.set(r.role, (counts.get(r.role) ?? 0) + 1);
  for (const [role, n] of counts) {
    if (n > 1) return `Two members cannot both be ${role}. Each role is held once.`;
  }

  if (rows.filter((r) => r.quiz).length > 2)
    return "A team can have at most 2 quiz representatives.";

  return null;
}

export async function updateMemberAction(_prev: unknown, formData: FormData) {
  await requireCoreTeam();
  const memberId = String(formData.get("member_id") ?? "");
  const teamId = String(formData.get("team_id") ?? "");
  if (!memberId || !teamId) return { error: "Missing member." };

  const name = String(formData.get("name") ?? "").trim();
  const classSection = String(formData.get("class_section") ?? "").trim();
  const role = String(formData.get("member_role") ?? "").trim();
  const quiz = formData.get("is_quiz_rep") === "on" || formData.get("is_quiz_rep") === "true";

  if (name.length < 2) return { error: "Enter the member's full name." };
  if (!classSection) return { error: "Enter the member's class/section." };
  if (!MEMBER_ROLES.includes(role as MemberRole)) return { error: "Pick a valid role." };

  const supabase = createAdminClient();
  const problem = await checkComposition(supabase, teamId, {
    memberId,
    role: role as MemberRole,
    quiz,
  });
  if (problem) return { error: problem };

  const { data: elsewhere } = await supabase
    .from("hack_participants")
    .select("id")
    .neq("id", memberId)
    .not("team_id", "is", null)
    .ilike("name", name)
    .ilike("class_section", classSection)
    .maybeSingle();
  if (elsewhere) return { error: `${name} (${classSection}) is already on another team.` };

  const { error } = await supabase
    .from("hack_participants")
    .update({ name, class_section: classSection, member_role: role, is_quiz_rep: quiz })
    .eq("id", memberId)
    .eq("team_id", teamId);
  if (error) {
    if (error.code === "23505") return { error: `${name} (${classSection}) is already registered.` };
    return { error: error.message };
  }

  revalidateHack();
  return { success: "Member updated." };
}

export async function addMemberAction(_prev: unknown, formData: FormData) {
  await requireCoreTeam();
  const teamId = String(formData.get("team_id") ?? "");
  if (!teamId) return { error: "Missing team." };

  const name = String(formData.get("name") ?? "").trim();
  const classSection = String(formData.get("class_section") ?? "").trim();
  const role = String(formData.get("member_role") ?? "").trim();
  const quiz = formData.get("is_quiz_rep") === "on" || formData.get("is_quiz_rep") === "true";

  if (name.length < 2) return { error: "Enter the member's full name." };
  if (!classSection) return { error: "Enter the member's class/section." };
  if (!MEMBER_ROLES.includes(role as MemberRole)) return { error: "Pick a valid role." };

  const supabase = createAdminClient();
  const problem = await checkComposition(supabase, teamId, { role: role as MemberRole, quiz });
  if (problem) return { error: problem };

  const { data: elsewhere } = await supabase
    .from("hack_participants")
    .select("id")
    .not("team_id", "is", null)
    .ilike("name", name)
    .ilike("class_section", classSection)
    .maybeSingle();
  if (elsewhere) return { error: `${name} (${classSection}) is already on a team.` };

  const { error } = await supabase.from("hack_participants").insert({
    name,
    class_section: classSection,
    member_role: role,
    is_quiz_rep: quiz,
    team_id: teamId,
  });
  if (error) {
    if (error.code === "23505") return { error: `${name} (${classSection}) is already registered.` };
    return { error: error.message };
  }

  revalidateHack();
  return { success: `${name} added.` };
}

export async function removeMemberAction(_prev: unknown, formData: FormData) {
  await requireCoreTeam();
  const memberId = String(formData.get("member_id") ?? "");
  const teamId = String(formData.get("team_id") ?? "");
  if (!memberId || !teamId) return { error: "Missing member." };

  const supabase = createAdminClient();
  const { count } = await supabase
    .from("hack_participants")
    .select("id", { count: "exact", head: true })
    .eq("team_id", teamId);

  if ((count ?? 0) <= 2)
    return { error: "A team needs at least 2 members — edit this member instead of removing them." };

  const { error } = await supabase
    .from("hack_participants")
    .delete()
    .eq("id", memberId)
    .eq("team_id", teamId);
  if (error) return { error: error.message };

  revalidateHack();
  return { success: "Member removed." };
}

/* ─────────────────────────── Results ─────────────────────────── */

const MAX_SHEET_BYTES = 8 * 1024 * 1024;
const SHEET_TYPES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "application/pdf": "pdf",
};

/**
 * Record a team's offline result: the final value from the paper sheet, any
 * remarks, and a scan or photo of the sheet itself.
 *
 * Nothing is computed here — the number is whatever the judges wrote down. The
 * row stays unpublished until the organisers explicitly publish it, so drafts
 * entered during the closing ceremony are never visible to teams.
 */
export async function saveResultAction(_prev: unknown, formData: FormData) {
  await requireCoreTeam();
  const teamId = String(formData.get("team_id") ?? "");
  if (!teamId) return { error: "Missing team." };

  const scoreRaw = String(formData.get("final_score") ?? "").trim();
  const remarks = String(formData.get("remarks") ?? "").trim();

  let finalScore: number | null = null;
  if (scoreRaw !== "") {
    const n = Number(scoreRaw);
    if (!Number.isFinite(n) || n < 0 || n > 9999) return { error: "Enter a valid final score." };
    finalScore = Math.round(n * 100) / 100;
  }

  const supabase = createAdminClient();

  // Optional new scan of the paper sheet.
  let sheetPath: string | undefined;
  let stalePath: string | null = null;
  const file = formData.get("sheet");
  if (file instanceof File && file.size > 0) {
    const ext = SHEET_TYPES[file.type];
    if (!ext) return { error: "The sheet must be a PNG, JPEG, WebP or PDF." };
    if (file.size > MAX_SHEET_BYTES) return { error: "That file is larger than 8 MB." };

    const path = `${teamId}/sheet-${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("hack-sheets")
      .upload(path, file, { contentType: file.type, upsert: false });
    if (uploadError) return { error: `Could not upload the sheet: ${uploadError.message}` };

    const { data: prev } = await supabase
      .from("hack_results")
      .select("sheet_path")
      .eq("team_id", teamId)
      .maybeSingle();
    stalePath = prev?.sheet_path ?? null;
    sheetPath = path;
  }

  const { error } = await supabase.from("hack_results").upsert(
    {
      team_id: teamId,
      final_score: finalScore,
      remarks: remarks || null,
      ...(sheetPath ? { sheet_path: sheetPath } : {}),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "team_id" },
  );
  if (error) return { error: error.message };

  // Only now is the old scan safe to drop. Deleting it before the row was
  // written would destroy the previous sheet while the database still pointed
  // at it — leaving the team's Achievement Card showing a broken image with
  // nothing to fall back to.
  if (stalePath && stalePath !== sheetPath) {
    await supabase.storage.from("hack-sheets").remove([stalePath]);
  }

  revalidateHack();
  return { success: "Result saved." };
}

/** Publish or unpublish one team's result. */
export async function toggleResultPublishedAction(_prev: unknown, formData: FormData) {
  await requireCoreTeam();
  const teamId = String(formData.get("team_id") ?? "");
  const published = formData.get("published") === "true";
  if (!teamId) return { error: "Missing team." };

  const supabase = createAdminClient();

  // Publishing a team that has no score would upsert a row with a null score,
  // and the portal would show that team a big "—" as its official result.
  // Refuse instead: there is nothing meaningful to publish yet.
  if (!published) {
    const { data: existing } = await supabase
      .from("hack_results")
      .select("final_score")
      .eq("team_id", teamId)
      .maybeSingle();
    if (existing?.final_score == null) {
      return { error: "Enter and save a final score before publishing this team." };
    }
  }

  const { error } = await supabase
    .from("hack_results")
    .upsert(
      { team_id: teamId, published: !published, updated_at: new Date().toISOString() },
      { onConflict: "team_id" },
    );
  if (error) return { error: error.message };

  revalidateHack();
  return { success: published ? "Hidden from the team." : "Published to the team." };
}

/** Publish every entered result at once — for the closing ceremony. */
export async function publishAllResultsAction(_prev?: unknown, _formData?: FormData) {
  await requireCoreTeam();

  const { data, error } = await createAdminClient()
    .from("hack_results")
    .update({ published: true, updated_at: new Date().toISOString() })
    .not("final_score", "is", null)
    .select("team_id");
  if (error) return { error: error.message };

  revalidateHack();
  const n = data?.length ?? 0;
  return {
    success:
      n === 0
        ? "No results to publish yet — enter the scores first."
        : `Published ${n} result${n === 1 ? "" : "s"}.`,
  };
}

/* ─────────────────────────── Day switches ─────────────────────────── */

/**
 * The two levers the core team pulls on the day.
 *
 * `briefs_released` gates whether a team's sealed problem text is assembled at
 * all — before it flips, the brief never leaves the server. `submissions_open`
 * gates both the upload ticket and the save, so closing it at code freeze
 * genuinely stops late hand-ins rather than merely hiding the form.
 */
async function setConfig(patch: Record<string, unknown>) {
  await requireCoreTeam();
  const { error } = await createAdminClient()
    .from("hack_config")
    .upsert({ id: true, ...patch, updated_at: new Date().toISOString() }, { onConflict: "id" });
  if (error) return { error: humanise(error.message) };
  revalidateHack();
  return null;
}

/**
 * These two are the most consequential buttons of the day — releasing the
 * sealed briefs at 9:20 and closing submissions at code freeze — so a failure
 * must never look like a success. They previously discarded the write error,
 * which would have left an organiser staring at an unchanged page with no
 * idea the flip had not happened.
 */
export async function toggleBriefsReleasedAction(_prev: unknown, formData: FormData) {
  const released = formData.get("released") === "true";
  const failed = await setConfig({ briefs_released: !released });
  if (failed) return failed;
  return {
    success: released
      ? "Briefs re-sealed. Teams can no longer read them."
      : "Briefs released. Every team can now read its problem.",
  };
}

export async function toggleSubmissionsOpenAction(_prev: unknown, formData: FormData) {
  const open = formData.get("open") === "true";
  const failed = await setConfig({ submissions_open: !open });
  if (failed) return failed;
  return {
    success: open
      ? "Submissions closed. Further uploads are rejected."
      : "Submissions open. Teams can hand in their work.",
  };
}

export async function deleteAnnouncementAction(_prev: unknown, formData: FormData) {
  await requireCoreTeam();
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Missing announcement." };

  const { error } = await createAdminClient().from("hack_announcements").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidateHack();
  return { success: "Announcement deleted." };
}
