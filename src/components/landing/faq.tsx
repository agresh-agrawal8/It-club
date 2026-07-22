"use client";

import { useState } from "react";
import { ArrowUpRight, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FaqItem {
  q: string;
  a: string;
}

/**
 * Numbered FAQ accordion — first item open by default, matching the
 * reference layout (01…05 with an arrow affordance on the open row).
 */
export function Faq({ items }: { items: FaqItem[] }) {
  const [open, setOpen] = useState(0);

  return (
    <div className="flex flex-col gap-3">
      {items.map((item, i) => {
        const isOpen = open === i;
        return (
          <div
            key={item.q}
            className={cn(
              "glass overflow-hidden rounded-2xl transition-colors",
              isOpen && "border-brand-400/30",
            )}
          >
            <button
              onClick={() => setOpen(isOpen ? -1 : i)}
              aria-expanded={isOpen}
              className="flex w-full items-center gap-4 px-5 py-4 text-left"
            >
              <span
                className={cn(
                  "font-mono text-sm tabular-nums transition-colors",
                  isOpen ? "text-brand-300" : "text-zinc-600",
                )}
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="flex-1 text-sm font-medium text-white">{item.q}</span>
              <span
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-all",
                  isOpen
                    ? "bg-brand-500 text-white"
                    : "border border-white/10 text-zinc-400",
                )}
              >
                {isOpen ? (
                  <ArrowUpRight className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </span>
            </button>
            <div
              className={cn(
                "grid transition-all duration-300 ease-out",
                isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
              )}
            >
              <div className="overflow-hidden">
                <p className="px-5 pb-5 pl-14 text-sm leading-relaxed text-zinc-400">{item.a}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
