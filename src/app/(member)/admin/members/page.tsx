import type { Metadata } from "next";
import { Users } from "lucide-react";
import { requireCoreTeam } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { AdminPageHeader, AdminPanel } from "@/components/admin/admin-shell";
import { setMemberRoleAction, toggleMemberActiveAction } from "@/lib/actions/admin";
import { SubmitButton } from "@/components/ui/submit-button";
import { formatDate, initials, isCoreTeam, roleLabel } from "@/lib/utils";
import { CreateMemberForm } from "./create-member-form";
import { ResetPasswordButton } from "./reset-password-button";

export const metadata: Metadata = { title: "Members" };

/**
 * Member management.
 *
 * Note what this page cannot do: show anyone's password. `auth.users` holds a
 * bcrypt hash, the columns selected below do not include anything from it, and
 * there is no API that returns one. Helping someone who has forgotten theirs
 * means issuing a new credential, not retrieving the old one.
 */
interface MemberRow {
  id: string;
  full_name: string;
  role: "member" | "core_team";
  headline: string | null;
  avatar_url: string | null;
  is_active: boolean;
  must_change_password: boolean;
  created_at: string;
}

export default async function AdminMembersPage() {
  const { user } = await requireCoreTeam();

  let members: MemberRow[] = [];
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name, role, headline, avatar_url, is_active, must_change_password, created_at")
      .order("role", { ascending: true })
      .order("full_name", { ascending: true });
    members = (data as MemberRow[]) ?? [];
  } catch {
    members = [];
  }

  return (
    <div className="flex flex-col gap-10">
      <AdminPageHeader
        title="Members"
        description="Create accounts, set roles, and issue new passwords."
        backHref="/admin"
      />

      <AdminPanel
        title="Add a member"
        description="An account is a name, a role, and a one-time password. Nothing else is collected."
      >
        <CreateMemberForm />
      </AdminPanel>

      <AdminPanel title={`Accounts (${members.length})`}>
        {members.length === 0 ? (
          <EmptyState
            icon={<Users className="h-6 w-6" aria-hidden />}
            title="No accounts yet"
            description="Create the first one above."
          />
        ) : (
          <ul className="flex flex-col gap-3">
            {members.map((m) => {
              const self = m.id === user.id;
              return (
                <li
                  key={m.id}
                  className="flex flex-col gap-4 surface-row p-5 lg:flex-row lg:items-center lg:justify-between"
                >
                  <div className="flex min-w-0 items-center gap-4">
                    <span
                      aria-hidden
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-500/15 text-xs font-semibold text-brand-200 ring-1 ring-white/15"
                    >
                      {initials(m.full_name)}
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-medium text-white">{m.full_name}</p>
                        <Badge variant={isCoreTeam(m.role) ? "accent" : "small"}>
                          {roleLabel(m.role)}
                        </Badge>
                        {!m.is_active && <Badge variant="danger">Inactive</Badge>}
                        {m.must_change_password && (
                          <Badge variant="warning">Password reset pending</Badge>
                        )}
                        {self && <Badge variant="success">You</Badge>}
                      </div>
                      <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-4">
                        Joined {formatDate(m.created_at)}
                      </p>
                    </div>
                  </div>

                  {/* Every control is disabled on your own row: demoting or
                      deactivating yourself could leave the club with no core
                      team, and the server actions refuse it regardless. */}
                  {!self && (
                    <div className="flex flex-wrap items-start gap-2">
                      <form action={setMemberRoleAction}>
                        <input type="hidden" name="id" value={m.id} />
                        <input
                          type="hidden"
                          name="role"
                          value={isCoreTeam(m.role) ? "member" : "core_team"}
                        />
                        <SubmitButton
                          variant="secondary"
                          pendingLabel="Saving…"
                          className="px-4 py-2.5 text-xs"
                        >
                          {isCoreTeam(m.role) ? "Make member" : "Make core team"}
                        </SubmitButton>
                      </form>

                      <form action={toggleMemberActiveAction}>
                        <input type="hidden" name="id" value={m.id} />
                        <input type="hidden" name="is_active" value={String(m.is_active)} />
                        <SubmitButton
                          variant={m.is_active ? "danger" : "secondary"}
                          pendingLabel="Saving…"
                          className="px-4 py-2.5 text-xs"
                        >
                          {m.is_active ? "Deactivate" : "Reactivate"}
                        </SubmitButton>
                      </form>

                      <ResetPasswordButton id={m.id} name={m.full_name} />
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </AdminPanel>
    </div>
  );
}
