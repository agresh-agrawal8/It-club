"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Check, Loader2, UserPlus, X } from "lucide-react";
import { registerTeamAction } from "@/lib/hackathon/portal-actions";
import { EVENT, QUIZ_REPS_REQUIRED, ROLES } from "@/lib/hackathon/content";

const FIELD =
  "w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-600 transition-colors focus:border-brand-400/60 focus:outline-none";

const LABEL = "text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500";

/** Row 0 defaults to captain; the rest start on the matching role. */
const DEFAULT_ROLE = ROLES.map((r) => r.id);

export function RegisterForm() {
  const [state, formAction, pending] = useActionState(registerTeamAction, undefined);
  const [rows, setRows] = useState(3);
  const [quiz, setQuiz] = useState<boolean[]>([false, false, false, false, false]);

  const quizCount = quiz.slice(0, rows).filter(Boolean).length;

  if (state && "success" in state) {
    return (
      <div className="flex flex-col items-center gap-6 py-6 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-500/15 text-accent-400">
          <Check className="h-6 w-6" />
        </span>
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-semibold tracking-tight text-white">
            {state.teamName} is registered
          </h2>
          <p className="max-w-md text-[13.5px] leading-relaxed text-zinc-400">
            Your team ID is{" "}
            <span className="font-mono text-brand-300">{state.teamCode}</span>. There is no password
            to remember — open your team portal any time by typing your exact team name.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Link
            href="/hackathon/team"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-500"
          >
            Open team portal <ArrowUpRight className="h-4 w-4" />
          </Link>
          <Link
            href="/hackathon/rules"
            className="inline-flex items-center justify-center rounded-full border border-white/12 px-5 py-2.5 text-sm text-white transition-colors hover:border-white/25"
          >
            Read the rules
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-8">
      {/* ── Team ─────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4">
        <span className="text-[11px] uppercase tracking-[0.16em] text-brand-300">Your team</span>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className={LABEL}>Team name *</span>
            <input
              name="team_name"
              required
              minLength={3}
              maxLength={40}
              placeholder="e.g. Byte Forge"
              className={FIELD}
            />
            <span className="text-[11px] text-zinc-600">
              This is how you will open your portal — pick something you will remember exactly.
            </span>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={LABEL}>School</span>
            <input
              name="school"
              placeholder={EVENT.school}
              defaultValue={EVENT.school}
              className={FIELD}
            />
          </label>
        </div>
        <label className="flex flex-col gap-1.5">
          <span className={LABEL}>Tagline (optional)</span>
          <input name="tagline" maxLength={80} placeholder="One line about your team" className={FIELD} />
        </label>
      </div>

      {/* ── Members ──────────────────────────────────────────── */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-[11px] uppercase tracking-[0.16em] text-brand-300">
            Members ({rows}/{EVENT.maxTeamSize})
          </span>
          <span
            className={`text-[11.5px] ${
              quizCount === QUIZ_REPS_REQUIRED ? "text-accent-400" : "text-amber-300"
            }`}
          >
            {quizCount}/{QUIZ_REPS_REQUIRED} quiz representatives selected
          </span>
        </div>

        <div className="flex flex-col gap-3">
          {Array.from({ length: rows }).map((_, i) => (
            <div
              key={i}
              className="rounded-[18px] border border-white/[0.07] bg-[#0d0d11] p-4 sm:p-5"
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-[0.14em] text-zinc-500">
                  Member {i + 1}
                  {i === 0 && <span className="ml-2 text-brand-300">Captain</span>}
                </span>
                {i >= EVENT.minTeamSize && i === rows - 1 && (
                  <button
                    type="button"
                    onClick={() => setRows((r) => r - 1)}
                    className="flex items-center gap-1 text-[11px] text-zinc-500 transition-colors hover:text-red-300"
                  >
                    <X className="h-3 w-3" /> Remove
                  </button>
                )}
              </div>

              <div className="grid gap-3 sm:grid-cols-[1.4fr_0.8fr_1.2fr]">
                <label className="flex flex-col gap-1.5">
                  <span className={LABEL}>Full name *</span>
                  <input name={`m${i}_name`} required minLength={2} className={FIELD} />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className={LABEL}>Class / section *</span>
                  <input name={`m${i}_class`} required placeholder="X-B" className={FIELD} />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className={LABEL}>Role *</span>
                  <select
                    name={`m${i}_role`}
                    required
                    defaultValue={DEFAULT_ROLE[i]}
                    className={FIELD}
                  >
                    {ROLES.map((r) => (
                      <option key={r.id} value={r.id} className="bg-zinc-900">
                        {r.title}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="mt-3 flex w-fit cursor-pointer items-center gap-2.5 rounded-full border border-white/10 px-3.5 py-2 transition-colors hover:border-brand-400/40">
                <input
                  type="checkbox"
                  name={`m${i}_quiz`}
                  checked={quiz[i]}
                  onChange={(e) =>
                    setQuiz((q) => q.map((v, idx) => (idx === i ? e.target.checked : v)))
                  }
                  className="h-3.5 w-3.5 accent-[var(--color-brand-500)]"
                />
                <span className="text-[12.5px] text-zinc-300">Quiz representative</span>
              </label>
            </div>
          ))}
        </div>

        {rows < EVENT.maxTeamSize && (
          <button
            type="button"
            onClick={() => setRows((r) => r + 1)}
            className="flex items-center justify-center gap-2 rounded-[18px] border border-dashed border-white/12 py-3.5 text-[13px] text-zinc-400 transition-colors hover:border-brand-400/40 hover:text-white"
          >
            <UserPlus className="h-4 w-4" /> Add member {rows + 1}
          </button>
        )}
      </div>

      {state && "error" in state && (
        <p className="rounded-xl border border-red-400/25 bg-red-500/10 px-4 py-3 text-[13px] text-red-200">
          {state.error}
        </p>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[11.5px] leading-relaxed text-zinc-500">
          One Team Captain, each role once, exactly {QUIZ_REPS_REQUIRED} quiz reps. Each student can
          only join one team.
        </p>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-brand-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-brand-500 disabled:opacity-60"
        >
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          {pending ? "Registering…" : "Register team"}
        </button>
      </div>
    </form>
  );
}
