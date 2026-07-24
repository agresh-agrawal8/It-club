"use client";

import { useState, useTransition } from "react";
import { ChevronDown, UserCog } from "lucide-react";
import { switchIdentityAction } from "@/lib/hackathon/actions";
import { cn } from "@/lib/utils";

interface Person {
  id: string;
  name: string;
  role: string;
}

/**
 * Demo role explorer — swap the active participant to preview the dashboard
 * as a student, judge, organizer or admin. This stands in for real auth,
 * which will replace it later without touching the rest of the module.
 */
export function RoleSwitcher({ people, currentId }: { people: Person[]; currentId: string | null }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const current = people.find((p) => p.id === currentId) ?? people[0];

  const grouped: Record<string, Person[]> = {};
  for (const p of people) (grouped[p.role] ??= []).push(p);
  const order = ["student", "judge", "organizer", "admin"];

  function pick(id: string) {
    setOpen(false);
    startTransition(async () => {
      await switchIdentityAction(id);
    });
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={pending}
        className="glass flex items-center gap-2.5 rounded-full py-1.5 pl-3 pr-2.5 text-sm text-zinc-200 transition-colors hover:border-brand-400/40"
      >
        <UserCog className="h-4 w-4 text-brand-300" />
        <span className="hidden sm:inline">
          Viewing as <span className="font-medium text-white">{current?.name ?? "—"}</span>
        </span>
        <span className="rounded-full bg-brand-500/20 px-2 py-0.5 text-[10px] uppercase tracking-wide text-brand-200">
          {current?.role ?? "demo"}
        </span>
        <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="glass-deep absolute right-0 z-50 mt-2 max-h-[70vh] w-64 overflow-y-auto rounded-2xl p-2">
            <p className="px-3 py-2 text-[10px] uppercase tracking-[2px] text-zinc-500">
              Demo — preview any role
            </p>
            {order
              .filter((r) => grouped[r]?.length)
              .map((r) => (
                <div key={r} className="mb-1">
                  <p className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wide text-brand-300/80">
                    {r}
                  </p>
                  {grouped[r].map((p) => (
                    <button
                      key={p.id}
                      onClick={() => pick(p.id)}
                      className={cn(
                        "flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition-colors",
                        p.id === currentId
                          ? "bg-brand-500/15 text-white"
                          : "text-zinc-300 hover:bg-white/5 hover:text-white",
                      )}
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              ))}
          </div>
        </>
      )}
    </div>
  );
}
