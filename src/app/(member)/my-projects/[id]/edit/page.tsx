import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { ProjectForm } from "../../project-form";
import type { Project } from "@/types/database";

export const metadata: Metadata = { title: "Edit Project" };

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { user } = await requireUser();
  const { id } = await params;

  const supabase = await createClient();
  const { data } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .eq("owner_id", user.id)
    .single();

  if (!data) notFound();
  const project = data as Project;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8">
      <Link href="/my-projects" className="flex w-fit items-center gap-2 text-sm text-zinc-400 hover:text-white">
        <ArrowLeft className="h-4 w-4" /> Back to my projects
      </Link>
      <div>
        <h1 className="text-3xl font-semibold tracking-tighter text-white md:text-4xl">Edit project</h1>
        <p className="mt-1 text-sm text-zinc-400">Update the details for “{project.title}”.</p>
      </div>
      <Card>
        <ProjectForm project={project} />
      </Card>
    </div>
  );
}
