"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { memberIdToEmail } from "@/lib/member-id";

const createMemberSchema = z.object({
  fullName: z.string().min(2),
  memberId: z.string().min(3),
  password: z.string().min(6),
  role: z.enum(["member", "admin"]).default("member"),
});

/**
 * Admin-only: provision a new club member account.
 *
 * Uses the `admin_create_member` Postgres function (SECURITY DEFINER) instead
 * of the Auth Admin API, so it works with the regular signed-in admin session
 * and does NOT require the service-role key. The function enforces the admin
 * check in the database and can never mint a super_admin.
 */
export async function createMemberAction(formData: FormData) {
  await requireAdmin();

  const parsed = createMemberSchema.safeParse({
    fullName: formData.get("fullName"),
    memberId: formData.get("memberId"),
    password: formData.get("password"),
    role: formData.get("role") ?? "member",
  });
  if (!parsed.success) {
    return { error: "Please fill all fields correctly (password ≥ 6 chars)." };
  }

  const { fullName, memberId, password, role } = parsed.data;
  const supabase = await createClient();

  const { error } = await supabase.rpc("admin_create_member", {
    p_email: memberIdToEmail(memberId),
    p_password: password,
    p_full_name: fullName,
    p_member_id: memberId,
    p_role: role,
  });

  if (error) {
    // Surface the friendly message raised by the DB function
    // (duplicate Member ID, etc.).
    return { error: error.message.replace(/^.*?:\s*/, "") || "Could not create the account." };
  }

  revalidatePath("/admin/members");
  revalidatePath("/team");
  return { success: true };
}
