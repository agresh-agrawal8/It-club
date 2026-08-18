import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { Icon } from "@/components/hackathon/icons";
import {
  CardBody,
  CardTitle,
  CheckRow,
  Chip,
  Eyebrow,
  HackCard,
  IconTile,
  SectionHead,
  type Tone,
} from "@/components/hackathon/card";
import {
  COMMITTEE,
  COMMITTEE_NOTE,
  CONDUCT_INTRO,
  JUDGING,
  PENALTIES,
  QUIZ,
  RULES,
  ROLES,
  ROLE_NOTES,
  SPIRIT,
  TEACHER_COORDINATORS,
  initials,
} from "@/lib/hackathon/content";

export const metadata: Metadata = {
  title: "Rules & judging",
  description:
    "Team roles, the offline rule, how judging works, the IT Quiz format, and the conduct rules for Infinium.",
};

export const dynamic = "force-static";

export default function RulesPage() {
  return (
    <Container className="flex flex-col gap-16 py-14">
      <SectionHead
        section="Section 10 / Conduct"
        eyebrow="Guidelines & discipline"
        icon="shield"
        title="Rules of the"
        accent="Room."
        lead={CONDUCT_INTRO}
        align="center"
      />

      {/* ── Conduct ────────────────────────────────────────────── */}
      <div className="grid gap-4 md:grid-cols-2">
        {RULES.map((group) => (
          <HackCard key={group.title} tone={group.tone as Tone} className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <IconTile name={group.icon} tone={group.tone as Tone} className="h-9 w-9" />
              <CardTitle>{group.title}</CardTitle>
            </div>
            <ul className="flex flex-col gap-2.5">
              {group.items.map((item) => (
                <CheckRow key={item} tone={group.tone as Tone}>
                  {item}
                </CheckRow>
              ))}
            </ul>
          </HackCard>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <HackCard tone="danger" className="flex items-start gap-4">
          <IconTile name="power" tone="danger" className="h-9 w-9" />
          <div className="flex flex-col gap-1">
            <CardTitle>{PENALTIES.title}</CardTitle>
            <CardBody>{PENALTIES.body}</CardBody>
          </div>
        </HackCard>
        <HackCard tone="accent" className="flex items-start gap-4">
          <IconTile name="check" tone="accent" className="h-9 w-9" />
          <div className="flex flex-col gap-1">
            <CardTitle>{SPIRIT.title}</CardTitle>
            <CardBody>{SPIRIT.body}</CardBody>
          </div>
        </HackCard>
      </div>

      {/* ── Roles ──────────────────────────────────────────────── */}
      <section className="flex flex-col gap-8 border-t border-white/[0.06] pt-14">
        <SectionHead
          section="Section 03 / Teams"
          eyebrow="Teams & roles"
          icon="users"
          title="Up to Five."
          accent="Five Clear Roles."
          lead="Every team submits its finalised role allocation during the planning phase. Roles keep everyone accountable — but everyone builds together."
        />
        <div className="grid gap-3 sm:grid-cols-2">
          {ROLES.map((r) => (
            <HackCard
              key={r.id}
              tone={r.lead ? "brand" : "default"}
              className={`flex items-start gap-4 ${r.lead ? "sm:col-span-2" : ""}`}
            >
              <IconTile name={r.icon} tone={r.lead ? "brand" : "default"} />
              <div className="flex flex-1 flex-col gap-1">
                <div className="flex items-center justify-between gap-3">
                  <CardTitle>{r.title}</CardTitle>
                  {r.lead && <Eyebrow>Lead</Eyebrow>}
                </div>
                <CardBody>{r.desc}</CardBody>
              </div>
            </HackCard>
          ))}
        </div>
        <div className="flex flex-col gap-3">
          {ROLE_NOTES.map((note, i) => (
            <HackCard key={note} tone={i === 1 ? "amber" : "default"} className="flex items-start gap-3.5 p-5">
              <Icon
                name={i === 1 ? "message" : "lightbulb"}
                className={`mt-0.5 h-4 w-4 shrink-0 ${i === 1 ? "text-amber-300" : "text-brand-300"}`}
              />
              <CardBody className="text-zinc-300">{note}</CardBody>
            </HackCard>
          ))}
        </div>
      </section>

      {/* ── Judging ────────────────────────────────────────────── */}
      <section className="flex flex-col gap-8 border-t border-white/[0.06] pt-14">
        <SectionHead
          section="Section 07 / Judging & Pitch"
          eyebrow="Judge interaction & final presentation"
          icon="message"
          title="Judged on"
          accent="How You Think."
          lead={JUDGING.intro}
        />

        <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <HackCard className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <IconTile name="clipboard" className="h-9 w-9" />
              <Eyebrow tone="default">What judges look for</Eyebrow>
            </div>
            <ul className="flex flex-col gap-2.5">
              {JUDGING.lookFor.map((l) => (
                <CheckRow key={l}>{l}</CheckRow>
              ))}
            </ul>
            <div className="mt-auto border-t border-white/[0.07] pt-4">
              <CardBody className="text-[12.5px]">{JUDGING.note}</CardBody>
            </div>
          </HackCard>

          <div className="flex flex-col gap-3">
            <Eyebrow>Your 6 minutes with the judges</Eyebrow>
            {JUDGING.slots.map((s, i) => (
              <HackCard
                key={s.title}
                tone={i === 2 ? "amber" : "brand"}
                className="flex items-center gap-5 p-5"
              >
                <span className="flex shrink-0 items-baseline gap-0.5">
                  <span className="text-3xl font-semibold tracking-tight text-white">{s.mins}</span>
                  <span className="text-[11px] text-zinc-500">min</span>
                </span>
                <div className="flex flex-col gap-0.5">
                  <CardTitle>{s.title}</CardTitle>
                  <CardBody className="text-[13px]">{s.desc}</CardBody>
                </div>
              </HackCard>
            ))}
            <HackCard className="flex flex-wrap items-center gap-x-5 gap-y-2 p-5">
              <Eyebrow tone="default">Submit</Eyebrow>
              {JUDGING.submit.map((s) => (
                <span key={s} className="flex items-center gap-1.5 text-[13px] text-zinc-300">
                  <Icon name="check" className="h-3.5 w-3.5 text-brand-300" /> {s}
                </span>
              ))}
            </HackCard>
          </div>
        </div>

        <HackCard tone="accent" className="flex items-start gap-4">
          <IconTile name="file" tone="accent" className="h-9 w-9" />
          <div className="flex flex-col gap-1">
            <CardTitle>Marking is on paper</CardTitle>
            <CardBody>{JUDGING.offlineNote}</CardBody>
          </div>
        </HackCard>
      </section>

      {/* ── Quiz ───────────────────────────────────────────────── */}
      <section className="flex flex-col gap-8 border-t border-white/[0.06] pt-14">
        <SectionHead
          section="Section 08 / Quiz Rounds"
          eyebrow="How the quiz is played"
          icon="lightbulb"
          title="Two Rounds."
          accent="One Challenge."
          lead={QUIZ.intro}
        />

        <div className="grid gap-4 md:grid-cols-2">
          <HackCard className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <IconTile name="users" className="h-9 w-9" />
              <Eyebrow tone="default">Team of two</Eyebrow>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {QUIZ.team.map((t) => (
                <div
                  key={t.label}
                  className="flex flex-col gap-1 rounded-xl border border-white/[0.07] bg-white/[0.02] p-4"
                >
                  <span className="text-[15px] font-semibold text-white">{t.label}</span>
                  <span className="text-[12px] text-zinc-500">{t.sub}</span>
                </div>
              ))}
            </div>
            <CardBody className="text-[13px]">{QUIZ.teamNote}</CardBody>
          </HackCard>

          <HackCard tone="brand" className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <IconTile name="trophy" tone="brand" className="h-9 w-9" />
              <Eyebrow>Scoring</Eyebrow>
            </div>
            <CardTitle as="h3" className="text-xl">
              {QUIZ.scoring.title}
            </CardTitle>
            <CardBody>{QUIZ.scoring.body}</CardBody>
          </HackCard>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {QUIZ.rounds.map((r) => (
            <HackCard
              key={r.n}
              tone={r.n === 1 ? "brand" : "amber"}
              className="flex flex-col gap-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="flex flex-col items-center">
                    <span className="text-2xl font-semibold leading-none text-white">{r.n}</span>
                    <span className="text-[9px] uppercase tracking-[0.14em] text-zinc-600">
                      Round
                    </span>
                  </span>
                  <span className="h-9 w-px bg-white/[0.08]" />
                  <div className="flex items-center gap-2">
                    <Icon
                      name={r.icon}
                      className={`h-4 w-4 ${r.n === 1 ? "text-brand-300" : "text-amber-300"}`}
                    />
                    <CardTitle as="h3" className="text-xl">
                      {r.title}
                    </CardTitle>
                  </div>
                </div>
                <span className="flex shrink-0 flex-col items-center">
                  <span className="text-xl font-semibold leading-none text-white">{r.badge}</span>
                  <span className="mt-1 text-[8px] uppercase tracking-[0.12em] text-zinc-600">
                    {r.badgeLabel}
                  </span>
                </span>
              </div>
              <CardBody>{r.desc}</CardBody>
              <ul className="mt-auto flex flex-col gap-2 pt-2">
                {r.points.map((p) => (
                  <CheckRow key={p} tone={r.n === 1 ? "brand" : "amber"}>
                    {p}
                  </CheckRow>
                ))}
              </ul>
            </HackCard>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <HackCard className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <IconTile name="lightbulb" className="h-9 w-9" />
              <Eyebrow tone="default">Topics covered</Eyebrow>
            </div>
            <div className="flex flex-wrap gap-2">
              {QUIZ.topics.map((t) => (
                <Chip key={t} tone="brand">
                  {t}
                </Chip>
              ))}
            </div>
          </HackCard>
          <HackCard className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <IconTile name="shield" className="h-9 w-9" />
              <Eyebrow tone="default">Quiz rules</Eyebrow>
            </div>
            <ul className="flex flex-col gap-2.5">
              {QUIZ.rules.map((r) => (
                <CheckRow key={r}>{r}</CheckRow>
              ))}
            </ul>
          </HackCard>
        </div>

        <HackCard tone="brand" className="flex items-start gap-3.5">
          <Icon name="check" className="mt-0.5 h-4 w-4 shrink-0 text-brand-300" />
          <CardBody className="text-zinc-300">{QUIZ.note}</CardBody>
        </HackCard>
      </section>

      {/* ── Committee ──────────────────────────────────────────── */}
      <section className="flex flex-col gap-8 border-t border-white/[0.06] pt-14">
        <SectionHead
          section="Section 11 / The Team"
          eyebrow="The people behind Infinium"
          icon="users"
          title="Organizing Committee"
          lead="The team that plans, runs and delivers Infinium — the flagship IT Fest of Emerald Heights International School."
        />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {COMMITTEE.map((name) => (
            <HackCard key={name} interactive className="flex flex-col items-center gap-3 py-7">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-500/90 text-lg font-semibold tracking-tight text-white">
                {initials(name)}
              </span>
              <span className="text-[14px] font-medium text-white">{name}</span>
            </HackCard>
          ))}
        </div>

        <HackCard tone="brand" className="flex flex-col gap-4">
          <div className="flex items-start gap-4">
            <IconTile name="message" tone="brand" className="h-9 w-9" />
            <div className="flex flex-col gap-1">
              <CardTitle>Need help?</CardTitle>
              <CardBody>{COMMITTEE_NOTE}</CardBody>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 border-t border-white/[0.07] pt-4">
            <Eyebrow tone="default">Teacher coordinators</Eyebrow>
            {TEACHER_COORDINATORS.map((t) => (
              <Chip key={t}>{t}</Chip>
            ))}
          </div>
        </HackCard>
      </section>

      <p className="text-center text-[11px] uppercase tracking-[0.18em] text-zinc-600">
        Coordinator decisions are final · Infinium IT Fest 2026
      </p>
    </Container>
  );
}
