import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Cpu,
  Code2,
  Palette,
  Rocket,
  Users,
} from "lucide-react";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { MeshCard } from "@/components/ui/mesh-card";
import { EmptyState } from "@/components/ui/empty-state";
import { EventCard } from "@/components/features/event-card";
import { RemoteImage } from "@/components/ui/remote-image";
import { getUpcomingEvents, getGallery, getTeam } from "@/lib/data";
import { SITE, absoluteUrl } from "@/lib/site";
import { isCoreTeam, initials } from "@/lib/utils";

export const metadata: Metadata = {
  // `absolute` opts out of the "%s · Avinya" template from the root layout,
  // which would otherwise render "Avinya — … · Avinya".
  title: { absolute: `${SITE.name} — ${SITE.tagline}` },
  description: SITE.description,
  alternates: { canonical: "/" },
};

/**
 * Public content changes when the core team publishes something, and the
 * mutating actions call revalidatePath() for exactly that. Between those
 * events this page is served from the cache instead of re-querying Postgres
 * on every visit — which is what makes navigation feel instant rather than
 * waiting on a round-trip per page.
 */
export const revalidate = 300;


/**
 * The homepage.
 *
 * Everything below renders from real rows. Where a table is empty the section
 * shows a designed empty state rather than sample content — an events strip
 * with three invented hackathons in it would be the most damaging thing on the
 * page, because a visitor cannot tell it is fake.
 *
 * This is a server component end to end; the only client JavaScript the page
 * ships is the navigation drawer and the subscribe form.
 */

/** Areas the club actually runs. Not aspirational filler. */
const DISCIPLINES = [
  {
    icon: Code2,
    title: "Software",
    body: "Web apps, tooling and automation — built properly, shipped, and then maintained.",
    accent: "violet",
    origin: "top-right",
  },
  {
    icon: Cpu,
    title: "Robotics & Hardware",
    body: "Microcontrollers, sensors and the unglamorous work of making them behave.",
    accent: "electric",
    origin: "top-left",
  },
  {
    icon: Rocket,
    title: "AI & Machine Learning",
    body: "Models applied to problems we actually have, not benchmarks we already know.",
    accent: "cyan",
    origin: "top-right",
  },
  {
    icon: Palette,
    title: "Design",
    body: "Interface and identity work, so what the club builds is worth looking at.",
    accent: "electric",
    origin: "top-right",
  },
  {
    icon: CalendarDays,
    title: "Hackathons",
    body: "We run Infinium and Code Red — build weekends with real deadlines and real judging.",
    accent: "violet",
    origin: "top-left",
  },
  {
    icon: Users,
    title: "Teaching",
    body: "Members run the sessions. Explaining a thing is how you find out you know it.",
    accent: "cyan",
    origin: "top-left",
  },
] as const;

