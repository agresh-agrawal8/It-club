import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Container } from "@/components/ui/container";
import { AnnouncementPoster } from "@/components/hackathon/announcement-poster";
import {
  CardBody,
  CardTitle,
  Eyebrow,
  HackCard,
  IconTile,
  SectionHead,
} from "@/components/hackathon/card";
import { requireCoreTeam } from "@/lib/auth";
import { EVENT } from "@/lib/hackathon/content";
import { getAdminStats, getAnnouncements, getConfig } from "@/lib/hackathon/data";
import {
  BriefsSwitch,
  DeleteAnnouncementButton,
  SubmissionsSwitch,
} from "@/components/hackathon/admin-controls";

export const metadata: Metadata = { title: "Admin console" };

export default async function AdminPage() {
  await requireCoreTeam();

  const [stats, announcements, config] = await Promise.all([
    getAdminStats(),
    getAnnouncements(),
    getConfig(),
  ]);

  const counters = [
    { label: "Teams registered", value: `${stats.teams}/${EVENT.maxTeams}`, icon: "users" },
    { label: "Participants", value: String(stats.members), icon: "crown" },
    {
      label: "Envelopes assigned",
      value: `${stats.envelopesAssigned}/${stats.teams}`,
      icon: "mail",
    },
    {
      label: "Results published",
      value: `${stats.resultsPublished}/${stats.resultsEntered}`,
      icon: "trophy",
    },
  ];

  return (
    <Container className="flex flex-col gap-8 py-10">
      <SectionHead
        eyebrow="Core team"
        icon="shield"
        title="Admin Console"
        lead={`Infinium runs offline — judging, the quiz and all marking happen on paper. This console exists to manage teams, assign the ${EVENT.maxTeams} sealed envelopes, and publish the results afterwards.`}
      />

      {/* ── Counters ───────────────────────────────────────────── */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {counters.map((c) => (
          <HackCard key={c.label} tone="brand" className="flex flex-col gap-2 p-5">
            <IconTile name={c.icon} tone="brand" className="h-9 w-9" />
            <span className="text-2xl font-semibold tracking-tight text-white">{c.value}</span>
            <Eyebrow tone="default">{c.label}</Eyebrow>
          </HackCard>
        ))}
      </div>

      {/* ── Day switches ───────────────────────────────────────── */}
      <div className="grid gap-4 md:grid-cols-2">
        <HackCard tone={config.briefs_released ? "accent" : "default"} className="flex flex-col gap-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <IconTile
                name={config.briefs_released ? "mail" : "lock"}
                tone={config.briefs_released ? "accent" : "brand"}
                className="h-9 w-9"
              />
              <div className="flex flex-col gap-1">
                <CardTitle>Sealed briefs</CardTitle>
                <CardBody>
                  {config.briefs_released
                    ? "Released. Every team can now read its full problem brief in its portal."
                    : "Sealed. Teams see only their domain — the brief text never leaves the server."}
                </CardBody>
              </div>
            </div>
          </div>
          <BriefsSwitch released={config.briefs_released} />
        </HackCard>

        <HackCard tone={config.submissions_open ? "amber" : "default"} className="flex flex-col gap-4">
          <div className="flex items-start gap-3">
            <IconTile
              name={config.submissions_open ? "send" : "lock"}
              tone={config.submissions_open ? "amber" : "brand"}
              className="h-9 w-9"
            />
            <div className="flex flex-col gap-1">
              <CardTitle>Submission window</CardTitle>
              <CardBody>
                {config.submissions_open
                  ? "Open. Teams can upload their pitch deck and code from their portal."
                  : "Closed. Uploads are rejected server-side, not just hidden."}
              </CardBody>
            </div>
          </div>
          <SubmissionsSwitch open={config.submissions_open} />
        </HackCard>
      </div>

      {/* ── Panels ─────────────────────────────────────────────── */}
      <div className="grid gap-4 md:grid-cols-3">
        <Link href="/hackathon/envelopes" className="block">
          <HackCard tone="brand" interactive className="flex h-full flex-col gap-3">
            <div className="flex items-start justify-between">
              <IconTile name="mail" tone="brand" className="h-11 w-11" />
              <ArrowUpRight className="h-4 w-4 text-zinc-500" />
            </div>
            <CardTitle as="h2" className="text-xl">
              Envelope allocation
            </CardTitle>
            <CardBody>
              Draw all twenty sealed briefs at once, or set any team by hand. Picking a taken
              envelope swaps the two teams.
            </CardBody>
            <span className="mt-auto pt-2 text-[12px] text-zinc-500">
              {stats.envelopesAssigned}/{stats.teams} assigned
            </span>
          </HackCard>
        </Link>

        <Link href="/hackathon/manage" className="block">
          <HackCard tone="brand" interactive className="flex h-full flex-col gap-3">
            <div className="flex items-start justify-between">
              <IconTile name="users" tone="brand" className="h-11 w-11" />
              <ArrowUpRight className="h-4 w-4 text-zinc-500" />
            </div>
            <CardTitle as="h2" className="text-xl">
              Manage teams &amp; results
            </CardTitle>
            <CardBody>
              Edit rosters, review submitted work, enter each team&apos;s final score from the
              paper sheet, upload the scan, and publish.
            </CardBody>
          </HackCard>
        </Link>

        <Link href="/hackathon/leaderboard" className="block">
          <HackCard interactive className="flex h-full flex-col gap-3">
            <div className="flex items-start justify-between">
              <IconTile name="trophy" tone="amber" className="h-11 w-11" />
              <ArrowUpRight className="h-4 w-4 text-zinc-500" />
            </div>
            <CardTitle as="h2" className="text-xl">
              Public standings
            </CardTitle>
            <CardBody>
              What everyone else sees. Only published results appear — check it before announcing.
            </CardBody>
          </HackCard>
        </Link>
      </div>

      {/* ── Announcements ──────────────────────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-[1fr_1fr] lg:items-start">
        <HackCard className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <IconTile name="megaphone" className="h-9 w-9" />
            <div className="flex flex-col">
              <CardTitle>Post an announcement</CardTitle>
              <span className="text-[12px] text-zinc-500">
                Shown in every team&apos;s portal immediately.
              </span>
            </div>
          </div>
          <AnnouncementPoster />
        </HackCard>

        <HackCard className="flex flex-col gap-4">
          <Eyebrow tone="default">Posted ({announcements.length})</Eyebrow>
          {announcements.length === 0 ? (
            <CardBody>Nothing posted yet.</CardBody>
          ) : (
            <ul className="flex flex-col gap-3">
              {announcements.map((a) => (
                <li
                  key={a.id}
                  className="flex items-start justify-between gap-3 rounded-xl border border-white/[0.06] bg-black/25 px-4 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      {a.pinned && (
                        <span className="rounded-full bg-brand-500/15 px-2 py-0.5 text-[9px] uppercase tracking-[0.1em] text-brand-300">
                          Pinned
                        </span>
                      )}
                      <span className="text-[13.5px] font-medium text-white">{a.title}</span>
                    </div>
                    {a.body && <p className="mt-0.5 text-[12px] text-zinc-500">{a.body}</p>}
                  </div>
                  <DeleteAnnouncementButton id={a.id} />
                </li>
              ))}
            </ul>
          )}
        </HackCard>
      </div>

      <HackCard tone="danger" className="flex items-start gap-4">
        <IconTile name="power" tone="danger" className="h-9 w-9" />
        <div className="flex flex-col gap-1">
          <CardTitle>No online judging</CardTitle>
          <CardBody>
            There is no judging panel, scoring form or quiz on this site any more. Judges mark on
            the official paper sheet; the quiz is run in the arena. This console is the only place
            hackathon data is written.
          </CardBody>
        </div>
      </HackCard>
    </Container>
  );
}
