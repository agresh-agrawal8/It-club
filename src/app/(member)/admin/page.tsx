import type { Metadata } from "next";
import Link from "next/link";
import {
  Users,
  UserCheck,
  Code2,
  CalendarDays,
  Trophy,
  Award,
  Eye,
  ArrowRight,
  UserPlus,
  Inbox,
  ImageIcon,
  Mail,
} from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getPlatformStats } from "@/lib/data";
import { StatCard } from "@/components/ui/stat-card";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { roleLabel, timeAgo } from "@/lib/utils";

export const metadata: Metadata = { title: "Core Team Panel" };

export default async function AdminPage() {
  const { profile } = await requireAdmin();
  const stats = await getPlatformStats();

  // Latest unhandled contact messages for the inbox preview.
  let messages: { id: string; name: string; subject: string | null; message: string; created_at: string }[] = [];
  let pendingCount = 0;
  try {
    const supabase = await createClient();
    const [{ data }, { count }] = await Promise.all([
      supabase
        .from("contact_messages")
        .select("id,name,subject,message,created_at")
        .eq("handled", false)
        .order("created_at", { ascending: false })
        .limit(4),
      supabase
        .from("contact_messages")
        .select("*", { count: "exact", head: true })
        .eq("handled", false),
    ]);
    messages = data ?? [];
    pendingCount = count ?? 0;
  } catch {
    /* panel still renders without the inbox */
  }

  const tiles = [
    { label: "Total members", value: stats.members, icon: <Users className="h-5 w-5" /> },
    { label: "Active members", value: stats.activeMembers, icon: <UserCheck className="h-5 w-5" /> },
    { label: "Projects", value: stats.projects, icon: <Code2 className="h-5 w-5" /> },
    { label: "Events", value: stats.events, icon: <CalendarDays className="h-5 w-5" /> },
    { label: "Competitions", value: stats.competitions, icon: <Trophy className="h-5 w-5" /> },
    { label: "Achievements", value: stats.achievements, icon: <Award className="h-5 w-5" /> },
    { label: "Website visitors", value: stats.visitors, icon: <Eye className="h-5 w-5" /> },
    { label: "Pending messages", value: pendingCount, icon: <Inbox className="h-5 w-5" /> },
  ];

  const manage = [
    { label: "Members", desc: "Accounts, roles & access", href: "/admin/members", icon: Users },
    { label: "Events", desc: "Publish & manage events", href: "/admin/events", icon: CalendarDays },
    { label: "Competitions", desc: "Contests & results", href: "/admin/competitions", icon: Trophy },
    { label: "Achievements", desc: "Awards & milestones", href: "/admin/achievements", icon: Award },
    { label: "Gallery", desc: "Curate club photos", href: "/admin/gallery", icon: ImageIcon },
    { label: "Messages", desc: "Contact form inbox", href: "/admin/messages", icon: Mail },
  ];

  return (
    <div className="flex flex-col gap-10">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <p className="text-xs font-medium uppercase tracking-[2px] text-amber-300/90">
              Core Team Panel
            </p>
            <Badge variant="accent">{roleLabel(profile?.role)}</Badge>
          </div>
          <h1 className="mt-1.5 text-3xl font-semibold tracking-tighter text-white md:text-4xl">
            Welcome, {(profile?.full_name || "Admin").split(" ")[0]}
          </h1>
          <p className="mt-1.5 text-sm text-zinc-400">
            Everything the club runs on — analytics, content and people.
          </p>
        </div>
        <ButtonLink href="/admin/members" size="sm">
          <UserPlus className="h-4 w-4" /> Add member
        </ButtonLink>
      </div>

      {/* Analytics */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map((t) => (
          <StatCard key={t.label} label={t.label} value={t.value} icon={t.icon} />
        ))}
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        {/* Management */}
        <section className="flex flex-col gap-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">Manage</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {manage.map(({ label, desc, href, icon: Icon }) => (
              <Link key={href} href={href}>
                <Card hoverLift className="flex items-center justify-between p-6">
                  <div className="flex items-center gap-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-500/15 text-brand-300">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white">{label}</div>
                      <div className="text-xs text-zinc-500">{desc}</div>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-zinc-600" />
                </Card>
              </Link>
            ))}
          </div>
        </section>

        {/* Inbox preview */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">
              Latest messages
            </h2>
            <Link
              href="/admin/messages"
              className="flex items-center gap-1 text-xs text-brand-300 hover:text-brand-200"
            >
              Open inbox <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <Card className="flex flex-col gap-3 p-5">
            {messages.length === 0 && (
              <p className="py-8 text-center text-sm text-zinc-500">
                No pending messages. Inbox zero.
              </p>
            )}
            {messages.map((m) => (
              <Link
                key={m.id}
                href="/admin/messages"
                className="rounded-xl border border-white/5 bg-zinc-950/50 p-3.5 transition-colors hover:border-white/15"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="truncate text-sm font-medium text-white">{m.name}</span>
                  <span className="shrink-0 text-[11px] text-zinc-600">{timeAgo(m.created_at)}</span>
                </div>
                <p className="mt-1 truncate text-xs text-zinc-400">
                  {m.subject || m.message}
                </p>
              </Link>
            ))}
          </Card>
        </section>
      </div>
    </div>
  );
}
