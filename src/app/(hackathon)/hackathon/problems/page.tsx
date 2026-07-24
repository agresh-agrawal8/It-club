import type { Metadata } from "next";
import { FileText, Lock, Download, Clock } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Countdown } from "@/components/hackathon/countdown";
import { getProblems } from "@/lib/hackathon/data";

export const metadata: Metadata = { title: "Problem statements" };

const difficultyVariant: Record<string, "success" | "warning" | "danger" | "small"> = {
  easy: "success",
  medium: "warning",
  hard: "danger",
};

export default async function ProblemsPage() {
  const problems = await getProblems();

  return (
    <Container className="flex flex-col gap-10 py-14">
      <div className="flex flex-col gap-3 text-center">
        <span className="eyebrow text-accent-400">Pick your challenge</span>
        <h1 className="text-4xl font-semibold tracking-tighter text-white md:text-6xl">
          Problem statements
        </h1>
        <p className="mx-auto max-w-xl text-sm text-zinc-400">
          Five open tracks plus one surprise. Locked problems reveal automatically at their release
          time.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        {problems.map((p: any) => (
          <Card key={p.id} className="flex flex-col gap-4 p-6 md:p-7">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs text-accent-400">{p.code}</span>
              <div className="flex items-center gap-2">
                {p.difficulty && (
                  <Badge variant={difficultyVariant[p.difficulty] ?? "small"}>{p.difficulty}</Badge>
                )}
                {p.released ? <Badge variant="success">Live</Badge> : <Badge variant="warning">Locked</Badge>}
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold tracking-tight text-white">{p.title}</h2>
              {p.track && <span className="text-xs text-brand-300">{p.track}</span>}
            </div>

            {p.released ? (
              <>
                <p className="text-sm leading-relaxed text-zinc-300">{p.summary}</p>
                {p.description && (
                  <p className="text-sm leading-relaxed text-zinc-500">{p.description}</p>
                )}
                {p.pdf_url && (
                  <ButtonLink
                    href={p.pdf_url}
                    variant="secondary"
                    size="sm"
                    className="mt-1 w-fit rounded-full"
                  >
                    <Download className="h-4 w-4" /> Full brief (PDF)
                  </ButtonLink>
                )}
              </>
            ) : (
              <div className="flex flex-col items-start gap-3 rounded-2xl border border-dashed border-white/10 bg-zinc-950/40 p-5">
                <span className="flex items-center gap-2 text-sm text-zinc-400">
                  <Lock className="h-4 w-4 text-amber-300" /> Unlocks soon
                </span>
                {p.release_at && (
                  <span className="flex items-center gap-2 text-xs text-zinc-500">
                    <Clock className="h-3.5 w-3.5" />
                    <Countdown target={p.release_at} compact />
                  </span>
                )}
              </div>
            )}
          </Card>
        ))}
        {problems.length === 0 && (
          <Card className="col-span-full flex flex-col items-center gap-3 py-16 text-center">
            <FileText className="h-6 w-6 text-zinc-700" />
            <p className="text-sm text-zinc-500">Problem statements will appear here once released.</p>
          </Card>
        )}
      </div>
    </Container>
  );
}
