/**
 * Event domain shell.
 *
 * Deliberately separate from the club's (public) layout: the event platform
 * has its own chrome, its own theming and its own navigation. It shares the
 * design tokens and UI primitives, so it still reads as one ecosystem.
 *
 * Base path note: the club site already owns `/events` and `/events/[slug]`
 * (its own event listing and detail pages). The platform therefore mounts at
 * `/events/hub` — a static segment, which Next.js resolves ahead of the
 * club's `[slug]`, so neither route is disturbed.
 */
export default function EventDomainLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-[#09090b] text-white">{children}</div>;
}
