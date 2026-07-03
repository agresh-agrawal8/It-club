"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { memberIdToEmail } from "@/lib/member-id";

const loginSchema = z.object({
  memberId: z.string().min(1, "Member ID or email is required"),
  password: z.string().min(1, "Password is required"),
});

export type AuthState = { error?: string } | undefined;

/**
 * Member login. Accounts are provisioned by admins with a Member ID that is
 * mapped to an internal email (memberid@members.local) at creation time, so
 * members sign in with their Member ID + password.
 */
export async function loginAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = loginSchema.safeParse({
    memberId: formData.get("memberId"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }

  const supabase = await createClient();
  // Core team members may sign in with their real email; regular members use
  // their Member ID (mapped to a synthetic auth email).
  const raw = parsed.data.memberId.trim();
  const email = raw.includes("@") ? raw.toLowerCase() : memberIdToEmail(raw);

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password: parsed.data.password,
  });

  if (error) {
    return { error: "Invalid Member ID / email or password." };
  }

  const redirectTo = (formData.get("redirect") as string) || "/dashboard";
  revalidatePath("/", "layout");
  redirect(redirectTo);
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}
