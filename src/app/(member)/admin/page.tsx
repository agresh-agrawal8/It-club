import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Award,
  CalendarDays,
  ImageIcon,
  Inbox,
  Send,
  Users,
} from "lucide-react";
import { requireCoreTeam } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getPlatformStats, getTeam, getUpcomingEvents } from "@/lib/data";
import { StatCard } from "@/components/ui/stat-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { AdminPageHeader } from "@/components/admin/admin-shell";
import { formatDate, isCoreTeam, timeAgo } from "@/lib/utils";

export const metadata: Metadata = { title: "Core Team" };

/** The management surfaces, in the order they are actually used. */
const SHORTCUTS = [
  { href: "/admin/members", label: "Members", icon: Users, hint: "Accounts, roles, resets" },
  { href: "/admin/events", label: "Events", icon: CalendarDays, hint: "Publish and schedule" },
  { href: "/admin/gallery", label: "Gallery", icon: ImageIcon, hint: "Upload photographs" },
  { href: "/admin/achievements", label: "Achievements", icon: Award, hint: "The awards wall" },
  { href: "/admin/submissions", label: "Submissions", icon: Inbox, hint: "Public inbox" },
  { href: "/admin/notifications", label: "Send notice", icon: Send, hint: "Broadcast to members" },
] as const;

export default async function CoreTeamPage() {
  const { profile } = await requireCoreTeam();

  const [stats, team, events] = await Promise.all([
    getPlatformStats(),
    getTeam(),
    getUpcomingEvents(4),
  ]);

  // Unhandled public submissions — the one queue that needs attention.
  let pendingSubmissions = 0;
  try {
    const supabase = await createClient();
    const { count } = await supabase
      .from("submissions")
      .select("id", { count: "exact", head: true })
      .eq("handled", false);
    pendingSubmissions = count ?? 0;
  } catch {
    pendingSubmissions = 0;
  }

  return (
    <div className="flex flex-col gap-10">
      <AdminPageHeader
        title={`Welcome, ${profile.full_name.split(" ")[0]}`}
        description="Everything the club publishes is managed from here."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Members"
          value={stats.members}
          hint={`${stats.activeMembers} active`}
          icon={<Users className="h-5 w-5" aria-hidden />}
        />
        <StatCard
          label="Events"
          value={stats.events}
          icon={<CalendarDays className="h-5 w-5" aria-hidden />}
        />
        <StatCard
          label="Gallery photos"
          value={stats.gallery}
          icon={<ImageIcon className="h-5 w-5" aria-hidden />}
        />
        <StatCard
          label="Open submissions"
          value={pendingSubmissions}
          icon={<Inbox className="h-5 w-5" aria-hidden />}
        />
      </div>

      <section className="flex flex-col gap-5">
        <h2 className="headline-wide text-sm text-white">Manage</h2>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SHORTCUTS.map(({ href, label, icon: Icon, hint }) => (
            <li key={href}>
              <Link
                href={href}
                className="surface surface-hover group flex h-full items-center gap-4 rounded-2xl p-5"
              >
                <span
                  aria-hidden
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-500/12 text-brand-300 transition-colors group-hover:bg-electric-500/15 group-hover:text-electric-300"
                >
                  <Icon className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-white">{label}</span>
                  <span className="block truncate text-xs text-ink-3">{hint}</span>
                </span>
                <ArrowRight
                  className="h-4 w-4 shrink-0 text-ink-4 transition-transform group-hover:translate-x-0.5"
                  aria-hidden
                />
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="surface flex flex-col gap-5 rounded-3xl p-6">
          <div className="flex items-center justify-between gap-4">
            <h2 className="headline-wide text-sm text-white">The team</h2>
            <Link
              href="/admin/members"
              className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-3 transition-colors hover:text-white"
            >
              Manage
            </Link>
          </div>

          {team.length === 0 ? (
            <EmptyState title="No accounts yet" className="py-10" />
          ) : (
            <ul className="flex flex-col gap-2.5">
              {team.slice(0, 6).map((m) => (
                <li
                  key={m.id}
                  className="flex items-center justify-between gap-3 surface-row p-4"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-white">
                      {m.full_name}
                    </span>
                    {m.headline && (
                      <span className="block truncate text-xs text-ink-3">{m.headline}</span>
                    )}
                  </span>
                  <Badge variant={isCoreTeam(m.role) ? "accent" : "small"}>
                    {isCoreTeam(m.role) ? "Core" : "Member"}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="surface flex flex-col gap-5 rounded-3xl p-6">
          <div className="flex items-center justify-between gap-4">
            <h2 className="headline-wide text-sm text-white">Upcoming events</h2>
            <Link
              href="/admin/events"
              className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-3 transition-colors hover:text-white"
            >
              Manage
            </Link>
          </div>

          {events.length === 0 ? (
            <EmptyState
              title="Nothing scheduled"
              description="Publish an event and it appears on the public site immediately."
              className="py-10"
            />
          ) : (
            <ul className="flex flex-col gap-2.5">
              {events.map((e) => (
                <li
                  key={e.id}
                  className="flex items-center justify-between gap-3 surface-row p-4"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-white">{e.title}</span>
                    <span className="block font-mono text-[10px] uppercase tracking-[0.14em] text-ink-4">
                      {formatDate(e.starts_at)} · {timeAgo(e.created_at)}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
