import Image from "next/image";
import type { GalleryItem } from "@/types/database";

/**
 * The public gallery.
 *
 * Semantics first: a list of <figure> elements, each with its own
 * <figcaption>, inside a <ul>. That is what tells a screen reader "this is a
 * collection of N images" rather than "here are some divs".
 *
 * Every image renders with its intrinsic width and height, which are recorded
 * at upload time. next/image turns those into an aspect-ratio box, so the
 * grid reserves each tile's space before the bytes arrive and the page does
 * not reflow as photographs stream in.
 */
export function GalleryGrid({ items }: { items: GalleryItem[] }) {
  return (
    <ul className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
      {items.map((item, index) => (
        <li key={item.id}>
          <figure className="hairline-gradient group relative overflow-hidden rounded-2xl">
            <Image
              src={item.image_url}
              // Falls back through title, then to empty — an empty alt marks
              // the image as decorative, which is correct and far better than
              // a screen reader announcing a filename.
              alt={item.alt_text ?? item.title ?? ""}
              width={item.width ?? 1200}
              height={item.height ?? 900}
              sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
              // The first row is likely above the fold on most viewports;
              // everything after it waits until it is needed.
              loading={index < 4 ? "eager" : "lazy"}
              priority={index === 0}
              className="aspect-[4/3] w-full object-cover transition-transform duration-[var(--duration-slow)] ease-[var(--ease-out-soft)] group-hover:scale-[1.04]"
            />
            {item.title && (
              <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/45 to-transparent p-4 pt-12 text-xs font-medium text-white">
                {item.title}
              </figcaption>
            )}
          </figure>
        </li>
      ))}
    </ul>
  );
}
