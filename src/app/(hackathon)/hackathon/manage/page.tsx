import type { Metadata } from "next";
import Link from "next/link";
import { Check, X, KeyRound, RefreshCw, FileText, Users, Gavel } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { Container } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import {
  approveTeamAction,
  rejectTeamAction,
  resetTeamPasswordAction,
  assignProblemAction,
} from "@/lib/hackathon/team-actions";
import { roleLabel } from "@/lib/utils";

export const metadata: Metadata = { title: "Manage Infinium" };

const ROLE_LABEL: Record<string, string> = {
  captain: "Captain",
  frontend: "Frontend",
  backend: "Backend",
  uiux: "UI/UX",
  docs: "Docs",
};

/**
 * Core Team control panel for Infinium — gated by the CLUB admin login
 * (requireAdmin), which is how the core team gets access to the hackathon.
 */
export default async function ManagePage() {
  const { profile } = await requireAdmin();

  const supabase = createAdminClient();
  const [{ data: teams }, { data: members }, { data: problems }] = await Promise.all([
    supabase.from("hack_teams").select("*").order("created_at"),
    supabase.from("hack_participants").select("*").not("team_id", "is", null),
    supabase.from("hack_problems").select("id,code,title,envelope_no").order("envelope_no"),
  ]);

  const byTeam = new Map<string, any[]>();
  for (const m of members ?? []) {
    const arr = byTeam.get(m.team_id) ?? [];
    arr.push(m);
    byTeam.set(m.team_id, arr);
  }
  const assigned = new Set((teams ?? []).map((t: any) => t.problem_id).filter(Boolean));

  const pending = (teams ?? []).filter((t: any) => t.reg_status === "pending");
  const approved = (teams ?? []).filter((t: any) => t.reg_status === "approved");

  return (
    <Container className="flex flex-col gap-8 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow text-amber-300/90">Core team · {roleLabel(profile?.role)}</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tighter text-white md:text-4xl">
            Manage Infinium
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Teams now receive their Team ID and password the moment they register. Use this panel to
            assign problem envelopes, re-issue lost passwords and remove teams.
          </p>
        </div>
        <div className="flex gap-2">
          <ButtonLink href="/hackathon/judge" variant="secondary" size="sm" className="rounded-full">
            <Gavel className="h-4 w-4" /> Judging
          </ButtonLink>
          <ButtonLink href="/hackathon" variant="ghost" size="sm" className="rounded-full">
            Public site
          </ButtonLink>
        </div>
      </div>

      {/* Pending registrations */}
      <section className="flex flex-col gap-4">
        <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-zinc-400">
          <Users className="h-4 w-4" /> Pending registrations ({pending.length})
        </h2>
        {pending.length === 0 && (
          <p className="text-sm text-zinc-500">No registrations waiting for approval.</p>
        )}
        {pending.map((t: any) => (
          <Card key={t.id} className="flex flex-col gap-4 p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-white">{t.name}</h3>
                <p className="text-xs text-zinc-500">
                  {t.school ?? "—"}
                  {t.tagline ? ` · ${t.tagline}` : ""}
                </p>
              </div>
              <div className="flex gap-2">
                <form action={approveTeamAction}>
                  <input type="hidden" name="id" value={t.id} />
                  <button className="flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-zinc-300 transition-colors hover:border-accent-400/40 hover:text-accent-300">
                    <Check className="h-3.5 w-3.5" /> Approve &amp; issue ID
                  </button>
                </form>
                <form action={rejectTeamAction}>
                  <input type="hidden" name="id" value={t.id} />
                  <button className="flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-zinc-300 transition-colors hover:border-red-400/40 hover:text-red-300">
                    <X className="h-3.5 w-3.5" /> Reject
                  </button>
                </form>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {(byTeam.get(t.id) ?? []).map((m: any) => (
                <span
                  key={m.id}
                  className="rounded-full border border-white/10 px-3 py-1 text-[11px] text-zinc-300"
                >
                  {m.name} · {m.class_section} · {ROLE_LABEL[m.member_role] ?? "—"}
                  {m.is_quiz_rep && <span className="ml-1 text-accent-400">· quiz</span>}
                </span>
              ))}
            </div>
          </Card>
        ))}
      </section>

      {/* Approved teams */}
      <section className="flex flex-col gap-4">
        <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-zinc-400">
          <KeyRound className="h-4 w-4" /> Approved teams ({approved.length}/10)
        </h2>
        {approved.length === 0 && <p className="text-sm text-zinc-500">No approved teams yet.</p>}
        {approved.map((t: any) => (
          <Card key={t.id} className="flex flex-col gap-4 p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm text-accent-400">{t.team_code}</span>
                  <h3 className="text-lg font-semibold text-white">{t.name}</h3>
                  <Badge variant={t.status === "submitted" ? "success" : "accent"}>{t.status}</Badge>
                </div>
                <p className="mt-1 text-xs text-zinc-500">
                  {(byTeam.get(t.id) ?? []).length} members · progress {t.progress}%
                </p>
              </div>
              <div className="flex items-center gap-2">
                {t.join_code && (
                  <span className="rounded-lg border border-amber-400/25 bg-amber-500/10 px-3 py-1.5 font-mono text-xs text-amber-200">
                    pw: {t.join_code}
                  </span>
                )}
                <form action={resetTeamPasswordAction}>
                  <input type="hidden" name="id" value={t.id} />
                  <button className="flex items-center gap-1.5 rounded-lg border border-white/10 px-2.5 py-1.5 text-[11px] text-zinc-400 transition-colors hover:border-brand-400/40 hover:text-brand-300">
                    <RefreshCw className="h-3.5 w-3.5" /> Reset
                  </button>
                </form>
              </div>
            </div>

            {/* Assign a unique problem envelope */}
            <form action={assignProblemAction} className="flex flex-wrap items-center gap-2">
              <input type="hidden" name="team_id" value={t.id} />
              <FileText className="h-4 w-4 text-brand-300" />
              <select
                name="problem_id"
                defaultValue={t.problem_id ?? ""}
                className="rounded-xl border border-white/10 bg-zinc-950/60 px-3 py-2 text-xs text-white focus:border-brand-400/60 focus:outline-none"
              >
                <option value="">— No envelope assigned —</option>
                {(problems ?? []).map((p: any) => {
                  const takenByOther = assigned.has(p.id) && t.problem_id !== p.id;
                  return (
                    <option key={p.id} value={p.id} disabled={takenByOther}>
                      {p.code} · {p.title}
                      {takenByOther ? " (assigned)" : ""}
                    </option>
                  );
                })}
              </select>
              <button className="rounded-lg border border-white/10 px-3 py-2 text-[11px] text-zinc-300 transition-colors hover:border-brand-400/40 hover:text-brand-300">
                Assign
              </button>
            </form>

            <div className="flex flex-wrap gap-2">
              {(byTeam.get(t.id) ?? []).map((m: any) => (
                <span
                  key={m.id}
                  className="rounded-full border border-white/10 px-3 py-1 text-[11px] text-zinc-300"
                >
                  {m.name} · {m.class_section} · {ROLE_LABEL[m.member_role] ?? "—"}
                  {m.is_quiz_rep && <span className="ml-1 text-accent-400">· quiz</span>}
                </span>
              ))}
            </div>
          </Card>
        ))}
      </section>

      <p className="text-center text-xs text-zinc-600">
        Team passwords are shown once here so you can hand them to students. Use{" "}
        <Link href="/hackathon/login" className="text-brand-300">
          /hackathon/login
        </Link>{" "}
        to test a team sign-in.
      </p>
    </Container>
  );
}
