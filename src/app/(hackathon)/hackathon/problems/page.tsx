import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { Countdown } from "@/components/hackathon/countdown";
import { Icon } from "@/components/hackathon/icons";
import {
  CardBody,
  CardTitle,
  CheckRow,
  Eyebrow,
  HackCard,
  IconTile,
  SectionHead,
} from "@/components/hackathon/card";
import {
  BRIEF_SECTIONS,
  DELIVERABLES,
  ENVELOPES,
  ENVELOPE_CONTENTS,
  EVENT,
} from "@/lib/hackathon/content";

export const metadata: Metadata = {
  title: "Sealed envelopes",
  description:
    "Twenty sealed problem briefs, one per team, opened for the first time at 9:20 AM on event day.",
};

export const dynamic = "force-static";

/**
 * The envelopes page.
 *
 * Only the twenty *domains* are published — never the brief titles or their
 * contents. The whole format depends on no team seeing its problem before
 * 9:20 AM on the day, so the titles stay in server-only content and are
 * rendered nowhere outside the organiser console.
 */
export default function ProblemsPage() {
  return (
    <Container className="flex flex-col gap-12 py-14">
      <SectionHead
        section="Section 02 / Format"
        eyebrow="Problem briefs"
        icon="mail"
        title="Twenty Envelopes."
        accent="One Each."
        lead="Every team gets its own sealed brief — a different real-world problem for each of the 20 teams, so no two teams build the same thing. Envelopes are handed out sealed and opened together at 9:20 AM. Nothing about your problem is published here, or anywhere else, before that moment."
        align="center"
      />

      {/* ── Sealed banner ──────────────────────────────────────── */}
      <HackCard tone="brand" className="flex flex-col items-center gap-5 py-10 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-brand-400/30 bg-brand-500/12">
          <Icon name="lock" className="h-6 w-6 text-brand-300" />
        </span>
        <div className="flex flex-col gap-2">
          <Eyebrow>Sealed until the reveal</Eyebrow>
          <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            Briefs open at 9:20 AM
          </h2>
          <p className="mx-auto max-w-lg text-[13.5px] leading-relaxed text-zinc-400">
            {EVENT.dateLabel}. Your envelope is assigned in advance, but stays sealed until the
            whole hall opens together.
          </p>
        </div>
        <Countdown target={EVENT.revealAt} label="Reveal in" className="items-center" compact />
      </HackCard>

      {/* ── Domains ────────────────────────────────────────────── */}
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="flex flex-col gap-1.5">
            <Eyebrow>The fields in play</Eyebrow>
            <h2 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">
              {ENVELOPES.length} domains, {ENVELOPES.length} problems
            </h2>
          </div>
          <p className="max-w-md text-[13px] leading-relaxed text-zinc-500">
            These are the areas the briefs are drawn from. Which envelope your team receives, and
            what it asks for, is revealed on the day.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {ENVELOPES.map((e) => (
            <HackCard key={e.no} interactive className="flex flex-col gap-3 p-5">
              <div className="flex items-start justify-between">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.05]">
                  <Icon name="lock" className="h-4 w-4 text-zinc-500" />
                </span>
                <span className="font-mono text-[10px] text-zinc-600">
                  {String(e.no).padStart(2, "0")}
                </span>
              </div>
              <span className="text-[13.5px] font-medium leading-tight text-white">{e.domain}</span>
              <span className="text-[10px] uppercase tracking-[0.14em] text-zinc-600">Sealed</span>
            </HackCard>
          ))}
        </div>
      </div>

      {/* ── What's inside / what you hand back ─────────────────── */}
      <div className="grid gap-4 md:grid-cols-2">
        <HackCard tone="brand" className="flex flex-col gap-5">
          <IconTile name="mail" tone="brand" className="h-11 w-11" />
          <div className="flex flex-col gap-1.5">
            <Eyebrow>Inside the envelope</Eyebrow>
            <CardTitle as="h3" className="text-xl">
              What your brief contains
            </CardTitle>
          </div>
          <ol className="flex flex-col gap-2.5">
            {ENVELOPE_CONTENTS.map((item, i) => (
              <li key={item} className="flex items-start gap-3">
                <span className="mt-0.5 font-mono text-[11px] text-brand-400">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="text-[13.5px] leading-relaxed text-zinc-300">{item}</span>
              </li>
            ))}
          </ol>
          <div className="mt-auto flex flex-wrap gap-1.5 pt-3">
            {BRIEF_SECTIONS.map((s) => (
              <span
                key={s}
                className="rounded-full border border-white/[0.08] px-2.5 py-1 text-[10.5px] text-zinc-500"
              >
                {s}
              </span>
            ))}
          </div>
        </HackCard>

        <HackCard tone="accent" className="flex flex-col gap-5">
          <IconTile name="usb" tone="accent" className="h-11 w-11" />
          <div className="flex flex-col gap-1.5">
            <Eyebrow tone="accent">By code freeze</Eyebrow>
            <CardTitle as="h3" className="text-xl">
              What you hand back
            </CardTitle>
          </div>
          <CardBody>
            Everything is handed over in person at your desk — nothing is uploaded to this site.
          </CardBody>
          <ul className="mt-auto flex flex-col gap-2.5">
            {DELIVERABLES.map((d) => (
              <CheckRow key={d} tone="accent">
                {d}
              </CheckRow>
            ))}
          </ul>
        </HackCard>
      </div>

      <p className="text-center text-[11px] uppercase tracking-[0.18em] text-zinc-600">
        Infinium · Build · Adapt · Innovate · {ENVELOPES.length} sealed briefs
      </p>
    </Container>
  );
}
