"use client";

import { useActionState } from "react";
import Link from "next/link";
import { createProjectAction, updateProjectAction } from "@/lib/actions/projects";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ImageUploadField } from "@/components/admin/image-upload-field";
import type { Project } from "@/types/database";

export function ProjectForm({ project }: { project?: Project }) {
  const action = project ? updateProjectAction : createProjectAction;
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-6">
      {project && <input type="hidden" name="id" value={project.id} />}

      <Input name="title" label="Title" defaultValue={project?.title} placeholder="Project name" required />
      <Input
        name="summary"
        label="Summary"
        defaultValue={project?.summary ?? ""}
        placeholder="One-line description"
      />
      <Textarea
        name="description"
        label="Description"
        defaultValue={project?.description ?? ""}
        rows={6}
        placeholder="Describe your project, how it works, what you learned…"
      />

      <div className="grid gap-6 sm:grid-cols-2">
        <Input
          name="technologies"
          label="Technologies (comma separated)"
          defaultValue={project?.technologies.join(", ") ?? ""}
          placeholder="Next.js, Supabase, Python"
        />
        <Input
          name="tags"
          label="Tags (comma separated)"
          defaultValue={project?.tags.join(", ") ?? ""}
          placeholder="web, ai, robotics"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <ImageUploadField
          name="cover_url"
          label="Cover image"
          bucket="media"
          folder="projects"
          defaultValue={project?.cover_url ?? ""}
        />
      </div>

      <div className="grid gap-6 sm:grid-cols-3">
        <Input name="github_url" label="GitHub" defaultValue={project?.github_url ?? ""} placeholder="https://github.com/…" />
        <Input name="demo_url" label="Live demo" defaultValue={project?.demo_url ?? ""} placeholder="https://…" />
        <Input name="docs_url" label="Documentation" defaultValue={project?.docs_url ?? ""} placeholder="https://…" />
      </div>

      <Select name="status" label="Status" defaultValue={project?.status ?? "in_progress"}>
        <option value="draft">Draft (only you can see it)</option>
        <option value="in_progress">In progress</option>
        <option value="completed">Completed</option>
        <option value="archived">Archived</option>
      </Select>

      {state?.error && <p className="text-sm text-red-400">{state.error}</p>}

      <div className="flex items-center gap-3">
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? "Saving…" : project ? "Save changes" : "Create project"}
        </Button>
        <Link href="/my-projects" className="text-sm text-zinc-400 hover:text-white">
          Cancel
        </Link>
      </div>

      <p className="text-xs text-zinc-500">
        Tip: after creating the project you can add screenshots, videos and files, and invite
        co-authors from the project page. Projects don't need admin approval.
      </p>
    </form>
  );
}
