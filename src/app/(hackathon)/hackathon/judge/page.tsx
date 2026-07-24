import type { Metadata } from "next";
import { Gavel, Github, Globe, Presentation, FileText, Users, Crown } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { Container } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MarkingSheet } from "@/components/hackathon/marking-sheet";

export const metadata: Metadata = { title: "Judging" };

const ROLE_LABEL: Record<string, string> = {
  captain: "Captain",
  frontend: "Frontend",
  backend: "Backend",
  uiux: "UI/UX",
  docs: "Docs",
};

/**
 * Judge evaluation. Everything a judge needs to score a team is on one screen:
 * the team, its roster, its assigned problem envelope, and every link the team
 * submitted — followed by the official Infinium marking sheet.
 */
export default async function JudgePage() {
  await requireAdmin();

  const supabase = createAdminClient();
  const [{ data: teams }, { data: members }, { data: subs }, { data: problems }, { data: cards }, { data: awarded }, { data: scores }] =
    await Promise.all([
      supabase.from("hack_teams").select("*").eq("reg_status", "approved").order("team_no"),
      supabase.from("hack_participants").select("*").not("team_id", "is", null),
      supabase.from("hack_submissions").select("*"),
      supabase.from("hack_problems").select("*"),
      supabase.from("hack_achievements").select("*").order("position"),
      supabase.from("hack_team_cards").select("*"),
      supabase.from("hack_scores").select("*"),
    ]);

  const byTeam = new Map<string, any[]>();
  for (const m of members ?? []) {
    const arr = byTeam.get(m.team_id) ?? [];
    arr.push(m);
    byTeam.set(m.team_id, arr);
  }
  const subByTeam = new Map((subs ?? []).map((s: any) => [s.team_id, s]));
  const problemById = new Map((problems ?? []).map((p: any) => [p.id, p]));
  const cardsByTeam = new Map<string, string[]>();
  for (const a of awarded ?? []) {
    const arr = cardsByTeam.get(a.team_id) ?? [];
    arr.push(a.achievement_id);
    cardsByTeam.set(a.team_id, arr);
  }
  const scoresByTeam = new Map<string, any[]>();
  for (const s of scores ?? []) {
    const arr = scoresByTeam.get(s.team_id) ?? [];
    arr.push(s);
    scoresByTeam.set(s.team_id, arr);
  }

  return (
    <Container className="flex flex-col gap-8 py-10">
      <div>
        <p className="eyebrow text-amber-300/90">Judging</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tighter text-white md:text-4xl">
          Evaluate teams
        </h1>
        <p className="mt-1 text-sm text-zinc-400">
          Official marking sheet — Section A (cards) + B (/60) + C (/40) + D (/25) − penalties.
        </p>
      </div>

      {(teams ?? []).length === 0 && (
        <Card className="py-14 text-center text-sm text-zinc-500">
          No approved teams yet. Approve registrations in Manage first.
        </Card>
      )}

      {(teams ?? []).map((t: any) => {
        const sub = subByTeam.get(t.id);
        const problem = t.problem_id ? problemById.get(t.problem_id) : null;
        const teamCards = cardsByTeam.get(t.id) ?? [];
        const teamScores = scoresByTeam.get(t.id) ?? [];

        return (
          <Card key={t.id} className="flex flex-col gap-5 p-6 md:p-7">
            {/* Team header */}
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-sm text-accent-400">{t.team_code}</span>
                  <h2 className="text-xl font-semibold tracking-tight text-white">{t.name}</h2>
                  <Badge variant={sub?.status === "submitted" ? "success" : "warning"}>
                    {sub?.status === "submitted" ? "Submitted" : "Not submitted"}
                  </Badge>
                </div>
                {problem && (
                  <p className="mt-1 text-xs text-zinc-500">
                    <span className="font-mono text-accent-400">{problem.code}</span> · {problem.title} ({problem.track})
                  </p>
                )}
              </div>
              {teamScores.length > 0 && (
                <div className="text-right">
                  <div className="text-2xl font-semibold tabular-nums text-white">
                    {Math.round(
                      teamScores.reduce((a: number, s: any) => a + Number(s.total), 0) /
                        teamScores.length,
                    )}
                  </div>
                  <div className="text-[10px] text-zinc-500">
                    avg of {teamScores.length} sheet{teamScores.length > 1 ? "s" : ""}
                  </div>
                </div>
              )}
            </div>

            {/* Roster */}
            <div className="flex flex-wrap gap-2">
              <span className="flex items-center gap-1.5 text-[11px] text-zinc-500">
                <Users className="h-3.5 w-3.5" />
              </span>
              {(byTeam.get(t.id) ?? []).map((m: any) => (
                <span
                  key={m.id}
                  className="flex items-center gap-1 rounded-full border border-white/10 px-3 py-1 text-[11px] text-zinc-300"
                >
                  {m.member_role === "captain" && <Crown className="h-3 w-3 text-amber-300" />}
                  {m.name} · {m.class_section} · {ROLE_LABEL[m.member_role] ?? "—"}
                </span>
              ))}
            </div>

            {/* Submission — everything the judge needs */}
            <div className="rounded-2xl border border-white/[0.07] bg-zinc-950/50 p-4">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Submission
              </h3>
              {sub ? (
                <div className="flex flex-col gap-3">
                  <div className="flex flex-wrap gap-2">
                    {[
                      { url: sub.github_url, label: "Repository", icon: Github },
                      { url: sub.demo_url, label: "Live demo", icon: Globe },
                      { url: sub.presentation_url, label: "Deck", icon: Presentation },
                      { url: sub.docs_url, label: "Docs", icon: FileText },
                    ]
                      .filter((l) => l.url)
                      .map(({ url, label, icon: Icon }) => (
                        <a
                          key={label}
                          href={url as string}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-zinc-300 transition-colors hover:border-brand-400/40 hover:text-brand-300"
                        >
                          <Icon className="h-3.5 w-3.5" /> {label}
                        </a>
                      ))}
                    {!sub.github_url && !sub.demo_url && !sub.presentation_url && !sub.docs_url && (
                      <span className="text-xs text-zinc-600">No links submitted yet.</span>
                    )}
                  </div>
                  {sub.notes && (
                    <div>
                      <span className="text-[11px] uppercase tracking-wide text-zinc-600">
                        Team notes
                      </span>
                      <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-zinc-300">
                        {sub.notes}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-zinc-600">This team has not submitted anything yet.</p>
              )}
            </div>

            {/* Official marking sheet */}
            <div className="border-t border-white/[0.07] pt-5">
              <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
                <Gavel className="h-4 w-4 text-brand-300" /> Marking sheet
              </h3>
              <MarkingSheet
                teamId={t.id}
                cards={cards ?? []}
                awardedCardIds={teamCards}
                existingScores={teamScores}
              />
            </div>
          </Card>
        );
      })}
    </Container>
  );
}
