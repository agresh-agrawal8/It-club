import type { Metadata } from "next";
import { ImageIcon } from "lucide-react";
import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { GalleryGrid } from "@/components/features/gallery-grid";
import { getGallery } from "@/lib/data";
import { SITE, absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Gallery",
  description: `Photographs from ${SITE.name} sessions, builds, workshops and competitions at ${SITE.school}.`,
  alternates: { canonical: "/gallery" },
  openGraph: {
    title: `Gallery · ${SITE.name}`,
    description: `Photographs from ${SITE.name} sessions, builds and competitions.`,
    url: absoluteUrl("/gallery"),
  },
};

/**
 * Public content changes when the core team publishes something, and the
 * mutating actions call revalidatePath() for exactly that. Between those
 * events this page is served from the cache instead of re-querying Postgres
 * on every visit — which is what makes navigation feel instant rather than
 * waiting on a round-trip per page.
 */
export const revalidate = 300;


export default async function GalleryPage() {
  const items = await getGallery();

  /**
   * ImageGallery structured data. Listing each photograph individually is what
   * makes them eligible to surface in image search with the club as the
   * credited source, rather than as orphaned files on a CDN.
   */
  const jsonLd =
    items.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "ImageGallery",
          name: `${SITE.name} Gallery`,
          url: absoluteUrl("/gallery"),
          image: items.map((item) => ({
            "@type": "ImageObject",
            contentUrl: item.image_url,
            name: item.title ?? undefined,
            description: item.alt_text ?? item.title ?? undefined,
            width: item.width ?? undefined,
            height: item.height ?? undefined,
          })),
        }
      : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}

      <PageHeader
        eyebrow="Gallery"
        title="From the lab"
        description="Sessions, builds, competitions and the occasional late night."
      />

      <Container className="py-16">
        {items.length ? (
          <GalleryGrid items={items} />
        ) : (
          <EmptyState
            icon={<ImageIcon className="h-6 w-6" aria-hidden />}
            title="No photographs yet"
            description="Pictures from sessions and competitions will appear here as the core team adds them."
          />
        )}
      </Container>
    </>
  );
}
