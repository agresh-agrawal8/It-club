"use client";

import { useActionState, useState } from "react";
import { Check, Dices, Loader2, Search, X } from "lucide-react";
import {
  assignEnvelopeAction,
  clearEnvelopesAction,
  drawEnvelopesAction,
} from "@/lib/hackathon/actions";

/**
 * The envelope allocation board.
 *
 * One screen for the whole draw, rather than a dropdown buried in each of
 * twenty team accordions. Two panels that read against each other: which team
 * holds nothing, and which envelope is still free.
 *
 * Every control reports what actually happened — assignment can now come back
 * as "assigned", "swapped with X", or a refusal, and the organiser sees which.
 */

export interface BoardEnvelope {
  no: number;
  code: string;
  domain: string;
  title: string;
  holderId: string | null;
  holderName: string | null;
  holderCode: string | null;
}

export interface BoardTeam {
  id: string;
  name: string;
  teamCode: string | null;
  envelopeNo: number | null;
}

type Result = { error?: string; success?: string } | undefined;

function Banner({ state }: { state: Result }) {
  if (!state) return null;
  if (state.error) {
    return (
      <p className="rounded-xl border border-red-400/25 bg-red-500/10 px-4 py-3 text-[13px] text-red-200">
        {state.error}
      </p>
    );
  }
  return (
    <p className="rounded-xl border border-accent-400/25 bg-accent-500/10 px-4 py-3 text-[13px] text-accent-300">
      {state.success}
    </p>
  );
}

