import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays, MapPin, CheckSquare } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getEvents, getMyTasks } from "@/lib/data";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate, formatTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Calendar" };

interface AgendaItem {
  id: string;
  kind: "event" | "task";
  title: string;
  date: string;
  meta?: string;
  href: string;
}

export default async function CalendarPage() {
  const { user } = await requireUser();
  const [events, tasks] = await Promise.all([getEvents(), getMyTasks(user.id)]);

  const now = Date.now();
  const items: AgendaItem[] = [
    ...events
      .filter((e) => new Date(e.starts_at).getTime() >= now)
      .map((e) => ({
        id: e.id,
        kind: "event" as const,
        title: e.title,
        date: e.starts_at,
        meta: e.venue ?? undefined,
        href: `/events/${e.slug}`,
      })),
    ...tasks
      .filter((t) => t.deadline && t.status !== "done")
      .map((t) => ({
        id: t.id,
        kind: "task" as const,
        title: t.title,
        date: t.deadline!,
        meta: `Task · ${t.priority}`,
        href: "/my-tasks",
      })),
  ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Group by month label
  const groups = new Map<string, AgendaItem[]>();
  for (const it of items) {
    const label = new Date(it.date).toLocaleDateString("en-GB", { month: "long", year: "numeric" });
    if (!groups.has(label)) groups.set(label, []);
    groups.get(label)!.push(it);
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tighter text-white md:text-4xl">Calendar</h1>
        <p className="mt-1 text-sm text-zinc-400">Upcoming events and your task deadlines in one place.</p>
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={<CalendarDays className="h-6 w-6" />}
          title="Nothing scheduled"
          description="Upcoming events and task deadlines will appear here."
        />
      ) : (
        <div className="flex flex-col gap-10">
          {Array.from(groups.entries()).map(([month, entries]) => (
            <section key={month} className="flex flex-col gap-4">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">{month}</h2>
              <div className="flex flex-col gap-3">
                {entries.map((it) => (
                  <Link key={`${it.kind}-${it.id}`} href={it.href}>
                    <Card className="flex items-center gap-4 p-4 transition-colors hover:border-brand-400/40">
                      <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-2xl bg-brand-500/15 text-brand-300">
                        <span className="text-lg font-semibold leading-none">
                          {new Date(it.date).getDate()}
                        </span>
                        <span className="text-[10px] uppercase">
                          {new Date(it.date).toLocaleDateString("en-GB", { month: "short" })}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-white">{it.title}</span>
                          <Badge variant={it.kind === "event" ? "accent" : "warning"}>{it.kind}</Badge>
                        </div>
                        <div className="mt-1 flex items-center gap-3 text-xs text-zinc-500">
                          <span className="flex items-center gap-1">
                            {it.kind === "event" ? (
                              <CalendarDays className="h-3 w-3" />
                            ) : (
                              <CheckSquare className="h-3 w-3" />
                            )}
                            {formatDate(it.date)} · {formatTime(it.date)}
                          </span>
                          {it.meta && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" /> {it.meta}
                            </span>
                          )}
                        </div>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
