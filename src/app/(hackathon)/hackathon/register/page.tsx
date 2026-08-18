import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { CardBody, Eyebrow, HackCard, IconTile, SectionHead } from "@/components/hackathon/card";
import { TeamOrbit, VisualWell } from "@/components/hackathon/visuals";
import { EVENT, QUIZ_REPS_REQUIRED } from "@/lib/hackathon/content";
import { getTeamCount } from "@/lib/hackathon/data";
import { RegisterForm } from "./register-form";

export const metadata: Metadata = {
  title: "Register your team",
  description: `Register one of the ${EVENT.maxTeams} team places for Infinium — ${EVENT.dateLabel}.`,
};

export default async function RegisterPage() {
  const taken = await getTeamCount();
  const remaining = Math.max(0, EVENT.maxTeams - taken);
  const full = remaining === 0;

  return (
    <Container className="flex flex-col gap-10 py-14">
      <SectionHead
        section="Section 03 / Teams"
        eyebrow="Registration"
        icon="users"
        title="Assemble"
        accent="Your Team."
        lead={`Between ${EVENT.minTeamSize} and ${EVENT.maxTeamSize} students, one Team Captain, and ${QUIZ_REPS_REQUIRED} quiz representatives. ${EVENT.classes}. Registration closes when all ${EVENT.maxTeams} places are taken.`}
        align="center"
      />

      {/* ── Capacity ───────────────────────────────────────────── */}
      <div className="grid gap-3 sm:grid-cols-3">
        <HackCard tone={full ? "danger" : "brand"} className="flex flex-col gap-1.5">
          <Eyebrow tone={full ? "danger" : "brand"}>Places left</Eyebrow>
          <span className="text-2xl font-semibold tracking-tight text-white">
            {remaining} <span className="text-base text-zinc-500">of {EVENT.maxTeams}</span>
          </span>
        </HackCard>
        <HackCard className="flex flex-col gap-1.5">
          <Eyebrow tone="default">Event day</Eyebrow>
          <span className="text-[15px] font-medium text-white">{EVENT.dateLabel}</span>
          <span className="text-[12px] text-zinc-500">{EVENT.timeLabel}</span>
        </HackCard>
        <HackCard className="flex flex-col gap-1.5">
          <Eyebrow tone="default">Venue</Eyebrow>
          <span className="text-[14px] font-medium leading-snug text-white">{EVENT.venue}</span>
        </HackCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_0.85fr] lg:items-start">
        <HackCard bare className="p-6 sm:p-8">
          {full ? (
            <div className="flex flex-col items-center gap-4 py-10 text-center">
              <IconTile name="lock" tone="danger" className="h-12 w-12" />
              <h2 className="text-xl font-semibold tracking-tight text-white">
                Registration is full
              </h2>
              <p className="max-w-sm text-[13.5px] leading-relaxed text-zinc-400">
                All {EVENT.maxTeams} team places have been taken. Speak to the Organizing Committee
                if you think a place should still be open.
              </p>
              <Link
                href="/hackathon/team"
                className="rounded-full border border-white/12 px-5 py-2.5 text-sm text-white transition-colors hover:border-white/25"
              >
                Open team portal
              </Link>
            </div>
          ) : (
            <RegisterForm />
          )}
        </HackCard>

        {/* ── Side notes ───────────────────────────────────────── */}
        <div className="flex flex-col gap-3">
          <HackCard tone="brand" className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <IconTile name="power" tone="brand" className="h-9 w-9" />
              <Eyebrow>Before you sign up</Eyebrow>
            </div>
            <CardBody>
              The build is fully offline. Install your editor, runtime, libraries and any starter
              templates <strong className="font-medium text-white">before</strong> the day, and bring
              them on your own laptop or a USB drive.
            </CardBody>
          </HackCard>

          <HackCard className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <IconTile name="users" className="h-9 w-9" />
              <Eyebrow tone="default">Team rules</Eyebrow>
            </div>
            <ul className="flex flex-col gap-2 text-[13px] leading-relaxed text-zinc-400">
              <li>• {EVENT.minTeamSize}–{EVENT.maxTeamSize} members, {EVENT.classes}.</li>
              <li>• Exactly one Team Captain; each role held once.</li>
              <li>• Exactly {QUIZ_REPS_REQUIRED} quiz representatives.</li>
              <li>• A student can only be on one team.</li>
              <li>• Team names must be unique.</li>
            </ul>
            <VisualWell pad={false} className="px-2 pt-1">
              <TeamOrbit />
            </VisualWell>
          </HackCard>

          <HackCard className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <IconTile name="ticket" className="h-9 w-9" />
              <Eyebrow tone="default">No passwords</Eyebrow>
            </div>
            <CardBody>
              There is nothing to remember beyond your team name. Type it into the team portal and
              your Achievement Card opens.
            </CardBody>
          </HackCard>

          <p className="px-1 text-[11.5px] leading-relaxed text-zinc-600">
            {EVENT.externalNote}.
          </p>
        </div>
      </div>
    </Container>
  );
}
