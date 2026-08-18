import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Container } from "@/components/ui/container";
import { CardBody, Eyebrow, HackCard, IconTile, SectionHead } from "@/components/hackathon/card";
import { requireAdmin } from "@/lib/auth";
import { ENVELOPES, EVENT } from "@/lib/hackathon/content";
import { getMembers, getResults, getTeams } from "@/lib/hackathon/data";
import { publishAllResultsAction } from "@/lib/hackathon/actions";
import { TeamAdminCard, type EnvelopeOption } from "./team-admin";

export const metadata: Metadata = { title: "Manage teams" };

export default async function ManagePage() {
  await requireAdmin();

  const [teams, members, results] = await Promise.all([getTeams(), getMembers(), getResults()]);

  const membersByTeam = new Map<string, typeof members>();
  for (const m of members) {
    const list = membersByTeam.get(m.team_id) ?? [];
    list.push(m);
    membersByTeam.set(m.team_id, list);
  }
  const resultByTeam = new Map(results.map((r) => [r.team_id, r]));

  // Envelope labels include the brief title — organisers need it to assign a
  // sensible problem — so they are built here, in a server component, and
  // handed down as props rather than importing content into the client.
  const takenBy = new Map(
    teams.filter((t) => t.envelope_no != null).map((t) => [t.envelope_no!, t.name]),
  );
  const envelopeOptions: EnvelopeOption[] = ENVELOPES.map((e) => ({
    no: e.no,
    label: `${e.code} · ${e.domain} — ${e.title}`,
    takenBy: takenBy.get(e.no) ?? null,
  }));

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
        lead="Edit rosters, assign sealed envelopes, and record each team's offline result — the final value from the paper sheet, the judges' remarks, and a scan of the sheet itself."
      />

      {/* ── Counters ───────────────────────────────────────────── */}
      <div className="grid gap-3 sm:grid-cols-4">
        {[
          { label: "Teams", value: `${teams.length}/${EVENT.maxTeams}` },
          { label: "Members", value: String(members.length) },
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
        <form action={publishAllResultsAction}>
          <button className="rounded-full bg-amber-500 px-5 py-2.5 text-[13px] font-medium text-black transition-opacity hover:opacity-90">
            Publish all {entered} results
          </button>
        </form>
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
              envelopes={envelopeOptions}
            />
          ))}
        </div>
      )}
    </Container>
  );
}
