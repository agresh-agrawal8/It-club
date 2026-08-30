import type { Metadata } from "next";
import { Users } from "lucide-react";
import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { MemberCard } from "@/components/features/member-card";
import { getTeam } from "@/lib/data";
import { isCoreTeam } from "@/lib/utils";
import { SITE, absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Team",
  description: `The students who run and build ${SITE.name}, the IT & AI Club of ${SITE.school}.`,
  alternates: { canonical: "/team" },
  openGraph: {
    title: `Team · ${SITE.name}`,
    description: `The students who run and build ${SITE.name}.`,
    url: absoluteUrl("/team"),
  },
};

/**
 * Public content changes when the core team publishes something, and the
 * mutating actions call revalidatePath() for exactly that. Between those
 * events this page is served from the cache instead of re-querying Postgres
 * on every visit — which is what makes navigation feel instant rather than
 * waiting on a round-trip per page.
 */
export const revalidate = 300;


/**
 * Two groups, because the club has exactly two roles. There is no third
 * section here and no hierarchy above the core team.
 */
export default async function TeamPage() {
  const team = await getTeam();
  const core = team.filter((m) => isCoreTeam(m.role));
  const members = team.filter((m) => !isCoreTeam(m.role));

  return (
    <>
      <PageHeader
        eyebrow="People"
        title="The team"
        description="Everyone here is a student. The core team runs the club; members build with it."
      />

      <Container className="flex flex-col gap-20 py-16">
        {team.length === 0 && (
          <EmptyState
            icon={<Users className="h-6 w-6" aria-hidden />}
            title="No profiles published yet"
            description="Member profiles appear here once the core team creates their accounts."
          />
        )}

        {core.length > 0 && (
          <section className="flex flex-col gap-8">
            <h2 className="headline text-2xl text-white">Core team</h2>
            <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {core.map((m) => (
                <li key={m.id}>
                  <MemberCard member={m} />
                </li>
              ))}
            </ul>
          </section>
        )}

        {members.length > 0 && (
          <section className="flex flex-col gap-8">
            <h2 className="headline text-2xl text-white">Members</h2>
            <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {members.map((m) => (
                <li key={m.id}>
                  <MemberCard member={m} />
                </li>
              ))}
            </ul>
          </section>
        )}
      </Container>
    </>
  );
}
