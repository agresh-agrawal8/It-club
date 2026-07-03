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
} from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { getPlatformStats } from "@/lib/data";
import { StatCard } from "@/components/ui/stat-card";
import { Card } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";

export const metadata: Metadata = { title: "Admin Console" };

export default async function AdminPage() {
  await requireAdmin();
  const stats = await getPlatformStats();

  const tiles = [
    { label: "Total members", value: stats.members, icon: <Users className="h-5 w-5" /> },
    { label: "Active members", value: stats.activeMembers, icon: <UserCheck className="h-5 w-5" /> },
    { label: "Projects", value: stats.projects, icon: <Code2 className="h-5 w-5" /> },
    { label: "Events", value: stats.events, icon: <CalendarDays className="h-5 w-5" /> },
    { label: "Competitions", value: stats.competitions, icon: <Trophy className="h-5 w-5" /> },
    { label: "Achievements", value: stats.achievements, icon: <Award className="h-5 w-5" /> },
    { label: "Website visitors", value: stats.visitors, icon: <Eye className="h-5 w-5" /> },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-amber-300">Core team</p>
          <h1 className="text-3xl font-semibold tracking-tighter text-white md:text-4xl">Admin Console</h1>
          <p className="mt-1 text-sm text-zinc-400">Platform analytics and management at a glance.</p>
        </div>
        <ButtonLink href="/admin/members" size="sm">
          <UserPlus className="h-4 w-4" /> Manage members
        </ButtonLink>
      </div>

      {/* Analytics */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map((t) => (
          <StatCard key={t.label} label={t.label} value={t.value} icon={t.icon} />
        ))}
      </section>

      {/* Management shortcuts */}
      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">Manage</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { label: "Members", desc: "Create & manage accounts", href: "/admin/members", icon: <Users className="h-5 w-5" /> },
            { label: "Projects", desc: "Moderate the showcase", href: "/projects", icon: <Code2 className="h-5 w-5" /> },
            { label: "Events", desc: "Publish upcoming events", href: "/events", icon: <CalendarDays className="h-5 w-5" /> },
            { label: "Competitions", desc: "Track contests & results", href: "/competitions", icon: <Trophy className="h-5 w-5" /> },
            { label: "Gallery", desc: "Curate photos", href: "/gallery", icon: <Award className="h-5 w-5" /> },
            { label: "Achievements", desc: "Celebrate milestones", href: "/achievements", icon: <Award className="h-5 w-5" /> },
          ].map((item) => (
            <Link key={item.label} href={item.href}>
              <Card hoverLift className="flex items-center justify-between p-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-500/15 text-brand-300">
                    {item.icon}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">{item.label}</div>
                    <div className="text-xs text-zinc-500">{item.desc}</div>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-zinc-600" />
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <p className="text-xs text-zinc-600">
        Note: full CRUD editors for events, competitions, gallery and achievements can be added here
        following the same server-action + form pattern used for projects and members. Content is
        already RLS-protected so only admins can write.
      </p>
    </div>
  );
}
