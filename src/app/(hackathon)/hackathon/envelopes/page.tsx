import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Container } from "@/components/ui/container";
import { CardBody, Eyebrow, HackCard, IconTile, SectionHead } from "@/components/hackathon/card";
import { requireCoreTeam } from "@/lib/auth";
import { BRIEFS } from "@/lib/hackathon/briefs";
import { getTeams } from "@/lib/hackathon/data";
import { EnvelopeBoard, type BoardEnvelope, type BoardTeam } from "./envelope-board";

export const metadata: Metadata = { title: "Envelope allocation" };

/**
 * The envelope allocation console.
 *
 * Its own route, deliberately: assigning twenty unique briefs is a single
 * sitting on briefing day, and doing it from inside twenty separate team
 * accordions meant never seeing the allocation as a whole.
 *
 * Brief titles are read here, in a Server Component — `briefs.ts` is
 * server-only, and this page is behind requireCoreTeam(), so the titles reach
 * organisers and nobody else.
 */
export default async function EnvelopesPage() {
  await requireCoreTeam();

  const teams = await getTeams();

  const holderByEnvelope = new Map(
    teams
      .filter((t) => t.envelope_no != null)
      .map((t) => [t.envelope_no as number, t] as const),
  );

  const envelopes: BoardEnvelope[] = BRIEFS.map((b) => {
    const holder = holderByEnvelope.get(b.no);
    return {
      no: b.no,
      code: b.code,
      domain: b.domain,
      title: b.title,
      holderId: holder?.id ?? null,
      holderName: holder?.name ?? null,
      holderCode: holder?.team_code ?? null,
    };
  });

  const boardTeams: BoardTeam[] = teams.map((t) => ({
    id: t.id,
    name: t.name,
    teamCode: t.team_code,
    envelopeNo: t.envelope_no,
  }));

  const assigned = boardTeams.filter((t) => t.envelopeNo != null).length;

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
        icon="mail"
        title="Envelope Allocation"
        lead="Every team gets a different sealed brief — that uniqueness is the whole format. Draw them all at once, or set any team by hand. Picking an envelope another team holds swaps the two, so nobody is ever left without one."
      />

      {/* ── Counters ───────────────────────────────────────────── */}
      <div className="grid gap-3 sm:grid-cols-4">
        {[
          { label: "Teams", value: String(boardTeams.length) },
          { label: "Assigned", value: `${assigned}/${boardTeams.length}` },
          { label: "Envelopes free", value: String(20 - assigned) },
          {
            label: "Status",
            value:
              boardTeams.length === 0
                ? "No teams"
                : assigned === boardTeams.length
                  ? "Complete"
                  : "In progress",
          },
        ].map((s) => (
          <HackCard key={s.label} className="flex flex-col gap-1 p-5">
            <Eyebrow tone="default">{s.label}</Eyebrow>
            <span className="text-xl font-semibold tracking-tight text-white">{s.value}</span>
          </HackCard>
        ))}
      </div>

      <HackCard tone="brand" className="flex items-start gap-4">
        <IconTile name="lock" tone="brand" className="h-9 w-9" />
        <div className="flex flex-col gap-1">
          <span className="text-[15px] font-semibold tracking-tight text-white">
            Assigning is not releasing
          </span>
          <CardBody>
            Teams only ever see their <strong className="font-medium text-white">domain</strong>{" "}
            until you release the briefs from the admin console at 9:20 AM. Until then the brief
            text is never sent to a browser, so you can allocate as early as you like.
          </CardBody>
        </div>
      </HackCard>

      <EnvelopeBoard teams={boardTeams} envelopes={envelopes} />
    </Container>
  );
}
