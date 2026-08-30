import type { Metadata } from "next";
import { CalendarDays } from "lucide-react";
import { requireCoreTeam } from "@/lib/auth";
import { getEvents } from "@/lib/data";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AdminPageHeader, DeleteButton } from "@/components/admin/admin-shell";
import { AdminCreateForm } from "@/components/admin/create-form";
import { createEventAction, deleteEventAction } from "@/lib/actions/content";
import { formatDate, formatTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Events" };

const statusVariant = { upcoming: "accent", ongoing: "success", past: "small", cancelled: "danger" } as const;

export default async function AdminEventsPage() {
  await requireCoreTeam();
  const events = await getEvents();

  return (
    <div className="flex flex-col gap-8">
      <AdminPageHeader
        title="Events"
        description="Publish workshops, talks and hack nights. New events appear on the public site instantly."
        backHref="/admin"
      />

      <Card surface deep className="p-6 md:p-8">
        <h2 className="headline-wide mb-5 text-sm text-white">
          New event
        </h2>
        <AdminCreateForm
          action={createEventAction}
          submitLabel="Publish event"
          successMessage="Event published."
          fields={[
            { name: "title", label: "Title", required: true, placeholder: "Intro to Web Development" },
            {
              name: "kind",
              label: "Kind",
              type: "select",
              hint: "Competitions live here too — they are events with an organiser and a result.",
              options: [
                { value: "workshop", label: "Workshop" },
                { value: "competition", label: "Competition" },
                { value: "hackathon", label: "Hackathon" },
                { value: "talk", label: "Talk" },
                { value: "other", label: "Other" },
              ],
            },
            { name: "venue", label: "Venue", placeholder: "Computer Lab 2" },
            { name: "organizer", label: "Organiser", placeholder: "Leave blank if the club is running it" },
            { name: "result", label: "Result", placeholder: "e.g. 2nd place — fill in afterwards" },
            { name: "starts_at", label: "Starts", type: "datetime-local", required: true },
            { name: "ends_at", label: "Ends", type: "datetime-local" },
            {
              name: "status",
              label: "Status",
              type: "select",
              options: [
                { value: "upcoming", label: "Upcoming" },
                { value: "ongoing", label: "Ongoing" },
                { value: "past", label: "Past" },
                { value: "cancelled", label: "Cancelled" },
              ],
            },
            { name: "registration_url", label: "Registration link", type: "url", placeholder: "https://…" },
            { name: "banner_url", label: "Banner image", type: "image", bucket: "media", folder: "events" },
            { name: "description", label: "Description", type: "textarea", span: "full", placeholder: "What's happening, who should come…" },
          ]}
        />
      </Card>

      <section className="flex flex-col gap-4">
        <h2 className="headline-wide text-sm text-white">
          All events ({events.length})
        </h2>
        {events.length === 0 && (
          <p className="text-sm text-ink-4">Nothing yet — publish your first event above.</p>
        )}
        {events.map((e) => (
          <Card surface key={e.id} className="flex items-center justify-between gap-4 p-5">
            <div className="flex min-w-0 items-center gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-500/15 text-brand-300">
                <CalendarDays className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="truncate text-sm font-semibold text-white">{e.title}</span>
                  <Badge variant={statusVariant[e.status]}>{e.status}</Badge>
                </div>
                <p className="mt-0.5 text-xs text-ink-4">
                  {formatDate(e.starts_at)} · {formatTime(e.starts_at)}
                  {e.venue ? ` · ${e.venue}` : ""}
                </p>
              </div>
            </div>
            <DeleteButton action={deleteEventAction} id={e.id} />
          </Card>
        ))}
      </section>
    </div>
  );
}
