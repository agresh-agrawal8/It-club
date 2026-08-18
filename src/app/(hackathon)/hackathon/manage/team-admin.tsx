"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Check, Download, Loader2, Trash2, Upload, UserPlus } from "lucide-react";
import {
  addMemberAction,
  deleteTeamAction,
  removeMemberAction,
  saveResultAction,
  toggleResultPublishedAction,
  updateMemberAction,
  updateTeamDetailsAction,
} from "@/lib/hackathon/actions";

/**
 * The organiser's editor for one team.
 *
 * Split into independent forms, each with its own action state, so a failure
 * in one (say a duplicate member) never discards what was typed into another.
 *
 * The envelope is shown but not editable here — allocating twenty unique
 * briefs is one sitting on a board where the whole picture is visible, so it
 * lives at /hackathon/envelopes. The label arrives as a prop rather than being
 * imported, keeping sealed brief titles out of this client chunk.
 */

export interface AdminMember {
  id: string;
  name: string;
  class_section: string | null;
  member_role: string;
  is_quiz_rep: boolean;
}

export interface AdminTeam {
  id: string;
  name: string;
  team_code: string | null;
  tagline: string | null;
  school: string | null;
  status: string;
  envelope_no: number | null;
}

export interface AdminResult {
  final_score: number | null;
  remarks: string | null;
  hasSheet: boolean;
  published: boolean;
}

export interface AdminSubmission {
  status: "draft" | "submitted";
  submittedAt: string | null;
  codeName: string | null;
  deckName: string | null;
  repoUrl: string | null;
  notes: string | null;
  codeUrl: string | null;
  deckUrl: string | null;
}

const FIELD =
  "w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-[13px] text-white placeholder:text-zinc-600 transition-colors focus:border-brand-400/60 focus:outline-none";
const LABEL = "text-[10px] font-medium uppercase tracking-[0.12em] text-zinc-500";
const ROLES = [
  { id: "captain", label: "Team Captain" },
  { id: "frontend", label: "Frontend Developer" },
  { id: "backend", label: "Backend Developer" },
  { id: "uiux", label: "UI / UX Designer" },
  { id: "docs", label: "Docs & Presentation Lead" },
];
const STATUSES = ["forming", "active", "submitted", "disqualified"];

function Feedback({ state }: { state?: { error?: string; success?: string } }) {
  if (!state) return null;
  if (state.error) return <p className="text-[12px] text-red-300">{state.error}</p>;
  if (state.success) return <p className="text-[12px] text-accent-400">{state.success}</p>;
  return null;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3 border-t border-white/[0.06] pt-4">
      <span className="text-[10px] uppercase tracking-[0.14em] text-zinc-500">{title}</span>
      {children}
    </div>
  );
}