/** Per-team assign control. */
function AssignRow({
  team,
  envelopes,
}: {
  team: BoardTeam;
  envelopes: BoardEnvelope[];
}) {
  const [state, action, pending] = useActionState(assignEnvelopeAction, undefined);
  const current = envelopes.find((e) => e.no === team.envelopeNo);

  return (
    <div className="flex flex-col gap-2 rounded-[14px] border border-white/[0.07] bg-black/25 p-3.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="font-mono text-[11px] text-brand-300">{team.teamCode ?? "—"}</span>
          <span className="truncate text-[14px] font-medium text-white">{team.name}</span>
        </div>
        {current ? (
          <span className="shrink-0 rounded-full border border-brand-400/30 bg-brand-500/10 px-2.5 py-0.5 text-[10.5px] text-brand-200">
            {current.code} · {current.domain}
          </span>
        ) : (
          <span className="shrink-0 rounded-full border border-amber-400/25 bg-amber-500/10 px-2.5 py-0.5 text-[10.5px] text-amber-300">
            No envelope
          </span>
        )}
      </div>

      <form action={action} className="flex flex-wrap items-center gap-2">
        <input type="hidden" name="team_id" value={team.id} />
        <select
          name="envelope_no"
          defaultValue={team.envelopeNo ?? ""}
          className="min-w-0 flex-1 rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-[12.5px] text-white transition-colors focus:border-brand-400/60 focus:outline-none"
        >
          <option value="" className="bg-zinc-900">
            — No envelope —
          </option>
          {envelopes.map((e) => (
            <option key={e.no} value={e.no} className="bg-zinc-900">
              {e.code} · {e.domain} — {e.title}
              {e.holderId && e.holderId !== team.id ? `  (${e.holderName})` : ""}
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-white/12 px-3.5 py-2 text-[12.5px] text-white transition-colors hover:border-brand-400/50 disabled:opacity-60"
        >
          {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
          Apply
        </button>
      </form>

      <Banner state={state} />
    </div>
  );
}

export function EnvelopeBoard({
  teams,
  envelopes,
}: {
  teams: BoardTeam[];
  envelopes: BoardEnvelope[];
}) {
  const [drawState, drawAction, drawPending] = useActionState(drawEnvelopesAction, undefined);
  const [clearState, clearAction, clearPending] = useActionState(clearEnvelopesAction, undefined);
  const [confirmClear, setConfirmClear] = useState(false);
  const [query, setQuery] = useState("");

  const unassigned = teams.filter((t) => t.envelopeNo == null);
  const free = envelopes.filter((e) => !e.holderId);

  const q = query.trim().toLowerCase();
  const shownTeams = q
    ? teams.filter(
        (t) =>
          t.name.toLowerCase().includes(q) || (t.teamCode ?? "").toLowerCase().includes(q),
      )
    : teams;
  const shownEnvelopes = q
    ? envelopes.filter(
        (e) =>
          e.domain.toLowerCase().includes(q) ||
          e.title.toLowerCase().includes(q) ||
          e.code.toLowerCase().includes(q) ||
          (e.holderName ?? "").toLowerCase().includes(q),
      )
    : envelopes;

  return (
    <div className="flex flex-col gap-6">
      {/* ── Bulk actions ─────────────────────────────────────── */}
      <div className="flex flex-col gap-3 rounded-[18px] border border-white/[0.07] bg-[#0d0d11] p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-col gap-1">
            <span className="text-[15px] font-semibold tracking-tight text-white">
              Draw the remaining envelopes
            </span>
            <span className="text-[12.5px] text-zinc-500">
              {unassigned.length === 0
                ? "Every team already holds an envelope."
                : `${unassigned.length} team${unassigned.length === 1 ? "" : "s"} waiting · ${free.length} envelope${free.length === 1 ? "" : "s"} free`}
            </span>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <form action={drawAction}>
              <button
                disabled={drawPending || unassigned.length === 0}
                className="inline-flex items-center gap-2 rounded-full bg-brand-600 px-5 py-2.5 text-[13px] font-medium text-white transition-colors hover:bg-brand-500 disabled:opacity-50"
              >
                {drawPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Dices className="h-3.5 w-3.5" />
                )}
                Draw for {unassigned.length || "all"}
              </button>
            </form>
            {confirmClear ? (
              <form action={clearAction} className="flex items-center gap-2">
                <button
                  disabled={clearPending}
                  className="inline-flex items-center gap-1.5 rounded-full border border-red-400/40 bg-red-500/10 px-4 py-2.5 text-[13px] text-red-200 transition-colors hover:bg-red-500/20 disabled:opacity-60"
                >
                  {clearPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Confirm clear all
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmClear(false)}
                  className="rounded-full border border-white/12 px-3 py-2.5 text-[13px] text-zinc-400"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmClear(true)}
                className="rounded-full border border-white/12 px-4 py-2.5 text-[13px] text-zinc-300 transition-colors hover:border-red-400/40 hover:text-red-300"
              >
                Clear all
              </button>
            )}
          </div>
        </div>
        <Banner state={drawState} />
        <Banner state={clearState} />
      </div>

      {/* ── Filter ───────────────────────────────────────────── */}
      <label className="relative block">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter by team, domain or envelope…"
          className="w-full rounded-xl border border-white/10 bg-black/40 py-2.5 pl-10 pr-3.5 text-sm text-white placeholder:text-zinc-600 transition-colors focus:border-brand-400/60 focus:outline-none"
        />
      </label>

      <div className="grid gap-5 lg:grid-cols-2 lg:items-start">
        {/* ── Teams ──────────────────────────────────────────── */}
        <section className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between gap-3 border-b border-white/[0.07] pb-2.5">
            <h2 className="text-[15px] font-semibold tracking-tight text-white">Teams</h2>
            <span className="text-[11px] uppercase tracking-[0.14em] text-zinc-600">
              {teams.length - unassigned.length}/{teams.length} assigned
            </span>
          </div>
          {shownTeams.length === 0 ? (
            <p className="rounded-[14px] border border-dashed border-white/10 px-4 py-8 text-center text-[13px] text-zinc-600">
              {teams.length === 0 ? "No teams registered yet." : "No teams match that filter."}
            </p>
          ) : (
            shownTeams.map((t) => <AssignRow key={t.id} team={t} envelopes={envelopes} />)
          )}
        </section>

        {/* ── Envelope board ─────────────────────────────────── */}
        <section className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between gap-3 border-b border-white/[0.07] pb-2.5">
            <h2 className="text-[15px] font-semibold tracking-tight text-white">
              The twenty envelopes
            </h2>
            <span className="text-[11px] uppercase tracking-[0.14em] text-zinc-600">
              {free.length} free
            </span>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {shownEnvelopes.map((e) => (
              <div
                key={e.no}
                className={`flex flex-col gap-1.5 rounded-[14px] border p-3.5 transition-colors ${
                  e.holderId
                    ? "border-brand-400/25 bg-brand-500/[0.07]"
                    : "border-white/[0.07] bg-black/25"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[10.5px] text-zinc-500">{e.code}</span>
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      e.holderId ? "bg-brand-400" : "bg-zinc-700"
                    }`}
                  />
                </div>
                <span className="text-[13.5px] font-medium leading-tight text-white">
                  {e.title}
                </span>
                <span className="text-[11px] text-zinc-500">{e.domain}</span>
                <span
                  className={`mt-1 truncate text-[11.5px] ${
                    e.holderName ? "text-brand-200" : "text-zinc-600"
                  }`}
                >
                  {e.holderName ?? "Free"}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
