import type { Metadata } from "next";
import Link from "next/link";
import { Plus, FolderKanban, Pencil, ExternalLink, Github } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getMyProjects } from "@/lib/data";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tag } from "@/components/ui/tag";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { deleteProjectAction } from "@/lib/actions/projects";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "My Projects" };

export default async function MyProjectsPage() {
  const { user } = await requireUser();
  const projects = await getMyProjects(user.id);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tighter text-white md:text-4xl">My Projects</h1>
          <p className="mt-1 text-sm text-zinc-400">Create and manage the projects you own.</p>
        </div>
        <ButtonLink href="/my-projects/new" size="sm">
          <Plus className="h-4 w-4" /> New project
        </ButtonLink>
      </div>

      {projects.length ? (
        <div className="flex flex-col gap-4">
          {projects.map((p) => (
            <Card key={p.id} className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3">
                  <Link href={`/projects/${p.slug}`} className="text-lg font-semibold text-white hover:text-brand-200">
                    {p.title}
                  </Link>
                  <Badge variant="small">{p.status.replace("_", " ")}</Badge>
                </div>
                {p.summary && <p className="text-sm text-zinc-400">{p.summary}</p>}
                <div className="flex flex-wrap items-center gap-2">
                  {p.technologies.slice(0, 5).map((t) => (
                    <Tag key={t}>{t}</Tag>
                  ))}
                  <span className="text-xs text-zinc-600">Updated {formatDate(p.updated_at)}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {p.github_url && (
                  <a href={p.github_url} target="_blank" rel="noreferrer" className="text-zinc-500 hover:text-white">
                    <Github className="h-4 w-4" />
                  </a>
                )}
                {p.demo_url && (
                  <a href={p.demo_url} target="_blank" rel="noreferrer" className="text-zinc-500 hover:text-white">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}
                <ButtonLink href={`/my-projects/${p.id}/edit`} variant="secondary" size="sm">
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </ButtonLink>
                <form action={deleteProjectAction}>
                  <input type="hidden" name="id" value={p.id} />
                  <button
                    type="submit"
                    className="rounded-2xl border border-white/15 px-4 py-2 text-xs text-red-300 transition-colors hover:border-red-400/50 hover:bg-red-500/10"
                  >
                    Delete
                  </button>
                </form>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<FolderKanban className="h-6 w-6" />}
          title="No projects yet"
          description="Create your first project to showcase your work — no approval needed."
          action={
            <ButtonLink href="/my-projects/new" size="sm">
              <Plus className="h-4 w-4" /> Create a project
            </ButtonLink>
          }
        />
      )}
    </div>
  );
}
