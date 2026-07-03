import Link from "next/link";
import Image from "next/image";
import { Github, ExternalLink, ArrowUpRight } from "lucide-react";
import type { Project } from "@/types/database";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tag } from "@/components/ui/tag";

const statusVariant = {
  completed: "success",
  in_progress: "accent",
  archived: "small",
  draft: "warning",
} as const;

export function ProjectCard({ project }: { project: Project }) {
  return (
    <Link href={`/projects/${project.slug}`} className="group block">
      <Card hoverLift className="flex h-full flex-col gap-4 overflow-hidden p-0">
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-zinc-950">
          {project.cover_url ? (
            <Image
              src={project.cover_url}
              alt={project.title}
              fill
              sizes="(max-width:768px) 100vw, 33vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="glow-violet flex h-full w-full items-center justify-center">
              <span className="text-4xl font-bold tracking-tighter text-white/10">
                {project.title.slice(0, 2).toUpperCase()}
              </span>
            </div>
          )}
          <div className="absolute right-3 top-3">
            <Badge variant={statusVariant[project.status]}>{project.status.replace("_", " ")}</Badge>
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-3 p-6 pt-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-lg font-semibold tracking-tight text-white">{project.title}</h3>
            <ArrowUpRight className="h-4 w-4 shrink-0 text-zinc-500 transition-colors group-hover:text-brand-300" />
          </div>
          {project.summary && (
            <p className="line-clamp-2 text-sm leading-relaxed text-zinc-400">{project.summary}</p>
          )}
          {project.technologies.length > 0 && (
            <div className="mt-auto flex flex-wrap gap-1.5 pt-2">
              {project.technologies.slice(0, 4).map((tech) => (
                <Tag key={tech}>{tech}</Tag>
              ))}
            </div>
          )}
          <div className="flex items-center gap-3 pt-1 text-zinc-500">
            {project.github_url && <Github className="h-4 w-4" />}
            {project.demo_url && <ExternalLink className="h-4 w-4" />}
          </div>
        </div>
      </Card>
    </Link>
  );
}
