import type { Metadata } from "next";
import Image from "next/image";
import { ImageIcon } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { getGallery } from "@/lib/data";
import { Card } from "@/components/ui/card";
import { AdminPageHeader, DeleteButton } from "@/components/admin/admin-shell";
import { GalleryUploadForm } from "@/components/admin/gallery-upload-form";
import { deleteGalleryItemAction } from "@/lib/actions/content";

export const metadata: Metadata = { title: "Manage Gallery" };

export default async function AdminGalleryPage() {
  await requireAdmin();
  const items = await getGallery();

  return (
    <div className="flex flex-col gap-8">
      <AdminPageHeader
        title="Gallery"
        description="Curate the public photo gallery — upload images directly, they're stored in Supabase Storage."
        backHref="/admin"
      />

      <Card deep className="p-6 md:p-8">
        <h2 className="mb-5 text-sm font-semibold uppercase tracking-wide text-zinc-400">
          Add photo
        </h2>
        <GalleryUploadForm />
      </Card>

      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">
          All photos ({items.length})
        </h2>
        {items.length === 0 && (
          <p className="text-sm text-zinc-500">The gallery is empty — add the first photo above.</p>
        )}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((g) => (
            <Card key={g.id} className="overflow-hidden p-0">
              <div className="relative aspect-[4/3] w-full bg-zinc-950">
                {g.image_url ? (
                  <Image
                    src={g.image_url}
                    alt={g.title ?? "Gallery photo"}
                    fill
                    sizes="(max-width:768px) 100vw, 33vw"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <ImageIcon className="h-8 w-8 text-white/10" />
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-white">
                    {g.title ?? "Untitled"}
                  </div>
                  {g.album && <div className="text-xs text-zinc-500">{g.album}</div>}
                </div>
                <DeleteButton action={deleteGalleryItemAction} id={g.id} />
              </div>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
