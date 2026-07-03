"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import type { Project } from "@/types/database";
import { ProjectCard } from "./project-card";
import { Tag } from "@/components/ui/tag";
import { EmptyState } from "@/components/ui/empty-state";
import { Code2 } from "lucide-react";

export function ProjectsExplorer({ projects }: { projects: Project[] }) {
  const [query, setQuery] = useState("");
  const [activeTech, setActiveTech] = useState<string | null>(null);

  const techs = useMemo(() => {
    const set = new Set<string>();
    projects.forEach((p) => p.technologies.forEach((t) => set.add(t)));
    return Array.from(set).sort();
  }, [projects]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return projects.filter((p) => {
      const matchesQuery =
        !q ||
        p.title.toLowerCase().includes(q) ||
        (p.summary ?? "").toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q));
      const matchesTech = !activeTech || p.technologies.includes(activeTech);
      return matchesQuery && matchesTech;
    });
  }, [projects, query, activeTech]);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-5">
        <div className="flex items-center gap-3 border-b border-white/15 pb-2 focus-within:border-brand-400">
          <Search className="h-4 w-4 text-zinc-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search projects by name, summary or tag…"
            className="w-full bg-transparent py-1 text-sm text-white placeholder:text-zinc-500 focus:outline-none"
          />
        </div>
        {techs.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <Tag active={activeTech === null} onClick={() => setActiveTech(null)}>
              All
            </Tag>
            {techs.map((t) => (
              <Tag key={t} active={activeTech === t} onClick={() => setActiveTech(t === activeTech ? null : t)}>
                {t}
              </Tag>
            ))}
          </div>
        )}
      </div>

      {filtered.length ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Code2 className="h-6 w-6" />}
          title={projects.length ? "No matching projects" : "No projects yet"}
          description={
            projects.length
              ? "Try a different search term or clear the filters."
              : "Members haven't published any projects yet. Check back soon."
          }
        />
      )}
    </div>
  );
}
