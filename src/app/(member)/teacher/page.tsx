import type { Metadata } from "next";
import Link from "next/link";
import {
  Users,
  Code2,
  CalendarDays,
  Trophy,
  Award,
  Inbox,
  UserPlus,
  Eye,
  ArrowRight,
} from "lucide-react";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getPlatformStats, getTeam, getProjects, getUpcomingEvents, getMyNotifications } from "@/lib/data";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { UrgentAlert } from "@/components/member/urgent-alert";
import { formatDate, timeAgo, isAdminRole, roleLabel } from "@/lib/utils";

export const metadata: Metadata = { title: "Teacher Panel" };

interface SubmissionRow {
  id: string;
  name: string;
  title: string;
  category: string;
  handled: boolean;
  created_at: string;
}
interface ApplicationRow {
  id: string;
  name: string;
  grade: string | null;
  status: string;
  created_at: string;
}

export default async function TeacherPage() {
  const { user, profile } = await requireStaff();

  const [stats, team, projects, events, myNotifications] = await Promise.all([
    getPlatformStats(),
    getTeam(),
    getProjects(),
    getUpcomingEvents(4),
    getMyNotifications(user.id),
  ]);

  // Read-only oversight data (teachers have SELECT via is_staff()).
  let submissions: SubmissionRow[] = [];
  let applications: ApplicationRow[] = [];
  try {
    const supabase = await createClient();
    const [subs, apps] = await Promise.all([
      supabase
        .from("submissions")
        .select("id,name,title,category,handled,created_at")
        .order("created_at", { ascending: false })
        .limit(6),
      supabase
        .from("join_requests")
        .select("id,name,grade,status,created_at")
        .order("created_at", { ascending: false })
        .limit(6),
    ]);
    submissions = (subs.data as SubmissionRow[]) ?? [];
    applications = (apps.data as ApplicationRow[]) ?? [];
  } catch {
    /* degrade gracefully */
  }

  const urgentNotices = myNotifications
    .filter((n) => n.urgent && !n.read)
    .map((n) => ({ id: n.id, title: n.title, body: n.body, link: n.link, created_at: n.created_at }));

  const today = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "short",
  });

  const tiles = [
    { value: stats.members, label: "Members", icon: Users },
    { value: stats.projects, label: "Projects", icon: Code2 },
    { value: stats.events + stats.competitions, label: "Events & contests", icon: Trophy },
    { value: stats.achievements, label: "Achievements", icon: Award },
  ];

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      {urgentNotices.length > 0 && <UrgentAlert notices={urgentNotices} />}

      {/* Greeting */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs text-zinc-500">{today}</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tighter text-white sm:text-3xl md:text-4xl">
            Welcome, {(profile?.full_name || "Teacher").split(" ")[0]}
          </h1>
          <p className="mt-1 flex items-center gap-2 text-sm text-zinc-500">
            <Eye className="h-3.5 w-3.5" /> Read-only view of club activity
          </p>
        </div>
        <div className="flex items-center gap-3 rounded-full border border-white/10 py-1.5 pl-1.5 pr-4">
          <Avatar name={profile?.full_name || "Teacher"} src={profile?.avatar_url} size="sm" />
          <div>
            <div className="text-xs font-medium text-white">{profile?.full_name}</div>
            <div className="text-[10px] uppercase tracking-wide text-sky-300/90">
              {roleLabel(profile?.role)}
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {tiles.map(({ value, label, icon: Icon }) => (
          <Card key={label} className="p-5 md:p-6">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500/15 text-brand-300">
              <Icon className="h-4 w-4" />
            </span>
            <div className="mt-4 text-3xl font-semibold tracking-tighter text-white md:text-4xl">
              {value}
            </div>
            <div className="mt-1 text-[11px] uppercase tracking-wide text-zinc-500">{label}</div>
          </Card>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Members roster */}
        <Card className="p-5 md:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold tracking-tight text-white">
              Club members <span className="text-zinc-600">({team.length})</span>
            </h2>
            <Link href="/team" className="text-xs text-zinc-500 hover:text-white">
              Public page
            </Link>
          </div>
          {team.length === 0 ? (
            <p className="py-6 text-sm text-zinc-500">No members yet.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {team.map((m) => (
                <li
                  key={m.id}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-white/[0.07] bg-zinc-950/50 px-3.5 py-2.5"
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <Avatar name={m.full_name || "Member"} src={m.avatar_url} size="sm" />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-white">
                        {m.full_name || "Member"}
                      </span>
                      <span className="block text-[11px] text-zinc-500">
                        {m.member_id ?? "—"}
                        {m.grade ? ` · ${m.grade}` : ""}
                      </span>
                    </span>
                  </span>
                  <Badge variant={isAdminRole(m.role) ? "accent" : "small"}>
                    {roleLabel(m.role)}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Student projects */}
        <Card className="p-5 md:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold tracking-tight text-white">
              Student projects <span className="text-zinc-600">({projects.length})</span>
            </h2>
            <Link href="/projects" className="text-xs text-zinc-500 hover:text-white">
              Browse all
            </Link>
          </div>
          {projects.length === 0 ? (
            <p className="py-6 text-sm text-zinc-500">No projects published yet.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {projects.slice(0, 6).map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/projects/${p.slug}`}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-white/[0.07] bg-zinc-950/50 px-3.5 py-2.5 transition-colors hover:border-brand-400/40"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-white">{p.title}</span>
                      {p.summary && (
                        <span className="block truncate text-[11px] text-zinc-500">{p.summary}</span>
                      )}
                    </span>
                    <Badge variant="small">{p.status.replace("_", " ")}</Badge>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Submissions (read-only) */}
        <Card className="p-5 md:p-6">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold tracking-tight text-white">
            <Inbox className="h-4 w-4 text-brand-300" /> Recent submissions
          </h2>
          {submissions.length === 0 ? (
            <p className="py-6 text-sm text-zinc-500">Nothing submitted yet.</p>
          ) : (
            <ul className="flex flex-col gap-2.5">
              {submissions.map((s) => (
                <li key={s.id} className="rounded-2xl border border-white/[0.07] bg-zinc-950/50 p-3.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate text-sm font-medium text-white">{s.title}</span>
                    <Badge variant="small">{s.category}</Badge>
                    {s.handled && <Badge variant="success">Handled</Badge>}
                  </div>
                  <p className="mt-0.5 text-[11px] text-zinc-500">
                    {s.name} · {timeAgo(s.created_at)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Applications + events */}
        <div className="flex flex-col gap-5">
          <Card className="p-5 md:p-6">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold tracking-tight text-white">
              <UserPlus className="h-4 w-4 text-brand-300" /> Membership applications
            </h2>
            {applications.length === 0 ? (
              <p className="py-4 text-sm text-zinc-500">No applications yet.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {applications.map((a) => (
                  <li
                    key={a.id}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-white/[0.07] bg-zinc-950/50 px-3.5 py-2.5"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm text-white">{a.name}</span>
                      <span className="block text-[11px] text-zinc-500">
                        {a.grade ?? "—"} · {timeAgo(a.created_at)}
                      </span>
                    </span>
                    <Badge
                      variant={
                        a.status === "approved"
                          ? "success"
                          : a.status === "rejected"
                            ? "danger"
                            : "warning"
                      }
                    >
                      {a.status}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card className="p-5 md:p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-semibold tracking-tight text-white">
                <CalendarDays className="h-4 w-4 text-brand-300" /> Upcoming
              </h2>
              <Link href="/events" className="text-xs text-zinc-500 hover:text-white">
                All events <ArrowRight className="inline h-3 w-3" />
              </Link>
            </div>
            {events.length === 0 ? (
              <p className="py-4 text-sm text-zinc-500">No upcoming events.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {events.map((e) => (
                  <li key={e.id}>
                    <Link
                      href={`/events/${e.slug}`}
                      className="flex items-center justify-between gap-3 rounded-2xl border border-white/[0.07] bg-zinc-950/50 px-3.5 py-2.5 transition-colors hover:border-brand-400/40"
                    >
                      <span className="truncate text-sm text-white">{e.title}</span>
                      <span className="shrink-0 text-[11px] text-zinc-500">
                        {formatDate(e.starts_at)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>

      <p className="text-center text-[11px] text-zinc-600">
        Teacher accounts are read-only — content is managed by the core team.
      </p>
    </div>
  );
}