export function TeamAdminCard({
  team,
  members,
  result,
  submission,
  envelopeLabel,
}: {
  team: AdminTeam;
  members: AdminMember[];
  result: AdminResult | null;
  submission: AdminSubmission | null;
  envelopeLabel: string | null;
}) {
  const [detailState, detailAction, detailPending] = useActionState(
    updateTeamDetailsAction,
    undefined,
  );
  const [resultState, resultAction, resultPending] = useActionState(saveResultAction, undefined);
  const [addState, addAction, addPending] = useActionState(addMemberAction, undefined);
  const [deleteState, deleteAction, deletePending] = useActionState(deleteTeamAction, undefined);
  const [showDelete, setShowDelete] = useState(false);

  const published = result?.published ?? false;

  return (
    <details className="group overflow-hidden rounded-[18px] border border-white/[0.07] bg-[#0d0d11]">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 transition-colors hover:bg-white/[0.02]">
        <div className="flex min-w-0 items-center gap-3">
          <span className="font-mono text-[11px] text-brand-300">{team.team_code ?? "—"}</span>
          <span className="truncate text-[14px] font-medium text-white">{team.name}</span>
          <span className="hidden text-[11px] text-zinc-600 sm:inline">
            {members.length} members
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {team.envelope_no != null && (
            <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] text-zinc-400">
              ENV-{String(team.envelope_no).padStart(2, "0")}
            </span>
          )}
          {result?.final_score != null && (
            <span className="rounded-full border border-amber-400/30 bg-amber-500/10 px-2 py-0.5 text-[10px] text-amber-300">
              {result.final_score}
            </span>
          )}
          {published && (
            <span className="rounded-full border border-accent-400/30 bg-accent-500/10 px-2 py-0.5 text-[10px] text-accent-400">
              Published
            </span>
          )}
          <span className="text-zinc-600 transition-transform group-open:rotate-90">›</span>
        </div>
      </summary>

      <div className="flex flex-col gap-4 px-5 pb-5">
        {/* ── Submission ─────────────────────────────────────── */}
        <Section title="Submitted project">
          {submission ? (
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full border px-2.5 py-0.5 text-[10px] uppercase tracking-[0.1em] ${
                    submission.status === "submitted"
                      ? "border-accent-400/30 bg-accent-500/10 text-accent-400"
                      : "border-amber-400/30 bg-amber-500/10 text-amber-300"
                  }`}
                >
                  {submission.status}
                </span>
                {submission.submittedAt && (
                  <span className="text-[11.5px] text-zinc-500">
                    {new Date(submission.submittedAt).toLocaleString()}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                {submission.codeUrl && (
                  <a
                    href={submission.codeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-white/12 px-3 py-1.5 text-[12px] text-zinc-300 transition-colors hover:border-brand-400/50 hover:text-white"
                  >
                    <Download className="h-3.5 w-3.5" /> {submission.codeName ?? "Code"}
                  </a>
                )}
                {submission.deckUrl && (
                  <a
                    href={submission.deckUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-white/12 px-3 py-1.5 text-[12px] text-zinc-300 transition-colors hover:border-brand-400/50 hover:text-white"
                  >
                    <Download className="h-3.5 w-3.5" /> {submission.deckName ?? "Pitch deck"}
                  </a>
                )}
                {submission.repoUrl && (
                  <a
                    href={submission.repoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-white/12 px-3 py-1.5 text-[12px] text-zinc-300 transition-colors hover:border-brand-400/50 hover:text-white"
                  >
                    Repository
                  </a>
                )}
              </div>

              {submission.notes && (
                <p className="whitespace-pre-wrap rounded-lg border border-white/[0.06] bg-black/25 p-3 text-[12.5px] leading-relaxed text-zinc-400">
                  {submission.notes}
                </p>
              )}
            </div>
          ) : (
            <p className="text-[12.5px] text-zinc-600">Nothing submitted yet.</p>
          )}
        </Section>

        {/* ── Result ─────────────────────────────────────────── */}
        <Section title="Achievement Card — offline result">
          <form action={resultAction} className="flex flex-col gap-3">
            <input type="hidden" name="team_id" value={team.id} />
            <div className="grid gap-3 sm:grid-cols-[140px_1fr]">
              <label className="flex flex-col gap-1.5">
                <span className={LABEL}>Final score</span>
                <input
                  name="final_score"
                  type="number"
                  step="0.01"
                  min="0"
                  max="9999"
                  defaultValue={result?.final_score ?? ""}
                  placeholder="0"
                  className={FIELD}
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className={LABEL}>Judges&apos; remarks</span>
                <textarea
                  name="remarks"
                  rows={2}
                  defaultValue={result?.remarks ?? ""}
                  placeholder="Optional — shown on the team's Achievement Card"
                  className={`${FIELD} resize-none`}
                />
              </label>
            </div>
            <label className="flex flex-col gap-1.5">
              <span className={LABEL}>
                Scan of the paper sheet {result?.hasSheet && "(one already uploaded)"}
              </span>
              <input
                name="sheet"
                type="file"
                accept="image/png,image/jpeg,image/webp,application/pdf"
                className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-[12px] text-zinc-400 file:mr-3 file:rounded-md file:border-0 file:bg-white/10 file:px-3 file:py-1.5 file:text-[12px] file:text-white"
              />
              <span className="text-[11px] text-zinc-600">PNG, JPEG, WebP or PDF · max 8 MB</span>
            </label>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="submit"
                disabled={resultPending}
                className="inline-flex items-center gap-2 rounded-full bg-brand-600 px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-brand-500 disabled:opacity-60"
              >
                {resultPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Upload className="h-3.5 w-3.5" />
                )}
                Save result
              </button>
              <Feedback state={resultState} />
            </div>
          </form>

          <form action={toggleResultPublishedAction}>
            <input type="hidden" name="team_id" value={team.id} />
            <input type="hidden" name="published" value={String(published)} />
            <button
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[13px] transition-colors ${
                published
                  ? "border-accent-400/40 bg-accent-500/10 text-accent-300 hover:border-red-400/40 hover:text-red-300"
                  : "border-white/12 text-zinc-300 hover:border-accent-400/40 hover:text-accent-300"
              }`}
            >
              <Check className="h-3.5 w-3.5" />
              {published ? "Published — click to hide" : "Publish to this team"}
            </button>
          </form>
        </Section>

        {/* ── Envelope ───────────────────────────────────────── */}
        {/* Read-only here on purpose. Allocating twenty unique briefs is one
            sitting, and it belongs on a screen where the whole board is
            visible — see /hackathon/envelopes. */}
        <Section title="Sealed envelope">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {team.envelope_no != null ? (
              <span className="rounded-full border border-brand-400/30 bg-brand-500/10 px-3 py-1 text-[12px] text-brand-200">
                ENV-{String(team.envelope_no).padStart(2, "0")}
                {envelopeLabel ? ` · ${envelopeLabel}` : ""}
              </span>
            ) : (
              <span className="rounded-full border border-amber-400/25 bg-amber-500/10 px-3 py-1 text-[12px] text-amber-300">
                Not assigned
              </span>
            )}
            <Link
              href="/hackathon/envelopes"
              className="inline-flex items-center gap-1.5 text-[12.5px] text-brand-300 transition-colors hover:text-brand-200"
            >
              Envelope allocation <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </Section>

        {/* ── Members ────────────────────────────────────────── */}
        <Section title={`Members (${members.length}/5)`}>
          <div className="flex flex-col gap-2">
            {members.map((m) => (
              <MemberRow key={m.id} member={m} teamId={team.id} />
            ))}
          </div>

          {members.length < 5 && (
            <form action={addAction} className="flex flex-col gap-2 rounded-lg border border-dashed border-white/10 p-3">
              <input type="hidden" name="team_id" value={team.id} />
              <div className="grid gap-2 sm:grid-cols-[1.3fr_0.7fr_1.1fr_auto]">
                <input name="name" placeholder="Full name" required className={FIELD} />
                <input name="class_section" placeholder="Class" required className={FIELD} />
                <select name="member_role" defaultValue="frontend" className={FIELD}>
                  {ROLES.map((r) => (
                    <option key={r.id} value={r.id} className="bg-zinc-900">
                      {r.label}
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  disabled={addPending}
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-white/12 px-3 py-2 text-[12px] text-white transition-colors hover:border-brand-400/50 disabled:opacity-60"
                >
                  <UserPlus className="h-3.5 w-3.5" /> Add
                </button>
              </div>
              <label className="flex w-fit items-center gap-2 text-[12px] text-zinc-400">
                <input type="checkbox" name="is_quiz_rep" className="accent-[var(--color-brand-500)]" />
                Quiz representative
              </label>
              <Feedback state={addState} />
            </form>
          )}
        </Section>

        {/* ── Details ────────────────────────────────────────── */}
        <Section title="Team details">
          <form action={detailAction} className="flex flex-col gap-3">
            <input type="hidden" name="id" value={team.id} />
            <div className="grid gap-2 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5">
                <span className={LABEL}>Team name</span>
                <input name="name" defaultValue={team.name} required className={FIELD} />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className={LABEL}>School</span>
                <input name="school" defaultValue={team.school ?? ""} className={FIELD} />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className={LABEL}>Tagline</span>
                <input name="tagline" defaultValue={team.tagline ?? ""} className={FIELD} />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className={LABEL}>Status</span>
                <select name="status" defaultValue={team.status} className={FIELD}>
                  {STATUSES.map((s) => (
                    <option key={s} value={s} className="bg-zinc-900">
                      {s}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="submit"
                disabled={detailPending}
                className="rounded-full border border-white/12 px-4 py-2 text-[13px] text-white transition-colors hover:border-brand-400/50 disabled:opacity-60"
              >
                Save details
              </button>
              <Feedback state={detailState} />
            </div>
          </form>
        </Section>

        {/* ── Danger ─────────────────────────────────────────── */}
        <Section title="Danger zone">
          {showDelete ? (
            <form action={deleteAction} className="flex flex-col gap-2">
              <input type="hidden" name="id" value={team.id} />
              <p className="text-[12px] text-red-300">
                This deletes the team, its members and its result permanently. Type{" "}
                <strong>{team.name}</strong> to confirm.
              </p>
              <div className="flex flex-wrap gap-2">
                <input name="confirm_name" placeholder={team.name} className={`${FIELD} max-w-xs`} />
                <button
                  type="submit"
                  disabled={deletePending}
                  className="inline-flex items-center gap-1.5 rounded-full border border-red-400/40 bg-red-500/10 px-4 py-2 text-[13px] text-red-200 transition-colors hover:bg-red-500/20 disabled:opacity-60"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Delete permanently
                </button>
                <button
                  type="button"
                  onClick={() => setShowDelete(false)}
                  className="rounded-full border border-white/12 px-4 py-2 text-[13px] text-zinc-400"
                >
                  Cancel
                </button>
              </div>
              <Feedback state={deleteState} />
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setShowDelete(true)}
              className="w-fit text-[12px] text-zinc-600 transition-colors hover:text-red-300"
            >
              Delete this team…
            </button>
          )}
        </Section>
      </div>
    </details>
  );
}

function MemberRow({ member, teamId }: { member: AdminMember; teamId: string }) {
  const [state, action, pending] = useActionState(updateMemberAction, undefined);
  const [removeState, removeAction] = useActionState(removeMemberAction, undefined);

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-white/[0.06] bg-black/25 p-3">
      <form action={action} className="grid gap-2 sm:grid-cols-[1.3fr_0.7fr_1.1fr_auto]">
        <input type="hidden" name="member_id" value={member.id} />
        <input type="hidden" name="team_id" value={teamId} />
        <input name="name" defaultValue={member.name} required className={FIELD} />
        <input
          name="class_section"
          defaultValue={member.class_section ?? ""}
          required
          className={FIELD}
        />
        <select name="member_role" defaultValue={member.member_role} className={FIELD}>
          {ROLES.map((r) => (
            <option key={r.id} value={r.id} className="bg-zinc-900">
              {r.label}
            </option>
          ))}
        </select>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 text-[11.5px] text-zinc-400">
            <input
              type="checkbox"
              name="is_quiz_rep"
              defaultChecked={member.is_quiz_rep}
              className="accent-[var(--color-brand-500)]"
            />
            Quiz
          </label>
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg border border-white/12 px-3 py-2 text-[12px] text-white transition-colors hover:border-brand-400/50 disabled:opacity-60"
          >
            Save
          </button>
        </div>
      </form>
      <div className="flex flex-wrap items-center gap-3">
        <Feedback state={state} />
        <Feedback state={removeState} />
        <form action={removeAction} className="ml-auto">
          <input type="hidden" name="member_id" value={member.id} />
          <input type="hidden" name="team_id" value={teamId} />
          <button className="text-[11.5px] text-zinc-600 transition-colors hover:text-red-300">
            Remove
          </button>
        </form>
      </div>
    </div>
  );
}
