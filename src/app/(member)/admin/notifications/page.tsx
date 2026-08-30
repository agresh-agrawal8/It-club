import type { Metadata } from "next";
import { Bell, AlertTriangle } from "lucide-react";
import { requireCoreTeam } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AdminPageHeader, DeleteButton } from "@/components/admin/admin-shell";
import { AdminCreateForm } from "@/components/admin/create-form";
import { sendNotificationAction, deleteNotificationAction } from "@/lib/actions/content";
import { timeAgo } from "@/lib/utils";

export const metadata: Metadata = { title: "Notifications" };

interface Row {
  id: string;
  title: string;
  body: string | null;
  type: string;
  urgent: boolean;
  read: boolean;
  created_at: string;
  recipient_id: string;
}

export default async function AdminNotificationsPage() {
  await requireCoreTeam();

  let recent: Row[] = [];
  let memberCount = 0;
  try {
    const supabase = await createClient();
    const [{ data }, { count }] = await Promise.all([
      supabase
        .from("notifications")
        .select("id,title,body,type,urgent,read,created_at,recipient_id")
        .order("created_at", { ascending: false })
        .limit(40),
      supabase.from("profiles").select("*", { count: "exact", head: true }).eq("is_active", true),
    ]);
    recent = (data as Row[]) ?? [];
    memberCount = count ?? 0;
  } catch {
    /* degrade */
  }

  // Group identical broadcasts (same title + timestamp minute) for a clean list.
  const grouped = Object.values(
    recent.reduce<Record<string, Row & { count: number }>>((acc, n) => {
      const key = `${n.title}|${n.created_at.slice(0, 16)}`;
      if (acc[key]) acc[key].count += 1;
      else acc[key] = { ...n, count: 1 };
      return acc;
    }, {}),
  );

  return (
    <div className="flex flex-col gap-8">
      <AdminPageHeader
        title="Notifications"
        description={`Broadcast an announcement to the club. Urgent notices pop up the moment a member opens their dashboard. ${memberCount} active accounts.`}
        backHref="/admin"
      />

      <Card surface deep className="p-6 md:p-8">
        <h2 className="mb-5 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-ink-3">
          <Bell className="h-4 w-4" /> Send a notification
        </h2>
        <AdminCreateForm
          action={sendNotificationAction}
          submitLabel="Send to club"
          successMessage="Notification sent."
          fields={[
            { name: "title", label: "Title", required: true, placeholder: "Hack night moved to Friday", span: "full" },
            { name: "body", label: "Message", type: "textarea", span: "full", placeholder: "The details members need…" },
            {
              name: "audience",
              label: "Send to",
              type: "select",
              options: [
                { value: "all", label: "Everyone" },
                { value: "members", label: "Members only" },
                { value: "admins", label: "Core team only" },
              ],
            },
            {
              name: "type",
              label: "Category",
              type: "select",
              options: [
                { value: "info", label: "General info" },
                { value: "event", label: "Event" },
                { value: "task", label: "Task" },
                { value: "project", label: "Project" },
                { value: "achievement", label: "Achievement" },
                { value: "system", label: "System" },
              ],
            },
            { name: "link", label: "Link (optional)", placeholder: "/events" },
            {
              name: "urgent",
              label: "Priority",
              type: "select",
              options: [
                { value: "", label: "Normal — appears in the bell" },
                { value: "true", label: "🔴 Urgent — pops up on their dashboard" },
              ],
            },
          ]}
        />
      </Card>

      <section className="flex flex-col gap-4">
        <h2 className="headline-wide text-sm text-white">
          Sent recently
        </h2>
        {grouped.length === 0 && (
          <p className="text-sm text-ink-4">Nothing sent yet — your first broadcast goes above.</p>
        )}
        {grouped.map((n) => (
          <Card surface key={n.id} className="flex items-center justify-between gap-4 p-5">
            <div className="flex min-w-0 items-center gap-4">
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${
                  n.urgent ? "bg-red-500/15 text-red-300" : "bg-brand-500/15 text-brand-300"
                }`}
              >
                {n.urgent ? <AlertTriangle className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
              </span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="truncate text-sm font-semibold text-white">{n.title}</span>
                  {n.urgent && <Badge variant="danger">Urgent</Badge>}
                  <Badge variant="small">{n.type}</Badge>
                </div>
                <p className="mt-0.5 truncate text-xs text-ink-4">
                  {n.count} recipient{n.count > 1 ? "s" : ""} · {timeAgo(n.created_at)}
                  {n.body ? ` · ${n.body}` : ""}
                </p>
              </div>
            </div>
            <DeleteButton action={deleteNotificationAction} id={n.id} />
          </Card>
        ))}
      </section>
    </div>
  );
}
