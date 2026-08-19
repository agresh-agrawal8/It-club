import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, LogOut } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Icon } from "@/components/hackathon/icons";
import {
  CardBody,
  CardTitle,
  Eyebrow,
  HackCard,
  IconTile,
  SectionHead,
} from "@/components/hackathon/card";
import {
  ACHIEVEMENTS,
  EVENT,
  PASSPORT_MAX,
  ROLE_LABEL,
  SCHEDULE,
  envelopeByNo,
  type MemberRole,
} from "@/lib/hackathon/content";
import { briefByNo } from "@/lib/hackathon/briefs";
import { getAnnouncements, getTeamPortal } from "@/lib/hackathon/data";
import { getTeamSessionId } from "@/lib/hackathon/session";
import { closePortalAction } from "@/lib/hackathon/portal-actions";
import { BriefView } from "@/components/hackathon/brief-view";
import { PortalCacheGuard, SaveOffline } from "@/components/hackathon/offline-kit";
import { SealedEnvelope } from "@/components/hackathon/visuals";
import { PortalForm } from "./portal-form";
import { SubmissionForm } from "./submission-form";

export const metadata: Metadata = {
  title: "Team portal",
  description: "Open your Infinium team portal to see your team, your event details and your Achievement Card.",
};

/** The portal reads a signed cookie, so it can never be statically rendered. */
export const dynamic = "force-dynamic";

const NEXT_UP = SCHEDULE.filter((s) => !s.parallel).slice(0, 4);

