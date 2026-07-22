import type { Metadata } from "next";
import { Trophy } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { getCompetitions } from "@/lib/data";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AdminPageHeader, DeleteButton } from "@/components/admin/admin-shell";
import { AdminCreateForm } from "@/components/admin/create-form";
import { createCompetitionAction, deleteCompetitionAction } from "@/lib/actions/content";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Manage Competitions" };

const statusVariant = { upcoming: "accent", ongoing: "success", past: "small", cancelled: "danger" } as const;

export default async function AdminCompetitionsPage() {
  await requireAdmin();
  const competitions = await getCompetitions();

  return (
    <div className="flex flex-col gap-8">
      <AdminPageHeader
        title="Competitions"
        description="Track hackathons, olympiads and contests — and record the club's results."
        backHref="/admin"
      />

      <Card deep className="p-6 md:p-8">
        <h2 className="mb-5 text-sm font-semibold uppercase tracking-wide text-zinc-400">
          New competition
        </h2>
        <AdminCreateForm
          action={createCompetitionAction}
          submitLabel="Add competition"
          successMessage="Competition added."
          fields={[
            { name: "title", label: "Title", required: true, placeholder: "CodeWars 2026" },
            { name: "organizer", label: "Organizer", placeholder: "IIT Indore" },
            { name: "location", label: "Location", placeholder: "Online / Indore" },
            { name: "starts_at", label: "Date", type: "datetime-local" },
            {
              name: "status",
              label: "Status",
              type: "select",
              options: [
                { value: "upcoming", label: "Upcoming" },
                { value: "ongoing", label: "Ongoing" },
                { value: "past", label: "Past" },
                { value: "cancelled", label: "Cancelled" },
              ],
            },
            { name: "registration_url", label: "Registration link", type: "url", placeholder: "https://…" },
            { name: "result", label: "Result / placement", placeholder: "1st place — Web category", span: "full" },
            { name: "banner_url", label: "Banner image", type: "image", bucket: "media", folder: "competitions" },
            { name: "description", label: "Description", type: "textarea", span: "full" },
          ]}
        />
      </Card>

      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">
          All competitions ({competitions.length})
        </h2>
        {competitions.length === 0 && (
          <p className="text-sm text-zinc-500">Nothing yet — add the first competition above.</p>
        )}
        {competitions.map((c) => (
          <Card key={c.id} className="flex items-center justify-between gap-4 p-5">
            <div className="flex min-w-0 items-center gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-300">
                <Trophy className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="truncate text-sm font-semibold text-white">{c.title}</span>
                  <Badge variant={statusVariant[c.status]}>{c.status}</Badge>
                </div>
                <p className="mt-0.5 text-xs text-zinc-500">
                  {c.organizer ?? "—"}
                  {c.starts_at ? ` · ${formatDate(c.starts_at)}` : ""}
                  {c.result ? ` · ${c.result}` : ""}
                </p>
              </div>
            </div>
            <DeleteButton action={deleteCompetitionAction} id={c.id} />
          </Card>
        ))}
      </section>
    </div>
  );
}
