"use client";

import { useState } from "react";
import Image from "next/image";
import { X } from "lucide-react";
import type { GalleryItem } from "@/types/database";

export function GalleryGrid({ items }: { items: GalleryItem[] }) {
  const [active, setActive] = useState<GalleryItem | null>(null);

  return (
    <>
      <div className="columns-1 gap-4 sm:columns-2 lg:columns-3 [&>*]:mb-4">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => setActive(item)}
            className="group relative block w-full overflow-hidden rounded-2xl border border-white/10 bg-zinc-900"
          >
            <Image
              src={item.image_url}
              alt={item.title ?? "Gallery image"}
              width={600}
              height={400}
              className="h-auto w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            {(item.title || item.caption) && (
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4 text-left opacity-0 transition-opacity group-hover:opacity-100">
                {item.title && <div className="text-sm font-medium text-white">{item.title}</div>}
                {item.caption && <div className="text-xs text-zinc-300">{item.caption}</div>}
              </div>
            )}
          </button>
        ))}
      </div>

      {active && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
          onClick={() => setActive(null)}
        >
          <button
            className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
            onClick={() => setActive(null)}
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
          <figure className="max-h-[90vh] max-w-5xl" onClick={(e) => e.stopPropagation()}>
            <Image
              src={active.image_url}
              alt={active.title ?? "Gallery image"}
              width={1600}
              height={1000}
              className="max-h-[80vh] w-auto rounded-2xl object-contain"
            />
            {(active.title || active.caption) && (
              <figcaption className="mt-3 text-center text-sm text-zinc-300">
                {active.title} {active.caption && `— ${active.caption}`}
              </figcaption>
            )}
          </figure>
        </div>
      )}
    </>
  );
}
