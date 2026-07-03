import type { Metadata } from "next";
import { Users } from "lucide-react";
import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { MemberCard } from "@/components/features/member-card";
import { getTeam } from "@/lib/data";
import { isAdminRole } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Team",
  description: "Meet the members and core team behind the EHIS IT Club.",
};

export default async function TeamPage() {
  const team = await getTeam();
  const core = team.filter((m) => isAdminRole(m.role));
  const members = team.filter((m) => !isAdminRole(m.role));

  return (
    <>
      <PageHeader
        eyebrow="People"
        title="Our team"
        description="The students building, leading and shaping the IT Club."
      />
      <Container className="flex flex-col gap-16 py-16">
        {team.length === 0 && (
          <EmptyState
            icon={<Users className="h-6 w-6" />}
            title="No members to show yet"
            description="Team profiles will appear here once accounts are created by the core team."
          />
        )}

        {core.length > 0 && (
          <section className="flex flex-col gap-8">
            <h2 className="text-2xl font-semibold tracking-tight text-white">Core team</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {core.map((m) => (
                <MemberCard key={m.id} member={m} />
              ))}
            </div>
          </section>
        )}

        {members.length > 0 && (
          <section className="flex flex-col gap-8">
            <h2 className="text-2xl font-semibold tracking-tight text-white">Members</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {members.map((m) => (
                <MemberCard key={m.id} member={m} />
              ))}
            </div>
          </section>
        )}
      </Container>
    </>
  );
}
