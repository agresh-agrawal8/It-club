import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { Container } from "@/components/ui/container";
import { ButtonLink } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/section-heading";
import { EmptyState } from "@/components/ui/empty-state";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Hero } from "@/components/features/hero";
import { ProjectCard } from "@/components/features/project-card";
import { EventCard } from "@/components/features/event-card";
import { AchievementCard } from "@/components/features/achievement-card";
import {
  getFeaturedProjects,
  getUpcomingEvents,
  getAchievements,
  getPlatformStats,
  getHomepageContent,
  getTeam,
} from "@/lib/data";
import { roleLabel } from "@/lib/utils";

const FOCUS_AREAS = [
  { n: "01", label: "Web Development", note: "React, Next.js, full-stack apps" },
  { n: "02", label: "App Development", note: "Android, cross-platform, PWAs" },
  { n: "03", label: "AI & Machine Learning", note: "models, agents, data" },
  { n: "04", label: "Robotics & IoT", note: "microcontrollers, automation" },
  { n: "05", label: "Cybersecurity", note: "CTFs, ethical hacking" },
  { n: "06", label: "Competitive Programming", note: "algorithms, olympiads" },
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

  const heroStats = [
    { value: count(stats.members), label: "Members" },
    { value: count(stats.projects), label: "Projects" },
    { value: count(stats.events), label: "Events" },
    { value: count(stats.achievements), label: "Achievements" },
  ];

  return (
    <>
      <Hero
        eyebrow={content.hero_eyebrow ?? "Emerald Heights International School · IT Club"}
        title={content.hero_title ?? "Where ideas compile into reality"}
        subtitle={
          content.hero_subtitle ??
          "soch.exe is the student-run IT Club of Emerald Heights — a place to build real software, compete, and learn from people who ship."
        }
        primaryLabel={content.primary_cta_label ?? "Explore projects"}
        primaryHref={content.primary_cta_href ?? "/projects"}
        secondaryLabel={content.secondary_cta_label ?? "Meet the team"}
        secondaryHref={content.secondary_cta_href ?? "/team"}
        stats={heroStats}
      />

      {/* ── Intro statement ── */}
      <section className="py-24 md:py-32">
        <Container>
          <div className="grid gap-10 md:grid-cols-[0.9fr_1.1fr] md:gap-16">
            <p className="eyebrow text-zinc-500">What we do</p>
            <div className="flex flex-col gap-8">
              <p className="text-balance text-2xl font-medium leading-snug tracking-tight text-white md:text-3xl">
                We&rsquo;re a community of student engineers, designers and makers who turn
                curiosity into working products — then put them in front of real people.
              </p>
              <p className="max-w-xl leading-relaxed text-zinc-400">
                Members lead their own projects, present at club events, and compete in hackathons
                and olympiads. No gatekeeping, no busywork — just building. This site is where that
                work lives.
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* ── Focus areas — editorial index ── */}
      <section className="border-y border-white/10 bg-zinc-950/40">
        <Container className="py-6">
          <ul className="divide-y divide-white/[0.06]">
            {FOCUS_AREAS.map((area) => (
              <li
                key={area.n}
                className="group flex items-center gap-5 py-5 transition-colors md:gap-8"
              >
                <span className="font-mono text-xs text-zinc-600">{area.n}</span>
                <span className="flex-1 text-lg font-medium tracking-tight text-zinc-200 transition-colors group-hover:text-white md:text-xl">
                  {area.label}
                </span>
                <span className="hidden text-sm text-zinc-500 sm:block">{area.note}</span>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      {/* ── Featured projects ── */}
      <section className="py-24 md:py-28">
        <Container className="flex flex-col gap-14">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <SectionHeading eyebrow="Selected work" title="Projects" description="Built and maintained by our members — web, apps, AI and hardware." />
            <ButtonLink href="/projects" variant="secondary" size="sm">
              View all <ArrowRight className="h-4 w-4" />
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
              title="Projects are on the way"
              description="Members are just getting set up. Published projects will appear here."
            />
          )}
        </Container>
      </section>

      {/* ── Upcoming events ── */}
      <section className="pb-8">
        <Container className="flex flex-col gap-14">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <SectionHeading eyebrow="Calendar" title="Upcoming events" description="Workshops, talks and build nights — open to every member." />
            <ButtonLink href="/events" variant="secondary" size="sm">
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
              title="No events scheduled yet"
              description="New sessions are posted here as they're planned."
            />
          )}
        </Container>
      </section>

      {/* ── Team ── */}
      {team.length > 0 && (
        <section className="py-24 md:py-28">
          <Container className="flex flex-col gap-14">
            <SectionHeading eyebrow="The people" title="Core team & members" description="The students who run soch.exe and build in the open." />
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {team.slice(0, 8).map((m) => (
                <Link
                  key={m.id}
                  href="/team"
                  className="group flex flex-col gap-4 rounded-2xl border border-white/10 bg-zinc-900/60 p-6 transition-colors hover:border-white/20 hover:bg-zinc-900"
                >
                  <Avatar name={m.full_name || "Member"} src={m.avatar_url} size="lg" />
                  <div>
                    <div className="text-sm font-medium tracking-tight text-white">
                      {m.full_name || "Member"}
                    </div>
                    <div className="mt-0.5 text-xs text-zinc-500">
                      {m.headline ?? roleLabel(m.role)}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            <div>
              <ButtonLink href="/team" variant="secondary" size="sm">
                Meet everyone <ArrowUpRight className="h-4 w-4" />
              </ButtonLink>
            </div>
          </Container>
        </section>
      )}

      {/* ── Achievements ── */}
      {achievements.length > 0 && (
        <section className="pb-8">
          <Container className="flex flex-col gap-14">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <SectionHeading eyebrow="Recognition" title="Achievements" description="Placements, awards and milestones from our members." />
              <ButtonLink href="/achievements" variant="secondary" size="sm">
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

      {/* ── Closing CTA ── */}
      <section className="py-24 md:py-32">
        <Container>
          <div className="grain relative overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-br from-zinc-900 to-zinc-950 px-8 py-20 md:px-16 md:py-28">
            <div className="glow-violet pointer-events-none absolute inset-x-0 top-0 h-2/3 opacity-60" />
            <div className="relative flex max-w-2xl flex-col gap-6">
              <p className="eyebrow text-brand-300">Get in touch</p>
              <h2 className="text-balance text-3xl font-semibold tracking-tighter text-white md:text-5xl">
                Want to collaborate, sponsor, or just say hello?
              </h2>
              <p className="max-w-xl leading-relaxed text-zinc-400">
                Reach the core team directly, or subscribe to hear about new events and
                competitions first.
              </p>
              <div className="mt-2 flex flex-col gap-3 sm:flex-row">
                <ButtonLink href="/contact" size="lg">
                  Contact the club <ArrowRight className="h-4 w-4" />
                </ButtonLink>
                <ButtonLink href="/gallery" variant="secondary" size="lg">
                  View the gallery
                </ButtonLink>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}

/** Right-aligned zero-padded counts read as intentional in the mono stat bar. */
function count(n: number) {
  return n > 0 ? String(n).padStart(2, "0") : "00";
}
