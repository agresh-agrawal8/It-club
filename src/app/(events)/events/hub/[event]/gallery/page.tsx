import { notFound } from "next/navigation";
import { ImageIcon } from "lucide-react";
import { Container } from "@/components/ui/container";
import { EmptyState } from "@/components/ui/empty-state";
import { getEvent, getEventSettings, can } from "@/lib/events/engine";
import { createClient } from "@/lib/supabase/server";
import { safeEventRead } from "@/lib/events/engine";

export const metadata = { title: "Gallery" };

export default async function EventGalleryPage({
  params,
}: {
  params: Promise<{ event: string }>;
}) {
  const { event: slug } = await params;
  const event = await getEvent(slug);
  if (!event) notFound();

  const settings = await getEventSettings(event.id);
  if (!can(settings, "gallery_enabled")) notFound();

  // ev_files is staff/owner-scoped by RLS, so an anonymous visitor sees the
  // empty state until the organisers publish gallery items.
  const files = await safeEventRead<{ id: string; path: string; bucket: string }[]>(async () => {
    const supabase = await createClient();
    const { data } = await supabase
      .from("ev_files")
      .select("id, path, bucket")
      .eq("event_id", event.id)
      .eq("kind", "gallery")
      .order("created_at", { ascending: false })
      .limit(60);
    return data ?? [];
  }, []);

  return (
    <Container className="flex flex-col gap-8 py-14">
      <header>
        <h1 className="text-3xl font-semibold tracking-tighter text-white md:text-4xl">Gallery</h1>
        <p className="mt-2 text-sm text-zinc-400">Moments from {event.name}.</p>
      </header>

      {files.length === 0 ? (
        <EmptyState
          icon={<ImageIcon className="h-6 w-6" />}
          title="No photos yet"
          description="Once the event runs, the organisers will publish highlights here."
        />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {files.map((f) => (
            <div
              key={f.id}
              className="aspect-square overflow-hidden rounded-2xl border border-white/[0.07] bg-zinc-950/40"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={f.path}
                alt=""
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
              />
            </div>
          ))}
        </div>
      )}
    </Container>
  );
}
