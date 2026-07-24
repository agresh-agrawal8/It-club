"use client";

import { useActionState, useState } from "react";
import { Save, Award } from "lucide-react";
import { saveOfficialScoreAction, toggleTeamCardAction } from "@/lib/hackathon/team-actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const RARITY_STYLE: Record<string, string> = {
  Common: "border-brand-400/40 bg-brand-500/15 text-brand-200",
  Rare: "border-sky-400/40 bg-sky-500/15 text-sky-200",
  Epic: "border-fuchsia-400/40 bg-fuchsia-500/15 text-fuchsia-200",
  Legendary: "border-amber-400/40 bg-amber-500/15 text-amber-200",
};

/** Section B/C/D fields, exactly as printed on the official sheet. */
const SECTION_B = [
  { name: "innovation", label: "Innovation & Originality", max: 10 },
  { name: "practicality", label: "Practicality & Impact", max: 10 },
  { name: "uiux", label: "UI / UX Quality", max: 10 },
  { name: "working_demo", label: "Working Demo", max: 10 },
  { name: "problem_solving", label: "Problem Solving", max: 10 },
  { name: "presentation", label: "Presentation & Pitch", max: 10 },
];
const SECTION_C = [
  { name: "task_completion", label: "Task Completion", max: 20 },
  { name: "code_quality", label: "Code Quality", max: 10 },
  { name: "speed_bonus", label: "Speed Bonus", max: 10 },
];

function ScoreInput({
  name,
  label,
  max,
  value,
  onChange,
}: {
  name: string;
  label: string;
  max: number;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.07] bg-zinc-950/50 px-3.5 py-2.5">
      <span className="text-xs text-zinc-300">{label}</span>
      <span className="flex items-center gap-1.5">
        <input
          type="number"
          name={name}
          min={0}
          max={max}
          value={value}
          onChange={(e) => onChange(Math.max(0, Math.min(max, Number(e.target.value) || 0)))}
          className="w-14 rounded-lg border border-white/10 bg-zinc-950 px-2 py-1 text-right text-sm tabular-nums text-white focus:border-brand-400/60 focus:outline-none"
        />
        <span className="w-7 text-[11px] text-zinc-600">/{max}</span>
      </span>
    </label>
  );
}

