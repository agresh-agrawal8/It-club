import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { getTeam } from "@/lib/data";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { CreateMemberForm } from "./create-member-form";
import { formatDate, isAdminRole, roleLabel } from "@/lib/utils";

export const metadata: Metadata = { title: "Manage Members" };

export default async function AdminMembersPage() {
  await requireAdmin();
  const members = await getTeam();

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tighter text-white md:text-4xl">Members</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Provision new member accounts. Accounts can only be created by the core team.
        </p>
      </div>

      <Card glass>
        <h2 className="mb-6 text-sm font-semibold uppercase tracking-wide text-zinc-400">
          Create a new member
        </h2>
        <CreateMemberForm />
      </Card>

      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">
          All members · {members.length}
        </h2>
        <div className="overflow-hidden rounded-3xl border border-white/10">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-900 text-xs uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-5 py-3 font-medium">Member</th>
                <th className="px-5 py-3 font-medium">Member ID</th>
                <th className="px-5 py-3 font-medium">Role</th>
                <th className="px-5 py-3 font-medium">Joined</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {members.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-zinc-500">
                    No members yet. Create the first account above.
                  </td>
                </tr>
              )}
              {members.map((m) => (
                <tr key={m.id} className="bg-zinc-950/50 hover:bg-zinc-900/60">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={m.full_name || "Member"} src={m.avatar_url} size="sm" />
                      <span className="font-medium text-white">{m.full_name || "—"}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-zinc-400">{m.member_id ?? "—"}</td>
                  <td className="px-5 py-3">
                    <Badge variant={isAdminRole(m.role) ? "accent" : "small"}>{roleLabel(m.role)}</Badge>
                  </td>
                  <td className="px-5 py-3 text-zinc-400">{formatDate(m.created_at)}</td>
                  <td className="px-5 py-3">
                    <span className="flex items-center gap-2 text-xs text-zinc-400">
                      <span className={`h-2 w-2 rounded-full ${m.is_active ? "bg-emerald-400" : "bg-zinc-600"}`} />
                      {m.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
