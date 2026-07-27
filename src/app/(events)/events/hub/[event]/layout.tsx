import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EventNav } from "@/components/events/shell/event-nav";
import { getEvent, getEventSettings, resolveTheme, themeVars, can } from "@/lib/events/engine";
import { readEventSession } from "@/lib/events/session";
import { getEventActor } from "@/lib/events/auth";

/**
 * Per-event layout.
 *
 * Loads the event, its capability flags and its theme, then renders the shell.
 * The theme arrives as CSS custom properties, which is how one component tree
 * takes on a different visual identity per event with no conditionals on the
 * event slug anywhere in the UI.
 */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ event: string }>;
}): Promise<Metadata> {
  const { event: slug } = await params;
  const event = await getEvent(slug);
  if (!event) return { title: "Event" };
  return {
    title: { default: event.name, template: `%s · ${event.name}` },
    description: event.summary ?? event.tagline ?? undefined,
  };
}

export default async function EventLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ event: string }>;
}) {
  const { event: slug } = await params;
  const event = await getEvent(slug);
  if (!event) notFound();

  const settings = await getEventSettings(event.id);
  const theme = resolveTheme(event);
  const base = `/events/hub/${event.slug}`;
  const participantId = await readEventSession(event.slug).catch(() => null);
  const actor = await getEventActor(event.id, event.slug);
  const isOrganiser = actor.isClubAdmin || actor.roles.some((r) => r === "admin" || r === "super_admin");

  // Navigation is derived from capabilities — an event with missions turned
  // off simply has no Missions tab. The Organiser tab appears only for admins.
  const links = [
    { href: base, label: "Overview" },
    ...(can(settings, "missions_enabled") ? [{ href: `${base}/missions`, label: "Missions" }] : []),
    { href: `${base}/schedule`, label: "Schedule" },
    { href: `${base}/leaderboard`, label: "Leaderboard" },
    ...(can(settings, "gallery_enabled") ? [{ href: `${base}/gallery`, label: "Gallery" }] : []),
    ...(isOrganiser ? [{ href: `${base}/admin`, label: "Organiser" }] : []),
  ];

  return (
    <div style={themeVars(theme)} className="min-h-screen bg-[var(--ev-surface)]">
      <EventNav
        base={base}
        name={event.name}
        links={links}
        signedIn={Boolean(participantId)}
      />
      <main>{children}</main>
    </div>
  );
}
