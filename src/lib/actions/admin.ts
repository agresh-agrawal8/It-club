"use server";

import { revalidatePath } from "next/cache";
import { randomInt } from "crypto";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireCoreTeam } from "@/lib/auth";
import { isUsableName } from "@/lib/identity";

/**
 * Core-team account management.
 *
 * There is no way to read a member's password from here, because there is no
 * password to read: `auth.users` stores a bcrypt hash and nothing else. When
 * someone forgets theirs, the core team issues a NEW temporary credential
 * through `admin_reset_member_password`, which also flags the account so the
 * member must replace it at their next sign-in.
 *
 * Both database functions are SECURITY DEFINER and re-check `is_admin()`
 * themselves, so the authorization holds even if a caller reached them
 * without passing through requireCoreTeam().
 */

/**
 * A readable one-time credential to hand over in person.
 *
 * Ambiguous glyphs (I/l/1, O/0) are excluded so a password read off a screen
 * or a slip of paper cannot be mistyped, and randomInt() draws from the CSPRNG
 * rather than Math.random().
 */
function generateTemporaryPassword() {
  const words = ["orbit", "cipher", "vector", "photon", "quartz", "signal", "beacon", "lattice"];
  const word = words[randomInt(words.length)];
  const digits = String(randomInt(1000, 10000));
  const symbol = "!@#$%&*"[randomInt(7)];
  return `${word[0].toUpperCase()}${word.slice(1)}${digits}${symbol}`;
}

const createSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Enter the member's full name")
    .max(80, "That name is too long"),
  role: z.enum(["member", "core_team"]).default("member"),
});

export type CreateMemberState =
  | { error?: string; success?: boolean; name?: string; tempPassword?: string }
  | undefined;

/**
 * Provision an account. The generated password is returned to the creating
 * admin exactly once, in the action's response, so it can be handed over. It
 * is never written to the profile, never logged, and cannot be read back.
 */
export async function createMemberAction(
  _prev: CreateMemberState,
  formData: FormData,
): Promise<CreateMemberState> {
  await requireCoreTeam();

  const parsed = createSchema.safeParse({
    fullName: formData.get("fullName"),
    role: formData.get("role") ?? "member",
  });
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Check the form and try again." };
  }
  if (!isUsableName(parsed.data.fullName)) {
    return { error: "That name needs at least one letter or number." };
  }

  const tempPassword = generateTemporaryPassword();
  const supabase = await createClient();

  const { error } = await supabase.rpc("admin_create_member", {
    p_full_name: parsed.data.fullName,
    p_password: tempPassword,
    p_role: parsed.data.role,
  });

  if (error) {
    return { error: error.message.replace(/^.*?:\s*/, "") || "Could not create the account." };
  }

  revalidatePath("/admin/members");
  revalidatePath("/team");
  return { success: true, name: parsed.data.fullName, tempPassword };
}

export type ResetPasswordState =
  | { error?: string; success?: boolean; name?: string; tempPassword?: string }
  | undefined;

/** Issue a new temporary credential for a member who has lost theirs. */
export async function resetMemberPasswordAction(
  _prev: ResetPasswordState,
  formData: FormData,
): Promise<ResetPasswordState> {
  const { user } = await requireCoreTeam();

  const id = String(formData.get("id") ?? "");
  if (!z.string().uuid().safeParse(id).success) return { error: "Unknown member." };

  // Resetting your own password this way would skip the current-password
  // check that protects an unattended session. Use Change password instead.
  if (id === user.id) {
    return { error: "Use Change password for your own account." };
  }

  const supabase = await createClient();
  const { data: target } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", id)
    .single();
  if (!target) return { error: "Unknown member." };

  const tempPassword = generateTemporaryPassword();
  const { error } = await supabase.rpc("admin_reset_member_password", {
    p_profile_id: id,
    p_password: tempPassword,
  });
  if (error) return { error: "Could not reset that password." };

  revalidatePath("/admin/members");
  return { success: true, name: target.full_name, tempPassword };
}

/* ── Role and activation ────────────────────────────────────────────────── */

export async function setMemberRoleAction(formData: FormData) {
  const { user } = await requireCoreTeam();
  const id = String(formData.get("id") ?? "");
  const role = String(formData.get("role") ?? "");

  if (!["member", "core_team"].includes(role)) return;
  if (!z.string().uuid().safeParse(id).success) return;
  // Demoting yourself could leave the club with no core team at all.
  if (id === user.id) return;

  const supabase = await createClient();
  await supabase.from("profiles").update({ role }).eq("id", id);
  revalidatePath("/admin/members");
  revalidatePath("/team");
}

export async function toggleMemberActiveAction(formData: FormData) {
  const { user } = await requireCoreTeam();
  const id = String(formData.get("id") ?? "");
  const isActive = formData.get("is_active") === "true";

  if (!z.string().uuid().safeParse(id).success) return;
  if (id === user.id) return;

  const supabase = await createClient();
  await supabase.from("profiles").update({ is_active: !isActive }).eq("id", id);
  revalidatePath("/admin/members");
  revalidatePath("/team");
}
