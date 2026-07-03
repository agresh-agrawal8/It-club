import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isAdminRole } from "@/lib/utils";
import type { Profile } from "@/types/database";

/**
 * Returns the current auth user + profile, or null. Cached per-request so
 * multiple components can call it without extra round-trips.
 */
export const getCurrentUser = cache(async () => {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    return { user, profile: (profile as Profile) ?? null };
  } catch {
    // Supabase not configured — treat as signed out.
    return null;
  }
});

/** Require any authenticated user; redirect to /login otherwise. */
export async function requireUser() {
  const current = await getCurrentUser();
  if (!current) redirect("/login");
  return current;
}

/** Require an admin; redirect non-admins to their dashboard. */
export async function requireAdmin() {
  const current = await requireUser();
  if (!isAdminRole(current.profile?.role)) redirect("/dashboard");
  return current;
}
