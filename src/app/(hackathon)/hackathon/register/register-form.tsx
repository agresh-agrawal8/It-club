"use client";

import { useActionState, useState } from "react";
import { Crown, Send, Users } from "lucide-react";
import { registerTeamAction } from "@/lib/hackathon/team-actions";
import { CredentialsPanel } from "@/components/hackathon/credentials-panel";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const ROLES = [
  { value: "captain", label: "Team Captain", hint: "Owns direction & final calls" },
  { value: "frontend", label: "Frontend Developer", hint: "Builds the interface" },
  { value: "backend", label: "Backend Developer", hint: "Owns data, logic & APIs" },
  { value: "uiux", label: "UI / UX Designer", hint: "Shapes experience & flow" },
  { value: "docs", label: "Docs & Presentation Lead", hint: "Documents & tells the story" },
];

const input =
  "w-full rounded-xl border border-white/10 bg-zinc-950/60 px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:border-brand-400/60 focus:outline-none transition-colors";

export function RegisterForm() {
  const [state, formAction, pending] = useActionState(registerTeamAction, undefined);
  const [quiz, setQuiz] = useState<boolean[]>([false, false, false, false, false]);

  const quizCount = quiz.filter(Boolean).length;

  function toggleQuiz(i: number) {
    setQuiz((q) => {
      const next = [...q];
      // Cap at 2 quiz reps — clicking a third does nothing.
      if (!next[i] && quizCount >= 2) return q;
      next[i] = !next[i];
      return next;
    });
  }

  // Credentials are issued at registration and shown exactly once.
  if (state && "teamCode" in state) {
    return (
      <CredentialsPanel
        teamCode={state.teamCode}
        password={state.password}
        message={state.success}
      />
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-7">
      {/* Team details */}
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Team name <span className="text-brand-300">*</span>
          </span>
          <input name="team_name" required placeholder="e.g. Neural Nomads" className={input} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">School</span>
          <input name="school" placeholder="Emerald Heights International School" className={input} />
        </label>
        <label className="flex flex-col gap-1.5 sm:col-span-2">
          <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Tagline <span className="text-zinc-600">(optional)</span>
          </span>
          <input name="tagline" placeholder="One line about your team" className={input} />
        </label>
      </div>

      {/* Members */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
            <Users className="h-4 w-4 text-brand-300" /> Team members
            <span className="text-xs font-normal text-zinc-500">(2–5, one per role)</span>
          </h3>
          <span
            className={cn(
              "rounded-full px-2.5 py-1 text-[11px]",
              quizCount === 2
                ? "bg-accent-500/15 text-accent-300"
                : "bg-amber-500/15 text-amber-300",
            )}
          >
            {quizCount}/2 quiz reps selected
          </span>
        </div>

        {ROLES.map((r, i) => (
          <div
            key={r.value}
            className={cn(
              "rounded-2xl border p-4 transition-colors",
              i === 0 ? "border-amber-400/25 bg-amber-500/[0.04]" : "border-white/10 bg-zinc-950/40",
            )}
          >
            <div className="mb-3 flex items-center justify-between gap-3">
              <span className="flex items-center gap-2 text-sm font-medium text-white">
                {i === 0 && <Crown className="h-4 w-4 text-amber-300" />}
                {r.label}
              </span>
              <span className="hidden text-[11px] text-zinc-500 sm:block">{r.hint}</span>
            </div>
            <input type="hidden" name={`m${i}_role`} value={r.value} />
            <div className="grid gap-3 sm:grid-cols-[1.4fr_1fr_auto]">
              <input
                name={`m${i}_name`}
                placeholder="Full name"
                required={i < 2}
                className={input}
              />
              <input
                name={`m${i}_class`}
                placeholder="Class & section (e.g. 11-B)"
                required={i < 2}
                className={input}
              />
              <label
                className={cn(
                  "flex cursor-pointer items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-xs transition-colors",
                  quiz[i]
                    ? "border-accent-400/50 bg-accent-500/15 text-accent-300"
                    : "border-white/10 text-zinc-400 hover:border-white/25",
                )}
              >
                <input
                  type="checkbox"
                  name={`m${i}_quiz`}
                  checked={quiz[i]}
                  onChange={() => toggleQuiz(i)}
                  className="sr-only"
                />
                Quiz rep
              </label>
            </div>
          </div>
        ))}
        <p className="text-[11px] leading-relaxed text-zinc-600">
          Leave a row blank if your team is smaller than five. Every student may join only one
          team — duplicate entries are rejected automatically.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" variant="brand" disabled={pending} className="rounded-full">
          <Send className="h-4 w-4" />
          {pending ? "Submitting…" : "Register team"}
        </Button>
        {state && "error" in state && state.error && (
          <p className="text-sm text-red-400">{state.error}</p>
        )}
      </div>
    </form>
  );
}
