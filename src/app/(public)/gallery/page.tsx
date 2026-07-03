import type { Metadata } from "next";
import { ImageIcon } from "lucide-react";
import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { GalleryGrid } from "@/components/features/gallery-grid";
import { getGallery } from "@/lib/data";

export const metadata: Metadata = {
  title: "Gallery",
  description: "Moments from IT Club events, workshops and competitions.",
};

export default async function GalleryPage() {
  const items = await getGallery();

  return (
    <>
      <PageHeader
        eyebrow="Moments"
        title="Gallery"
        description="Snapshots from our events, workshops, builds and celebrations."
      />
      <Container className="py-16">
        {items.length ? (
          <GalleryGrid items={items} />
        ) : (
          <EmptyState
            icon={<ImageIcon className="h-6 w-6" />}
            title="The gallery is empty"
            description="Photos curated by the core team will appear here."
          />
        )}
      </Container>
    </>
  );
}
