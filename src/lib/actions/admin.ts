"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { memberIdToEmail } from "@/lib/member-id";

const createMemberSchema = z.object({
  fullName: z.string().min(2),
  memberId: z.string().min(3),
  password: z.string().min(6),
  role: z.enum(["member", "admin"]).default("member"),
});

/**
 * Admin-only: provision a new club member account. Uses the service-role
 * client to create the auth user; the handle_new_user() trigger then creates
 * the matching profile row with the supplied member_id + role.
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

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return {
      error:
        "Account creation needs the SUPABASE_SERVICE_ROLE_KEY env var (Supabase → Settings → API keys → secret key). Add it on Vercel and locally, then try again.",
    };
  }

  const admin = createAdminClient();
  const { fullName, memberId, password, role } = parsed.data;

  const { error } = await admin.auth.admin.createUser({
    email: memberIdToEmail(memberId),
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName, member_id: memberId, role },
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/members");
  return { success: true };
}
