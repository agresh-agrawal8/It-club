import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  ArrowUpRight,
  Code2,
  Smartphone,
  BrainCircuit,
  Cpu,
  ShieldCheck,
  Binary,
  CalendarDays,
} from "lucide-react";
import { Container } from "@/components/ui/container";
import { ButtonLink } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { LightBeams } from "@/components/landing/light-beams";
import { Faq } from "@/components/landing/faq";
import { Testimonials } from "@/components/landing/testimonials";
import { IdeaForm } from "@/components/landing/idea-form";
import { ProjectCard } from "@/components/features/project-card";
import { EventCard } from "@/components/features/event-card";
import {
  getFeaturedProjects,
  getUpcomingEvents,
  getAchievements,
  getPlatformStats,
  getHomepageContent,
  getTeam,
} from "@/lib/data";
import { roleLabel } from "@/lib/utils";

const SERVICES = [
  { icon: Code2, title: "Web Development", desc: "Modern, responsive web apps built with React and Next.js." },
  { icon: Smartphone, title: "App Development", desc: "Android and cross-platform apps that solve real problems." },
  { icon: BrainCircuit, title: "AI & Machine Learning", desc: "Models, agents and data projects that actually ship." },
  { icon: Cpu, title: "Robotics & IoT", desc: "Microcontrollers, sensors and automation you can hold." },
  { icon: ShieldCheck, title: "Cybersecurity", desc: "CTFs, ethical hacking and secure-by-default thinking." },
  { icon: Binary, title: "Competitive Programming", desc: "Algorithms, data structures and olympiad training." },
];

const FAQS = [
  {
    q: "How do I join Avinya?",
    a: "Membership is open to all EHIS students. Reach out through the form below or talk to any core team member — we'll set up your member account and you can start publishing projects right away.",
  },
  {
    q: "Do I need to already know how to code?",
    a: "Not at all. We have members at every level, from complete beginners to students shipping full-stack apps. Sessions and mentoring are built around wherever you're starting.",
  },
  {
    q: "What kind of projects can I build?",
    a: "Anything you're curious about — web apps, games, robotics, AI experiments, security tools. Your projects are yours; you publish them to the showcase without waiting for approval.",
  },
  {
    q: "How often does the club meet?",
    a: "We run regular workshops, hack nights and build sessions through the term. Everything upcoming is listed on the Events page and your member calendar.",
  },
  {
    q: "Can I compete in hackathons through the club?",
    a: "Yes. We enter inter-school hackathons, olympiads and online contests as a team, and the club supports you with practice, mentoring and logistics.",
  },
];

const TESTIMONIALS = [
  {
    quote:
      "Joining Avinya completely changed how I think about building things. I went from writing my first HTML page to shipping a full project that people actually use — with seniors who genuinely wanted to help.",
    name: "Club Member",
    role: "Grade 11",
  },
  {
    quote:
      "The best part is nobody gatekeeps here. You have an idea, you build it, you put it on the site. That freedom is why our members keep coming back and keep shipping.",
    name: "Core Team",
    role: "Avinya",
  },
];

