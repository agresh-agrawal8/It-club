import type { Metadata } from "next";
import { UserPlus, Check, X as XIcon, RotateCcw } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { Tag } from "@/components/ui/tag";
import { AdminPageHeader, DeleteButton } from "@/components/admin/admin-shell";
import { setJoinStatusAction, deleteJoinRequestAction } from "@/lib/actions/content";
import { timeAgo } from "@/lib/utils";
import type { JoinRequest } from "@/types/database";

export const metadata: Metadata = { title: "Applications" };

const statusVariant = { pending: "warning", approved: "success", rejected: "danger" } as const;

export default async function AdminApplicationsPage() {
  await requireAdmin();

  let requests: JoinRequest[] = [];
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("join_requests")
      .select("*")
      .order("status", { ascending: false }) // pending > approved > rejected alphabetically reversed puts pending last; sort below instead
      .order("created_at", { ascending: false })
      .limit(200);
    requests = ((data as JoinRequest[]) ?? []).sort(
      (a, b) => Number(a.status !== "pending") - Number(b.status !== "pending"),
    );
  } catch {
    requests = [];
  }

  return (
    <div className="flex flex-col gap-8">
      <AdminPageHeader
        title="Applications"
        description="Membership applications from the Join page. Approve one, then create the member's account from the Members page."
        backHref="/admin"
      />

      {requests.length === 0 ? (
        <EmptyState
          icon={<UserPlus className="h-6 w-6" />}
          title="No applications yet"
          description="Share the Join page — applications will land here."
        />
      ) : (
        <div className="flex flex-col gap-4">
          {requests.map((r) => (
            <Card key={r.id} className={`p-6 ${r.status === "rejected" ? "opacity-60" : ""}`}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-sm font-semibold text-white">{r.name}</h3>
                    <Badge variant={statusVariant[r.status]}>{r.status}</Badge>
                    {r.grade && <span className="text-xs text-zinc-500">{r.grade}</span>}
                    <span className="text-[11px] text-zinc-600">{timeAgo(r.created_at)}</span>
                  </div>
                  <p className="mt-1 text-xs text-zinc-500">
                    <a href={`mailto:${r.email}`} className="text-brand-300 hover:text-brand-200">
                      {r.email}
                    </a>
                    {r.phone ? ` · ${r.phone}` : ""}
                    {r.experience ? ` · ${r.experience}` : ""}
                  </p>
                  {r.interests.length > 0 && (
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {r.interests.map((t) => (
                        <Tag key={t}>{t}</Tag>
                      ))}
                    </div>
                  )}
                  {r.why && (
                    <p className="mt-2.5 whitespace-pre-wrap text-sm leading-relaxed text-zinc-400">
                      {r.why}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {r.status !== "approved" && (
                    <form action={setJoinStatusAction}>
                      <input type="hidden" name="id" value={r.id} />
                      <input type="hidden" name="status" value="approved" />
                      <button
                        type="submit"
                        className="flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-zinc-300 transition-colors hover:border-emerald-400/40 hover:text-emerald-300"
                      >
                        <Check className="h-3.5 w-3.5" /> Approve
                      </button>
                    </form>
                  )}
                  {r.status === "pending" && (
                    <form action={setJoinStatusAction}>
                      <input type="hidden" name="id" value={r.id} />
                      <input type="hidden" name="status" value="rejected" />
                      <button
                        type="submit"
                        className="flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-zinc-300 transition-colors hover:border-red-400/40 hover:text-red-300"
                      >
                        <XIcon className="h-3.5 w-3.5" /> Reject
                      </button>
                    </form>
                  )}
                  {r.status !== "pending" && (
                    <form action={setJoinStatusAction}>
                      <input type="hidden" name="id" value={r.id} />
                      <input type="hidden" name="status" value="pending" />
                      <button
                        type="submit"
                        className="flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-zinc-300 transition-colors hover:border-white/25 hover:text-white"
                      >
                        <RotateCcw className="h-3.5 w-3.5" /> Reset
                      </button>
                    </form>
                  )}
                  <DeleteButton action={deleteJoinRequestAction} id={r.id} />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