export default async function HomePage() {
  // One parallel round of queries for the whole page.
  const [events, gallery, team] = await Promise.all([
    getUpcomingEvents(3),
    getGallery(),
    getTeam(),
  ]);

  const featuredGallery = gallery.slice(0, 6);
  const coreTeam = team.filter((m) => isCoreTeam(m.role));

  /**
   * Structured data. Describes the club as an organisation at a school, which
   * is what it is — no fabricated ratings, member counts or awards.
   */
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE.name,
    alternateName: `${SITE.name} IT & AI Club`,
    description: SITE.description,
    url: SITE.url,
    logo: absoluteUrl(SITE.ogImage),
    email: SITE.contact.email,
    parentOrganization: { "@type": "School", name: SITE.school },
    address: {
      "@type": "PostalAddress",
      addressLocality: SITE.city,
      addressRegion: SITE.region,
      addressCountry: SITE.country,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        // Serialised from an object literal we control — no user input reaches it.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* ── Hero ───────────────────────────────────────────────────────
          Full-bleed stage: the artwork spans the whole viewport, running
          edge to edge and up behind the transparent nav, rather than sitting
          inside a bordered card.

          Art direction is a real <picture> element — the phone downloads only
          the portrait crop and the desktop only the landscape one. Loading
          both and hiding one with CSS is the usual way this gets done, and it
          doubles the hero's weight on the device that can least afford it.

          The image is decorative, so alt is empty; the headline carries the
          meaning. fetchPriority="high" marks it as the LCP element. */}
      <section className="relative isolate -mt-[68px] w-full overflow-hidden">
        <picture>
          <source
            media="(max-width: 767px)"
            srcSet="/hero/hero-mobile.webp"
            width={1100}
            height={1353}
          />
          <img
            src="/hero/hero-desktop.webp"
            alt=""
            aria-hidden
            width={1448}
            height={1086}
            fetchPriority="high"
            decoding="async"
            className="hero-media hero-blend absolute inset-0 z-0 h-full w-full object-cover object-[70%_center] md:object-[76%_center]"
          />
        </picture>

        {/* Scrim. Reads bottom-up on phones, where the text sits under the
            figure, and left-to-right on desktop, where it sits beside it. */}
        <div
          className="hero-blend absolute inset-0 z-[1] bg-gradient-to-t from-[#0a0a0c] via-[#0a0a0c]/75 to-[#0a0a0c]/25 md:bg-gradient-to-r md:from-[#0a0a0c] md:via-[#0a0a0c]/75 md:to-transparent"
          aria-hidden
        />
        <div
          className="hero-blend pointer-events-none absolute inset-0 z-[1] bg-[radial-gradient(120%_95%_at_0%_45%,color-mix(in_oklab,var(--color-brand-600)_18%,transparent),transparent_64%)]"
          aria-hidden
        />
        <Container className="relative z-10">
          <div className="flex min-h-[38rem] flex-col justify-end pb-20 pt-40 md:min-h-[44rem] md:max-w-[58%] md:justify-center md:py-40 lg:min-h-[48rem]">
            <span className="hairline-gradient mb-7 inline-flex w-fit items-center gap-2.5 rounded-full bg-black/25 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-ink-2 backdrop-blur-sm">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full rounded-full bg-electric-400 opacity-75 [animation:var(--animate-pulse-ring)]" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-electric-400" />
              </span>
              {SITE.school} · {SITE.city}
            </span>

            <h1 className="headline text-balance text-[clamp(2.6rem,1.2rem+6.4vw,6rem)] text-white">
              Avinya
              <br />
              <span className="text-club-gradient">Club</span>
            </h1>

            <p className="headline-wide mt-5 text-[clamp(0.85rem,0.7rem+0.5vw,1.2rem)] text-electric-300">
              The AI Club
            </p>

            <p className="mt-6 max-w-lg text-pretty text-base leading-relaxed text-ink-2">
              We write software, build hardware, run hackathons and compete as a team.
              Everything on this site was made by students here.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href="/events"
                className="sheen-host group inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-b from-brand-400 to-brand-600 px-7 py-4 text-sm font-medium text-white shadow-[0_10px_36px_-12px_var(--color-brand-500)] transition-[transform,box-shadow] duration-[var(--duration-fast)] ease-[var(--ease-out-quart)] hover:-translate-y-px hover:shadow-[0_14px_44px_-12px_var(--color-brand-500)]"
              >
                <span className="sheen-line" aria-hidden />
                See what&apos;s on
                <ArrowRight
                  className="h-4 w-4 transition-transform duration-[var(--duration-fast)] group-hover:translate-x-0.5"
                  aria-hidden
                />
              </Link>
              <Link
                href="/gallery"
                className="hairline-gradient inline-flex items-center justify-center gap-2 rounded-2xl bg-black/30 px-7 py-4 text-sm font-medium text-white backdrop-blur-sm transition-colors hover:bg-white/[0.07]"
              >
                Look around
                <ArrowUpRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>
          </div>
        </Container>
      </section>

      {/* ── About ─────────────────────────────────────────────────────── */}
      <section id="about" className="scroll-mt-24 py-20 md:py-28">
        <Container>
          <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
            <SectionHeading
              eyebrow="About the club"
              title={
                <>
                  A workshop,
                  <br />
                  not a classroom.
                </>
              }
            />
            <div className="flex flex-col gap-6 text-base leading-relaxed text-ink-2 md:text-lg">
              <p>
                Avinya exists because there is a difference between being taught how something
                works and building it yourself. Members pick problems, form teams, and ship —
                with the rest of the club as the first people to try it and the first to say
                what is wrong with it.
              </p>
              <p>
                We meet through the school year to build, to prepare for competitions, and to run
                sessions for each other. There is no entrance test and no prerequisite beyond
                wanting to make something. The seniors were beginners two years ago.
              </p>
              <div className="hairline-gradient rounded-2xl p-6">
                <p className="text-pretty text-sm leading-relaxed text-ink-3">
                  Everything published here — this site included — is designed, built and
                  maintained by club members.
                </p>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* ── What we do ────────────────────────────────────────────────── */}
      <section className="py-20 md:py-28">
        <Container className="flex flex-col gap-14">
          <SectionHeading
            eyebrow="What we do"
            title="Six things, done properly"
            description="The club is organised around work that produces something at the end of it."
          />

          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {DISCIPLINES.map(({ icon: Icon, title, body, accent, origin }) => (
              <li key={title} className="h-full">
                <MeshCard
                  as="article"
                  accent={accent}
                  origin={origin}
                  className="flex h-full flex-col p-7"
                >
                  <Icon className="h-6 w-6 text-white/90" strokeWidth={1.4} aria-hidden />
                  <h3 className="mt-8 text-lg font-semibold tracking-tight text-white">{title}</h3>
                  <p className="mt-2.5 text-sm leading-relaxed text-ink-3">{body}</p>
                </MeshCard>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      {/* ── Events ────────────────────────────────────────────────────── */}
      <section className="py-20 md:py-28">
        <Container className="flex flex-col gap-14">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <SectionHeading eyebrow="What's on" title="Coming up" />
            <Link
              href="/events"
              className="group inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.16em] text-ink-3 transition-colors hover:text-white"
            >
              All events
              <ArrowRight
                className="h-3.5 w-3.5 transition-transform duration-[var(--duration-fast)] group-hover:translate-x-0.5"
                aria-hidden
              />
            </Link>
          </div>

          {events.length === 0 ? (
            <EmptyState
              icon={<CalendarDays className="h-6 w-6" aria-hidden />}
              title="Nothing scheduled right now"
              description="The next session, workshop or hackathon will be announced here first. Subscribe below and you'll hear about it."
            />
          ) : (
            /*
              The same EventCard the /events page uses, rather than a bespoke
              text row. These events carry banner artwork, and the old row
              layout showed none of it — a date chip and a title on a dark
              panel reads as an empty placeholder even when the data is there.
            */
            <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {events.map((event) => (
                <li key={event.id}>
                  <EventCard event={event} />
                </li>
              ))}
            </ul>
          )}
        </Container>
      </section>

      {/* ── Gallery ───────────────────────────────────────────────────── */}
      <section className="py-20 md:py-28">
        <Container className="flex flex-col gap-14">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <SectionHeading eyebrow="Gallery" title="From the lab" />
            {featuredGallery.length > 0 && (
              <Link
                href="/gallery"
                className="group inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.16em] text-ink-3 transition-colors hover:text-white"
              >
                Full gallery
                <ArrowRight
                  className="h-3.5 w-3.5 transition-transform duration-[var(--duration-fast)] group-hover:translate-x-0.5"
                  aria-hidden
                />
              </Link>
            )}
          </div>

          {featuredGallery.length === 0 ? (
            <EmptyState
              title="No photographs yet"
              description="Pictures from sessions, builds and competitions will appear here as they are added."
            />
          ) : (
            <ul className="grid grid-cols-2 gap-4 md:grid-cols-3">
              {featuredGallery.map((item, index) => (
                <li
                  key={item.id}
                  className={
                    // First tile spans two columns on desktop, which gives the
                    // grid an editorial rhythm instead of a uniform contact sheet.
                    index === 0 ? "md:col-span-2 md:row-span-2" : undefined
                  }
                >
                  <figure className="hairline-gradient group relative h-full overflow-hidden rounded-3xl">
                    <Image
                      src={item.image_url}
                      alt={item.alt_text ?? item.title ?? ""}
                      width={item.width ?? 1200}
                      height={item.height ?? 900}
                      sizes={
                        index === 0
                          ? "(max-width: 768px) 50vw, 66vw"
                          : "(max-width: 768px) 50vw, 33vw"
                      }
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-[var(--duration-slow)] ease-[var(--ease-out-soft)] group-hover:scale-[1.03]"
                    />
                    {item.title && (
                      <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent p-4 pt-10 text-xs font-medium text-white">
                        {item.title}
                      </figcaption>
                    )}
                  </figure>
                </li>
              ))}
            </ul>
          )}
        </Container>
      </section>

      {/* ── Team ──────────────────────────────────────────────────────── */}
      {coreTeam.length > 0 && (
        <section className="py-20 md:py-28">
          <Container className="flex flex-col gap-14">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <SectionHeading eyebrow="Core team" title="Who runs it" />
              <Link
                href="/team"
                className="group inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.16em] text-ink-3 transition-colors hover:text-white"
              >
                Everyone
                <ArrowRight
                  className="h-3.5 w-3.5 transition-transform duration-[var(--duration-fast)] group-hover:translate-x-0.5"
                  aria-hidden
                />
              </Link>
            </div>

            <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {coreTeam.slice(0, 4).map((member) => (
                <li key={member.id}>
                  <article className="glass hairline-gradient flex h-full flex-col items-center gap-4 rounded-3xl p-7 text-center">
                    {member.avatar_url ? (
                      <RemoteImage
                        src={member.avatar_url}
                        alt=""
                        width={72}
                        height={72}
                        loading="lazy"
                        className="h-[72px] w-[72px] rounded-full object-cover ring-1 ring-white/15"
                      />
                    ) : (
                      <span
                        aria-hidden
                        className="headline-wide flex h-[72px] w-[72px] items-center justify-center rounded-full bg-brand-500/15 text-lg text-brand-200 ring-1 ring-white/15"
                      >
                        {initials(member.full_name)}
                      </span>
                    )}
                    <div className="flex flex-col gap-1">
                      <h3 className="text-sm font-semibold text-white">{member.full_name}</h3>
                      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-brand-300">
                        {member.headline || "Core team"}
                      </p>
                    </div>
                  </article>
                </li>
              ))}
            </ul>
          </Container>
        </section>
      )}

      {/* ── Closing CTA ───────────────────────────────────────────────── */}
      <section className="pb-8 pt-20 md:pt-28">
        <Container>
          <div className="glass-deep hairline-gradient grain relative overflow-hidden rounded-[2rem] px-8 py-20 text-center md:px-16 md:py-28">
            <div className="glow-club pointer-events-none absolute inset-0" aria-hidden />
            <div className="relative flex flex-col items-center gap-7">
              <span className="eyebrow text-champagne-300">Join us</span>
              <h2 className="headline text-balance text-[clamp(2rem,1.2rem+3.6vw,4rem)] text-white">
                Build the future
                <br />
                <span className="text-club-gradient">with us.</span>
              </h2>
              <p className="max-w-xl text-pretty text-base leading-relaxed text-ink-2">
                Membership is open to students of {SITE.school}. Come to a session, or talk to
                any of the core team — that is the whole process.
              </p>
              <Link
                href="/contact"
                className="sheen-host group inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-8 py-4 text-sm font-medium text-zinc-950 transition-transform duration-[var(--duration-fast)] ease-[var(--ease-out-quart)] hover:-translate-y-px"
              >
                <span className="sheen-line" aria-hidden />
                Get in touch
                <ArrowRight
                  className="h-4 w-4 transition-transform duration-[var(--duration-fast)] group-hover:translate-x-0.5"
                  aria-hidden
                />
              </Link>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
