import type { Metadata } from "next";
import { Trophy } from "lucide-react";
import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { CompetitionCard } from "@/components/features/competition-card";
import { getCompetitions } from "@/lib/data";

export const metadata: Metadata = {
  title: "Competitions",
  description: "Hackathons, olympiads and contests the EHIS IT Club competes in.",
};

export default async function CompetitionsPage() {
  const competitions = await getCompetitions();

  return (
    <>
      <PageHeader
        eyebrow="Compete"
        title="Competitions"
        description="Where our members test their skills against the best — and bring home the wins."
      />
      <Container className="py-16">
        {competitions.length ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {competitions.map((c) => (
              <CompetitionCard key={c.id} competition={c} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Trophy className="h-6 w-6" />}
            title="No competitions listed yet"
            description="Upcoming contests and past results will appear here."
          />
        )}
      </Container>
    </>
  );
}
