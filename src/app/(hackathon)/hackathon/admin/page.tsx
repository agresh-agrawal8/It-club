import type { Metadata } from "next";
import Link from "next/link";
import {
  Settings2,
  Gavel,
  Users,
  Trophy,
  FileText,
  Megaphone,
  KeyRound,
  Rocket,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { Container } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AnnouncementPoster } from "@/components/hackathon/announcement-poster";
import { roleLabel } from "@/lib/utils";

export const metadata: Metadata = { title: "Organiser console" };

/**
 * Infinium organiser console — the single entry point for the core team.
 *
 * This exists because /hackathon/admin is the URL organisers reach for by
 * instinct; the working panels live at /manage (registrations, envelopes,
 * credentials) and /judge (evaluation), and this page routes to them rather
 * than duplicating their controls.
 */
export default async function HackathonAdminPage() {
  const { profile } = await requireAdmin();

  const supabase = createAdminClient();
  const [{ data: teams }, { data: submissions }, { data: scores }, { data: problems }] =
    await Promise.all([
      supabase.from("hack_teams").select("id, team_code, name, status, reg_status, problem_id"),
      supabase.from("hack_submissions").select("id, status"),
      supabase.from("hack_scores").select("id, team_id, submitted"),
      supabase.from("hack_problems").select("id, released"),
    ]);

  const allTeams = teams ?? [];
  const active = allTeams.filter((t: any) => t.reg_status === "approved");
  const pending = allTeams.filter((t: any) => t.reg_status === "pending");
  const withEnvelope = active.filter((t: any) => t.problem_id);
  const submitted = (submissions ?? []).filter((s: any) => s.status === "submitted");
  const judged = new Set((scores ?? []).filter((s: any) => s.submitted).map((s: any) => s.team_id));
  const released = (problems ?? []).filter((p: any) => p.released).length;

  const stats = [
    { label: "Teams", value: `${active.length}/10`, icon: Users },
    { label: "Envelopes assigned", value: `${withEnvelope.length}/${active.length || 0}`, icon: FileText },
    { label: "Submitted", value: submitted.length, icon: Rocket },
    { label: "Judged", value: `${judged.size}/${active.length || 0}`, icon: Gavel },
  ];

  const panels = [
    {
      href: "/hackathon/manage",
      title: "Manage teams",
      desc: "Assign problem envelopes, re-issue lost passwords, reject or remove teams. Teams receive their Team ID and password automatically at registration.",
      icon: Settings2,
      cta: "Open manage",
    },
    {
      href: "/hackathon/judge",
      title: "Judge evaluation",
      desc: "The official marking sheet — achievement cards (Section A) plus B/60, C/40, D/25 minus penalties. Totals are computed in the database.",
      icon: Gavel,
      cta: "Open judging",
    },
    {
      href: "/hackathon/leaderboard",
      title: "Live leaderboard",
      desc: "Standings computed from judge averages. Public — this is what students and screens see.",
      icon: Trophy,
      cta: "View leaderboard",
    },
    {
      href: "/hackathon/problems",
      title: "Problem envelopes",
      desc: `${released} of ${(problems ?? []).length} envelopes released. Envelopes stay sealed until orientation.`,
      icon: FileText,
      cta: "View problems",
    },
  ];

  return (
    <Container className="flex flex-col gap-8 py-10">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow text-amber-300/90">Core team · {roleLabel(profile?.role)}</p>
          <h1 className="mt-2 flex items-center gap-2.5 text-3xl font-semibold tracking-tighter text-white md:text-4xl">
            <ShieldCheck className="h-7 w-7 text-brand-300" />
            Organiser console
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Everything the core team runs for Infinium, in one place.
          </p>
        </div>
        {pending.length > 0 && (
          <Badge variant="warning">{pending.length} awaiting review</Badge>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map(({ label, value, icon: Icon }) => (
          <Card key={label} className="flex flex-col gap-1 p-4">
            <Icon className="h-4 w-4 text-zinc-400" />
            <span className="font-mono text-2xl font-semibold text-white">{value}</span>
            <span className="text-[11px] uppercase tracking-wide text-zinc-500">{label}</span>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        {/* Panels */}
        <div className="grid gap-4 sm:grid-cols-2">
          {panels.map(({ href, title, desc, icon: Icon, cta }) => (
            <Link key={href} href={href} className="group">
              <Card hoverLift className="flex h-full flex-col gap-3 p-5">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-500/15 text-brand-300">
                  <Icon className="h-4 w-4" />
                </span>
                <h2 className="text-base font-semibold tracking-tight text-white">{title}</h2>
                <p className="flex-1 text-xs leading-relaxed text-zinc-400">{desc}</p>
                <span className="flex items-center gap-1.5 text-xs font-medium text-brand-300">
                  {cta}
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Card>
            </Link>
          ))}
        </div>

        {/* Side rail */}
        <div className="flex flex-col gap-5">
          <Card className="p-6">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
              <Megaphone className="h-4 w-4 text-brand-300" /> Broadcast to all teams
            </h2>
            <AnnouncementPoster />
          </Card>

          {/* Credentials at a glance — organisers are asked for these constantly. */}
          <Card className="p-6">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
              <KeyRound className="h-4 w-4 text-brand-300" /> Team credentials
            </h2>
            {active.length === 0 ? (
              <p className="text-sm text-zinc-500">No teams registered yet.</p>
            ) : (
              <>
                <ul className="flex flex-col gap-2">
                  {active.slice(0, 6).map((t: any) => (
                    <li
                      key={t.id}
                      className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.07] bg-zinc-950/50 px-3.5 py-2.5"
                    >
                      <div className="min-w-0">
                        <div className="font-mono text-xs text-brand-300">{t.team_code}</div>
                        <div className="truncate text-sm text-white">{t.name}</div>
                      </div>
                      <Badge variant={t.status === "submitted" ? "success" : "small"}>
                        {t.status}
                      </Badge>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/hackathon/manage"
                  className="mt-3 inline-flex items-center gap-1.5 text-xs text-zinc-400 transition-colors hover:text-white"
                >
                  Passwords &amp; envelopes in Manage
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </>
            )}
          </Card>

          <Link
            href="/admin"
            className="glass glass-hover flex items-center justify-between rounded-2xl p-4"
          >
            <span className="text-sm text-white">Club Core Team Panel</span>
            <ArrowRight className="h-4 w-4 text-zinc-500" />
          </Link>
        </div>
      </div>
    </Container>
  );
}
