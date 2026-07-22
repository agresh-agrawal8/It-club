"use client";

import { useActionState } from "react";
import { Send, CheckCircle2 } from "lucide-react";
import { joinRequestAction } from "@/lib/actions/public";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const TRACKS = [
  "Web Development",
  "App Development",
  "AI & Machine Learning",
  "Robotics & IoT",
  "Cybersecurity",
  "Competitive Programming",
];

const GRADES = ["6", "7", "8", "9", "10", "11", "12"];

const inputClasses =
  "w-full rounded-xl border border-white/10 bg-zinc-950/60 px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:border-brand-400/60 focus:outline-none transition-colors";

export function JoinForm() {
  const [state, formAction, pending] = useActionState(joinRequestAction, undefined);

  if (state && "success" in state && state.success) {
    return (
      <div className="flex flex-col items-center gap-4 py-12 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-300">
          <CheckCircle2 className="h-7 w-7" />
        </span>
        <h3 className="text-xl font-semibold tracking-tight text-white">You&apos;re in the queue!</h3>
        <p className="max-w-sm text-sm leading-relaxed text-zinc-400">{state.success}</p>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Full name <span className="text-brand-300">*</span>
          </span>
          <input name="name" required placeholder="Your name" className={inputClasses} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Email <span className="text-brand-300">*</span>
          </span>
          <input name="email" type="email" required placeholder="you@school.edu" className={inputClasses} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Class <span className="text-brand-300">*</span>
          </span>
          <select name="grade" required defaultValue="" className={inputClasses}>
            <option value="" disabled>
              Select your class
            </option>
            {GRADES.map((g) => (
              <option key={g} value={`Class ${g}`}>
                Class {g}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Phone <span className="text-zinc-600">(optional)</span>
          </span>
          <input name="phone" type="tel" placeholder="+91 …" className={inputClasses} />
        </label>
      </div>

      {/* Interest chips */}
      <fieldset className="flex flex-col gap-2.5">
        <legend className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          What do you want to explore?
        </legend>
        <div className="flex flex-wrap gap-2">
          {TRACKS.map((t) => (
            <label key={t} className="cursor-pointer">
              <input type="checkbox" name="interests" value={t} className="peer sr-only" />
              <span
                className={cn(
                  "inline-flex items-center rounded-full border border-white/10 px-3.5 py-1.5 text-xs text-zinc-400 transition-colors",
                  "hover:border-white/25 hover:text-zinc-200",
                  "peer-checked:border-brand-400/60 peer-checked:bg-brand-500/20 peer-checked:text-brand-200",
                )}
              >
                {t}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          Coding experience
        </span>
        <select name="experience" defaultValue="beginner" className={inputClasses}>
          <option value="beginner">Beginner — just starting out</option>
          <option value="some">Some experience — school projects, tutorials</option>
          <option value="confident">Confident — built and shipped things</option>
        </select>
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          Why do you want to join? <span className="text-brand-300">*</span>
        </span>
        <textarea
          name="why"
          rows={4}
          required
          placeholder="What do you want to build or learn with us?"
          className={cn(inputClasses, "resize-none")}
        />
      </label>

      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" variant="brand" disabled={pending} className="rounded-full">
          <Send className="h-4 w-4" />
          {pending ? "Sending…" : "Apply to join Avinya"}
        </Button>
        {state && "error" in state && state.error && (
          <p className="text-sm text-red-400">{state.error}</p>
        )}
      </div>
    </form>
  );
}
