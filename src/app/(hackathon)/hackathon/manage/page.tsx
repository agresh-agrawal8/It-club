import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Container } from "@/components/ui/container";
import { CardBody, Eyebrow, HackCard, IconTile, SectionHead } from "@/components/hackathon/card";
import { requireAdmin } from "@/lib/auth";
import { EVENT } from "@/lib/hackathon/content";
import { BRIEFS } from "@/lib/hackathon/briefs";
import {
  getMembers,
  getResults,
  getSubmissions,
  getTeams,
  signSubmissionLinks,
} from "@/lib/hackathon/data";
import { PublishAllButton } from "@/components/hackathon/admin-controls";
import { TeamAdminCard } from "./team-admin";

export const metadata: Metadata = { title: "Manage teams" };

export default async function ManagePage() {
  await requireAdmin();

  const [teams, members, results, submissions] = await Promise.all([
    getTeams(),
    getMembers(),
    getResults(),
    getSubmissions(),
  ]);
  const links = await signSubmissionLinks(submissions);

  const membersByTeam = new Map<string, typeof members>();
  for (const m of members) {
    const list = membersByTeam.get(m.team_id) ?? [];
    list.push(m);
    membersByTeam.set(m.team_id, list);
  }
  const resultByTeam = new Map(results.map((r) => [r.team_id, r]));
  const submissionByTeam = new Map(submissions.map((s) => [s.team_id, s]));

  // Read here, in a Server Component: `briefs.ts` is server-only, so a brief
  // title can only ever be resolved on the server and handed down as a string.
  const briefByNo = new Map(BRIEFS.map((b) => [b.no, b] as const));

  const entered = results.filter((r) => r.final_score != null).length;
  const published = results.filter((r) => r.published).length;

  return (
    <Container className="flex flex-col gap-8 py-10">
      <Link
        href="/hackathon/admin"
        className="flex w-fit items-center gap-1.5 text-[13px] text-zinc-500 transition-colors hover:text-white"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Admin console
      </Link>

      <SectionHead
        eyebrow="Core team"
        icon="users"
        title="Manage Teams"
        lead="Edit rosters, review what each team handed in, and record its offline result — the final value from the paper sheet, the judges' remarks, and a scan of the sheet itself. Envelope allocation has its own board."
      />

      {/* ── Counters ───────────────────────────────────────────── */}
      <div className="grid gap-3 sm:grid-cols-4">
        {[
          { label: "Teams", value: `${teams.length}/${EVENT.maxTeams}` },
          {
            label: "Submitted",
            value: `${submissions.filter((s) => s.status === "submitted").length}/${teams.length}`,
          },
          { label: "Scores entered", value: `${entered}/${teams.length}` },
          { label: "Published", value: `${published}/${teams.length}` },
        ].map((s) => (
          <HackCard key={s.label} className="flex flex-col gap-1 p-5">
            <Eyebrow tone="default">{s.label}</Eyebrow>
            <span className="text-xl font-semibold tracking-tight text-white">{s.value}</span>
          </HackCard>
        ))}
      </div>

      {/* ── Publish all ────────────────────────────────────────── */}
      <HackCard tone="amber" className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <IconTile name="trophy" tone="amber" className="h-9 w-9" />
          <div className="flex flex-col gap-1">
            <span className="text-[15px] font-semibold tracking-tight text-white">
              Release results
            </span>
            <CardBody className="text-[13px]">
              Publishes every team that has a score entered. Teams see their Achievement Card and
              the standings page fills in — do this at the closing ceremony.
            </CardBody>
          </div>
        </div>
        <PublishAllButton entered={entered} />
      </HackCard>

      {/* ── Teams ──────────────────────────────────────────────── */}
      {teams.length === 0 ? (
        <HackCard className="flex flex-col items-center gap-3 py-14 text-center">
          <IconTile name="users" className="h-12 w-12" />
          <span className="text-[15px] font-medium text-white">No teams registered yet</span>
          <CardBody className="max-w-sm">
            Teams appear here as soon as they register at /hackathon/register.
          </CardBody>
        </HackCard>
      ) : (
        <div className="flex flex-col gap-2.5">
          {teams.map((t) => (
            <TeamAdminCard
              key={t.id}
              team={{
                id: t.id,
                name: t.name,
                team_code: t.team_code,
                tagline: t.tagline,
                school: t.school,
                status: t.status,
                envelope_no: t.envelope_no,
              }}
              members={(membersByTeam.get(t.id) ?? []).map((m) => ({
                id: m.id,
                name: m.name,
                class_section: m.class_section,
                member_role: m.member_role,
                is_quiz_rep: m.is_quiz_rep,
              }))}
              result={
                resultByTeam.has(t.id)
                  ? {
                      final_score: resultByTeam.get(t.id)!.final_score,
                      remarks: resultByTeam.get(t.id)!.remarks,
                      hasSheet: Boolean(resultByTeam.get(t.id)!.sheet_path),
                      published: resultByTeam.get(t.id)!.published,
                    }
                  : null
              }
              submission={(() => {
                const s = submissionByTeam.get(t.id);
                if (!s) return null;
                const l = links.get(t.id);
                return {
                  status: s.status,
                  submittedAt: s.submitted_at,
                  codeName: s.code_name,
                  deckName: s.deck_name,
                  repoUrl: s.repo_url,
                  notes: s.notes,
                  codeUrl: l?.codeUrl ?? null,
                  deckUrl: l?.deckUrl ?? null,
                };
              })()}
              envelopeLabel={
                t.envelope_no != null
                  ? (briefByNo.get(t.envelope_no)?.domain ?? null)
                  : null
              }
            />
          ))}
        </div>
      )}
    </Container>
  );
}
