import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Code2,
  CalendarDays,
  Sparkles,
  Users,
} from "lucide-react";
import { Container } from "@/components/ui/container";
import { ButtonLink } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SectionHeading } from "@/components/ui/section-heading";
import { EmptyState } from "@/components/ui/empty-state";
import { Avatar } from "@/components/ui/avatar";
import { ProjectCard } from "@/components/features/project-card";
import { EventCard } from "@/components/features/event-card";
import { AchievementCard } from "@/components/features/achievement-card";
import { HeroVisual } from "@/components/features/hero-visual";
import {
  getFeaturedProjects,
  getUpcomingEvents,
  getAchievements,
  getPlatformStats,
  getHomepageContent,
  getTeam,
} from "@/lib/data";

const FOCUS_AREAS = [
  "Web Development",
  "App Development",
  "AI & Machine Learning",
  "Robotics",
  "Game Development",
  "Cybersecurity",
  "UI / UX Design",
  "Competitive Programming",
];

export default async function HomePage() {
  const [projects, events, achievements, stats, content, team] = await Promise.all([
    getFeaturedProjects(6),
    getUpcomingEvents(3),
    getAchievements(),
    getPlatformStats(),
    getHomepageContent(),
    getTeam(),
  ]);

  const statItems = [
    { value: plus(stats.members), label: "student members", sub: "building together" },
    { value: plus(stats.projects), label: "projects shipped", sub: "by our members" },
    { value: plus(stats.events), label: "events hosted", sub: "workshops & hack nights" },
    { value: plus(stats.achievements), label: "achievements won", sub: "and counting" },
  ];

  return (
    <>
      {/* ══ Hero — rounded glass card on dark, FitPRO-style ══ */}
      <Container className="pt-6">
        <section className="glass relative overflow-hidden rounded-3xl">
          <div className="glow-violet pointer-events-none absolute inset-0" />

          <div className="relative grid items-center gap-10 p-8 md:grid-cols-[1.05fr_1fr] md:p-14 lg:p-16">
            {/* Copy */}
            <div className="flex flex-col items-start gap-7">
              <Badge variant="accent" className="animate-fade-in">
                <Sparkles className="mr-1.5 h-3 w-3" />
                {content.hero_eyebrow ?? "Emerald Heights International School"}
              </Badge>

              <h1 className="animate-fade-up text-4xl font-semibold leading-[1.04] tracking-tighter text-white sm:text-5xl lg:text-6xl xl:text-7xl">
                {content.hero_title ?? "Where student technologists build the future"}
              </h1>

              <p className="max-w-xl animate-fade-up text-base leading-relaxed text-zinc-300 md:text-lg">
                {content.hero_subtitle ??
                  "The official IT Club — projects, events, competitions and a community of makers."}
              </p>

              <div className="flex animate-fade-up flex-col gap-3 sm:flex-row">
                <ButtonLink href={content.primary_cta_href ?? "/projects"} size="lg">
                  {content.primary_cta_label ?? "Explore projects"}
                  <ArrowRight className="h-4 w-4" />
                </ButtonLink>
                <ButtonLink
                  href={content.secondary_cta_href ?? "/team"}
                  variant="secondary"
                  size="lg"
                >
                  {content.secondary_cta_label ?? "Meet the team"}
                </ButtonLink>
              </div>
            </div>

            {/* Artwork */}
            <div className="animate-scale-in">
              <HeroVisual />
            </div>
          </div>
        </section>
      </Container>

      {/* ══ Stats strip — bold numbers with dividers ══ */}
      <Container>
        <section className="grid grid-cols-2 gap-y-12 py-16 md:grid-cols-4 md:py-20">
          {statItems.map((s, i) => (
            <div
              key={s.label}
              className={`flex flex-col items-center gap-1.5 px-6 text-center ${
                i > 0 ? "md:border-l md:border-white/10" : ""
              } ${i % 2 === 1 ? "border-l border-white/10 md:border-l" : ""}`}
            >
              <span className="text-5xl font-bold tracking-tighter text-white md:text-6xl">
                {s.value}
              </span>
              <span className="text-sm text-zinc-300">{s.label}</span>
              <span className="text-xs text-zinc-500">{s.sub}</span>
            </div>
          ))}
        </section>
      </Container>

      {/* ══ Focus areas — muted "logo strip" treatment ══ */}
      <section className="border-y border-white/10 bg-zinc-950/60 py-10">
        <Container>
          <p className="mb-6 text-center text-xs font-medium uppercase tracking-[2px] text-zinc-500">
            What we explore
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
            {FOCUS_AREAS.map((area) => (
              <span
                key={area}
                className="text-sm font-semibold tracking-tight text-zinc-500 transition-colors hover:text-brand-300"
              >
                {area}
              </span>
            ))}
          </div>
        </Container>
      </section>

      {/* ══ Featured projects ══ */}
      <section className="py-24">
        <Container className="flex flex-col gap-12">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <SectionHeading
              eyebrow="Our work"
              title="Featured projects"
              description="A glimpse of what our members are building — from web apps to robotics."
            />
            <ButtonLink href="/projects" variant="link">
              View all projects <ArrowRight className="h-4 w-4" />
            </ButtonLink>
          </div>
          {projects.length ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {projects.map((p) => (
                <ProjectCard key={p.id} project={p} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<Code2 className="h-6 w-6" />}
              title="No projects yet"
              description="Once members start publishing projects, they'll shine here."
            />
          )}
        </Container>
      </section>

      {/* ══ Upcoming events ══ */}
      <section className="py-8">
        <Container className="flex flex-col gap-12">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <SectionHeading
              eyebrow="What's next"
              title="Upcoming events"
              description="Workshops, talks and hack nights you won't want to miss."
            />
            <ButtonLink href="/events" variant="link">
              All events <ArrowRight className="h-4 w-4" />
            </ButtonLink>
          </div>
          {events.length ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {events.map((e) => (
                <EventCard key={e.id} event={e} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<CalendarDays className="h-6 w-6" />}
              title="No upcoming events"
              description="Check back soon — new events are added regularly."
            />
          )}
        </Container>
      </section>

      {/* ══ Meet the team — horizontal scroll row ══ */}
      {team.length > 0 && (
        <section className="py-24">
          <Container className="flex flex-col gap-12">
            <SectionHeading
              eyebrow="People"
              title="Meet the team"
              description="The students leading and building the IT Club."
              align="center"
              className="items-center"
            />
            <div className="-mx-6 overflow-x-auto px-6 pb-4 md:-mx-10 md:px-10">
              <div className="flex w-max gap-5">
                {team.slice(0, 10).map((m) => (
                  <Link key={m.id} href="/team" className="group w-52 shrink-0">
                    <div className="glass flex flex-col items-center gap-4 rounded-3xl p-6 text-center transition-transform duration-300 ease-out group-hover:-translate-y-2">
                      <Avatar name={m.full_name || "Member"} src={m.avatar_url} size="xl" />
                      <div>
                        <div className="text-sm font-semibold text-white">
                          {m.full_name || "Member"}
                        </div>
                        <div className="mt-0.5 text-xs text-zinc-400">
                          {m.headline ?? (m.role === "admin" ? "Core team" : "Member")}
                        </div>
                      </div>
                      {m.role === "admin" && <Badge variant="accent">Core</Badge>}
                    </div>
                  </Link>
                ))}
                <Link href="/team" className="group flex w-52 shrink-0">
                  <div className="flex w-full flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-white/15 p-6 text-center transition-colors group-hover:border-brand-400/50">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-500/15 text-brand-300">
                      <Users className="h-5 w-5" />
                    </div>
                    <span className="flex items-center gap-1 text-sm text-zinc-300">
                      View everyone <ArrowUpRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </Link>
              </div>
            </div>
          </Container>
        </section>
      )}

      {/* ══ Achievements ══ */}
      {achievements.length > 0 && (
        <section className="py-8">
          <Container className="flex flex-col gap-12">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <SectionHeading
                eyebrow="Recognition"
                title="Recent achievements"
                description="Awards, placements and milestones we're proud of."
              />
              <ButtonLink href="/achievements" variant="link">
                All achievements <ArrowRight className="h-4 w-4" />
              </ButtonLink>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              {achievements.slice(0, 4).map((a) => (
                <AchievementCard key={a.id} achievement={a} />
              ))}
            </div>
          </Container>
        </section>
      )}

      {/* ══ Closing CTA ══ */}
      <section className="py-24">
        <Container>
          <div className="glass relative overflow-hidden rounded-3xl px-8 py-20 text-center">
            <div className="glow-violet pointer-events-none absolute inset-0" />
            <div className="relative flex flex-col items-center gap-6">
              <h2 className="max-w-2xl text-3xl font-semibold tracking-tighter text-white md:text-5xl">
                Have a question or want to collaborate?
              </h2>
              <p className="max-w-xl text-zinc-300">
                Reach out to the core team, or subscribe to stay updated on everything the IT Club
                is doing.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <ButtonLink href="/contact" size="lg">
                  Contact the club <ArrowRight className="h-4 w-4" />
                </ButtonLink>
                <ButtonLink href="/gallery" variant="secondary" size="lg">
                  See the gallery
                </ButtonLink>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}

/** "12" → "+12" like the reference stats; zero stays plain. */
function plus(n: number) {
  return n > 0 ? `+${n}` : `${n}`;
}
