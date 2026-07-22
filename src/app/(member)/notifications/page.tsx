import type { Metadata } from "next";
import { Bell, Check } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getMyNotifications } from "@/lib/data";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { markNotificationReadAction, markAllNotificationsReadAction } from "@/lib/actions/member";
import { timeAgo } from "@/lib/utils";

export const metadata: Metadata = { title: "Notifications" };

// Palette-consistent: brand violet, plus the semantic accents already used
// across the app (amber = attention, emerald = positive, zinc = neutral).
const typeColor: Record<string, string> = {
  info: "bg-brand-400",
  task: "bg-amber-400",
  event: "bg-emerald-400",
  project: "bg-brand-300",
  achievement: "bg-amber-300",
  system: "bg-zinc-400",
};

export default async function NotificationsPage() {
  const { user } = await requireUser();
  const notifications = await getMyNotifications(user.id);
  const unread = notifications.filter((n) => !n.read);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tighter text-white md:text-4xl">Notifications</h1>
          <p className="mt-1 text-sm text-zinc-400">
            {unread.length ? `${unread.length} unread` : "You're all caught up."}
          </p>
        </div>
        {unread.length > 0 && (
          <form action={markAllNotificationsReadAction}>
            <Button type="submit" variant="secondary" size="sm">
              <Check className="h-4 w-4" /> Mark all read
            </Button>
          </form>
        )}
      </div>

      {notifications.length ? (
        <div className="flex flex-col gap-2">
          {notifications.map((n) => (
            <Card
              key={n.id}
              className={`flex items-start gap-4 p-5 ${n.read ? "opacity-70" : "border-brand-400/20"}`}
            >
              <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${typeColor[n.type] ?? "bg-brand-400"}`} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold text-white">{n.title}</h3>
                  <span className="shrink-0 text-xs text-zinc-500">{timeAgo(n.created_at)}</span>
                </div>
                {n.body && <p className="mt-1 text-sm text-zinc-400">{n.body}</p>}
                {n.link && (
                  <a href={n.link} className="mt-2 inline-block text-xs text-brand-300 hover:text-brand-200">
                    View details →
                  </a>
                )}
              </div>
              {!n.read && (
                <form action={markNotificationReadAction}>
                  <input type="hidden" name="id" value={n.id} />
                  <button
                    type="submit"
                    className="rounded-full p-2 text-zinc-500 transition-colors hover:bg-white/5 hover:text-white"
                    title="Mark as read"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                </form>
              )}
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Bell className="h-6 w-6" />}
          title="No notifications"
          description="Updates about tasks, events and achievements will appear here."
        />
      )}
    </div>
  );
}