export function MarkingSheet({
  teamId,
  cards,
  awardedCardIds,
  existingScores,
}: {
  teamId: string;
  cards: any[];
  awardedCardIds: string[];
  existingScores: any[];
}) {
  const [state, formAction, pending] = useActionState(saveOfficialScoreAction, undefined);
  const [judge, setJudge] = useState("");

  // Pre-fill from this judge's existing sheet if the name matches.
  const prior = existingScores.find((s) => (s.comments ?? "") === judge.trim());
  const init = (k: string) => Number(prior?.[k] ?? 0);

  const [b, setB] = useState<Record<string, number>>(() =>
    Object.fromEntries(SECTION_B.map((f) => [f.name, 0])),
  );
  const [c, setC] = useState<Record<string, number>>(() =>
    Object.fromEntries(SECTION_C.map((f) => [f.name, 0])),
  );
  const [bonus, setBonus] = useState(0);
  const [penalty, setPenalty] = useState(0);

  const sectionA = cards
    .filter((x) => awardedCardIds.includes(x.id))
    .reduce((sum, x) => sum + (x.points ?? 0), 0);
  const sectionB = Object.values(b).reduce((a, v) => a + v, 0);
  const sectionC = Object.values(c).reduce((a, v) => a + v, 0);
  const grand = sectionA + sectionB + sectionC + bonus - penalty;

  return (
    <div className="flex flex-col gap-5">
      {/* Section A — achievement cards */}
      <div>
        <div className="mb-2.5 flex items-center justify-between">
          <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">
            <Award className="h-3.5 w-3.5 text-brand-300" /> A · Achievement cards
          </span>
          <span className="text-sm font-semibold tabular-nums text-white">{sectionA}</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {cards.map((card) => {
            const has = awardedCardIds.includes(card.id);
            return (
              <form key={card.id} action={toggleTeamCardAction}>
                <input type="hidden" name="team_id" value={teamId} />
                <input type="hidden" name="card_id" value={card.id} />
                <input type="hidden" name="has" value={String(has)} />
                <button
                  type="submit"
                  title={`${card.rarity} · +${card.points} — ${card.description ?? ""}`}
                  className={cn(
                    "rounded-lg border px-2.5 py-1 text-[10px] transition-colors",
                    has
                      ? RARITY_STYLE[card.rarity] ?? "border-white/20 text-white"
                      : "border-white/[0.07] text-zinc-600 hover:border-white/20 hover:text-zinc-300",
                  )}
                >
                  {card.title} <span className="opacity-70">+{card.points}</span>
                </button>
              </form>
            );
          })}
        </div>
      </div>

      <form action={formAction} className="flex flex-col gap-5">
        <input type="hidden" name="team_id" value={teamId} />

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Judge name <span className="text-brand-300">*</span>
          </span>
          <input
            name="judge_name"
            value={judge}
            onChange={(e) => setJudge(e.target.value)}
            required
            placeholder="Your name (identifies your sheet)"
            className="w-full rounded-xl border border-white/10 bg-zinc-950/60 px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:border-brand-400/60 focus:outline-none"
          />
        </label>

        <div className="grid gap-5 lg:grid-cols-2">
          {/* Section B */}
          <div>
            <div className="mb-2.5 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                B · Judge evaluation
              </span>
              <span className="text-sm font-semibold tabular-nums text-white">{sectionB}/60</span>
            </div>
            <div className="flex flex-col gap-2">
              {SECTION_B.map((f) => (
                <ScoreInput
                  key={f.name}
                  {...f}
                  value={b[f.name]}
                  onChange={(v) => setB((s) => ({ ...s, [f.name]: v }))}
                />
              ))}
            </div>
          </div>

          {/* Section C + D */}
          <div className="flex flex-col gap-5">
            <div>
              <div className="mb-2.5 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                  C · 2-hour task challenge
                </span>
                <span className="text-sm font-semibold tabular-nums text-white">{sectionC}/40</span>
              </div>
              <div className="flex flex-col gap-2">
                {SECTION_C.map((f) => (
                  <ScoreInput
                    key={f.name}
                    {...f}
                    value={c[f.name]}
                    onChange={(v) => setC((s) => ({ ...s, [f.name]: v }))}
                  />
                ))}
              </div>
            </div>

            <div>
              <span className="mb-2.5 block text-xs font-semibold uppercase tracking-wide text-zinc-400">
                D · Bonus &amp; penalties
              </span>
              <div className="flex flex-col gap-2">
                <ScoreInput
                  name="bonus_challenge"
                  label="Bonus challenge"
                  max={25}
                  value={bonus}
                  onChange={setBonus}
                />
                <ScoreInput
                  name="penalties"
                  label="Penalties (deduct)"
                  max={100}
                  value={penalty}
                  onChange={setPenalty}
                />
              </div>
            </div>
          </div>
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Judge&apos;s notes
          </span>
          <textarea
            name="notes"
            rows={2}
            placeholder="Feedback for the team…"
            className="w-full resize-none rounded-xl border border-white/10 bg-zinc-950/60 px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:border-brand-400/60 focus:outline-none"
          />
        </label>

        {/* Grand total */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-amber-400/25 bg-amber-500/[0.06] px-5 py-4">
          <div>
            <div className="text-[10px] uppercase tracking-[2px] text-amber-300/90">Grand total</div>
            <div className="text-[11px] text-zinc-500">A + B + C + D − penalties</div>
          </div>
          <div className="text-3xl font-semibold tabular-nums text-white">{grand}</div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" variant="brand" size="sm" disabled={pending} className="rounded-full">
            <Save className="h-4 w-4" /> {pending ? "Saving…" : "Save marking sheet"}
          </Button>
          {state?.error && <p className="text-sm text-red-400">{state.error}</p>}
          {state?.success && <p className="text-sm text-accent-400">{state.success}</p>}
        </div>
      </form>

      {/* Sheets already recorded */}
      {existingScores.length > 0 && (
        <div className="flex flex-wrap gap-2 border-t border-white/[0.07] pt-4">
          {existingScores.map((s) => (
            <span
              key={s.id}
              className="rounded-full border border-white/10 px-3 py-1 text-[11px] text-zinc-400"
            >
              {s.comments || "Judge"}: <span className="text-white">{s.total}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
