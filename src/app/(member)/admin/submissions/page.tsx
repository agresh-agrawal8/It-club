import type { Metadata } from "next";
import { CheckCircle2, Undo2, Inbox, FileText, Link2 } from "lucide-react";
import { requireCoreTeam } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { AdminPageHeader, DeleteButton } from "@/components/admin/admin-shell";
import { toggleSubmissionHandledAction, deleteSubmissionAction } from "@/lib/actions/content";
import { timeAgo } from "@/lib/utils";
import type { Submission } from "@/types/database";

export const metadata: Metadata = { title: "Submissions" };

const categoryLabel: Record<Submission["category"], string> = {
  competition: "Competition",
  company: "Company drive",
  content: "Club content",
  other: "Other",
};

export default async function AdminSubmissionsPage() {
  await requireCoreTeam();

  let submissions: Submission[] = [];
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("submissions")
      .select("*")
      .order("handled", { ascending: true })
      .order("created_at", { ascending: false })
      .limit(200);
    submissions = (data as Submission[]) ?? [];
  } catch {
    submissions = [];
  }

  return (
    <div className="flex flex-col gap-8">
      <AdminPageHeader
        title="Submissions"
        description="Documents and entries submitted from the homepage — competition work, company-drive files and club content."
        backHref="/admin"
      />

      {submissions.length === 0 ? (
        <EmptyState
          icon={<Inbox className="h-6 w-6" />}
          title="No submissions yet"
          description="Entries submitted through the homepage form will land here."
        />
      ) : (
        <div className="flex flex-col gap-4">
          {submissions.map((s) => (
            <Card surface key={s.id} className={`p-6 ${s.handled ? "opacity-60" : ""}`}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-sm font-semibold text-white">{s.title}</h3>
                    <Badge variant="accent">{categoryLabel[s.category]}</Badge>
                    {s.handled && <Badge variant="success">Handled</Badge>}
                    <span className="text-[11px] text-ink-4">{timeAgo(s.created_at)}</span>
                  </div>
                  <p className="mt-1.5 text-xs text-ink-4">
                    {s.name} ·{" "}
                    <a href={`mailto:${s.email}`} className="text-brand-300 hover:text-brand-200">
                      {s.email}
                    </a>
                  </p>
                  {s.message && (
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-ink-3">
                      {s.message}
                    </p>
                  )}
                  <div className="mt-3 flex flex-wrap gap-3">
                    {s.file_url && (
                      <a
                        href={s.file_url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-ink-2 transition-colors hover:border-brand-400/40 hover:text-brand-300"
                      >
                        <FileText className="h-3.5 w-3.5" /> Open document
                      </a>
                    )}
                    {s.link_url && (
                      <a
                        href={s.link_url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-ink-2 transition-colors hover:border-brand-400/40 hover:text-brand-300"
                      >
                        <Link2 className="h-3.5 w-3.5" /> Open link
                      </a>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <form action={toggleSubmissionHandledAction}>
                    <input type="hidden" name="id" value={s.id} />
                    <input type="hidden" name="handled" value={String(s.handled)} />
                    <button
                      type="submit"
                      className="flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-ink-2 transition-colors hover:border-emerald-400/40 hover:text-emerald-300"
                    >
                      {s.handled ? (
                        <>
                          <Undo2 className="h-3.5 w-3.5" /> Reopen
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-3.5 w-3.5" /> Mark handled
                        </>
                      )}
                    </button>
                  </form>
                  <DeleteButton action={deleteSubmissionAction} id={s.id} />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
