"use client";

import { useActionState, useState } from "react";
import {
  Pencil,
  Trash2,
  UserPlus,
  X,
  Save,
  Crown,
  AlertTriangle,
  ChevronDown,
} from "lucide-react";
import {
  updateTeamDetailsAction,
  updateMemberAction,
  addMemberAction,
  removeMemberAction,
  deleteTeamAction,
} from "@/lib/hackathon/team-actions";
import { SubmitButton } from "@/components/ui/submit-button";
import { cn } from "@/lib/utils";

const ROLES = [
  { value: "captain", label: "Team Captain" },
  { value: "frontend", label: "Frontend Developer" },
  { value: "backend", label: "Backend Developer" },
  { value: "uiux", label: "UI / UX Designer" },
  { value: "docs", label: "Docs & Presentation Lead" },
];

const ROLE_LABEL: Record<string, string> = Object.fromEntries(
  ROLES.map((r) => [r.value, r.label]),
);

const field =
  "w-full rounded-xl border border-white/10 bg-zinc-950/60 px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:border-brand-400/60 focus:outline-none transition-colors";

const chipBtn =
  "flex items-center gap-1.5 rounded-lg border border-white/10 px-2.5 py-1.5 text-[11px] text-zinc-300 transition-colors hover:border-brand-400/40 hover:text-brand-300";

type Member = {
  id: string;
  name: string;
  class_section: string | null;
  member_role: string | null;
  is_quiz_rep: boolean;
};

type Team = {
  id: string;
  name: string;
  school: string | null;
  tagline: string | null;
  status: string;
  progress: number;
};

/** Inline feedback shared by every sub-form. */
function Result({ state }: { state: { error?: string; success?: string } | undefined }) {
  if (!state) return null;
  if (state.error)
    return (
      <p className="text-xs text-red-400" role="alert">
        {state.error}
      </p>
    );
  if (state.success) return <p className="text-xs text-accent-400">{state.success}</p>;
  return null;
}

/* ── Team details ─────────────────────────────────────────────── */

function DetailsForm({ team }: { team: Team }) {
  const [state, action] = useActionState(updateTeamDetailsAction, undefined);

  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="id" value={team.id} />
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1">
          <span className="text-[11px] uppercase tracking-wide text-zinc-500">Team name</span>
          <input name="name" defaultValue={team.name} required className={field} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[11px] uppercase tracking-wide text-zinc-500">School</span>
          <input name="school" defaultValue={team.school ?? ""} className={field} />
        </label>
        <label className="flex flex-col gap-1 sm:col-span-2">
          <span className="text-[11px] uppercase tracking-wide text-zinc-500">Tagline</span>
          <input name="tagline" defaultValue={team.tagline ?? ""} className={field} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[11px] uppercase tracking-wide text-zinc-500">Status</span>
          <select name="status" defaultValue={team.status} className={field}>
            {["forming", "active", "submitted", "disqualified"].map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[11px] uppercase tracking-wide text-zinc-500">Progress %</span>
          <input
            name="progress"
            type="number"
            min={0}
            max={100}
            defaultValue={team.progress}
            className={field}
          />
        </label>
      </div>
      <div className="flex items-center gap-3">
        <SubmitButton
          icon={<Save className="h-3.5 w-3.5" />}
          pendingText="Saving…"
          className={chipBtn}
        >
          Save details
        </SubmitButton>
        <Result state={state} />
      </div>
    </form>
  );
}

/* ── One member row ───────────────────────────────────────────── */

