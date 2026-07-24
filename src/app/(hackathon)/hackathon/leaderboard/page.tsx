import type { Metadata } from "next";
import { Trophy, Crown, Minus } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getLeaderboard } from "@/lib/hackathon/data";

export const metadata: Metadata = { title: "Leaderboard" };

const statusVariant: Record<string, "success" | "accent" | "warning" | "danger" | "small"> = {
  submitted: "success",
  active: "accent",
  forming: "warning",
  disqualified: "danger",
};

const podium = ["text-amber-300", "text-zinc-300", "text-orange-300"];

export default async function LeaderboardPage() {
  const rows = await getLeaderboard();
  const scored = rows.filter((r) => r.judges > 0);
  const top = scored.slice(0, 3);

  return (
    <Container className="flex flex-col gap-10 py-14">
      <div className="flex flex-col items-center gap-3 text-center">
        <span className="eyebrow text-accent-400">Live standings</span>
        <h1 className="text-4xl font-semibold tracking-tighter text-white md:text-6xl">Leaderboard</h1>
        <p className="max-w-xl text-sm text-zinc-400">
          Teams ranked by average judge score across innovation, execution, impact and presentation.
        </p>
      </div>

      {/* Podium */}
      {top.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-3">
          {top.map((r, i) => (
            <Card
              key={r.team_id}
              deep={i === 0}
              className={`relative flex flex-col items-center gap-2 p-6 text-center ${
                i === 0 ? "sm:-translate-y-3" : ""
              }`}
            >
              <Crown className={`h-6 w-6 ${podium[i]}`} />
              <span className="text-4xl font-semibold tracking-tighter text-white">{r.avg}</span>
              <span className="text-[11px] uppercase tracking-wide text-zinc-500">avg / 40</span>
              <h3 className="mt-1 text-sm font-semibold text-white">{r.name}</h3>
              {r.tagline && <p className="text-xs text-zinc-500">{r.tagline}</p>}
              <span className="mt-1 font-mono text-[11px] text-accent-400">#{i + 1}</span>
            </Card>
          ))}
        </div>
      )}

      {/* Full table */}
      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="border-b border-white/10 text-xs uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-5 py-3.5 font-medium">#</th>
                <th className="px-5 py-3.5 font-medium">Team</th>
                <th className="px-5 py-3.5 font-medium">Track</th>
                <th className="px-5 py-3.5 font-medium">Status</th>
                <th className="px-5 py-3.5 text-right font-medium">Judges</th>
                <th className="px-5 py-3.5 text-right font-medium">Avg</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {rows.map((r, i) => (
                <tr key={r.team_id} className="transition-colors hover:bg-white/[0.03]">
                  <td className="px-5 py-3.5">
                    <span
                      className={`font-mono text-sm ${i < 3 && r.judges > 0 ? podium[i] : "text-zinc-500"}`}
                    >
                      {r.judges > 0 ? i + 1 : <Minus className="h-3.5 w-3.5 text-zinc-700" />}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="font-medium text-white">{r.name}</div>
                    {r.tagline && <div className="text-[11px] text-zinc-500">{r.tagline}</div>}
                  </td>
                  <td className="px-5 py-3.5 font-mono text-xs text-accent-400">
                    {r.problem_code ?? "—"}
                  </td>
                  <td className="px-5 py-3.5">
                    <Badge variant={statusVariant[r.status] ?? "small"}>{r.status}</Badge>
                  </td>
                  <td className="px-5 py-3.5 text-right tabular-nums text-zinc-400">{r.judges}</td>
                  <td className="px-5 py-3.5 text-right">
                    <span className="font-semibold tabular-nums text-white">
                      {r.judges > 0 ? r.avg : "—"}
                    </span>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-zinc-500">
                    <Trophy className="mx-auto mb-3 h-6 w-6 text-zinc-700" />
                    Scores appear here as judges submit them.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </Container>
  );
}
