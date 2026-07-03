import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Github, ExternalLink, FileText, ArrowLeft, Calendar } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Badge } from "@/components/ui/badge";
import { Tag } from "@/components/ui/tag";
import { Avatar } from "@/components/ui/avatar";
import { ButtonLink } from "@/components/ui/button";
import { getProjectBySlug } from "@/lib/data";
import { formatDate } from "@/lib/utils";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = await getProjectBySlug(slug);
  if (!data) return { title: "Project not found" };
  return {
    title: data.project.title,
    description: data.project.summary ?? undefined,
  };
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await getProjectBySlug(slug);
  if (!data) notFound();

  const { project, media, authors } = data;
  const images = media.filter((m) => m.kind === "image");
  const videos = media.filter((m) => m.kind === "video");
  const files = media.filter((m) => m.kind === "file");

  return (
    <article className="pb-24">
      {/* Cover */}
      <div className="relative h-[42vh] min-h-[320px] w-full overflow-hidden bg-zinc-950">
        {project.cover_url ? (
          <Image src={project.cover_url} alt={project.title} fill priority className="object-cover" />
        ) : (
          <div className="glow-violet h-full w-full" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-surface-0 via-surface-0/40 to-transparent" />
      </div>

      <Container className="-mt-24 flex flex-col gap-10">
        <div className="relative flex flex-col gap-6">
          <Link href="/projects" className="flex w-fit items-center gap-2 text-sm text-zinc-400 hover:text-white">
            <ArrowLeft className="h-4 w-4" /> Back to projects
          </Link>

          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="accent">{project.status.replace("_", " ")}</Badge>
            <span className="flex items-center gap-1.5 text-xs text-zinc-400">
              <Calendar className="h-3.5 w-3.5" /> Updated {formatDate(project.updated_at)}
            </span>
          </div>

          <h1 className="max-w-4xl text-4xl font-semibold tracking-tighter text-white md:text-6xl">
            {project.title}
          </h1>
          {project.summary && <p className="max-w-2xl text-lg text-zinc-300">{project.summary}</p>}

          <div className="flex flex-wrap gap-3">
            {project.github_url && (
              <ButtonLink href={project.github_url} target="_blank" variant="secondary" size="sm">
                <Github className="h-4 w-4" /> GitHub
              </ButtonLink>
            )}
            {project.demo_url && (
              <ButtonLink href={project.demo_url} target="_blank" size="sm">
                <ExternalLink className="h-4 w-4" /> Live demo
              </ButtonLink>
            )}
            {project.docs_url && (
              <ButtonLink href={project.docs_url} target="_blank" variant="secondary" size="sm">
                <FileText className="h-4 w-4" /> Documentation
              </ButtonLink>
            )}
          </div>
        </div>

        <div className="grid gap-12 lg:grid-cols-[2fr_1fr]">
          {/* Main */}
          <div className="flex flex-col gap-10">
            {project.description && (
              <div className="prose-invert max-w-none whitespace-pre-wrap text-base leading-relaxed text-zinc-300">
                {project.description}
              </div>
            )}

            {images.length > 0 && (
              <section className="flex flex-col gap-4">
                <h2 className="text-lg font-semibold tracking-tight text-white">Gallery</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  {images.map((img) => (
                    <div key={img.id} className="relative aspect-video overflow-hidden rounded-2xl border border-white/10">
                      <Image src={img.url} alt={img.title ?? project.title} fill className="object-cover" />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {videos.length > 0 && (
              <section className="flex flex-col gap-4">
                <h2 className="text-lg font-semibold tracking-tight text-white">Videos</h2>
                {videos.map((v) => (
                  <video key={v.id} controls className="w-full rounded-2xl border border-white/10">
                    <source src={v.url} />
                  </video>
                ))}
              </section>
            )}
          </div>

          {/* Sidebar */}
          <aside className="flex flex-col gap-8">
            {authors.length > 0 && (
              <div className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-zinc-900 p-6">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Authors</h3>
                <div className="flex flex-col gap-3">
                  {authors.map((a) => (
                    <Link key={a.id} href="/team" className="flex items-center gap-3 hover:opacity-80">
                      <Avatar name={a.full_name || "Member"} src={a.avatar_url} size="sm" />
                      <div>
                        <div className="text-sm font-medium text-white">{a.full_name || "Member"}</div>
                        {a.member_id && <div className="text-xs text-zinc-500">{a.member_id}</div>}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {project.technologies.length > 0 && (
              <div className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-zinc-900 p-6">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Built with</h3>
                <div className="flex flex-wrap gap-1.5">
                  {project.technologies.map((t) => (
                    <Tag key={t}>{t}</Tag>
                  ))}
                </div>
              </div>
            )}

            {project.tags.length > 0 && (
              <div className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-zinc-900 p-6">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Tags</h3>
                <div className="flex flex-wrap gap-1.5">
                  {project.tags.map((t) => (
                    <Tag key={t}>#{t}</Tag>
                  ))}
                </div>
              </div>
            )}

            {files.length > 0 && (
              <div className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-zinc-900 p-6">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Files</h3>
                {files.map((f) => (
                  <a
                    key={f.id}
                    href={f.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 text-sm text-brand-300 hover:text-brand-200"
                  >
                    <FileText className="h-4 w-4" /> {f.title ?? "Download"}
                  </a>
                ))}
              </div>
            )}
          </aside>
        </div>
      </Container>
    </article>
  );
}
