import { notFound } from "next/navigation";
import Link from "next/link";
import { Radio, Trash2, Users, Megaphone, Rocket, ArrowLeft } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getEvent, getEventSettings, countRegistered } from "@/lib/events/engine";
import { getMissions, getAnnouncements } from "@/lib/events/queries";
import { requireEventAdmin } from "@/lib/events/auth";
import { createClient } from "@/lib/supabase/server";
import { AnnouncementComposer } from "@/components/events/admin/announcement-composer";
import { EventMark } from "@/components/events/shell/event-mark";
import {
  deleteEventAnnouncementAction,
  setMissionStatusAction,
  setEventStatusAction,
} from "@/lib/events/actions/admin";
import { timeAgo } from "@/lib/utils";
import { eventBasePath } from "@/lib/events/paths";

export const metadata = { title: "Organiser console" };

const EVENT_STATUSES = [
  "draft",
  "published",
  "registration",
  "live",
  "judging",
  "closed",
  "archived",
] as const;

const MISSION_NEXT: Record<string, { label: string; to: string }> = {
  draft: { label: "Open", to: "open" },
  scheduled: { label: "Open", to: "open" },
  open: { label: "Close", to: "closed" },
  closed: { label: "Re-open", to: "open" },
};

const SEV_VARIANT: Record<string, "accent" | "success" | "warning" | "danger" | "small"> = {
  info: "small",
  success: "success",
  warning: "warning",
  critical: "danger",
};

