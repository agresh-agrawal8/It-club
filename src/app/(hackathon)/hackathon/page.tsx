import Link from "next/link";
import {
  ArrowUpRight,
  Trophy,
  Users,
  Rocket,
  MapPin,
  Sparkles,
  Calendar,
  FileText,
  ShieldQuestion,
} from "lucide-react";
import { Container } from "@/components/ui/container";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Countdown } from "@/components/hackathon/countdown";
import { getHackEvent, getProblems, getSchedule, getHackStats } from "@/lib/hackathon/data";
import { formatDate, formatTime } from "@/lib/utils";

const kindColor: Record<string, string> = {
  ceremony: "text-brand-300",
  session: "text-accent-400",
  deadline: "text-red-300",
  break: "text-amber-300",
  challenge: "text-fuchsia-300",
};

export default async function HackathonHome() {
  const [event, problems, schedule, stats] = await Promise.all([
    getHackEvent(),
    getProblems(),
    getSchedule(),
    getHackStats(),
  ]);

  const releasedProblems = problems.filter((p: any) => p.released);
  const startsAt = event.starts_at || "2026-08-29T09:00:00+05:30";

  return (
    <>
      {/* ═══ HERO ═══ */}
      <section className="relative overflow-hidden">
        <div className="glow-duo pointer-events-none absolute inset-0" />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
            backgroundSize: "48px 48px",
            maskImage: "radial-gradient(ellipse 70% 60% at 50% 0%, black, transparent)",
            WebkitMaskImage: "radial-gradient(ellipse 70% 60% at 50% 0%, black, transparent)",
          }}
        />

        <Container className="relative flex flex-col items-center gap-8 pb-16 pt-20 text-center md:pt-28">
          <Badge variant="accent" className="animate-fade-in rounded-full">
            <Sparkles className="mr-1.5 h-3 w-3" />
            {event.edition || "Season 01"} · {event.venue || "Emerald Heights, Indore"}
          </Badge>

          <h1 className="animate-fade-up max-w-4xl text-balance text-5xl font-semibold leading-[1.02] tracking-tighter text-white sm:text-6xl lg:text-7xl">
            {event.name || "Infinium Hackathon"}
          </h1>

          <p className="max-w-2xl animate-fade-up text-balance text-lg text-zinc-300">
            {event.tagline || "36 hours. One idea. Infinite outcomes."}
          </p>

          <Countdown target={startsAt} label="Kicks off in" className="animate-fade-up items-center" />

          <div className="flex animate-fade-up flex-col gap-3 sm:flex-row">
            <ButtonLink href="/hackathon/register" variant="brand" size="lg" className="rounded-full">
              Register your team <ArrowUpRight className="h-4 w-4" />
            </ButtonLink>
            <ButtonLink href="/hackathon/problems" variant="secondary" size="lg" className="rounded-full">
              View problem statements
            </ButtonLink>
          </div>

          {/* Stat strip */}
          <div className="mt-6 grid w-full max-w-3xl grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { icon: Users, value: stats.participants, label: "Hackers" },
              { icon: Rocket, value: stats.teams, label: "Teams" },
              { icon: FileText, value: releasedProblems.length, label: "Tracks live" },
              { icon: Trophy, value: event.prize_pool || "₹1L", label: "Prize pool" },
            ].map(({ icon: Icon, value, label }) => (
              <div key={label} className="glass flex flex-col items-center gap-1 rounded-2xl px-4 py-5">
                <Icon className="h-4 w-4 text-brand-300" />
                <span className="text-2xl font-semibold tracking-tighter text-white">{value}</span>
                <span className="text-[11px] uppercase tracking-wide text-zinc-500">{label}</span>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* ═══ TRACKS ═══ */}
      <section className="py-20">
        <Container className="flex flex-col gap-10">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <span className="eyebrow text-accent-400">Choose your battle</span>
              <h2 className="mt-3 text-4xl font-semibold tracking-tighter text-white md:text-5xl">
                Problem tracks
              </h2>
            </div>
            <ButtonLink href="/hackathon/problems" variant="link">
              All problems <ArrowUpRight className="h-4 w-4" />
            </ButtonLink>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {problems.map((p: any) => (
              <Card key={p.id} hoverLift className="flex h-full flex-col gap-3 p-6">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-accent-400">{p.code}</span>
                  {p.released ? (
                    <Badge variant="success">Live</Badge>
                  ) : (
                    <Badge variant="warning">Locked</Badge>
                  )}
                </div>
                <h3 className="text-lg font-semibold tracking-tight text-white">{p.title}</h3>
                {p.track && <span className="text-xs text-brand-300">{p.track}</span>}
                <p className="line-clamp-3 text-sm leading-relaxed text-zinc-400">{p.summary}</p>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      {/* ═══ HOW IT WORKS ═══ */}
      <section className="border-y border-white/[0.07] py-20">
        <Container className="grid gap-6 md:grid-cols-3">
          {[
            { icon: Users, title: "Form a team", desc: "Rally 2–5 hackers, pick a captain, and lock in your problem track." },
            { icon: Rocket, title: "Build & submit", desc: "36 hours to ship. Link your repo, demo and deck in the submission portal." },
            { icon: Trophy, title: "Climb the board", desc: "Judges score live. Unlock passport achievements and chase the top spot." },
          ].map(({ icon: Icon, title, desc }, i) => (
            <div key={title} className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500/15 text-brand-300">
                  <Icon className="h-4 w-4" />
                </span>
                <span className="font-mono text-xs text-zinc-600">0{i + 1}</span>
              </div>
              <h3 className="text-lg font-semibold tracking-tight text-white">{title}</h3>
              <p className="text-sm leading-relaxed text-zinc-400">{desc}</p>
            </div>
          ))}
        </Container>
      </section>

      {/* ═══ SCHEDULE PREVIEW + BLACKOUT ═══ */}
      <section className="py-20">
        <Container className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
          <Card className="p-6 md:p-8">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight text-white">
                <Calendar className="h-5 w-5 text-brand-300" /> Event flow
              </h2>
              <ButtonLink href="/hackathon/schedule" variant="link">
                Full schedule <ArrowUpRight className="h-4 w-4" />
              </ButtonLink>
            </div>
            <ul className="relative flex flex-col">
              {schedule.slice(0, 5).map((s: any, i: number) => (
                <li key={s.id} className="relative flex gap-4 pb-6 last:pb-0">
                  {i < Math.min(schedule.length, 5) - 1 && (
                    <span className="absolute left-[15px] top-9 h-[calc(100%-28px)] w-px border-l border-dashed border-white/15" />
                  )}
                  <span
                    className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-zinc-900 ${kindColor[s.kind] ?? "text-brand-300"}`}
                  >
                    <span className="h-2 w-2 rounded-full bg-current" />
                  </span>
                  <div className="min-w-0 flex-1 pt-0.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium text-white">{s.title}</span>
                      <span className={`text-[10px] uppercase tracking-wide ${kindColor[s.kind] ?? "text-zinc-500"}`}>
                        {s.kind}
                      </span>
                    </div>
                    <div className="mt-0.5 text-[11px] text-zinc-500">
                      {formatDate(s.starts_at)} · {formatTime(s.starts_at)}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </Card>

          {/* Operation Blackout teaser */}
          <Card deep className="relative flex flex-col justify-between gap-6 overflow-hidden p-6 md:p-8">
            <div className="glow-accent pointer-events-none absolute inset-0 opacity-60" />
            <div className="relative">
              <Badge variant="danger" className="mb-4">
                <ShieldQuestion className="mr-1.5 h-3 w-3" /> Classified
              </Badge>
              <h2 className="text-2xl font-semibold tracking-tighter text-white">Operation Blackout</h2>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                A surprise challenge drops mid-event. Teams that take it on earn bonus passport
                points. The clock is already ticking.
              </p>
            </div>
            <div className="relative">
              <Countdown
                target={event.blackout_at || "2026-08-29T23:00:00+05:30"}
                label="Unlocks in"
              />
              <ButtonLink href="/hackathon/blackout" variant="secondary" size="sm" className="mt-5 rounded-full">
                Enter the vault <ArrowUpRight className="h-4 w-4" />
              </ButtonLink>
            </div>
          </Card>
        </Container>
      </section>

      {/* ═══ CTA ═══ */}
      <section className="pb-24">
        <Container>
          <div className="glass-deep glow-duo relative overflow-hidden rounded-[28px] px-8 py-16 text-center md:py-20">
            <div className="relative flex flex-col items-center gap-6">
              <h2 className="max-w-2xl text-balance text-3xl font-semibold tracking-tighter text-white md:text-5xl">
                Ready to build something <span className="text-duo">infinite</span>?
              </h2>
              <p className="max-w-xl text-zinc-300">
                Enter the arena, assemble your team and put your idea on the board.
              </p>
              <div className="flex items-center gap-2 text-sm text-zinc-500">
                <MapPin className="h-4 w-4" /> {event.venue || "Emerald Heights International School, Indore"}
              </div>
              <ButtonLink href="/hackathon/register" variant="brand" size="lg" className="rounded-full">
                Register your team <ArrowUpRight className="h-4 w-4" />
              </ButtonLink>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
