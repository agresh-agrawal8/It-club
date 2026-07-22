import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  FolderKanban,
  CheckSquare,
  Bell,
  CalendarDays,
  Award,
  ArrowUpRight,
  Plus,
  Circle,
} from "lucide-react";
import { requireUser } from "@/lib/auth";
import {
  getMyProjects,
  getMyTasks,
  getMyNotifications,
  getUpcomingEvents,
  getAchievements,
  getPlatformStats,
  getTeam,
} from "@/lib/data";
import { UrgentAlert } from "@/components/member/urgent-alert";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { ButtonLink } from "@/components/ui/button";
import { ProgressBar } from "@/components/ui/progress";
import { formatDate, timeAgo, isAdminRole, roleLabel } from "@/lib/utils";

export const metadata: Metadata = { title: "Dashboard" };

const priorityVariant = { urgent: "danger", high: "warning", medium: "accent", low: "small" } as const;

export default async function DashboardPage() {
  const { user, profile } = await requireUser();

  // Core team lands on the Core Team Panel; this dashboard is the member home.
  if (isAdminRole(profile?.role)) redirect("/admin");

  const [projects, tasks, notifications, events, achievements, stats, team] = await Promise.all([
    getMyProjects(user.id),
    getMyTasks(user.id),
    getMyNotifications(user.id),
    getUpcomingEvents(4),
    getAchievements(),
    getPlatformStats(),
    getTeam(),
  ]);

  const urgentNotices = notifications
    .filter((n) => n.urgent && !n.read)
    .map((n) => ({ id: n.id, title: n.title, body: n.body, link: n.link, created_at: n.created_at }));

  const openTasks = tasks.filter((t) => t.status !== "done");
  const doneProjects = projects.filter((p) => p.status === "completed").length;
  const unread = notifications.filter((n) => !n.read).length;
  const firstName = (profile?.full_name || "there").split(" ")[0];

  const daysInClub = profile?.created_at
    ? Math.max(1, Math.round((Date.now() - new Date(profile.created_at).getTime()) / 86400000))
    : 1;

  const today = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "short",
  });

  return (
    <div className="flex flex-col gap-8">
      {/* Urgent core-team notices pop up on arrival */}
      {urgentNotices.length > 0 && <UrgentAlert notices={urgentNotices} />}

      {/* ── Greeting header ── */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs text-zinc-500">{today}</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tighter text-white md:text-4xl">
            Welcome in, {firstName}
          </h1>
          <p className="mt-1 text-sm text-zinc-500">{stats.members} members</p>
        </div>
        <div className="flex items-center gap-4">
          {/* Club roster — overlapping avatars */}
          {team.length > 0 && (
            <Link href="/team" className="group flex items-center -space-x-2.5" title="Club members">
              {team.slice(0, 5).map((m) => (
                <span
                  key={m.id}
                  className="rounded-full ring-2 ring-zinc-950 transition-transform group-hover:translate-x-0"
                >
                  <Avatar name={m.full_name || "Member"} src={m.avatar_url} size="sm" />
                </span>
              ))}
              {team.length > 5 && (
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800 text-[10px] font-semibold text-zinc-300 ring-2 ring-zinc-950">
                  +{team.length - 5}
                </span>
              )}
            </Link>
          )}
          <ButtonLink href="/my-projects/new" variant="brand" size="sm" className="rounded-full">
            <Plus className="h-4 w-4" /> New project
          </ButtonLink>
        </div>
      </div>

      {/* ── Bento grid ── */}
      <div className="grid gap-5 lg:grid-cols-[300px_1fr_1fr]">
        {/* Profile column */}
        <div className="flex flex-col gap-5">
          <Card deep className="relative overflow-hidden p-6">
            <span className="flex w-fit items-center gap-1.5 rounded-full border border-white/10 px-2.5 py-1 text-[10px] uppercase tracking-wide text-emerald-300">
              <Circle className="h-1.5 w-1.5 fill-emerald-400 text-emerald-400" /> Online
            </span>
            <div className="mt-5 flex flex-col items-center gap-4 text-center">
              <Avatar name={profile?.full_name || "Member"} src={profile?.avatar_url} size="xl" />
              <div>
                <h2 className="text-lg font-semibold tracking-tight text-white">
                  {profile?.full_name || "Member"}
                </h2>
                <p className="mt-0.5 text-xs text-zinc-500">
                  {profile?.headline ?? roleLabel(profile?.role)}
                </p>
              </div>
            </div>
            <Link
              href="/profile"
              aria-label="Edit profile"
              className="absolute bottom-4 right-4 flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-zinc-400 transition-colors hover:border-brand-400/50 hover:text-brand-300"
            >
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </Card>

          {/* Big stat tiles */}
          <div className="grid grid-cols-2 gap-5">
            <Card className="p-5">
              <div className="text-4xl font-semibold tracking-tighter text-white">{daysInClub}</div>
              <div className="mt-1.5 text-xs leading-snug text-zinc-500">
                Days
                <br />
                in the club
              </div>
            </Card>
            <Card className="p-5">
              <div className="text-4xl font-semibold tracking-tighter text-white">{doneProjects}</div>
              <div className="mt-1.5 text-xs leading-snug text-zinc-500">
                Done
                <br />
                projects
              </div>
            </Card>
          </div>

          {/* Skill tags scatter */}
          {(profile?.skills?.length ?? 0) > 0 && (
            <Card className="p-5">
              <div className="flex flex-wrap gap-2">
                {profile!.skills.slice(0, 8).map((s, i) => (
                  <span
                    key={s}
                    className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-zinc-300"
                    style={{ transform: `rotate(${((i % 5) - 2) * 2}deg)` }}
                  >
                    {s}
                  </span>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Progress column — open tasks */}
        <Card className="flex flex-col gap-5 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold tracking-tight text-white">Progress</h2>
            <Link href="/my-tasks" className="text-xs text-zinc-500 hover:text-white">
              View all
            </Link>
          </div>
          {openTasks.length ? (
            <ul className="flex flex-col gap-2.5">
              {openTasks.slice(0, 6).map((t) => (
                <li
                  key={t.id}
                  className="group rounded-2xl border border-white/[0.07] bg-zinc-950/50 p-4 transition-colors hover:border-white/15"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500/15 text-brand-300">
                        <CheckSquare className="h-4 w-4" />
                      </span>
                      <div>
                        <div className="text-sm font-medium text-white">{t.title}</div>
                        {t.deadline && (
                          <div className="mt-0.5 text-[11px] text-zinc-500">
                            Due {formatDate(t.deadline)}
                          </div>
                        )}
                      </div>
                    </div>
                    <Badge variant={priorityVariant[t.priority]}>{t.priority}</Badge>
                  </div>
                  <div className="mt-3 flex items-center gap-3">
                    <ProgressBar value={t.progress} className="flex-1" />
                    <span className="text-[11px] tabular-nums text-zinc-500">{t.progress}%</span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 py-10 text-center">
              <CheckSquare className="h-5 w-5 text-zinc-600" />
              <p className="text-sm text-zinc-500">No open tasks — you&apos;re all caught up.</p>
            </div>
          )}

          {/* My projects strip */}
          <div className="mt-auto border-t border-white/[0.07] pt-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                My projects
              </h3>
              <Link href="/my-projects" className="text-xs text-zinc-500 hover:text-white">
                All
              </Link>
            </div>
            {projects.length ? (
              <ul className="flex flex-col gap-2">
                {projects.slice(0, 3).map((p) => (
                  <li key={p.id}>
                    <Link
                      href={`/projects/${p.slug}`}
                      className="flex items-center justify-between rounded-xl border border-white/[0.07] bg-zinc-950/50 px-3.5 py-2.5 transition-colors hover:border-brand-400/40"
                    >
                      <span className="flex items-center gap-2.5 text-sm text-white">
                        <FolderKanban className="h-4 w-4 text-brand-300" />
                        {p.title}
                      </span>
                      <Badge variant="small">{p.status.replace("_", " ")}</Badge>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-zinc-600">Nothing yet — publish your first project.</p>
            )}
          </div>
        </Card>

        {/* Right rail — timeline of events + notifications */}
        <div className="flex flex-col gap-5">
          <Card className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold tracking-tight text-white">Upcoming events</h2>
              <Link href="/calendar" className="text-xs text-zinc-500 hover:text-white">
                Calendar
              </Link>
            </div>
            {events.length ? (
              <ul className="relative flex flex-col gap-0">
                {events.map((e, i) => (
                  <li key={e.id} className="relative flex gap-4 pb-5 last:pb-0">
                    {i < events.length - 1 && (
                      <span className="absolute left-[15px] top-8 h-[calc(100%-24px)] w-px border-l border-dashed border-white/15" />
                    )}
                    <span className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-zinc-900 text-brand-300">
                      <CalendarDays className="h-3.5 w-3.5" />
                    </span>
                    <Link href={`/events/${e.slug}`} className="group min-w-0 flex-1 pt-1">
                      <div className="truncate text-sm font-medium text-white group-hover:text-brand-200">
                        {e.title}
                      </div>
                      <div className="mt-0.5 text-[11px] text-zinc-500">
                        {formatDate(e.starts_at)}
                        {e.venue ? ` · ${e.venue}` : ""}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="py-6 text-center text-sm text-zinc-500">No upcoming events.</p>
            )}
          </Card>

          <Card className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-semibold tracking-tight text-white">
                Notifications
                {unread > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-500 px-1.5 text-[10px] font-semibold text-white">
                    {unread}
                  </span>
                )}
              </h2>
              <Link href="/notifications" className="text-xs text-zinc-500 hover:text-white">
                All
              </Link>
            </div>
            {notifications.length ? (
              <ul className="flex flex-col gap-2.5">
                {notifications.slice(0, 4).map((n) => (
                  <li key={n.id} className="flex items-start gap-3">
                    <span
                      className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.read ? "bg-zinc-700" : "bg-brand-400"}`}
                    />
                    <div className="min-w-0">
                      <div className="truncate text-sm text-white">{n.title}</div>
                      <div className="text-[11px] text-zinc-600">{timeAgo(n.created_at)}</div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="flex items-center gap-2 py-4 text-sm text-zinc-500">
                <Bell className="h-4 w-4 text-zinc-600" /> Nothing new yet.
              </p>
            )}
          </Card>

          {achievements.length > 0 && (
            <Card className="p-6">
              <h2 className="mb-4 text-sm font-semibold tracking-tight text-white">Club wins</h2>
              <ul className="flex flex-col gap-2.5">
                {achievements.slice(0, 3).map((a) => (
                  <li key={a.id} className="flex items-center gap-3">
                    <Award className="h-4 w-4 shrink-0 text-amber-300" />
                    <span className="truncate text-sm text-zinc-300">{a.title}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