export default async function EventAdminPage({
  params,
}: {
  params: Promise<{ event: string }>;
}) {
  const { event: slug } = await params;
  const event = await getEvent(slug);
  if (!event) notFound();

  // Organiser gate. Club admins (is_admin) and event admins both pass.
  await requireEventAdmin(event.id, event.slug);

  // getEventSettings still runs: it is what raises if the event is
  // misconfigured, even though this page renders nothing from it.
  const [, registered, missions, announcements] = await Promise.all([
    getEventSettings(event.id),
    countRegistered(event.id),
    getMissions(event.id),
    getAnnouncements(event.id, 20),
  ]);

  // Pending registrations (only relevant in review mode).
  const supabase = await createClient();
  const { data: pending } = await supabase
    .from("ev_participants")
    .select("id, display_name, status, ev_profiles(full_name, institution, grade)")
    .eq("event_id", event.id)
    .eq("status", "pending")
    .limit(50);

  const base = eventBasePath(event.slug);
  const completedMissions = missions.filter((m) => m.status === "open").length;

  return (
    <Container className="flex flex-col gap-7 py-10">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link
            href={base}
            className="mb-2 inline-flex items-center gap-1.5 text-xs text-zinc-400 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> {event.name}
          </Link>
          <h1 className="flex items-center gap-3 text-3xl font-semibold tracking-tighter text-white">
            <EventMark title={event.name} className="h-11 w-11 rounded-xl" />
            Organiser console
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="accent">{event.status}</Badge>
        </div>
      </div>

      {/* Stat strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Registered", value: registered, icon: Users },
          { label: "Missions open", value: completedMissions, icon: Rocket },
          { label: "Announcements", value: announcements.length, icon: Megaphone },
          { label: "Pending", value: pending?.length ?? 0, icon: Radio },
        ].map(({ label, value, icon: Icon }) => (
          <Card key={label} className="flex flex-col gap-1 p-4">
            <Icon className="h-4 w-4 text-zinc-400" />
            <span className="font-mono text-2xl font-semibold tabular-nums text-white">{value}</span>
            <span className="text-[11px] uppercase tracking-wide text-zinc-500">{label}</span>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="flex flex-col gap-6">
          {/* Missions */}
          <Card className="p-6">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
              <Rocket className="h-4 w-4" style={{ color: "var(--ev-accent)" }} /> Mission control
            </h2>
            {missions.length === 0 ? (
              <p className="text-sm text-zinc-500">No missions defined for this event.</p>
            ) : (
              <ul className="flex flex-col divide-y divide-white/[0.06]">
                {missions.map((m) => {
                  const next = MISSION_NEXT[m.status];
                  return (
                    <li key={m.id} className="flex items-center gap-3 py-3">
                      <span className="font-mono text-xs text-zinc-500">{m.code}</span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium text-white">{m.title}</div>
                        <div className="text-[11px] text-zinc-500">
                          {m.points} pts · {m.difficulty}
                        </div>
                      </div>
                      <Badge variant={m.status === "open" ? "success" : "small"}>{m.status}</Badge>
                      {next && (
                        <form action={setMissionStatusAction}>
                          <input type="hidden" name="event_slug" value={slug} />
                          <input type="hidden" name="mission_id" value={m.id} />
                          <input type="hidden" name="status" value={next.to} />
                          <button className="rounded-full border border-white/10 px-3 py-1 text-xs text-zinc-300 transition-colors hover:border-[var(--ev-accent)] hover:text-white">
                            {next.label}
                          </button>
                        </form>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          {/* Pending registrations */}
          {(pending?.length ?? 0) > 0 && (
            <Card className="p-6">
              <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
                <Users className="h-4 w-4" style={{ color: "var(--ev-accent)" }} /> Pending
                registrations
              </h2>
              <ul className="flex flex-col gap-2">
                {pending!.map((p: any) => (
                  <li
                    key={p.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.07] bg-zinc-950/40 px-3.5 py-2.5"
                  >
                    <div>
                      <div className="text-sm text-white">
                        {p.display_name ?? p.ev_profiles?.full_name ?? "Participant"}
                      </div>
                      <div className="text-[11px] text-zinc-500">
                        {[p.ev_profiles?.institution, p.ev_profiles?.grade]
                          .filter(Boolean)
                          .join(" · ")}
                      </div>
                    </div>
                    <Badge variant="warning">pending</Badge>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>

        <div className="flex flex-col gap-6">
          {/* Event status */}
          <Card className="p-6">
            <h2 className="mb-4 text-sm font-semibold text-white">Event status</h2>
            <div className="flex flex-wrap gap-2">
              {EVENT_STATUSES.map((s) => (
                <form key={s} action={setEventStatusAction}>
                  <input type="hidden" name="event_slug" value={slug} />
                  <input type="hidden" name="status" value={s} />
                  <button
                    className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                      event.status === s
                        ? "border-[var(--ev-accent)] bg-[var(--ev-accent)]/15 text-white"
                        : "border-white/10 text-zinc-400 hover:border-white/25 hover:text-white"
                    }`}
                  >
                    {s}
                  </button>
                </form>
              ))}
            </div>
          </Card>

          {/* Announcements */}
          <Card className="p-6">
            <AnnouncementComposer eventSlug={slug} />

            {announcements.length > 0 && (
              <ul className="mt-5 flex flex-col gap-2 border-t border-white/[0.06] pt-4">
                {announcements.map((a) => (
                  <li key={a.id} className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        {a.pinned && <Badge variant="accent">Pinned</Badge>}
                        <Badge variant={SEV_VARIANT[a.severity]}>{a.severity}</Badge>
                        <span className="truncate text-sm font-medium text-white">{a.title}</span>
                      </div>
                      {a.body && <p className="mt-0.5 text-xs text-zinc-400">{a.body}</p>}
                      <span className="text-[10px] text-zinc-600">{timeAgo(a.published_at)}</span>
                    </div>
                    <form action={deleteEventAnnouncementAction}>
                      <input type="hidden" name="event_slug" value={slug} />
                      <input type="hidden" name="id" value={a.id} />
                      <button
                        aria-label="Delete announcement"
                        className="rounded-lg p-1.5 text-zinc-500 transition-colors hover:bg-red-500/10 hover:text-red-400"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </form>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </Container>
  );
}