export default async function TeamPortalPage() {
  const teamId = await getTeamSessionId();
  const portal = teamId ? await getTeamPortal(teamId) : null;

  /* ── Not signed in ─────────────────────────────────────────── */
  if (!portal) {
    return (
      <Container className="flex flex-col items-center gap-10 py-16">
        <SectionHead
          eyebrow="Team portal"
          icon="ticket"
          title="Open Your"
          accent="Team Portal."
          lead="No password needed — just your team's exact name. Inside you will find your roster, your event details and your Achievement Card once results are published."
          align="center"
        />

        <HackCard tone="brand" className="w-full max-w-md">
          <PortalForm />
        </HackCard>

        <div className="flex flex-col items-center gap-2 text-center">
          <p className="text-[13px] text-zinc-500">
            Not registered yet?{" "}
            <Link href="/hackathon/register" className="text-brand-300 hover:text-brand-200">
              Register your team
            </Link>
          </p>
          <p className="max-w-sm text-[11.5px] leading-relaxed text-zinc-600">
            If your team name does not work, check the spelling with your Team Captain or ask the
            Organizing Committee.
          </p>
        </div>
      </Container>
    );
  }

  const { team, members, result, submission, config, sheetUrl, codeUrl, deckUrl } = portal;
  const envelope = envelopeByNo(team.envelope_no);
  const announcements = await getAnnouncements();
  // A row can be flagged published while its score is still empty (direct SQL,
  // or a half-finished entry). Showing that team a giant "—" as its official
  // result would be worse than showing nothing, so treat it as not yet out —
  // the same rule the leaderboard applies.
  const published = Boolean(result?.published && result.final_score != null);
  const quizReps = members.filter((m) => m.is_quiz_rep);

  // The brief is only assembled once the core team has released it. Before
  // that the full text never leaves the server, so there is nothing in the
  // page for a curious team to dig out early.
  const brief = config.briefs_released ? briefByNo(team.envelope_no) : null;

  return (
    <Container className="flex flex-col gap-6 py-10 md:gap-8">
      <PortalCacheGuard teamId={team.id} />

      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2.5">
            {team.team_code && (
              <span className="font-mono text-[13px] text-brand-300">{team.team_code}</span>
            )}
            <span className="rounded-full border border-white/10 px-2.5 py-0.5 text-[10px] uppercase tracking-[0.14em] text-zinc-400">
              {team.status}
            </span>
          </div>
          <h1 className="text-3xl font-semibold tracking-tighter text-white md:text-4xl">
            {team.name}
          </h1>
          {team.tagline && <p className="text-[13.5px] text-zinc-400">{team.tagline}</p>}
          {team.school && <p className="text-[12px] text-zinc-600">{team.school}</p>}
        </div>

        <form action={closePortalAction}>
          <button className="flex items-center gap-1.5 rounded-full border border-white/10 px-3.5 py-2 text-xs text-zinc-400 transition-colors hover:border-red-400/40 hover:text-red-300">
            <LogOut className="h-3.5 w-3.5" /> Close portal
          </button>
        </form>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.45fr_1fr] lg:items-start">
        <div className="flex flex-col gap-5">
          {/* ── ACHIEVEMENT CARD ───────────────────────────────── */}
          <HackCard tone={published ? "amber" : "brand"} bare className="overflow-hidden">
            <div className="flex items-center justify-between gap-3 border-b border-white/[0.07] px-6 py-4">
              <div className="flex items-center gap-3">
                <IconTile name="award" tone={published ? "amber" : "brand"} className="h-9 w-9" />
                <div className="flex flex-col">
                  <Eyebrow tone={published ? "amber" : "brand"}>Achievement Card</Eyebrow>
                  <span className="text-[13px] text-zinc-400">Official result · {EVENT.name}</span>
                </div>
              </div>
              <span className="hidden font-mono text-[11px] text-zinc-600 sm:block">
                {team.team_code}
              </span>
            </div>

            {published ? (
              <div className="flex flex-col">
                <div className="flex flex-col items-center gap-2 px-6 py-8 text-center">
                  <Eyebrow tone="amber">Final score</Eyebrow>
                  <span className="text-6xl font-semibold tracking-tighter text-white">
                    {result?.final_score ?? "—"}
                  </span>
                  <span className="text-[12px] text-zinc-500">
                    As marked on the official paper sheet
                  </span>
                </div>

                {result?.remarks && (
                  <div className="border-t border-white/[0.07] px-6 py-5">
                    <Eyebrow tone="default">Judges&apos; remarks</Eyebrow>
                    <p className="mt-2 whitespace-pre-wrap text-[13.5px] leading-relaxed text-zinc-300">
                      {result.remarks}
                    </p>
                  </div>
                )}

                <div className="border-t border-white/[0.07] px-6 py-5">
                  <Eyebrow tone="default">Your evaluation sheet</Eyebrow>
                  {sheetUrl ? (
                    <div className="mt-3 flex flex-col gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={sheetUrl}
                        alt={`Scanned evaluation sheet for ${team.name}`}
                        loading="lazy"
                        decoding="async"
                        className="w-full rounded-xl border border-white/10 bg-white"
                      />
                      <a
                        href={sheetUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex w-fit items-center gap-1.5 text-[13px] text-brand-300 transition-colors hover:text-brand-200"
                      >
                        Open full size <ArrowUpRight className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  ) : (
                    <p className="mt-2 text-[13px] text-zinc-500">
                      The scan of your sheet has not been uploaded yet.
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
                <IconTile name="lock" tone="brand" className="h-12 w-12" />
                <CardTitle as="h2" className="text-lg">
                  Results are not out yet
                </CardTitle>
                <p className="max-w-sm text-[13px] leading-relaxed text-zinc-500">
                  All judging is done in person on the official paper sheet. Your final score and a
                  scan of your sheet appear here once the Organizing Committee publishes them after
                  the closing ceremony.
                </p>
              </div>
            )}
          </HackCard>

          {/* ── Problem brief ──────────────────────────────────── */}
          {brief ? (
            <BriefView brief={brief} />
          ) : (
            <HackCard tone="brand" bare className="overflow-hidden">
              <div className="flex items-center justify-between gap-3 border-b border-white/[0.07] px-6 py-4">
                <div className="flex items-center gap-3">
                  <IconTile name="mail" tone="brand" className="h-9 w-9" />
                  <Eyebrow>Your problem envelope</Eyebrow>
                </div>
                {envelope && (
                  <span className="font-mono text-[11px] text-zinc-500">{envelope.code}</span>
                )}
              </div>

              <div className="flex flex-col items-center gap-4 px-6 py-8 text-center">
                <SealedEnvelope className="max-w-[280px]" />
                {envelope ? (
                  <>
                    <div className="flex flex-wrap items-center justify-center gap-2">
                      <span className="rounded-full border border-brand-400/30 bg-brand-500/10 px-3 py-1 text-[12px] text-brand-200">
                        {envelope.domain}
                      </span>
                      <span className="text-[12px] text-zinc-500">
                        Envelope {String(envelope.no).padStart(2, "0")} of {EVENT.maxTeams}
                      </span>
                    </div>
                    <CardBody className="max-w-md">
                      Your domain is assigned, but the brief itself stays sealed until{" "}
                      <strong className="font-medium text-white">9:20 AM</strong> on event day. It
                      appears here in full the moment the hall opens its envelopes together.
                    </CardBody>
                  </>
                ) : (
                  <CardBody className="max-w-md">
                    No envelope assigned yet — the core team assigns each team a unique problem
                    before the briefing.
                  </CardBody>
                )}
              </div>
            </HackCard>
          )}

          {/* ── Submission ─────────────────────────────────────── */}
          <HackCard tone={submission?.status === "submitted" ? "accent" : "default"} bare>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.07] px-6 py-4">
              <div className="flex items-center gap-3">
                <IconTile
                  name="send"
                  tone={submission?.status === "submitted" ? "accent" : "brand"}
                  className="h-9 w-9"
                />
                <div className="flex flex-col">
                  <Eyebrow tone={submission?.status === "submitted" ? "accent" : "brand"}>
                    Submit your project
                  </Eyebrow>
                  <span className="text-[12px] text-zinc-500">Pitch deck and code, together</span>
                </div>
              </div>
              <span
                className={`rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.12em] ${
                  submission?.status === "submitted"
                    ? "border-accent-400/30 bg-accent-500/10 text-accent-300"
                    : config.submissions_open
                      ? "border-amber-400/30 bg-amber-500/10 text-amber-300"
                      : "border-white/10 text-zinc-500"
                }`}
              >
                {submission?.status === "submitted"
                  ? "Submitted"
                  : config.submissions_open
                    ? "Open"
                    : "Not open"}
              </span>
            </div>

            <div className="p-6">
              <SubmissionForm
                open={config.submissions_open}
                submission={
                  submission
                    ? {
                        code_name: submission.code_name,
                        code_size: submission.code_size,
                        deck_name: submission.deck_name,
                        deck_size: submission.deck_size,
                        repo_url: submission.repo_url,
                        notes: submission.notes,
                        status: submission.status,
                        submitted_at: submission.submitted_at,
                      }
                    : null
                }
              />

              {(codeUrl || deckUrl) && (
                <div className="mt-5 flex flex-wrap gap-2 border-t border-white/[0.07] pt-5">
                  <span className="w-full text-[10px] uppercase tracking-[0.14em] text-zinc-600">
                    On file
                  </span>
                  {codeUrl && (
                    <a
                      href={codeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-full border border-white/12 px-3.5 py-1.5 text-[12px] text-zinc-300 transition-colors hover:border-brand-400/40 hover:text-white"
                    >
                      <Icon name="archive" className="h-3.5 w-3.5" />
                      {submission?.code_name ?? "Code"}
                    </a>
                  )}
                  {deckUrl && (
                    <a
                      href={deckUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-full border border-white/12 px-3.5 py-1.5 text-[12px] text-zinc-300 transition-colors hover:border-brand-400/40 hover:text-white"
                    >
                      <Icon name="deck" className="h-3.5 w-3.5" />
                      {submission?.deck_name ?? "Pitch deck"}
                    </a>
                  )}
                </div>
              )}
            </div>
          </HackCard>

          {/* ── Roster ─────────────────────────────────────────── */}
          <HackCard className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <IconTile name="users" className="h-9 w-9" />
                <Eyebrow tone="default">
                  Your team ({members.length}/{EVENT.maxTeamSize})
                </Eyebrow>
              </div>
              <span className="text-[11px] text-zinc-600">
                {quizReps.length} quiz {quizReps.length === 1 ? "rep" : "reps"}
              </span>
            </div>
            <ul className="flex flex-col gap-2">
              {members.map((m) => (
                <li
                  key={m.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-black/30 px-4 py-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate text-[14px] font-medium text-white">{m.name}</span>
                      {m.member_role === "captain" && (
                        <Icon name="crown" className="h-3.5 w-3.5 text-amber-300" />
                      )}
                    </div>
                    <div className="text-[11.5px] text-zinc-500">
                      {ROLE_LABEL[m.member_role as MemberRole] ?? "Member"}
                      {m.class_section ? ` · ${m.class_section}` : ""}
                    </div>
                  </div>
                  {m.is_quiz_rep && (
                    <span className="shrink-0 rounded-full border border-amber-400/30 bg-amber-500/10 px-2.5 py-0.5 text-[10px] uppercase tracking-[0.1em] text-amber-300">
                      Quiz rep
                    </span>
                  )}
                </li>
              ))}
            </ul>
            <p className="flex items-start gap-2 border-t border-white/[0.06] pt-3 text-[11.5px] leading-relaxed text-zinc-500">
              <Icon name="lock" className="mt-[2px] h-3.5 w-3.5 shrink-0" />
              Team and member details are managed by the core team. If something here is wrong,
              speak to the Organizing Committee — you cannot edit it yourself.
            </p>
          </HackCard>
        </div>

        {/* ── Sidebar ──────────────────────────────────────────── */}
        <div className="flex flex-col gap-5">
          {/* Deliberately the first thing in the sidebar: this is the one
              action a team must take before the internet is cut. */}
          <SaveOffline />

          <HackCard tone="brand" className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <IconTile name="calendar" tone="brand" className="h-9 w-9" />
              <Eyebrow>Event details</Eyebrow>
            </div>
            <dl className="flex flex-col">
              {[
                { k: "Date", v: EVENT.dateLabel },
                { k: "Time", v: EVENT.timeLabel },
                { k: "Venue", v: EVENT.venue },
                { k: "Format", v: "Fully offline · no internet" },
              ].map((row, i, arr) => (
                <div
                  key={row.k}
                  className={`flex items-start justify-between gap-4 py-2.5 ${
                    i < arr.length - 1 ? "border-b border-white/[0.06]" : ""
                  }`}
                >
                  <dt className="shrink-0 text-[12.5px] text-zinc-500">{row.k}</dt>
                  <dd className="text-right text-[13px] font-medium text-white">{row.v}</dd>
                </div>
              ))}
            </dl>
          </HackCard>

          <HackCard className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <IconTile name="clock" className="h-9 w-9" />
              <Eyebrow tone="default">First moves on the day</Eyebrow>
            </div>
            <ul className="flex flex-col gap-3">
              {NEXT_UP.map((s) => (
                <li key={s.title} className="flex gap-3">
                  <span className="w-14 shrink-0 font-mono text-[11px] text-zinc-500">{s.time}</span>
                  <span className="text-[13px] leading-snug text-zinc-300">{s.title}</span>
                </li>
              ))}
            </ul>
            <Link
              href="/hackathon/schedule"
              className="inline-flex items-center gap-1.5 text-[12.5px] text-brand-300 transition-colors hover:text-brand-200"
            >
              Full schedule <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </HackCard>

          {announcements.length > 0 && (
            <HackCard className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <IconTile name="megaphone" className="h-9 w-9" />
                <Eyebrow tone="default">Announcements</Eyebrow>
              </div>
              <ul className="flex flex-col gap-3.5">
                {announcements.slice(0, 5).map((a) => (
                  <li key={a.id} className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      {a.pinned && (
                        <span className="rounded-full bg-brand-500/15 px-2 py-0.5 text-[9px] uppercase tracking-[0.1em] text-brand-300">
                          Pinned
                        </span>
                      )}
                      <span className="text-[13.5px] font-medium text-white">{a.title}</span>
                    </div>
                    {a.body && (
                      <p className="text-[12.5px] leading-relaxed text-zinc-400">{a.body}</p>
                    )}
                  </li>
                ))}
              </ul>
            </HackCard>
          )}

          <HackCard tone="amber" className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <IconTile name="ticket" tone="amber" className="h-9 w-9" />
              <Eyebrow tone="amber">Developer Passport</Eyebrow>
            </div>
            <CardBody>
              {ACHIEVEMENTS.length} achievement cards are on the table, worth up to {PASSPORT_MAX}{" "}
              points. You collect them on paper during the build.
            </CardBody>
            <Link
              href="/hackathon/passport"
              className="inline-flex items-center gap-1.5 text-[12.5px] text-amber-300 transition-colors hover:text-amber-200"
            >
              See every card <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </HackCard>
        </div>
      </div>
    </Container>
  );
}
