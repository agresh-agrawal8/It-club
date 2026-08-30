import type { Metadata } from "next";
import { Award } from "lucide-react";
import { requireCoreTeam } from "@/lib/auth";
import { getAchievements } from "@/lib/data";
import { Card } from "@/components/ui/card";
import { AdminPageHeader, DeleteButton } from "@/components/admin/admin-shell";
import { AdminCreateForm } from "@/components/admin/create-form";
import { createAchievementAction, deleteAchievementAction } from "@/lib/actions/content";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Manage Achievements" };

export default async function AdminAchievementsPage() {
  await requireCoreTeam();
  const achievements = await getAchievements();

  return (
    <div className="flex flex-col gap-8">
      <AdminPageHeader
        title="Achievements"
        description="Record awards, placements and milestones. They show on the public achievements page and the homepage."
        backHref="/admin"
      />

      <Card surface deep className="p-6 md:p-8">
        <h2 className="headline-wide mb-5 text-sm text-white">
          New achievement
        </h2>
        <AdminCreateForm
          action={createAchievementAction}
          submitLabel="Add achievement"
          successMessage="Achievement added."
          fields={[
            { name: "title", label: "Title", required: true, placeholder: "1st place — District Hackathon" },
            { name: "category", label: "Category", placeholder: "Hackathon / Olympiad / Award" },
            { name: "awarded_on", label: "Date awarded", type: "date" },
            { name: "image_url", label: "Image", type: "image", bucket: "media", folder: "achievements" },
            { name: "description", label: "Description", type: "textarea", span: "full" },
          ]}
        />
      </Card>

      <section className="flex flex-col gap-4">
        <h2 className="headline-wide text-sm text-white">
          All achievements ({achievements.length})
        </h2>
        {achievements.length === 0 && (
          <p className="text-sm text-ink-4">Nothing yet — add the first achievement above.</p>
        )}
        {achievements.map((a) => (
          <Card surface key={a.id} className="flex items-center justify-between gap-4 p-5">
            <div className="flex min-w-0 items-center gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-300">
                <Award className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <span className="truncate text-sm font-semibold text-white">{a.title}</span>
                <p className="mt-0.5 text-xs text-ink-4">
                  {a.category ?? "—"}
                  {a.awarded_on ? ` · ${formatDate(a.awarded_on)}` : ""}
                </p>
              </div>
            </div>
            <DeleteButton action={deleteAchievementAction} id={a.id} />
          </Card>
        ))}
      </section>
    </div>
  );
}