export default async function HomePage() {
  const [projects, events, achievements, stats, content, team] = await Promise.all([
    getFeaturedProjects(3),
    getUpcomingEvents(3),
    getAchievements(),
    getPlatformStats(),
    getHomepageContent(),
    getTeam(),
  ]);

  const lead = team.find((m) => m.role === "super_admin") ?? team[0];

  return (
    <>
      {/* ═══ HERO ═══ */}
      <section className="relative overflow-hidden">
        <LightBeams />
        <div className="dot-grid pointer-events-none absolute inset-0 opacity-[0.35] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,black,transparent)]" />

        <Container className="relative flex flex-col items-center gap-7 pb-16 pt-24 text-center md:pt-32">
          <Badge variant="accent" className="animate-fade-in rounded-full">
            {content.hero_eyebrow ?? "Avinya · Emerald Heights International School"}
          </Badge>

          <h1 className="animate-fade-up max-w-4xl text-balance text-4xl font-semibold leading-[1.06] tracking-tighter text-white sm:text-5xl lg:text-6xl xl:text-7xl">
            {content.hero_title ?? "Where ideas compile into reality"}
          </h1>

          <p className="max-w-2xl animate-fade-up text-balance text-base leading-relaxed text-zinc-400">
            {content.hero_subtitle ??
              "Avinya is the official IT & AI Club of Emerald Heights — projects, events, competitions and a community of student makers."}
          </p>

          <ButtonLink
            href={content.primary_cta_href ?? "/projects"}
            variant="brand"
            className="animate-fade-up rounded-full"
          >
            {content.primary_cta_label ?? "Explore projects"}
            <ArrowUpRight className="h-4 w-4" />
          </ButtonLink>
        </Container>

        {/* Showcase row — three project previews, centre one raised */}
        <Container className="relative pb-24">
          {projects.length > 0 ? (
            <div className="grid items-center gap-5 md:grid-cols-3">
              {projects.map((p, i) => (
                <div
                  key={p.id}
                  className={i === 1 ? "md:-translate-y-6 md:scale-[1.04]" : "md:opacity-90"}
                >
                  <ProjectCard project={p} />
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<Code2 className="h-6 w-6" />}
              title="The showcase is warming up"
              description="Member projects will appear here as soon as they're published."
            />
          )}
        </Container>
      </section>

      {/* ═══ MANIFESTO + STATS ═══ */}
      <section className="border-t border-white/[0.07] py-24">
        <Container className="grid gap-16 lg:grid-cols-[1.35fr_1fr]">
          <div className="flex flex-col items-start gap-10">
            <p className="text-balance text-2xl font-medium leading-[1.35] tracking-tight text-white md:text-[2rem]">
              Technology isn&apos;t just about code — it&apos;s about building things that solve
              real problems, teach you something new, and outlast the term they were made in.
            </p>
            {lead && (
              <div className="flex items-center gap-3 rounded-full border border-white/10 py-2 pl-2 pr-5">
                <Avatar name={lead.full_name || "Core team"} src={lead.avatar_url} size="md" />
                <div>
                  <div className="text-[11px] text-zinc-500">{roleLabel(lead.role)}</div>
                  <div className="text-sm font-medium text-white">{lead.full_name}</div>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col justify-center gap-10">
            {[
              { value: stats.members, label: "Club Members" },
              { value: stats.projects, label: "Projects Shipped" },
              { value: stats.events + stats.competitions, label: "Events & Competitions" },
            ].map((s) => (
              <div key={s.label}>
                <div className="text-5xl font-semibold tracking-tighter text-white md:text-6xl">
                  {s.value}
                  <span className="text-brand-400">+</span>
                </div>
                <div className="mt-1 text-sm text-zinc-500">{s.label}</div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* ═══ WHAT WE DO ═══ */}
      <section className="py-24">
        <Container className="flex flex-col items-center gap-14">
          <div className="flex max-w-2xl flex-col items-center gap-4 text-center">
            <h2 className="text-balance text-4xl font-semibold tracking-tighter text-white md:text-5xl">
              What We Do
            </h2>
            <p className="text-balance text-zinc-400">
              Six tracks members explore — pick one, mix several, or invent your own.
            </p>
          </div>

          <div className="grid w-full gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {SERVICES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="glass glass-hover relative overflow-hidden rounded-3xl p-7">
                <div
                  className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full opacity-60"
                  style={{
                    background:
                      "radial-gradient(closest-side, color-mix(in oklab, var(--color-brand-500) 30%, transparent), transparent)",
                    filter: "blur(24px)",
                  }}
                />
                <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-brand-500/15 text-brand-300">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="relative mt-14 text-lg font-semibold tracking-tight text-white">
                  {title}
                </h3>
                <p className="relative mt-2 text-sm leading-relaxed text-zinc-400">{desc}</p>
              </div>
            ))}
          </div>

          <ButtonLink href="/projects" variant="secondary" className="rounded-full">
            View more projects <ArrowUpRight className="h-4 w-4" />
          </ButtonLink>
        </Container>
      </section>

      {/* ═══ UPCOMING EVENTS ═══ */}
      {events.length > 0 && (
        <section className="py-16">
          <Container className="flex flex-col gap-10">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div>
                <span className="eyebrow text-brand-300">What&apos;s next</span>
                <h2 className="mt-3 text-4xl font-semibold tracking-tighter text-white md:text-5xl">
                  Upcoming events
                </h2>
              </div>
              <Link
                href="/events"
                className="flex items-center gap-1.5 text-sm text-zinc-400 transition-colors hover:text-white"
              >
                All events <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {events.map((e) => (
                <EventCard key={e.id} event={e} />
              ))}
            </div>
          </Container>
        </section>
      )}

      {/* ═══ FAQ ═══ */}
      <section className="relative overflow-hidden py-24">
        <div
          className="pointer-events-none absolute -left-40 top-1/4 h-[420px] w-[420px] rounded-full opacity-40"
          style={{
            background:
              "radial-gradient(closest-side, color-mix(in oklab, var(--color-brand-600) 40%, transparent), transparent)",
            filter: "blur(90px)",
          }}
        />
        <Container className="relative grid gap-14 lg:grid-cols-[1fr_1.25fr]">
          <div className="flex flex-col gap-6">
            <h2 className="text-balance text-4xl font-semibold tracking-tighter text-white md:text-5xl">
              Got questions? We&apos;ve got answers.
            </h2>
            <p className="max-w-sm text-sm leading-relaxed text-zinc-400">
              Everything students usually ask before joining Avinya — how it works, what you&apos;ll
              build, and how to get started.
            </p>
            <ButtonLink href="/contact" variant="brand" size="sm" className="w-fit rounded-full">
              Get started <ArrowUpRight className="h-4 w-4" />
            </ButtonLink>
          </div>
          <Faq items={FAQS} />
        </Container>
      </section>

      {/* ═══ TESTIMONIALS ═══ */}
      <section className="py-16">
        <Container className="flex flex-col items-center gap-12">
          <h2 className="text-balance text-center text-4xl font-semibold tracking-tighter text-white md:text-5xl">
            What our members say
          </h2>
          <div className="w-full max-w-4xl">
            <Testimonials
              items={TESTIMONIALS}
              reviewCount={`${stats.members} member${stats.members === 1 ? "" : "s"} and growing`}
            />
          </div>
        </Container>
      </section>

      {/* ═══ GOT AN IDEA — enquiry form ═══ */}
      <section className="py-24">
        <Container className="grid gap-14 lg:grid-cols-[1fr_1.1fr]">
          <div className="flex flex-col gap-6">
            <h2 className="text-balance text-4xl font-semibold tracking-tighter text-white md:text-5xl">
              Got a great idea?
            </h2>
            <p className="max-w-md text-sm leading-relaxed text-zinc-400">
              Share it with us and let&apos;s turn it into something real. Whether you want to join,
              collaborate or run a workshop — we&apos;d love to hear from you.
            </p>

            {achievements.length > 0 && (
              <div className="mt-2 flex flex-col gap-3">
                <span className="eyebrow text-zinc-600">Recent wins</span>
                {achievements.slice(0, 3).map((a) => (
                  <div
                    key={a.id}
                    className="glass flex items-center gap-3 rounded-2xl px-4 py-3"
                  >
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand-400" />
                    <span className="truncate text-sm text-zinc-300">{a.title}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="glass-deep rounded-3xl p-7 md:p-9">
            <IdeaForm />
          </div>
        </Container>
      </section>
    </>
  );
}
