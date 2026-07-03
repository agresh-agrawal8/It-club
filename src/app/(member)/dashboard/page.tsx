import type { Metadata } from "next";
import Link from "next/link";
import {
  FolderKanban,
  CheckSquare,
  Bell,
  CalendarDays,
  Award,
  ArrowRight,
  Plus,
} from "lucide-react";
import { requireUser } from "@/lib/auth";
import {
  getMyProjects,
  getMyTasks,
  getMyNotifications,
  getUpcomingEvents,
  getAchievements,
} from "@/lib/data";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ProgressBar } from "@/components/ui/progress";
import { formatDate, timeAgo } from "@/lib/utils";

export const metadata: Metadata = { title: "Dashboard" };

const priorityVariant = { urgent: "danger", high: "warning", medium: "accent", low: "small" } as const;

export default async function DashboardPage() {
  const { user, profile } = await requireUser();
  const [projects, tasks, notifications, events, achievements] = await Promise.all([
    getMyProjects(user.id),
    getMyTasks(user.id),
    getMyNotifications(user.id),
    getUpcomingEvents(3),
    getAchievements(),
  ]);

  const openTasks = tasks.filter((t) => t.status !== "done");
  const unread = notifications.filter((n) => !n.read);
  const firstName = (profile?.full_name || "there").split(" ")[0];

  const stats = [
    { label: "Projects", value: projects.length, icon: FolderKanban, href: "/my-projects" },
    { label: "Open tasks", value: openTasks.length, icon: CheckSquare, href: "/my-tasks" },
    { label: "Unread", value: unread.length, icon: Bell, href: "/notifications" },
    { label: "Events", value: events.length, icon: CalendarDays, href: "/calendar" },
  ];

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-brand-300">Welcome back</p>
          <h1 className="text-3xl font-semibold tracking-tighter text-white md:text-4xl">
            Hi, {firstName} 👋
          </h1>
        </div>
        <ButtonLink href="/my-projects/new" size="sm">
          <Plus className="h-4 w-4" /> New project
        </ButtonLink>
      </div>

      {/* Stat tiles */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, href }) => (
          <Link key={label} href={href}>
            <Card glass hoverLift className="flex items-center gap-4 p-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-500/15 text-brand-300">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <div className="text-2xl font-semibold tracking-tighter text-white">{value}</div>
                <div className="text-xs uppercase tracking-wide text-zinc-500">{label}</div>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upcoming tasks */}
        <Widget title="Upcoming tasks" href="/my-tasks">
          {openTasks.length ? (
            <ul className="flex flex-col gap-3">
              {openTasks.slice(0, 4).map((t) => (
                <li key={t.id} className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-zinc-950 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-sm font-medium text-white">{t.title}</span>
                    <Badge variant={priorityVariant[t.priority]}>{t.priority}</Badge>
                  </div>
                  <ProgressBar value={t.progress} />
                  <div className="flex items-center justify-between text-xs text-zinc-500">
                    <span>{t.progress}% complete</span>
                    {t.deadline && <span>Due {formatDate(t.deadline)}</span>}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <MiniEmpty icon={<CheckSquare className="h-5 w-5" />} text="No open tasks. You're all caught up!" />
          )}
        </Widget>

        {/* Notifications */}
        <Widget title="Recent notifications" href="/notifications">
          {notifications.length ? (
            <ul className="flex flex-col gap-2">
              {notifications.slice(0, 5).map((n) => (
                <li
                  key={n.id}
                  className="flex items-start gap-3 rounded-2xl border border-white/10 bg-zinc-950 p-3"
                >
                  <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.read ? "bg-zinc-700" : "bg-brand-400"}`} />
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-white">{n.title}</div>
                    {n.body && <div className="truncate text-xs text-zinc-500">{n.body}</div>}
                    <div className="mt-0.5 text-[11px] text-zinc-600">{timeAgo(n.created_at)}</div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <MiniEmpty icon={<Bell className="h-5 w-5" />} text="No notifications yet." />
          )}
        </Widget>

        {/* My projects */}
        <Widget title="My projects" href="/my-projects">
          {projects.length ? (
            <ul className="flex flex-col gap-2">
              {projects.slice(0, 4).map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/projects/${p.slug}`}
                    className="flex items-center justify-between rounded-2xl border border-white/10 bg-zinc-950 p-4 hover:border-brand-400/40"
                  >
                    <span className="text-sm font-medium text-white">{p.title}</span>
                    <Badge variant="small">{p.status.replace("_", " ")}</Badge>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <MiniEmpty
              icon={<FolderKanban className="h-5 w-5" />}
              text="You haven't created any projects yet."
            />
          )}
        </Widget>

        {/* Upcoming events */}
        <Widget title="Upcoming events" href="/calendar">
          {events.length ? (
            <ul className="flex flex-col gap-2">
              {events.map((e) => (
                <li key={e.id}>
                  <Link
                    href={`/events/${e.slug}`}
                    className="flex items-center gap-3 rounded-2xl border border-white/10 bg-zinc-950 p-4 hover:border-brand-400/40"
                  >
                    <div className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-xl bg-brand-500/15 text-brand-300">
                      <CalendarDays className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white">{e.title}</div>
                      <div className="text-xs text-zinc-500">{formatDate(e.starts_at)}</div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <MiniEmpty icon={<CalendarDays className="h-5 w-5" />} text="No upcoming events." />
          )}
        </Widget>
      </div>

      {/* Achievements strip */}
      {achievements.length > 0 && (
        <Widget title="Club achievements" href="/achievements">
          <div className="grid gap-3 sm:grid-cols-2">
            {achievements.slice(0, 4).map((a) => (
              <div key={a.id} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-zinc-950 p-4">
                <Award className="h-5 w-5 shrink-0 text-amber-300" />
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-white">{a.title}</div>
                  {a.category && <div className="text-xs text-zinc-500">{a.category}</div>}
                </div>
              </div>
            ))}
          </div>
        </Widget>
      )}
    </div>
  );
}

function Widget({ title, href, children }: { title: string; href: string; children: React.ReactNode }) {
  return (
    <Card className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">{title}</h2>
        <Link href={href} className="flex items-center gap-1 text-xs text-brand-300 hover:text-brand-200">
          View all <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
      {children}
    </Card>
  );
}

function MiniEmpty({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex flex-col items-center gap-2 py-8 text-center text-sm text-zinc-500">
      <span className="text-zinc-600">{icon}</span>
      {text}
    </div>
  );
}
