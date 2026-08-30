"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { authEmailForName, isUsableName } from "@/lib/identity";
import { requireUserAllowingPasswordChange } from "@/lib/auth";
import { homeForRole } from "@/lib/utils";

export type AuthState = { error?: string } | undefined;

const loginSchema = z.object({
  name: z.string().trim().min(1, "Enter your name"),
  password: z.string().min(1, "Enter your password"),
});

/**
 * Sign in with name + password.
 *
 * The failure message is deliberately identical for "no such member", "wrong
 * password" and "unusable name". Distinguishing them would turn the form into
 * a membership oracle that tells an anonymous visitor who is in the club.
 */
const GENERIC_FAILURE = "That name and password don't match an account.";

export async function loginAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = loginSchema.safeParse({
    name: formData.get("name"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }

  const { name, password } = parsed.data;
  if (!isUsableName(name)) return { error: GENERIC_FAILURE };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: authEmailForName(name),
    password,
  });
  if (error || !data.user) return { error: GENERIC_FAILURE };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, is_active, must_change_password")
    .eq("id", data.user.id)
    .single();

  // A deactivated account must not hold a live session.
  if (profile && profile.is_active === false) {
    await supabase.auth.signOut();
    return { error: GENERIC_FAILURE };
  }

  let destination = profile?.must_change_password
    ? "/account/password?forced=1"
    : homeForRole(profile?.role);

  // Honour ?redirect=, but only for local paths — an absolute URL here would
  // be an open redirect straight off the back of a successful sign-in.
  if (!profile?.must_change_password) {
    const requested = String(formData.get("redirect") ?? "");
    if (requested.startsWith("/") && !requested.startsWith("//")) {
      destination = requested;
    }
  }

  revalidatePath("/", "layout");
  redirect(destination);
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}

/* ── Changing your own password ─────────────────────────────────────────── */

const changeSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password"),
    newPassword: z
      .string()
      .min(8, "New password must be at least 8 characters")
      .max(128, "That password is too long"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "The two new passwords don't match",
    path: ["confirmPassword"],
  })
  .refine((d) => d.newPassword !== d.currentPassword, {
    message: "Choose a password you haven't used here before",
    path: ["newPassword"],
  });

export type PasswordState = { error?: string; success?: boolean } | undefined;

/**
 * Change your own password.
 *
 * The current password is re-verified first. Without that, anyone who found an
 * unattended signed-in browser could take the account over permanently, and a
 * stolen session cookie would become a stolen account.
 */
export async function changePasswordAction(
  _prev: PasswordState,
  formData: FormData,
): Promise<PasswordState> {
  const { user, profile } = await requireUserAllowingPasswordChange();

  const parsed = changeSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Check the form and try again." };
  }

  const supabase = await createClient();

  const { error: reauthError } = await supabase.auth.signInWithPassword({
    email: authEmailForName(profile.full_name),
    password: parsed.data.currentPassword,
  });
  if (reauthError) return { error: "Your current password isn't right." };

  // Supabase hashes with bcrypt on the way in; only the hash is ever stored.
  const { error } = await supabase.auth.updateUser({ password: parsed.data.newPassword });
  if (error) return { error: "Could not update the password. Try again." };

  await supabase
    .from("profiles")
    .update({ must_change_password: false })
    .eq("id", user.id);

  revalidatePath("/", "layout");
  return { success: true };
}
