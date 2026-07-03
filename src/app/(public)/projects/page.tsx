import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/layout/page-header";
import { ProjectsExplorer } from "@/components/features/projects-explorer";
import { getProjects } from "@/lib/data";

export const metadata: Metadata = {
  title: "Projects",
  description: "Browse student projects built by members of the EHIS IT Club.",
};

export default async function ProjectsPage() {
  const projects = await getProjects();

  return (
    <>
      <PageHeader
        eyebrow="Showcase"
        title="Projects"
        description="Web apps, games, robotics and experiments — built and maintained by our members."
      />
      <Container className="py-16">
        <ProjectsExplorer projects={projects} />
      </Container>
    </>
  );
}
