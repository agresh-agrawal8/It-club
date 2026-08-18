"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createAdminClient, hasServiceRole } from "@/lib/supabase/server";
import { HACK_TAG, getConfig } from "./data";
import { EVENT, QUIZ_REPS_REQUIRED, type MemberRole } from "./content";
import { TEAM_COOKIE, TEAM_COOKIE_OPTIONS, getTeamSession, openPortalFor } from "./session";

/**
 * Public (team-facing) actions: registration, and opening or closing the team
 * portal.
 *
 * These are the only two things a visitor can do without a club admin session,
 * and neither of them can modify another team: registration only inserts, and
 * opening a portal only reads.
 */

const ROLES: MemberRole[] = ["captain", "frontend", "backend", "uiux", "docs"];

/* ─────────────────────────── Registration ─────────────────────────── */

type MemberInput = { name: string; class_section: string; role: MemberRole; quiz: boolean };

export type RegisterResult = { error: string } | { success: string; teamCode: string; teamName: string };

/**
 * Register a team.
 *
 * Enforces the guide's rules: 2–5 members, exactly one Team Captain, each role
 * held at most once, exactly two Quiz Representatives, at most 20 teams, and
 * no student on two teams. The heavy checks run inside one SECURITY DEFINER
 * transaction (`hack_register_team_v3`) so two simultaneous submissions cannot
 * race past the capacity limit or collide on a team number.
 *
 * No password is issued any more — the team opens its portal by name.
 */
export async function registerTeamAction(
  _prev: unknown,
  formData: FormData,
): Promise<RegisterResult> {
  const teamName = String(formData.get("team_name") ?? "").trim().replace(/\s+/g, " ");
  const school = String(formData.get("school") ?? "").trim();
  const tagline = String(formData.get("tagline") ?? "").trim();

  if (teamName.length < 3) return { error: "Give your team a name (3+ characters)." };
  if (teamName.length > 40) return { error: "Team names must be 40 characters or fewer." };

  const members: MemberInput[] = [];
  for (let i = 0; i < EVENT.maxTeamSize; i++) {
    const name = String(formData.get(`m${i}_name`) ?? "").trim().replace(/\s+/g, " ");
    const cls = String(formData.get(`m${i}_class`) ?? "").trim();
    const role = String(formData.get(`m${i}_role`) ?? "").trim();
    const quiz = formData.get(`m${i}_quiz`) === "on" || formData.get(`m${i}_quiz`) === "true";

    if (!name && !cls) continue; // blank row — teams may be smaller than five
    if (name.length < 2 || !cls) return { error: `Member ${i + 1}: enter both name and class/section.` };
    if (!ROLES.includes(role as MemberRole)) return { error: `Member ${i + 1}: pick a role.` };

    members.push({ name, class_section: cls, role: role as MemberRole, quiz });
  }

  if (members.length < EVENT.minTeamSize)
    return { error: `A team needs at least ${EVENT.minTeamSize} members.` };
  if (members.length > EVENT.maxTeamSize)
    return { error: `A team can have at most ${EVENT.maxTeamSize} members.` };

  if (members.filter((m) => m.role === "captain").length !== 1)
    return { error: "Pick exactly one Team Captain." };

  if (new Set(members.map((m) => m.role)).size !== members.length)
    return { error: "Each member needs a different role." };

  if (members.filter((m) => m.quiz).length !== QUIZ_REPS_REQUIRED)
    return { error: `Select exactly ${QUIZ_REPS_REQUIRED} Quiz Representatives.` };

  const keys = members.map((m) => `${m.name.toLowerCase()}|${m.class_section.toLowerCase()}`);
  if (new Set(keys).size !== keys.length)
    return { error: "The same student is listed twice in this team." };

  if (!hasServiceRole())
    return { error: "Registration is temporarily unavailable — please tell the core team." };

  const { data, error } = await createAdminClient().rpc("hack_register_team_v3", {
    p_team_name: teamName,
    p_school: school,
    p_tagline: tagline,
    p_members: members.map((m) => ({
      name: m.name,
      class_section: m.class_section,
      role: m.role,
      quiz: m.quiz,
    })),
  });

  if (error) {
    // Postgres RAISE messages arrive prefixed — show just the human sentence.
    return { error: error.message.replace(/^.*?:\s*/, "") || "Could not register the team." };
  }

  const result = data as { team_code?: string } | null;
  if (!result?.team_code) return { error: "Could not register the team. Tell the core team." };

  revalidateTag(HACK_TAG);
  revalidatePath("/hackathon/register");
  revalidatePath("/hackathon/admin");
  revalidatePath("/hackathon/manage");

  return {
    success: "Your team is registered.",
    teamCode: result.team_code,
    teamName,
  };
}

/* ─────────────────────────── Portal ─────────────────────────── */

/**
 * Open a team's portal from its exact name.
 *
 * The name is matched case-insensitively against a uniquely indexed
 * `lower(name)`, so it resolves to exactly one team or none — there is no way
 * for a near-match to open somebody else's portal.
 */
export async function openPortalAction(_prev: unknown, formData: FormData) {
  const name = String(formData.get("team_name") ?? "").trim();
  if (name.length < 2) return { error: "Enter your team name." };

  const opened = await openPortalFor(name);
  if (!opened) {
    return {
      error: "No team with that exact name. Check the spelling, or ask the core team.",
    };
  }

  const store = await cookies();
  store.set(TEAM_COOKIE, opened.token, TEAM_COOKIE_OPTIONS);
  redirect("/hackathon/team");
}

export async function closePortalAction() {
  const store = await cookies();
  store.delete(TEAM_COOKIE);
  redirect("/hackathon/team");
}

