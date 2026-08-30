import type { Metadata } from "next";
import Image from "next/image";
import { ImageIcon } from "lucide-react";
import { requireCoreTeam } from "@/lib/auth";
import { getGallery } from "@/lib/data";
import { EmptyState } from "@/components/ui/empty-state";
import { AdminPageHeader, AdminPanel, DeleteButton } from "@/components/admin/admin-shell";
import { GalleryUploadForm } from "@/components/admin/gallery-upload-form";
import { deleteGalleryItemAction } from "@/lib/actions/gallery";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Gallery" };

export default async function AdminGalleryPage() {
  await requireCoreTeam();
  const items = await getGallery();

  return (
    <div className="flex flex-col gap-10">
      <AdminPageHeader
        title="Gallery"
        description="Add a photo and give it a title. Everything else is generated."
        backHref="/admin"
      />

      <AdminPanel title="Upload a photo">
        <GalleryUploadForm />
      </AdminPanel>

      <AdminPanel title={`Photos (${items.length})`}>
        {items.length === 0 ? (
          <EmptyState
            icon={<ImageIcon className="h-6 w-6" aria-hidden />}
            title="The gallery is empty"
            description="Upload the first photo above and it appears on the public site immediately."
          />
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <li
                key={item.id}
                className="flex flex-col overflow-hidden surface-row"
              >
                <div className="relative aspect-[4/3]">
                  <Image
                    src={item.image_url}
                    alt={item.alt_text ?? item.title ?? ""}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    loading="lazy"
                    className="object-cover"
                  />
                </div>
                <div className="flex flex-1 items-start justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-white">
                      {item.title ?? "Untitled"}
                    </p>
                    <p className="mt-1 truncate font-mono text-[10px] uppercase tracking-[0.14em] text-ink-4">
                      /{item.slug}
                    </p>
                    <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-4">
                      {item.width && item.height ? `${item.width}×${item.height} · ` : ""}
                      {formatDate(item.created_at)}
                    </p>
                  </div>
                  <DeleteButton
                    action={deleteGalleryItemAction}
                    id={item.id}
                    label={`Delete ${item.title ?? "photo"}`}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </AdminPanel>
    </div>
  );
}
