import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { ProjectForm } from "../project-form";

export const metadata: Metadata = { title: "New Project" };

export default async function NewProjectPage() {
  await requireUser();

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8">
      <Link href="/my-projects" className="flex w-fit items-center gap-2 text-sm text-zinc-400 hover:text-white">
        <ArrowLeft className="h-4 w-4" /> Back to my projects
      </Link>
      <div>
        <h1 className="text-3xl font-semibold tracking-tighter text-white md:text-4xl">New project</h1>
        <p className="mt-1 text-sm text-zinc-400">Publish a new project to the showcase.</p>
      </div>
      <Card>
        <ProjectForm />
      </Card>
    </div>
  );
}
