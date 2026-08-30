import type { Metadata } from "next";
import { Award } from "lucide-react";
import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { AchievementCard } from "@/components/features/achievement-card";
import { getAchievements } from "@/lib/data";

export const metadata: Metadata = {
  title: "Achievements",
  description: "Awards, placements and milestones earned by the EHIS IT Club.",
};

/**
 * Public content changes when the core team publishes something, and the
 * mutating actions call revalidatePath() for exactly that. Between those
 * events this page is served from the cache instead of re-querying Postgres
 * on every visit — which is what makes navigation feel instant rather than
 * waiting on a round-trip per page.
 */
export const revalidate = 300;


export default async function AchievementsPage() {
  const achievements = await getAchievements();

  return (
    <>
      <PageHeader
        eyebrow="Recognition"
        title="Achievements"
        description="The awards, placements and proud milestones of our members."
      />
      <Container className="py-16">
        {achievements.length ? (
          <div className="grid gap-6 md:grid-cols-2">
            {achievements.map((a) => (
              <AchievementCard key={a.id} achievement={a} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Award className="h-6 w-6" />}
            title="No achievements yet"
            description="Milestones and awards will be celebrated here."
          />
        )}
      </Container>
    </>
  );
}