/* ─────────────────────────── Project submission ─────────────────────────── */

/**
 * Uploads go straight from the browser to Supabase Storage, not through this
 * server.
 *
 * A code archive can be tens of megabytes and Vercel caps a server-action
 * request body at ~4.5 MB, so streaming files through a Server Action would
 * fail on exactly the submissions that matter. Instead the server issues a
 * signed, single-use ticket for one specific path under the team's own folder,
 * and the browser PUTs the file to Supabase directly.
 */

const KINDS = {
  code: {
    bucket: "hack-submissions",
    maxBytes: 60 * 1024 * 1024,
    exts: ["zip", "rar", "7z", "gz", "tgz", "tar"],
    label: "code archive",
  },
  deck: {
    bucket: "hack-submissions",
    maxBytes: 25 * 1024 * 1024,
    exts: ["pdf", "pptx", "ppt", "odp", "key"],
    label: "pitch deck",
  },
} as const;

type UploadKind = keyof typeof KINDS;

function extensionOf(name: string) {
  const parts = name.toLowerCase().split(".");
  if (parts.length < 2) return "";
  // Treat .tar.gz as gz
  return parts[parts.length - 1];
}

export async function getUploadTicketAction(
  kind: string,
  fileName: string,
  size: number,
): Promise<{ error: string } | { signedUrl: string; path: string }> {
  const session = await getTeamSession();
  if (!session) return { error: "Your portal session expired. Open your portal again." };

  const config = await getConfig();
  if (!config.submissions_open) return { error: "The submission window is not open." };

  const spec = KINDS[kind as UploadKind];
  if (!spec) return { error: "Unknown upload type." };

  const ext = extensionOf(fileName);
  if (!spec.exts.includes(ext as never)) {
    return { error: `Your ${spec.label} must be a ${spec.exts.join(", ")} file.` };
  }
  if (!Number.isFinite(size) || size <= 0) return { error: "That file looks empty." };
  if (size > spec.maxBytes) {
    return { error: `Your ${spec.label} is larger than ${Math.round(spec.maxBytes / 1024 / 1024)} MB.` };
  }

  // The path is built here, from the session's team id — never from the client.
  const path = `${session.id}/${kind}-${Date.now()}.${ext}`;
  const { data, error } = await createAdminClient()
    .storage.from(spec.bucket)
    .createSignedUploadUrl(path);

  if (error || !data) return { error: "Could not start the upload. Try again." };
  return { signedUrl: data.signedUrl, path: data.path };
}

/**
 * Record what the team has handed in.
 *
 * The team id always comes from the signed cookie, and every supplied storage
 * path must sit under that team's own folder — otherwise a crafted request
 * could point one team's submission row at another team's file.
 */
export async function saveSubmissionAction(_prev: unknown, formData: FormData) {
  const session = await getTeamSession();
  if (!session) return { error: "Your portal session expired. Open your portal again." };

  const config = await getConfig();
  if (!config.submissions_open) return { error: "The submission window is closed." };

  const teamId = session.id;
  const finalize = formData.get("finalize") === "true";

  const ownPath = (value: FormDataEntryValue | null) => {
    const p = String(value ?? "").trim();
    if (!p) return null;
    return p.startsWith(`${teamId}/`) ? p : null;
  };

  const codePath = ownPath(formData.get("code_path"));
  const deckPath = ownPath(formData.get("deck_path"));
  const repoUrl = String(formData.get("repo_url") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (repoUrl && !/^https?:\/\/\S+$/i.test(repoUrl)) {
    return { error: "The repository link must start with http:// or https://" };
  }

  const supabase = createAdminClient();
  const { data: existing } = await supabase
    .from("hack_submissions")
    .select("code_path,deck_path")
    .eq("team_id", teamId)
    .maybeSingle();

  if (finalize) {
    const willHaveCode = codePath ?? existing?.code_path;
    const willHaveDeck = deckPath ?? existing?.deck_path;
    if (!willHaveCode || !willHaveDeck) {
      return { error: "Attach both your code archive and your pitch deck before submitting." };
    }
  }

  const patch: Record<string, unknown> = {
    team_id: teamId,
    repo_url: repoUrl || null,
    notes: notes || null,
    updated_at: new Date().toISOString(),
  };

  if (codePath) {
    patch.code_path = codePath;
    patch.code_name = String(formData.get("code_name") ?? "").slice(0, 200) || null;
    patch.code_size = Number(formData.get("code_size") ?? 0) || null;
  }
  if (deckPath) {
    patch.deck_path = deckPath;
    patch.deck_name = String(formData.get("deck_name") ?? "").slice(0, 200) || null;
    patch.deck_size = Number(formData.get("deck_size") ?? 0) || null;
  }
  if (finalize) {
    patch.status = "submitted";
    patch.submitted_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from("hack_submissions")
    .upsert(patch, { onConflict: "team_id" });
  if (error) return { error: error.message };

  // Replacing a file leaves the old object orphaned in the bucket.
  const stale = [
    codePath && existing?.code_path && existing.code_path !== codePath ? existing.code_path : null,
    deckPath && existing?.deck_path && existing.deck_path !== deckPath ? existing.deck_path : null,
  ].filter(Boolean) as string[];
  if (stale.length) await supabase.storage.from("hack-submissions").remove(stale);

  revalidateTag(HACK_TAG);
  revalidatePath("/hackathon/team");
  revalidatePath("/hackathon/manage");

  return {
    success: finalize
      ? "Project submitted. You can still replace files until the window closes."
      : "Draft saved.",
  };
}
