"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Container } from "@/components/ui/container";
import { ButtonLink } from "@/components/ui/button";

const LINKS = [
  { href: "/hackathon", label: "Home", exact: true },
  { href: "/hackathon/register", label: "Register" },
  { href: "/hackathon/problems", label: "Problems" },
  { href: "/hackathon/schedule", label: "Schedule" },
  { href: "/hackathon/leaderboard", label: "Leaderboard" },
];

/** Infinium's own nav — Avinya theme, distinct violet→green identity. */
export function HackNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 glass-strong">
      <Container className="flex h-16 items-center justify-between">
        <Link href="/hackathon" className="group flex items-center gap-2.5" onClick={() => setOpen(false)}>
          <span className="relative flex h-8 w-8 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-brand-500 via-brand-600 to-accent-600">
            <span className="h-2.5 w-2.5 rotate-45 rounded-[2px] bg-white" />
          </span>
          <span className="flex flex-col leading-none">
            <span className="text-sm font-semibold tracking-tight text-white">Infinium</span>
            <span className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">Hackathon</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 rounded-full border border-white/10 bg-white/[0.03] p-1 lg:flex">
          {LINKS.map((l) => {
            const active = l.exact ? pathname === l.href : pathname.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "rounded-full px-3.5 py-1.5 text-[13px] tracking-tight transition-colors",
                  active
                    ? "bg-brand-500/90 text-white shadow-[0_4px_16px_-6px_var(--color-brand-500)]"
                    : "text-zinc-400 hover:text-white",
                )}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <Link href="/" className="flex items-center gap-1 text-xs text-zinc-500 hover:text-white">
            Avinya <ArrowUpRight className="h-3 w-3" />
          </Link>
          <ButtonLink href="/hackathon/login" variant="brand" size="sm" className="rounded-full">
            Team sign in
          </ButtonLink>
        </div>

        <button
          className="flex h-10 w-10 items-center justify-center rounded-xl text-white lg:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </Container>

      {open && (
        <div className="border-t border-white/10 lg:hidden">
          <Container className="flex flex-col gap-1 py-4">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-xl px-3 py-2.5 text-sm text-zinc-300 hover:bg-white/5 hover:text-white"
              >
                {l.label}
              </Link>
            ))}
            <ButtonLink
              href="/hackathon/login"
              variant="brand"
              size="sm"
              className="mt-2 rounded-full"
              onClick={() => setOpen(false)}
            >
              Team sign in
            </ButtonLink>
          </Container>
        </div>
      )}
    </header>
  );
}
