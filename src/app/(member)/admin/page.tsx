import type { Metadata } from "next";
import Link from "next/link";
import {
  Users,
  Code2,
  CalendarDays,
  Trophy,
  Award,
  ArrowRight,
  ArrowUpRight,
  UserPlus,
  Inbox,
  ImageIcon,
  Mail,
} from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getPlatformStats } from "@/lib/data";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { roleLabel, timeAgo } from "@/lib/utils";

export const metadata: Metadata = { title: "Core Team Panel" };

export default async function AdminPage() {
  const { profile } = await requireAdmin();
  const stats = await getPlatformStats();

  // Inbox counters + latest items (best-effort; panel renders without them).
  let messages: { id: string; name: string; subject: string | null; message: string; created_at: string }[] = [];
  let pendingMessages = 0;
  let pendingSubmissions = 0;
  let pendingApplications = 0;
  try {
    const supabase = await createClient();
    const [msgs, msgCount, subCount, appCount] = await Promise.all([
      supabase
        .from("contact_messages")
        .select("id,name,subject,message,created_at")
        .eq("handled", false)
        .order("created_at", { ascending: false })
        .limit(3),
      supabase.from("contact_messages").select("*", { count: "exact", head: true }).eq("handled", false),
      supabase.from("submissions").select("*", { count: "exact", head: true }).eq("handled", false),
      supabase.from("join_requests").select("*", { count: "exact", head: true }).eq("status", "pending"),
    ]);
    messages = msgs.data ?? [];
    pendingMessages = msgCount.count ?? 0;
    pendingSubmissions = subCount.count ?? 0;
    pendingApplications = appCount.count ?? 0;
  } catch {
    /* degrade gracefully */
  }

  const today = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "short",
  });

  const bigStats = [
    { value: stats.members, label: "Members" },
    { value: stats.projects, label: "Projects" },
    { value: stats.events + stats.competitions, label: "Events & contests" },
    { value: stats.achievements, label: "Achievements" },
  ];

  // Real-data comparison chart (normalized pill columns).
  const chart = [
    { label: "Members", value: stats.members },
    { label: "Projects", value: stats.projects },
    { label: "Events", value: stats.events },
    { label: "Contests", value: stats.competitions },
    { label: "Awards", value: stats.achievements },
  ];
  const maxVal = Math.max(1, ...chart.map((c) => c.value));

  const inboxes = [
    { label: "Applications", desc: "membership requests", count: pendingApplications, href: "/admin/applications", icon: UserPlus },
    { label: "Submissions", desc: "competition & drive files", count: pendingSubmissions, href: "/admin/submissions", icon: Inbox },
    { label: "Messages", desc: "contact form", count: pendingMessages, href: "/admin/messages", icon: Mail },
  ];

  const manage = [
    { label: "Members", href: "/admin/members", icon: Users },
    { label: "Events", href: "/admin/events", icon: CalendarDays },
    { label: "Competitions", href: "/admin/competitions", icon: Trophy },
    { label: "Achievements", href: "/admin/achievements", icon: Award },
    { label: "Gallery", href: "/admin/gallery", icon: ImageIcon },
    { label: "Projects", href: "/projects", icon: Code2 },
  ];

  return (
    <div className="flex flex-col gap-8">
      {/* ── Greeting ── */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs text-zinc-500">{today}</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tighter text-white md:text-4xl">
            Welcome in, {(profile?.full_name || "Admin").split(" ")[0]}
          </h1>
          <p className="mt-1 text-sm text-zinc-500">{stats.members} members</p>
        </div>
        <div className="flex items-center gap-3 rounded-full border border-white/10 py-1.5 pl-1.5 pr-4">
          <Avatar name={profile?.full_name || "Admin"} src={profile?.avatar_url} size="sm" />
          <div>
            <div className="text-xs font-medium text-white">{profile?.full_name}</div>
            <div className="text-[10px] uppercase tracking-wide text-amber-300/90">
              {roleLabel(profile?.role)}
            </div>
          </div>
        </div>
      </div>

      {/* ── Big numerals ── */}
      <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
        {bigStats.map((s) => (
          <Card key={s.label} className="p-6">
            <div className="text-5xl font-semibold tracking-tighter text-white">{s.value}</div>
            <div className="mt-2 text-xs uppercase tracking-wide text-zinc-500">{s.label}</div>
          </Card>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.15fr_1fr]">
        {/* ── Activity chart + inboxes ── */}
        <div className="flex flex-col gap-5">
          <Card className="p-6">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-sm font-semibold tracking-tight text-white">Club at a glance</h2>
              <span className="text-[11px] text-zinc-600">live totals</span>
            </div>
            <div className="flex items-end justify-between gap-3 px-2">
              {chart.map((c) => {
                const h = Math.max(18, Math.round((c.value / maxVal) * 120));
                return (
                  <div key={c.label} className="flex flex-1 flex-col items-center gap-2.5">
                    <span className="text-xs font-semibold tabular-nums text-white">{c.value}</span>
                    <div
                      className="w-9 rounded-full bg-gradient-to-b from-brand-400 to-brand-600 shadow-[0_0_24px_-8px_var(--color-brand-500)] transition-all duration-500 hover:from-brand-300"
                      style={{ height: `${h}px`, opacity: c.value === 0 ? 0.25 : 1 }}
                    />
                    <span className="text-[10px] uppercase tracking-wide text-zinc-500">
                      {c.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Inbox tiles with pending counts */}
          <div className="grid gap-5 sm:grid-cols-3">
            {inboxes.map(({ label, desc, count, href, icon: Icon }) => (
              <Link key={href} href={href}>
                <Card hoverLift className="relative h-full p-5">
                  {count > 0 && (
                    <span className="absolute right-4 top-4 flex h-6 min-w-6 items-center justify-center rounded-full bg-brand-500 px-1.5 text-[11px] font-semibold text-white">
                      {count}
                    </span>
                  )}
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/15 text-brand-300">
                    <Icon className="h-4.5 w-4.5" />
                  </span>
                  <div className="mt-4 text-sm font-semibold text-white">{label}</div>
                  <div className="mt-0.5 text-[11px] text-zinc-500">{desc}</div>
                </Card>
              </Link>
            ))}
          </div>

          {/* Manage rail */}
          <Card className="p-5">
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Manage
            </h2>
            <div className="flex flex-wrap gap-2">
              {manage.map(({ label, href, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-xs text-zinc-300 transition-colors hover:border-amber-400/40 hover:text-amber-200"
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </Link>
              ))}
            </div>
          </Card>
        </div>

        {/* ── Latest messages timeline ── */}
        <Card className="flex flex-col p-6">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-sm font-semibold tracking-tight text-white">Latest messages</h2>
            <Link
              href="/admin/messages"
              className="flex items-center gap-1 text-xs text-zinc-500 hover:text-white"
            >
              Open inbox <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          {messages.length === 0 ? (
            <p className="flex flex-1 items-center justify-center py-10 text-sm text-zinc-500">
              Inbox zero. Nothing pending.
            </p>
          ) : (
            <ul className="relative flex flex-col">
              {messages.map((m, i) => (
                <li key={m.id} className="relative flex gap-4 pb-6 last:pb-0">
                  {i < messages.length - 1 && (
                    <span className="absolute left-[15px] top-9 h-[calc(100%-28px)] w-px border-l border-dashed border-white/15" />
                  )}
                  <span className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-zinc-900 text-brand-300">
                    <Mail className="h-3.5 w-3.5" />
                  </span>
                  <Link href="/admin/messages" className="group min-w-0 flex-1 pt-0.5">
                    <div className="flex items-center justify-between gap-3">
                      <span className="truncate text-sm font-medium text-white group-hover:text-brand-200">
                        {m.name}
                      </span>
                      <span className="shrink-0 text-[11px] text-zinc-600">
                        {timeAgo(m.created_at)}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-zinc-500">
                      {m.subject || m.message}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}

          <Link
            href="/admin/members"
            className="mt-auto flex items-center justify-between rounded-2xl border border-white/10 p-4 transition-colors hover:border-amber-400/40"
          >
            <span className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/15 text-amber-300">
                <UserPlus className="h-4 w-4" />
              </span>
              <span className="text-sm font-medium text-white">Add a member</span>
            </span>
            <ArrowUpRight className="h-4 w-4 text-zinc-500" />
          </Link>
        </Card>
      </div>

    </div>
  );
}
