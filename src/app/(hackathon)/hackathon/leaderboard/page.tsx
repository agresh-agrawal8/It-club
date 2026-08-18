import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Icon } from "@/components/hackathon/icons";
import { CardBody, Eyebrow, HackCard, IconTile, SectionHead } from "@/components/hackathon/card";
import { EVENT } from "@/lib/hackathon/content";
import { getStandings } from "@/lib/hackathon/data";

export const metadata: Metadata = {
  title: "Final results",
  description:
    "Final Infinium standings, published after judging closes. Scores are marked in person on the official paper sheet.",
};

const PODIUM = [
  { ring: "border-amber-400/40 bg-amber-500/10", text: "text-amber-300", label: "1st" },
  { ring: "border-zinc-300/30 bg-white/[0.06]", text: "text-zinc-200", label: "2nd" },
  { ring: "border-orange-400/35 bg-orange-500/10", text: "text-orange-300", label: "3rd" },
];

/**
 * Final standings.
 *
 * Every number here was written by a judge on paper and typed in by the core
 * team — nothing on this page is computed from anything the website measured.
 * Only published results appear, so drafts entered during the closing ceremony
 * stay hidden until the organisers release them.
 */
export default async function LeaderboardPage() {
  const rows = await getStandings();
  const top = rows.slice(0, 3);
  const rest = rows.slice(3);

  return (
    <Container className="flex flex-col gap-12 py-14">
      <SectionHead
        eyebrow="Final standings"
        icon="trophy"
        title="The Board."
        lead="Judging happens in person on the official paper sheet — four judges, five teams each, six minutes per team. Final scores are published here after the closing ceremony."
        align="center"
        tone="amber"
      />

      {rows.length === 0 ? (
        <HackCard tone="brand" className="flex flex-col items-center gap-4 py-16 text-center">
          <IconTile name="lock" tone="brand" className="h-12 w-12" />
          <h2 className="text-xl font-semibold tracking-tight text-white">
            Results are not published yet
          </h2>
          <p className="max-w-md text-[13.5px] leading-relaxed text-zinc-400">
            Standings appear here once judging closes and the Organizing Committee publishes the
            scores. Until then, nothing is ranked — there is no live scoring at Infinium.
          </p>
          <div className="mt-1 flex flex-wrap items-center justify-center gap-2 text-[12px] text-zinc-500">
            <Icon name="calendar" className="h-4 w-4" />
            {EVENT.dateLabel} · results at the closing ceremony
          </div>
          <Link
            href="/hackathon/team"
            className="mt-3 rounded-full border border-white/12 px-5 py-2.5 text-sm text-white transition-colors hover:border-white/25"
          >
            Open your team portal
          </Link>
        </HackCard>
      ) : (
        <>
          {/* ── Podium ─────────────────────────────────────────── */}
          {top.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-3">
              {top.map((r, i) => (
                <HackCard
                  key={r.team_id}
                  tone={i === 0 ? "amber" : "default"}
                  className={`flex flex-col items-center gap-3 py-8 text-center ${
                    i === 0 ? "sm:order-2" : i === 1 ? "sm:order-1" : "sm:order-3"
                  }`}
                >
                  <span
                    className={`flex h-12 w-12 items-center justify-center rounded-2xl border text-[13px] font-semibold ${
                      PODIUM[i].ring
                    } ${PODIUM[i].text}`}
                  >
                    {PODIUM[i].label}
                  </span>
                  <div className="flex flex-col gap-1">
                    <span className="text-lg font-semibold tracking-tight text-white">{r.name}</span>
                    {r.team_code && (
                      <span className="font-mono text-[11px] text-zinc-600">{r.team_code}</span>
                    )}
                  </div>
                  <span className="text-3xl font-semibold tracking-tighter text-white">
                    {r.score}
                  </span>
                  <Eyebrow tone={i === 0 ? "amber" : "default"}>Points</Eyebrow>
                </HackCard>
              ))}
            </div>
          )}

          {/* ── Table ──────────────────────────────────────────── */}
          {rest.length > 0 && (
            <HackCard bare className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[420px] text-left">
                  <thead>
                    <tr className="border-b border-white/[0.07]">
                      {["Rank", "Team", "School", "Score"].map((h, i) => (
                        <th
                          key={h}
                          className={`px-5 py-3.5 text-[10px] uppercase tracking-[0.14em] text-zinc-500 ${
                            i === 3 ? "text-right" : ""
                          } ${i === 2 ? "hidden sm:table-cell" : ""}`}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rest.map((r) => (
                      <tr
                        key={r.team_id}
                        className="border-b border-white/[0.05] last:border-0 hover:bg-white/[0.02]"
                      >
                        <td className="px-5 py-3.5 font-mono text-[12px] text-zinc-500">
                          {r.rank}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="text-[14px] font-medium text-white">{r.name}</span>
                          {r.team_code && (
                            <span className="ml-2 font-mono text-[10.5px] text-zinc-600">
                              {r.team_code}
                            </span>
                          )}
                        </td>
                        <td className="hidden px-5 py-3.5 text-[12.5px] text-zinc-500 sm:table-cell">
                          {r.school ?? "—"}
                        </td>
                        <td className="px-5 py-3.5 text-right text-[14px] font-semibold tabular-nums text-white">
                          {r.score}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </HackCard>
          )}

          <HackCard className="flex items-start gap-4">
            <IconTile name="file" className="h-9 w-9" />
            <div className="flex flex-col gap-1">
              <span className="text-[15px] font-semibold tracking-tight text-white">
                Want your own sheet?
              </span>
              <CardBody>
                Every team can open its Achievement Card in the team portal to see its final score,
                the judges&apos; remarks and a scan of its physical evaluation sheet.
              </CardBody>
              <Link
                href="/hackathon/team"
                className="mt-1 inline-flex w-fit items-center gap-1.5 text-[13px] text-brand-300 transition-colors hover:text-brand-200"
              >
                Open team portal <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </HackCard>
        </>
      )}
    </Container>
  );
}
