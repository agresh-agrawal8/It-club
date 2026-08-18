import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Countdown } from "@/components/hackathon/countdown";
import { Icon } from "@/components/hackathon/icons";
import { PassportCard } from "@/components/hackathon/achievement-card";
import {
  CurveChart,
  DayGrid,
  PanelStack,
  TeamOrbit,
  VisualWell,
} from "@/components/hackathon/visuals";
import {
  CardBody,
  CardTitle,
  CheckRow,
  Chip,
  Eyebrow,
  FeatureCard,
  HackCard,
  IconTile,
  SectionHead,
} from "@/components/hackathon/card";
import {
  ACHIEVEMENTS,
  AT_A_GLANCE,
  COME_PREPARED,
  ENVELOPE_CONTENTS,
  EVENT,
  HOW_IT_WORKS,
  OFFLINE_RULE,
  PASSPORT_MAX,
  PILLARS,
  ROLES,
  SCHEDULE,
  STACK,
  SURPRISE_TASK,
} from "@/lib/hackathon/content";

/**
 * Infinium landing page.
 *
 * Every word here comes from the official participant guide, and every one of
 * them is a constant — this route makes no database call and is prerendered at
 * build time. The only client JavaScript on the page is the countdown.
 */
export const dynamic = "force-static";

/** The first six timeline entries are enough for a preview. */
const FLOW_PREVIEW = SCHEDULE.filter((s) => !s.parallel).slice(0, 6);

/** One card of each rarity, as a taste of the full passport. */
const PASSPORT_PREVIEW = [
  ACHIEVEMENTS[0],
  ACHIEVEMENTS[5],
  ACHIEVEMENTS[10],
  ACHIEVEMENTS[19],
];

