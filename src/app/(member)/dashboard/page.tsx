import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  Bell,
  CalendarDays,
  CheckSquare,
  ImageIcon,
  MapPin,
} from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getMyTasks, getMyNotifications, getUpcomingEvents } from "@/lib/data";
import { EmptyState } from "@/components/ui/empty-state";
import { StatCard } from "@/components/ui/stat-card";
import { Badge } from "@/components/ui/badge";
import { UrgentAlert } from "@/components/member/urgent-alert";
import { formatDate, isCoreTeam, timeAgo, roleLabel } from "@/lib/utils";
import type { TaskPriority } from "@/types/database";

export const metadata: Metadata = { title: "Dashboard" };

const PRIORITY_VARIANT: Record<TaskPriority, "danger" | "warning" | "accent" | "small"> = {
  urgent: "danger",
  high: "warning",
  medium: "accent",
  low: "small",
};

export default async function DashboardPage() {
  const { user, profile } = await requireUser();

  // Core team have their own home; this page is the member view.
  if (isCoreTeam(profile.role)) redirect("/admin");

  const [tasks, notifications, events] = await Promise.all([
    getMyTasks(user.id),
    getMyNotifications(user.id),
    getUpcomingEvents(3),
  ]);

  const openTasks = tasks.filter((t) => t.status !== "done");
  const unread = notifications.filter((n) => !n.read);
  const urgent = unread
    .filter((n) => n.urgent)
    .map((n) => ({
      id: n.id,
      title: n.title,
      body: n.body,
      link: n.link,
      created_at: n.created_at,
    }));

  return (
    <div className="flex flex-col gap-10">
      {urgent.length > 0 && <UrgentAlert notices={urgent} />}

      <header className="flex flex-col gap-2">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-brand-300">
          {roleLabel(profile.role)}
        </p>
        <h1 className="headline text-[clamp(1.8rem,1.2rem+2vw,2.75rem)] text-white">
          {profile.full_name.split(" ")[0]}
        </h1>
        <p className="text-sm text-ink-3">
          {openTasks.length > 0
            ? `${openTasks.length} task${openTasks.length === 1 ? "" : "s"} open.`
            : "Nothing outstanding."}
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Open tasks"
          value={openTasks.length}
          icon={<CheckSquare className="h-5 w-5" aria-hidden />}
        />
        <StatCard
          label="Unread notices"
          value={unread.length}
          icon={<Bell className="h-5 w-5" aria-hidden />}
        />
        <StatCard
          label="Upcoming events"
          value={events.length}
          icon={<CalendarDays className="h-5 w-5" aria-hidden />}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Tasks */}
        <section className="surface flex flex-col gap-5 rounded-3xl p-6">
          <div className="flex items-center justify-between gap-4">
            <h2 className="headline-wide text-sm text-white">My tasks</h2>
            <Link
              href="/my-tasks"
              className="group inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-ink-3 transition-colors hover:text-white"
            >
              All
              <ArrowRight
                className="h-3 w-3 transition-transform group-hover:translate-x-0.5"
                aria-hidden
              />
            </Link>
          </div>

          {openTasks.length === 0 ? (
            <EmptyState
              title="No open tasks"
              description="Work assigned to you by the core team appears here."
              className="py-10"
            />
          ) : (
            <ul className="flex flex-col gap-2.5">
              {openTasks.slice(0, 5).map((task) => (
                <li
                  key={task.id}
                  className="flex items-start justify-between gap-4 surface-row p-4"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-white">{task.title}</p>
                    {task.deadline && (
                      <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-4">
                        Due {formatDate(task.deadline)}
                      </p>
                    )}
                  </div>
                  <Badge variant={PRIORITY_VARIANT[task.priority]}>{task.priority}</Badge>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Notifications */}
        <section className="surface flex flex-col gap-5 rounded-3xl p-6">
          <div className="flex items-center justify-between gap-4">
            <h2 className="headline-wide text-sm text-white">Latest notices</h2>
            <Link
              href="/notifications"
              className="group inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-ink-3 transition-colors hover:text-white"
            >
              All
              <ArrowRight
                className="h-3 w-3 transition-transform group-hover:translate-x-0.5"
                aria-hidden
              />
            </Link>
          </div>

          {notifications.length === 0 ? (
            <EmptyState
              title="Nothing yet"
              description="Announcements from the core team will show up here."
              className="py-10"
            />
          ) : (
            <ul className="flex flex-col gap-2.5">
              {notifications.slice(0, 5).map((n) => (
                <li
                  key={n.id}
                  className="flex items-start gap-3 surface-row p-4"
                >
                  {!n.read && (
                    <span
                      aria-label="Unread"
                      className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-400"
                    />
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-white">{n.title}</p>
                    <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-4">
                      {timeAgo(n.created_at)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* Events */}
      <section className="flex flex-col gap-5">
        <div className="flex items-center justify-between gap-4">
          <h2 className="headline-wide text-sm text-white">Coming up</h2>
          <Link
            href="/calendar"
            className="group inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-ink-3 transition-colors hover:text-white"
          >
            Calendar
            <ArrowRight
              className="h-3 w-3 transition-transform group-hover:translate-x-0.5"
              aria-hidden
            />
          </Link>
        </div>

        {events.length === 0 ? (
          <EmptyState
            icon={<CalendarDays className="h-6 w-6" aria-hidden />}
            title="Nothing scheduled"
            description="The next club event will show up here once it is published."
          />
        ) : (
          <ul className="grid gap-4 md:grid-cols-3">
            {events.map((event) => (
              <li key={event.id}>
                <Link
                  href={`/events/${event.slug}`}
                  className="surface surface-hover flex h-full flex-col gap-3 rounded-2xl p-5"
                >
                  <time
                    dateTime={event.starts_at}
                    className="font-mono text-[10px] uppercase tracking-[0.16em] text-brand-300"
                  >
                    {formatDate(event.starts_at)}
                  </time>
                  <h3 className="text-sm font-semibold text-white">{event.title}</h3>
                  {event.venue && (
                    <p className="mt-auto flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-4">
                      <MapPin className="h-3 w-3" aria-hidden />
                      {event.venue}
                    </p>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Link
        href="/gallery"
        className="surface flex items-center gap-4 rounded-2xl p-5 transition-colors hover:bg-white/[0.04]"
      >
        <span
          aria-hidden
          className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-500/12 text-brand-300"
        >
          <ImageIcon className="h-5 w-5" />
        </span>
        <span className="flex-1">
          <span className="block text-sm font-medium text-white">Club gallery</span>
          <span className="block text-xs text-ink-3">Photographs from sessions and builds.</span>
        </span>
        <ArrowRight className="h-4 w-4 text-ink-4" aria-hidden />
      </Link>
    </div>
  );
}
