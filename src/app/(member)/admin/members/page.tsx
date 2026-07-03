import type { Metadata } from "next";
import { ShieldCheck, ShieldOff, UserCheck, UserX } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { CreateMemberForm } from "./create-member-form";
import { AdminPageHeader } from "@/components/admin/admin-shell";
import { setMemberRoleAction, toggleMemberActiveAction } from "@/lib/actions/content";
import { formatDate, isAdminRole, roleLabel } from "@/lib/utils";
import type { Profile } from "@/types/database";

export const metadata: Metadata = { title: "Manage Members" };

export default async function AdminMembersPage() {
  const { user } = await requireAdmin();

  // All profiles including deactivated ones — the public getTeam() filter
  // would hide inactive members and make deactivation irreversible here.
  let members: Profile[] = [];
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: true });
    members = (data as Profile[]) ?? [];
  } catch {
    members = [];
  }

  return (
    <div className="flex flex-col gap-8">
      <AdminPageHeader
        title="Members"
        description="Provision accounts, promote members to core team and control access."
        backHref="/admin"
      />

      <Card deep className="p-6 md:p-8">
        <h2 className="mb-6 text-sm font-semibold uppercase tracking-wide text-zinc-400">
          Create a new member
        </h2>
        <CreateMemberForm />
      </Card>

      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">
          All members · {members.length}
        </h2>
        <div className="glass overflow-hidden rounded-3xl">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-white/10 text-xs uppercase tracking-wide text-zinc-500">
                <tr>
                  <th className="px-5 py-3.5 font-medium">Member</th>
                  <th className="px-5 py-3.5 font-medium">Member ID</th>
                  <th className="px-5 py-3.5 font-medium">Role</th>
                  <th className="px-5 py-3.5 font-medium">Joined</th>
                  <th className="px-5 py-3.5 font-medium">Status</th>
                  <th className="px-5 py-3.5 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {members.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center text-zinc-500">
                      No members yet. Create the first account above.
                    </td>
                  </tr>
                )}
                {members.map((m) => {
                  const isSelf = m.id === user.id;
                  const locked = isSelf || m.role === "super_admin";
                  return (
                    <tr key={m.id} className="transition-colors hover:bg-white/[0.03]">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar name={m.full_name || "Member"} src={m.avatar_url} size="sm" />
                          <div>
                            <span className="font-medium text-white">{m.full_name || "—"}</span>
                            {isSelf && <span className="ml-2 text-[10px] text-zinc-500">(you)</span>}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-zinc-400">{m.member_id ?? "—"}</td>
                      <td className="px-5 py-3">
                        <Badge variant={isAdminRole(m.role) ? "accent" : "small"}>
                          {roleLabel(m.role)}
                        </Badge>
                      </td>
                      <td className="px-5 py-3 text-zinc-400">{formatDate(m.created_at)}</td>
                      <td className="px-5 py-3">
                        <span className="flex items-center gap-2 text-xs text-zinc-400">
                          <span
                            className={`h-2 w-2 rounded-full ${m.is_active ? "bg-emerald-400" : "bg-zinc-600"}`}
                          />
                          {m.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        {locked ? (
                          <span className="block text-right text-[11px] text-zinc-600">
                            {m.role === "super_admin" ? "Master admin" : "—"}
                          </span>
                        ) : (
                          <div className="flex items-center justify-end gap-2">
                            {/* Promote / demote */}
                            <form action={setMemberRoleAction}>
                              <input type="hidden" name="id" value={m.id} />
                              <input
                                type="hidden"
                                name="role"
                                value={m.role === "admin" ? "member" : "admin"}
                              />
                              <button
                                type="submit"
                                title={m.role === "admin" ? "Demote to member" : "Promote to core team"}
                                className="flex items-center gap-1.5 rounded-lg border border-white/10 px-2.5 py-1.5 text-[11px] text-zinc-300 transition-colors hover:border-brand-400/40 hover:text-brand-300"
                              >
                                {m.role === "admin" ? (
                                  <>
                                    <ShieldOff className="h-3.5 w-3.5" /> Demote
                                  </>
                                ) : (
                                  <>
                                    <ShieldCheck className="h-3.5 w-3.5" /> Promote
                                  </>
                                )}
                              </button>
                            </form>
                            {/* Activate / deactivate */}
                            <form action={toggleMemberActiveAction}>
                              <input type="hidden" name="id" value={m.id} />
                              <input type="hidden" name="is_active" value={String(m.is_active)} />
                              <button
                                type="submit"
                                title={m.is_active ? "Deactivate account" : "Reactivate account"}
                                className={`flex items-center gap-1.5 rounded-lg border border-white/10 px-2.5 py-1.5 text-[11px] transition-colors ${
                                  m.is_active
                                    ? "text-zinc-300 hover:border-red-400/40 hover:text-red-300"
                                    : "text-zinc-300 hover:border-emerald-400/40 hover:text-emerald-300"
                                }`}
                              >
                                {m.is_active ? (
                                  <>
                                    <UserX className="h-3.5 w-3.5" /> Deactivate
                                  </>
                                ) : (
                                  <>
                                    <UserCheck className="h-3.5 w-3.5" /> Activate
                                  </>
                                )}
                              </button>
                            </form>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
