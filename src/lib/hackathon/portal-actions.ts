"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createAdminClient, hasServiceRole } from "@/lib/supabase/server";
import { HACK_TAG } from "./data";
import { EVENT, QUIZ_REPS_REQUIRED, type MemberRole } from "./content";
import { TEAM_COOKIE, TEAM_COOKIE_OPTIONS, openPortalFor } from "./session";

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
