import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isCoreTeam, homeForRole } from "@/lib/utils";
import type { Profile } from "@/types/database";

/**
 * Server-side authorization.
 *
 * Every guard here runs on the server and re-reads the role from the database
 * on each request — the role is never taken from a cookie, a client prop, or
 * the JWT's user metadata, all of which the browser can influence. RLS in
 * Postgres is the second layer: even a guard that was somehow skipped cannot
 * read or write rows the signed-in account is not entitled to.
 */

/** The columns any part of the app may see. Never `select("*")` on profiles. */
const PROFILE_COLUMNS =
  "id, full_name, role, avatar_url, bio, headline, grade, skills, github_url, " +
  "linkedin_url, website_url, phone, phone_verified, is_active, " +
  "must_change_password, last_active_at, created_at, updated_at";

/**
 * The current auth user + profile, or null. Cached per request so several
 * components can call it without extra round-trips.
 */
export const getCurrentUser = cache(async () => {
  try {
    const supabase = await createClient();
    // getUser() revalidates the token with the auth server; getSession() would
    // trust whatever is in the cookie.
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profile } = await supabase
      .from("profiles")
      .select(PROFILE_COLUMNS)
      .eq("id", user.id)
      .single();

    return { user, profile: (profile as Profile | null) ?? null };
  } catch {
    // Supabase not configured — treat as signed out.
    return null;
  }
});

/**
 * Require any authenticated, active account.
 *
 * A deactivated account is signed out rather than merely redirected: leaving
 * the session alive would let it keep hitting API routes.
 */
export async function requireUser() {
  const current = await getCurrentUser();
  if (!current?.profile) redirect("/login");
  if (!current.profile.is_active) redirect("/login?error=inactive");

  // A core-team reset parks the account on a temporary credential. Nothing
  // else in the member area opens until it has been replaced.
  if (current.profile.must_change_password) redirect("/account/password?forced=1");

  return current as { user: NonNullable<typeof current.user>; profile: Profile };
}

/** Require core team; send everyone else to their own home. */
export async function requireCoreTeam() {
  const current = await requireUser();
  if (!isCoreTeam(current.profile.role)) redirect(homeForRole(current.profile.role));
  return current;
}

/**
 * Like requireUser, but tolerated while the forced password change is pending
 * — otherwise /account/password would redirect to itself forever.
 */
export async function requireUserAllowingPasswordChange() {
  const current = await getCurrentUser();
  if (!current?.profile) redirect("/login");
  if (!current.profile.is_active) redirect("/login?error=inactive");
  return current as { user: NonNullable<typeof current.user>; profile: Profile };
}
