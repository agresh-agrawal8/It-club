"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getEvent, resolveTheme } from "@/lib/events/engine";
import {
  eventCookieName,
  mintSessionToken,
  sessionCookieOptions,
} from "@/lib/events/session";
import { generateLoginCode, generatePassword, hashPassword } from "@/lib/events/credentials";

/**
 * Public registration + login for any event.
 *
 * Both flows go through SECURITY DEFINER RPCs: anonymous visitors cannot (and
 * must not) write to ev_* directly, and the event's rules — window, capacity,
 * team size, one-team-per-person — are enforced inside one transaction so two
 * simultaneous submissions cannot race past them.
 */

export type EventRegisterResult =
  | { error: string }
  | { success: string; loginCode: string; password: string };

const memberSchema = z.object({
  full_name: z.string().trim().min(2),
  email: z.string().trim().email().optional().or(z.literal("")),
  institution: z.string().trim().optional(),
  grade: z.string().trim().optional(),
  role_label: z.string().trim().optional(),
});

export async function registerEventTeamAction(
  _prev: unknown,
  formData: FormData,
): Promise<EventRegisterResult> {
  const slug = String(formData.get("event_slug") ?? "");
  const event = await getEvent(slug);
  if (!event) return { error: "Unknown event." };

  const teamName = String(formData.get("team_name") ?? "").trim();
  const tagline = String(formData.get("tagline") ?? "").trim();
  if (teamName.length < 3) return { error: "Give your team a name (3+ characters)." };

  // Collect member rows up to the event's own maximum.
  const members: z.infer<typeof memberSchema>[] = [];
  for (let i = 0; i < event.team_max; i++) {
    const full_name = String(formData.get(`m${i}_name`) ?? "").trim();
    const email = String(formData.get(`m${i}_email`) ?? "").trim();
    const institution = String(formData.get(`m${i}_institution`) ?? "").trim();
    const grade = String(formData.get(`m${i}_grade`) ?? "").trim();
    if (!full_name && !email) continue; // blank row

    const parsed = memberSchema.safeParse({ full_name, email, institution, grade });
    if (!parsed.success) {
      return {
        error: `Member ${i + 1}: enter a full name (and a valid email, if you give one).`,
      };
    }
    members.push(parsed.data);
  }

  if (members.length < event.team_min)
    return {
      error: `A team needs at least ${event.team_min} member${event.team_min === 1 ? "" : "s"}.`,
    };
  if (members.length > event.team_max)
    return { error: `A team can have at most ${event.team_max} members.` };

  const dupe = new Set(members.map((m) => `${m.full_name.toLowerCase()}|${(m.email ?? "").toLowerCase()}`));
  if (dupe.size !== members.length) return { error: "The same person is listed twice." };

  // Credentials are minted here and returned once; the DB stores only the hash
  // (plus the plain value for organiser re-issue, as documented in 0017).
  const theme = resolveTheme(event);
  const loginCode = generateLoginCode(theme.codename || "EV");
  const password = generatePassword();

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("ev_register_team", {
    p_event_slug: slug,
    p_team_name: teamName,
    p_tagline: tagline,
    p_members: members.map((m) => ({
      full_name: m.full_name,
      email: m.email || null,
      institution: m.institution || null,
      grade: m.grade || null,
      role_label: m.role_label || null,
    })),
    p_login_code: loginCode,
    p_password_hash: hashPassword(password),
    p_password_plain: password,
  });

  if (error) {
    // Postgres RAISE messages arrive prefixed; show just the human sentence.
    return { error: error.message.replace(/^.*?:\s*/, "") || "Could not register the team." };
  }

  const result = data as { login_code?: string } | null;
  if (!result?.login_code) return { error: "Could not issue your credentials. Tell the organisers." };

  revalidatePath(`/events/hub/${slug}`);
  revalidatePath(`/events/hub/${slug}/admin`);
  return {
    success: "Your team is registered. Save these credentials — you need them to sign in.",
    loginCode: result.login_code,
    password,
  };
}

/* ─────────────────────────────── LOGIN ─────────────────────────────── */

export async function eventTeamLoginAction(_prev: unknown, formData: FormData) {
  const slug = String(formData.get("event_slug") ?? "");
  const code = String(formData.get("login_code") ?? "").trim().toUpperCase();
  const password = String(formData.get("password") ?? "");
  if (!slug || !code || !password) return { error: "Enter your Team ID and password." };

  const supabase = await createClient();

  // Fetch only the salt, hash the attempt with it, let Postgres compare.
  const { data: salt } = await supabase.rpc("ev_credential_salt", {
    p_event_slug: slug,
    p_login_code: code,
  });
  if (!salt) return { error: "Invalid Team ID or password." };

  const { data: result, error } = await supabase.rpc("ev_team_login", {
    p_event_slug: slug,
    p_login_code: code,
    p_password_hash: hashPassword(password, String(salt)),
  });
  if (error) return { error: "Could not sign in right now. Please try again." };

  const res = result as { ok: boolean; reason?: string; participant_id?: string } | null;
  if (!res?.ok) {
    if (res?.reason === "locked")
      return { error: "Too many failed attempts. Try again in 15 minutes." };
    return { error: "Invalid Team ID or password." };
  }

  const store = await cookies();
  store.set(
    eventCookieName(slug),
    mintSessionToken(res.participant_id!),
    sessionCookieOptions(slug),
  );
  redirect(`/events/hub/${slug}/dashboard`);
}

export async function eventLogoutAction(formData: FormData) {
  const slug = String(formData.get("event_slug") ?? "");
  const store = await cookies();
  // Delete with the same options the cookie was written with, or the browser
  // keeps it (a mismatched path/name pair is a no-op).
  store.set(eventCookieName(slug), "", { ...sessionCookieOptions(slug), maxAge: 0 });
  redirect(`/events/hub/${slug}`);
}