function MemberRow({
  member,
  teamId,
  canRemove,
}: {
  member: Member;
  teamId: string;
  canRemove: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [updateState, updateAction] = useActionState(updateMemberAction, undefined);
  const [removeState, removeAction] = useActionState(removeMemberAction, undefined);

  if (!editing) {
    return (
      <li className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/[0.07] bg-zinc-950/50 px-3 py-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-sm text-white">{member.name}</span>
            {member.member_role === "captain" && <Crown className="h-3.5 w-3.5 text-amber-300" />}
            {member.is_quiz_rep && (
              <span className="rounded-full bg-accent-500/15 px-1.5 py-0.5 text-[9px] text-accent-300">
                QUIZ
              </span>
            )}
          </div>
          <div className="text-[11px] text-zinc-500">
            {ROLE_LABEL[member.member_role ?? ""] ?? "—"} · {member.class_section ?? "—"}
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button type="button" onClick={() => setEditing(true)} className={chipBtn}>
            <Pencil className="h-3 w-3" /> Edit
          </button>
          {canRemove && (
            <form action={removeAction}>
              <input type="hidden" name="member_id" value={member.id} />
              <input type="hidden" name="team_id" value={teamId} />
              <SubmitButton
                icon={<Trash2 className="h-3 w-3" />}
                className="flex items-center gap-1.5 rounded-lg border border-white/10 px-2.5 py-1.5 text-[11px] text-zinc-400 transition-colors hover:border-red-400/40 hover:text-red-300"
              >
                Remove
              </SubmitButton>
            </form>
          )}
        </div>
        <div className="w-full">
          <Result state={removeState} />
        </div>
      </li>
    );
  }

  return (
    <li className="rounded-xl border border-brand-400/30 bg-brand-500/[0.05] p-3">
      <form action={updateAction} className="flex flex-col gap-2.5">
        <input type="hidden" name="member_id" value={member.id} />
        <input type="hidden" name="team_id" value={teamId} />
        <div className="grid gap-2.5 sm:grid-cols-2">
          <input name="name" defaultValue={member.name} required placeholder="Full name" className={field} />
          <input
            name="class_section"
            defaultValue={member.class_section ?? ""}
            required
            placeholder="Class & section"
            className={field}
          />
          <select name="member_role" defaultValue={member.member_role ?? "captain"} className={field}>
            {ROLES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-2 px-1 text-xs text-zinc-300">
            <input
              type="checkbox"
              name="is_quiz_rep"
              defaultChecked={member.is_quiz_rep}
              className="accent-brand-500"
            />
            Quiz representative
          </label>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <SubmitButton icon={<Save className="h-3.5 w-3.5" />} pendingText="Saving…" className={chipBtn}>
            Save member
          </SubmitButton>
          <button type="button" onClick={() => setEditing(false)} className={chipBtn}>
            <X className="h-3 w-3" /> Cancel
          </button>
          <Result state={updateState} />
        </div>
      </form>
    </li>
  );
}

/* ── Add member ───────────────────────────────────────────────── */

function AddMember({ teamId, disabled }: { teamId: string; disabled: boolean }) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState(addMemberAction, undefined);

  if (disabled) {
    return <p className="text-[11px] text-zinc-500">Team is full (5 members).</p>;
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className={chipBtn}>
        <UserPlus className="h-3.5 w-3.5" /> Add member
      </button>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-2.5 rounded-xl border border-white/10 p-3">
      <input type="hidden" name="team_id" value={teamId} />
      <div className="grid gap-2.5 sm:grid-cols-2">
        <input name="name" required placeholder="Full name" className={field} />
        <input name="class_section" required placeholder="Class & section" className={field} />
        <select name="member_role" defaultValue="frontend" className={field}>
          {ROLES.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2 px-1 text-xs text-zinc-300">
          <input type="checkbox" name="is_quiz_rep" className="accent-brand-500" /> Quiz
          representative
        </label>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <SubmitButton icon={<UserPlus className="h-3.5 w-3.5" />} pendingText="Adding…" className={chipBtn}>
          Add
        </SubmitButton>
        <button type="button" onClick={() => setOpen(false)} className={chipBtn}>
          <X className="h-3 w-3" /> Cancel
        </button>
        <Result state={state} />
      </div>
    </form>
  );
}

/* ── Danger zone ──────────────────────────────────────────────── */

function DeleteTeam({ team }: { team: Team }) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState(deleteTeamAction, undefined);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-lg border border-white/10 px-2.5 py-1.5 text-[11px] text-zinc-400 transition-colors hover:border-red-400/40 hover:text-red-300"
      >
        <Trash2 className="h-3 w-3" /> Delete team
      </button>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-2.5 rounded-xl border border-red-400/30 bg-red-500/[0.06] p-3">
      <input type="hidden" name="id" value={team.id} />
      <p className="flex items-start gap-2 text-[11px] leading-relaxed text-red-200">
        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        This permanently deletes <strong>{team.name}</strong>, its members, submission, scores and
        awarded cards. It cannot be undone.
      </p>
      <input
        name="confirm_name"
        required
        placeholder={`Type "${team.name}" to confirm`}
        className={field}
        autoComplete="off"
      />
      <div className="flex flex-wrap items-center gap-2">
        <SubmitButton
          icon={<Trash2 className="h-3.5 w-3.5" />}
          pendingText="Deleting…"
          className="flex items-center gap-1.5 rounded-lg border border-red-400/40 bg-red-500/15 px-3 py-1.5 text-[11px] text-red-200 transition-colors hover:bg-red-500/25"
        >
          Delete permanently
        </SubmitButton>
        <button type="button" onClick={() => setOpen(false)} className={chipBtn}>
          <X className="h-3 w-3" /> Cancel
        </button>
        <Result state={state} />
      </div>
    </form>
  );
}

/* ── Wrapper ──────────────────────────────────────────────────── */

export function TeamEditor({ team, members }: { team: Team; members: Member[] }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-t border-white/[0.07] pt-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-2 text-xs text-zinc-400 transition-colors hover:text-white"
      >
        <span className="flex items-center gap-1.5">
          <Pencil className="h-3.5 w-3.5" /> Edit team &amp; members
        </span>
        <ChevronDown
          className={cn("h-4 w-4 transition-transform duration-200", open && "rotate-180")}
        />
      </button>

      {open && (
        <div className="mt-4 flex flex-col gap-5">
          <DetailsForm team={team} />

          <div className="flex flex-col gap-2.5">
            <span className="text-[11px] uppercase tracking-wide text-zinc-500">
              Members ({members.length}/5)
            </span>
            <ul className="flex flex-col gap-2">
              {members.map((m) => (
                <MemberRow
                  key={m.id}
                  member={m}
                  teamId={team.id}
                  canRemove={members.length > 2}
                />
              ))}
            </ul>
            <AddMember teamId={team.id} disabled={members.length >= 5} />
          </div>

          <DeleteTeam team={team} />
        </div>
      )}
    </div>
  );
}
