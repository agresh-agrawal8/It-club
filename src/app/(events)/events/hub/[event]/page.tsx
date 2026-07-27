import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, MapPin, Users, Radio, Lock, ChevronRight } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Countdown } from "@/components/events/shell/countdown";
import { EventMark } from "@/components/events/shell/event-mark";
import {
  getEvent,
  getEventSettings,
  resolveTheme,
  countRegistered,
  can,
} from "@/lib/events/engine";
import { getMissionCategories, getSchedule, getBadges } from "@/lib/events/queries";
import { eventPhase, registrationOpen } from "@/lib/events/rules";
import { formatDate, formatTime } from "@/lib/utils";

/**
 * Event landing page.
 *
 * Entirely data-driven: copy, theme, countdown target, capability strip and
 * mission tracks all come from the event row and its settings.
 */
export default async function EventLandingPage({
  params,
}: {
  params: Promise<{ event: string }>;
}) {
  const { event: slug } = await params;
  const event = await getEvent(slug);
  if (!event) notFound();

  const [settings, registered] = await Promise.all([
    getEventSettings(event.id),
    countRegistered(event.id),
  ]);
  const [categories, schedule, badges] = await Promise.all([
    getMissionCategories(event.id),
    getSchedule(event.id),
    getBadges(event.id),
  ]);

  const theme = resolveTheme(event);
  const phase = eventPhase(event);
  const regStatus = registrationOpen(event, settings, registered);
  const base = `/events/hub/${event.slug}`;

  // Count down to whichever deadline actually matters right now.
  const countdownTarget =
    phase === "registration" ? event.register_closes_at : event.starts_at;
  const countdownLabel =
    phase === "registration"
      ? "Registration closes in"
      : phase === "live"
        ? "Event in progress"
        : "T-minus to launch";

  return (
    <>
      {/* ── Hero ───────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-white/[0.07]">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.9]"
          style={{
            backgroundImage:
              "linear-gradient(var(--ev-grid) 1px, transparent 1px), linear-gradient(90deg, var(--ev-grid) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
            maskImage: "radial-gradient(ellipse 80% 60% at 50% 0%, black, transparent)",
          }}
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -top-40 left-1/2 h-[420px] w-[820px] -translate-x-1/2 rounded-full opacity-20 blur-[120px]"
          style={{ background: theme.accent }}
          aria-hidden
        />

        <Container className="relative flex flex-col gap-8 py-20 md:py-28">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2 w-2">
              <span
                className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60"
                style={{ background: theme.accent }}
              />
              <span
                className="relative inline-flex h-2 w-2 rounded-full"
                style={{ background: theme.accent }}
              />
            </span>
            <span className="font-mono text-[11px] uppercase tracking-[0.25em] text-zinc-400">
              {phase === "live" ? "System armed" : `Status · ${phase}`}
            </span>
          </div>

          <div className="max-w-3xl">
            <EventMark
              title={event.name}
              className="mb-6 h-20 w-20 rounded-2xl md:h-24 md:w-24"
            />
            <h1 className="text-5xl font-semibold leading-[0.95] tracking-tighter text-white md:text-7xl">
              {event.name}
            </h1>
            {event.tagline && (
              <p className="mt-4 font-mono text-sm text-zinc-400 md:text-base">
                &gt; {event.tagline}
              </p>
            )}
            {event.summary && (
              <p className="mt-5 max-w-2xl text-sm leading-relaxed text-zinc-400 md:text-base">
                {event.summary}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-end gap-8">
            <Countdown to={countdownTarget} label={countdownLabel} />

            <div className="flex flex-col gap-2">
              {regStatus.ok ? (
                <Link
                  href={`${base}/register`}
                  className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                  style={{ background: theme.accent }}
                >
                  Enlist now <ChevronRight className="h-4 w-4" />
                </Link>
              ) : (
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 px-6 py-3 text-sm text-zinc-400">
                  <Lock className="h-4 w-4" /> {regStatus.reason}
                </span>
              )}
              {event.capacity && (
                <span className="font-mono text-[11px] text-zinc-500">
                  {registered} / {event.capacity} places claimed
                </span>
              )}
            </div>
          </div>

          <dl className="flex flex-wrap gap-x-8 gap-y-3 border-t border-white/[0.07] pt-6 text-xs text-zinc-500">
            {event.starts_at && (
              <div className="flex items-center gap-2">
                <CalendarDays className="h-3.5 w-3.5" />
                <dd>
                  {formatDate(event.starts_at)}
                  {event.ends_at && ` — ${formatDate(event.ends_at)}`}
                </dd>
              </div>
            )}
            {event.venue && (
              <div className="flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5" />
                <dd>{event.venue}</dd>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Users className="h-3.5 w-3.5" />
              <dd>
                Teams of {event.team_min}–{event.team_max}
              </dd>
            </div>
          </dl>
        </Container>
      </section>

      <Container className="flex flex-col gap-12 py-16">
        {/* ── Mission briefing ─────────────────────────────────────── */}
        {event.description && (
          <section className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
            <div>
              <h2 className="flex items-center gap-2 text-sm font-semibold text-white">
                <Radio className="h-4 w-4" style={{ color: theme.accent }} />
                Mission briefing
              </h2>
            </div>
            <Card deep className="p-7">
              <p className="whitespace-pre-line text-sm leading-relaxed text-zinc-300">
                {event.description}
              </p>
            </Card>
          </section>
        )}

        {/* ── Tracks ───────────────────────────────────────────────── */}
        {can(settings, "missions_enabled") && categories.length > 0 && (
          <section className="flex flex-col gap-5">
            <h2 className="text-sm font-semibold text-white">Mission tracks</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {categories.map((c) => (
                <Card key={c.id} className="flex flex-col gap-2 p-5">
                  <span
                    className="h-1 w-10 rounded-full"
                    style={{ background: c.colour ?? theme.accent }}
                  />
                  <h3 className="text-base font-semibold tracking-tight text-white">{c.name}</h3>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* ── Schedule ─────────────────────────────────────────────── */}
        {schedule.length > 0 && (
          <section className="flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white">Run of show</h2>
              <Link
                href={`${base}/schedule`}
                className="text-xs text-zinc-500 transition-colors hover:text-white"
              >
                Full schedule →
              </Link>
            </div>
            <ol className="flex flex-col">
              {schedule.slice(0, 5).map((item, i) => (
                <li
                  key={item.id}
                  className="flex items-baseline gap-5 border-l border-white/[0.08] py-3 pl-5"
                >
                  <span className="font-mono text-[11px] tabular-nums text-zinc-600">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="text-sm font-medium text-white">{item.title}</span>
                      <Badge variant="small">{item.kind}</Badge>
                    </div>
                    {item.description && (
                      <p className="mt-0.5 text-xs text-zinc-500">{item.description}</p>
                    )}
                  </div>
                  <span className="font-mono text-[11px] text-zinc-500">
                    {formatDate(item.starts_at, { day: "numeric", month: "short" })}{" "}
                    {formatTime(item.starts_at)}
                  </span>
                </li>
              ))}
            </ol>
          </section>
        )}

        {/* ── Badges ───────────────────────────────────────────────── */}
        {can(settings, "badges_enabled") && badges.length > 0 && (
          <section className="flex flex-col gap-5">
            <h2 className="text-sm font-semibold text-white">Commendations</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {badges.map((b) => (
                <Card key={b.id} className="flex flex-col gap-1 p-4">
                  <span className="font-mono text-[9px] uppercase tracking-wider text-zinc-600">
                    {b.rarity}
                  </span>
                  <span className="text-xs font-semibold leading-tight text-white">{b.title}</span>
                  <span className="text-[10px]" style={{ color: theme.accent }}>
                    +{b.points}
                  </span>
                </Card>
              ))}
            </div>
          </section>
        )}
      </Container>
    </>
  );
}