export default function HackathonHome() {
  return (
    <>
      {/* ═══════════════════════ HERO ═══════════════════════ */}
      <section className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
            backgroundSize: "56px 56px",
            maskImage: "radial-gradient(ellipse 70% 55% at 50% 0%, black, transparent)",
            WebkitMaskImage: "radial-gradient(ellipse 70% 55% at 50% 0%, black, transparent)",
          }}
        />
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-[520px]"
          style={{
            background:
              "radial-gradient(60% 100% at 50% 0%, rgba(139,92,246,0.20), transparent 70%)",
          }}
        />

        <Container className="relative flex flex-col items-center gap-7 pb-20 pt-20 text-center md:pt-28">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1.5 text-[11px] uppercase tracking-[0.16em] text-zinc-300">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-400" />
            {EVENT.format} · {EVENT.classes}
          </span>

          <div className="flex flex-col items-center gap-4">
            <h1 className="text-balance text-6xl font-semibold leading-[0.95] tracking-tighter text-white sm:text-7xl lg:text-8xl">
              Infi<span className="text-brand-400">nium</span>
            </h1>
            <p className="flex items-center gap-3 text-[13px] uppercase tracking-[0.32em] text-zinc-300 sm:text-base sm:tracking-[0.4em]">
              <span className="hidden h-px w-8 bg-brand-500/60 sm:block" />
              Build · Adapt · Innovate
            </p>
          </div>

          <p className="max-w-2xl text-balance text-[15px] leading-relaxed text-zinc-400">
            {EVENT.blurb} There are surprise tasks, friendly judges, and nothing but your own
            machine to build on.
          </p>

          <Countdown target={EVENT.startsAt} label="Envelopes open in" className="items-center" />

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/hackathon/register"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-brand-500"
            >
              Register your team <ArrowUpRight className="h-4 w-4" />
            </Link>
            <Link
              href="/hackathon/schedule"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/12 bg-white/[0.03] px-6 py-3 text-sm font-medium text-white transition-colors hover:border-white/25"
            >
              See the day
            </Link>
          </div>

          <div className="mt-4 grid w-full max-w-4xl grid-cols-2 gap-3 sm:grid-cols-4">
            {AT_A_GLANCE.map((s) => (
              <HackCard key={s.label} tone="brand" className="flex flex-col items-center gap-1.5 p-5">
                <Icon name={s.icon} className="h-4 w-4 text-brand-300" />
                <span className="text-xl font-semibold tracking-tight text-white sm:text-2xl">
                  {s.value}
                </span>
                <span className="text-[10px] uppercase tracking-[0.14em] text-zinc-500">
                  {s.label}
                </span>
              </HackCard>
            ))}
          </div>
        </Container>
      </section>

      {/* ═══════════════════════ WELCOME ═══════════════════════ */}
      <section className="py-16 md:py-20">
        <Container className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
          <div className="flex flex-col gap-5">
            <SectionHead
              section="Section 00 / Welcome"
              eyebrow="Welcome, builders"
              title="Step Into"
              accent="The Forge."
            />
            <div className="flex flex-col gap-4 text-[14.5px] leading-relaxed text-zinc-400">
              <p>
                <strong className="font-medium text-white">Infinium</strong> feels like a real
                project at a tech company. In a single day, your team is given a brand-new problem
                and builds something that people can actually use — entirely offline.
              </p>
              <p>
                You don&apos;t win by writing the most code. You win by building the most{" "}
                <span className="text-brand-300">useful and well-made</span> project — planned well,
                built under real constraints, and explained clearly to the judges.
              </p>
            </div>
            <blockquote className="border-l-2 border-brand-500/60 pl-5 text-lg font-medium leading-snug tracking-tight text-white sm:text-xl">
              &ldquo;It is not about how much code you write. It is about how much your idea helps
              people.&rdquo;
            </blockquote>
          </div>

          <div className="flex flex-col gap-4">
            <HackCard className="flex flex-col gap-0 p-0">
              <div className="px-6 pb-2 pt-5">
                <Eyebrow tone="default">Event at a glance</Eyebrow>
              </div>
              <dl className="flex flex-col px-6 pb-5">
                {[
                  { k: "Date", v: EVENT.dateLabel },
                  { k: "Time", v: EVENT.timeLabel },
                  { k: "Teams", v: String(EVENT.maxTeams) },
                  { k: "Team size", v: `Up to ${EVENT.maxTeamSize}` },
                  { k: "Open to", v: EVENT.classes },
                ].map((row, i, arr) => (
                  <div
                    key={row.k}
                    className={`flex items-center justify-between gap-4 py-3 ${
                      i < arr.length - 1 ? "border-b border-white/[0.06]" : ""
                    }`}
                  >
                    <dt className="text-[13px] text-zinc-400">{row.k}</dt>
                    <dd className="text-right text-[14px] font-medium text-white">{row.v}</dd>
                  </div>
                ))}
              </dl>
              <p className="border-t border-white/[0.06] px-6 py-3 text-[10px] uppercase tracking-[0.14em] text-zinc-600">
                + {EVENT.externalNote}
              </p>
            </HackCard>

            <HackCard tone="brand" className="flex gap-4">
              <IconTile name="power" tone="brand" />
              <div className="flex flex-col gap-1.5">
                <Eyebrow>Signature twist</Eyebrow>
                <CardBody className="text-zinc-300">
                  The whole event runs with{" "}
                  <strong className="font-medium text-white">no internet at all</strong> — no AI, no
                  searching. Just what you know and what you brought.
                </CardBody>
              </div>
            </HackCard>
          </div>
        </Container>
      </section>

      {/* ═══════════════════════ SHOWCASE ═══════════════════════ */}
      <section className="border-t border-white/[0.06] py-16 md:py-20">
        <Container className="grid gap-4 md:grid-cols-2">
          <HackCard tone="brand" className="flex flex-col gap-4">
            <CardTitle as="h2" className="text-xl">
              One Sealed Envelope
            </CardTitle>
            <CardBody className="max-w-md">
              Every team opens its own problem at 9:20 AM — a different real-world brief for each of
              the {EVENT.maxTeams} teams, so nothing can be copied.
            </CardBody>
            <VisualWell>
              <PanelStack />
            </VisualWell>
          </HackCard>

          <HackCard className="flex flex-col gap-4">
            <CardTitle as="h2" className="text-xl">
              The Arc of the Day
            </CardTitle>
            <CardBody className="max-w-md">
              Plan, three build sprints, a surprise task, then final polish — one continuous push
              from 8:30 AM to code freeze at 2:15.
            </CardBody>
            <VisualWell>
              <CurveChart badge="2:15 PM" caption="The build day, start to freeze" />
            </VisualWell>
          </HackCard>

          <HackCard className="flex flex-col gap-4">
            <CardTitle as="h2" className="text-xl">
              Two Tracks at Once
            </CardTitle>
            <CardBody className="max-w-md">
              While three members keep building, your two quiz reps step out for their rounds and
              rejoin. Nobody sits idle.
            </CardBody>
            <VisualWell>
              <DayGrid />
            </VisualWell>
          </HackCard>

          <HackCard tone="brand" className="flex flex-col gap-4">
            <CardTitle as="h2" className="text-xl">
              Five Roles, One Team
            </CardTitle>
            <CardBody className="max-w-md">
              Captain, frontend, backend, UI/UX and docs. Every role is owned by someone — and
              everyone understands the whole project.
            </CardBody>
            <VisualWell pad={false} className="px-4 pt-2">
              <TeamOrbit />
            </VisualWell>
          </HackCard>
        </Container>
      </section>

      {/* ═══════════════════════ PILLARS ═══════════════════════ */}
      <section className="border-t border-white/[0.06] py-16 md:py-20">
        <Container className="flex flex-col gap-10">
          <SectionHead
            section="Section 01 / The Idea"
            eyebrow="Overview & philosophy"
            icon="target"
            title="Not the Most Code."
            accent="The Best Solution."
            lead="Infinium simulates a real software sprint: analyse a problem, plan an approach, build a working product, and defend every decision. It rewards engineering judgement — planning, adaptability, teamwork and delivery — over raw output."
          />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {PILLARS.map((p) => (
              <FeatureCard key={p.n} n={p.n} icon={p.icon} title={p.title} desc={p.desc} />
            ))}
          </div>
        </Container>
      </section>

      {/* ═══════════════════════ FORMAT ═══════════════════════ */}
      <section className="border-t border-white/[0.06] py-16 md:py-20">
        <Container className="flex flex-col gap-10">
          <SectionHead
            section="Section 02 / Format"
            eyebrow="How it works"
            icon="mail"
            title="One Day. One Envelope."
            accent="No Internet."
            lead="Infinium runs start to finish in a single day. A short briefing a day or two earlier covers the rules and lets you form your team — but the problems stay sealed. On event morning every team opens its own envelope and builds from scratch, entirely offline. Every team's problem is different."
          />

          <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
            <HackCard tone="brand" className="flex flex-col gap-5">
              <IconTile name="mail" tone="brand" className="h-11 w-11" />
              <CardTitle as="h3" className="text-2xl leading-tight tracking-tight">
                Inside Your
                <br />
                Problem Brief
              </CardTitle>
              <ol className="flex flex-col gap-3">
                {ENVELOPE_CONTENTS.map((item, i) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="mt-0.5 font-mono text-[11px] text-brand-400">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="text-[13.5px] leading-relaxed text-zinc-300">{item}</span>
                  </li>
                ))}
              </ol>
            </HackCard>

            <div className="flex flex-col gap-3">
              {HOW_IT_WORKS.map((s, i) => (
                <div key={s.step} className="flex flex-col gap-3">
                  <HackCard tone={i === 2 ? "brand" : "default"} className="flex items-start gap-4">
                    <IconTile name={s.icon} tone={i === 2 ? "brand" : "default"} />
                    <div className="flex flex-col gap-1">
                      <Eyebrow tone={i === 2 ? "brand" : "default"}>
                        {s.step} — {s.kicker}
                      </Eyebrow>
                      <CardTitle>{s.title}</CardTitle>
                      <CardBody>{s.desc}</CardBody>
                    </div>
                  </HackCard>
                  {i < HOW_IT_WORKS.length - 1 && (
                    <span className="mx-auto text-zinc-700" aria-hidden>
                      ↓
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </Container>
      </section>

      {/* ═══════════════════════ ROLES ═══════════════════════ */}
      <section className="border-t border-white/[0.06] py-16 md:py-20">
        <Container className="flex flex-col gap-10">
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
          <HackCard tone="amber" className="flex items-start gap-4">
            <IconTile name="message" tone="amber" />
            <CardBody className="text-zinc-300">
              Before the event, also pick{" "}
              <strong className="font-medium text-white">2 Quiz Representatives</strong> from these
              five members — they play the Quiz on Hack Day while the other three keep building.
            </CardBody>
          </HackCard>
        </Container>
      </section>

      {/* ═══════════════════════ FLOW ═══════════════════════ */}
      <section className="border-t border-white/[0.06] py-16 md:py-20">
        <Container className="flex flex-col gap-10">
          <SectionHead
            section="Section 04 / The Flow"
            eyebrow="The event flow"
            icon="clock"
            title="One Day,"
            accent="Start to Finish."
            lead="Doors at 8:30 AM, closing ceremony by 3:00 PM. Envelopes open at 9:20. The 2 Quiz Reps step out for their rounds while the other 3 keep building, then rejoin. Nobody sits idle, and nothing carries over to a second day."
          />

          <HackCard bare className="p-6 sm:p-8">
            <ol className="flex flex-col">
              {FLOW_PREVIEW.map((s, i) => (
                <li key={s.title} className="relative flex gap-5 pb-7 last:pb-0">
                  {i < FLOW_PREVIEW.length - 1 && (
                    <span className="absolute left-[70px] top-8 h-[calc(100%-20px)] w-px bg-white/[0.08]" />
                  )}
                  <span className="w-14 shrink-0 pt-1.5 text-right font-mono text-[11px] text-zinc-500">
                    {s.time}
                  </span>
                  <span className="relative z-10 mt-1.5 flex h-3 w-3 shrink-0 items-center justify-center rounded-full border-2 border-brand-400 bg-[#0d0d11]" />
                  <div className="min-w-0 flex-1">
                    <h3 className="text-[15px] font-semibold tracking-tight text-white">
                      {s.title}
                    </h3>
                    <p className="mt-0.5 text-[13px] leading-relaxed text-zinc-500">{s.desc}</p>
                  </div>
                </li>
              ))}
            </ol>
            <Link
              href="/hackathon/schedule"
              className="mt-2 inline-flex items-center gap-1.5 text-[13px] text-brand-300 transition-colors hover:text-brand-200"
            >
              Full one-day schedule <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </HackCard>
        </Container>
      </section>

      {/* ═══════════════════════ OFFLINE ═══════════════════════ */}
      <section className="border-t border-white/[0.06] py-16 md:py-20">
        <Container className="flex flex-col gap-10">
          <SectionHead
            section="Section 05 / Offline Rules"
            eyebrow="Tools, stack & the offline rule"
            icon="cpu"
            title="No Internet."
            accent="Just You and the Machine."
            lead="Infinium is fully offline. The labs have no internet access for the whole build — no AI assistants, no Stack Overflow, no package downloads, no cloud services. Your stack is whatever you brought and whatever is already installed. Come prepared."
          />

          <div className="flex flex-wrap gap-2">
            {STACK.map((s) => (
              <Chip key={s}>{s}</Chip>
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <HackCard tone="brand" className="flex flex-col gap-4">
              <IconTile name="box" tone="brand" className="h-11 w-11" />
              <div className="flex flex-col gap-1.5">
                <Eyebrow>{COME_PREPARED.kicker}</Eyebrow>
                <CardTitle as="h3" className="text-xl">
                  {COME_PREPARED.title}
                </CardTitle>
              </div>
              <CardBody>{COME_PREPARED.body}</CardBody>
              <div className="mt-auto flex flex-wrap gap-2 pt-2">
                {COME_PREPARED.chips.map((c) => (
                  <Chip key={c} tone="brand">
                    {c}
                  </Chip>
                ))}
              </div>
            </HackCard>

            <HackCard tone="danger" className="flex flex-col gap-4">
              <IconTile name="power" tone="danger" className="h-11 w-11" />
              <div className="flex flex-col gap-1.5">
                <Eyebrow tone="danger">{OFFLINE_RULE.kicker}</Eyebrow>
                <CardTitle as="h3" className="text-xl">
                  {OFFLINE_RULE.title}
                </CardTitle>
              </div>
              <CardBody>{OFFLINE_RULE.body}</CardBody>
              <div className="mt-auto grid grid-cols-3 gap-2 pt-2">
                {OFFLINE_RULE.points.map((p) => (
                  <div
                    key={p.label}
                    className="flex flex-col items-center gap-2 rounded-xl border border-red-400/15 bg-red-500/[0.06] px-2 py-3 text-center"
                  >
                    <Icon name={p.icon} className="h-4 w-4 text-red-300" />
                    <span className="text-[10.5px] leading-tight text-zinc-400">{p.label}</span>
                  </div>
                ))}
              </div>
            </HackCard>
          </div>
        </Container>
      </section>

      {/* ═══════════════════════ SURPRISE + PASSPORT ═══════════════════════ */}
      <section className="border-t border-white/[0.06] py-16 md:py-20">
        <Container className="flex flex-col gap-10">
          <SectionHead
            section="Section 06 / Adapt & Achieve"
            eyebrow="Surprise challenges & the developer passport"
            icon="shuffle"
            title="Adapt Fast."
            accent="Collect Achievements."
          />

          <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
            <div className="flex flex-col gap-4">
              <Eyebrow tone="amber">Surprise task — {SURPRISE_TASK.dropsAt}</Eyebrow>
              <CardBody className="text-[14px]">{SURPRISE_TASK.body}</CardBody>
              <ul className="flex flex-col gap-2">
                {SURPRISE_TASK.examples.map((e) => (
                  <li
                    key={e.label}
                    className="flex items-center gap-3 rounded-full border border-white/[0.07] bg-white/[0.02] px-4 py-2.5"
                  >
                    <Icon name={e.icon} className="h-4 w-4 text-brand-300" />
                    <span className="text-[13px] text-zinc-300">{e.label}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <Eyebrow>Developer passport · {ACHIEVEMENTS.length} cards</Eyebrow>
                <span className="text-[11px] text-zinc-500">
                  Up to {PASSPORT_MAX} pts across the day
                </span>
              </div>
              <CardBody className="text-[14px]">
                Earn achievement cards as you hit engineering milestones — all of them offline. Each
                is worth points added to your final score.
              </CardBody>
              <div className="grid gap-3 sm:grid-cols-2">
                {PASSPORT_PREVIEW.map((c) => (
                  <PassportCard key={c.code} card={c} />
                ))}
              </div>
              <Link
                href="/hackathon/passport"
                className="inline-flex items-center gap-1.5 text-[13px] text-brand-300 transition-colors hover:text-brand-200"
              >
                See all {ACHIEVEMENTS.length} cards <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </Container>
      </section>

      {/* ═══════════════════════ CTA ═══════════════════════ */}
      <section className="border-t border-white/[0.06] py-16 md:py-24">
        <Container>
          <HackCard tone="brand" bare className="relative overflow-hidden px-6 py-14 text-center">
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "radial-gradient(60% 120% at 50% 0%, rgba(139,92,246,0.18), transparent 70%)",
              }}
            />
            <div className="relative flex flex-col items-center gap-5">
              <h2 className="max-w-2xl text-balance text-3xl font-semibold tracking-tighter text-white md:text-5xl">
                Come and build something <span className="text-brand-400">real</span>.
              </h2>
              <p className="max-w-lg text-[14.5px] text-zinc-400">
                {EVENT.maxTeams} places. {EVENT.dateLabel}. One sealed envelope each.
              </p>
              <ul className="flex flex-col items-start gap-1.5 text-left">
                <CheckRow>Bring your own laptop or use a lab PC</CheckRow>
                <CheckRow>Install everything you need beforehand</CheckRow>
                <CheckRow>Pick your five roles and two quiz reps</CheckRow>
              </ul>
              <div className="mt-1 flex items-center gap-2 text-[13px] text-zinc-500">
                <Icon name="pin" className="h-4 w-4" /> {EVENT.venue}
              </div>
              <Link
                href="/hackathon/register"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-medium text-black transition-opacity hover:opacity-90"
              >
                Register your team <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
          </HackCard>
        </Container>
      </section>
    </>
  );
}
