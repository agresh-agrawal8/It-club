"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight, Star } from "lucide-react";
import { initials } from "@/lib/utils";

export interface Testimonial {
  quote: string;
  name: string;
  role: string;
}

/**
 * Testimonial panel — aggregate rating on the left, rotating quote on the
 * right, arrow controls. Mirrors the reference layout.
 */
export function Testimonials({
  items,
  rating = "4.9",
  reviewCount,
}: {
  items: Testimonial[];
  rating?: string;
  reviewCount: string;
}) {
  const [i, setI] = useState(0);
  const t = items[i];

  const go = (dir: 1 | -1) => setI((prev) => (prev + dir + items.length) % items.length);

  return (
    <div className="glass-deep grid overflow-hidden rounded-3xl md:grid-cols-[300px_1fr]">
      {/* Rating panel */}
      <div className="flex flex-col items-center justify-center gap-3 border-b border-white/10 p-8 text-center md:border-b-0 md:border-r">
        <div className="text-5xl font-semibold tracking-tighter text-white">{rating}</div>
        <div className="flex gap-1">
          {Array.from({ length: 5 }).map((_, s) => (
            <Star key={s} className="h-3.5 w-3.5 fill-amber-300 text-amber-300" />
          ))}
        </div>
        <p className="text-[11px] text-zinc-500">{reviewCount}</p>
        <p className="mt-1 max-w-[190px] text-xs leading-relaxed text-zinc-400">
          Experiences that speak for themselves
        </p>
      </div>

      {/* Quote panel */}
      <div className="flex flex-col justify-between gap-6 p-8">
        <p className="text-[15px] leading-relaxed text-zinc-200">“{t.quote}”</p>
        <div className="flex items-end justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-500/20 text-xs font-semibold text-brand-200">
              {initials(t.name)}
            </span>
            <div>
              <div className="text-sm font-medium text-white">{t.name}</div>
              <div className="text-xs text-zinc-500">{t.role}</div>
            </div>
          </div>
          {items.length > 1 && (
            <div className="flex gap-2">
              <button
                onClick={() => go(-1)}
                aria-label="Previous testimonial"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-zinc-400 transition-colors hover:border-white/25 hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => go(1)}
                aria-label="Next testimonial"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-500 text-white transition-colors hover:bg-brand-400"
              >
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
