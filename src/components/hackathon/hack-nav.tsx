"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, ArrowUpRight, Settings2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Container } from "@/components/ui/container";

const LINKS = [
  { href: "/hackathon", label: "Home", exact: true },
  { href: "/hackathon/schedule", label: "Schedule" },
  { href: "/hackathon/problems", label: "Envelopes" },
  { href: "/hackathon/passport", label: "Passport" },
  { href: "/hackathon/rules", label: "Rules" },
  { href: "/hackathon/leaderboard", label: "Results" },
];

/**
 * Infinium's own navigation — a floating pill bar, matching the guide's
 * wordmark treatment (INFI·N·IUM with the accent letter picked out).
 */
export function HackNav({ isAdmin = false }: { isAdmin?: boolean }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.07] bg-[#08080b]/85 backdrop-blur-xl">
      <Container className="flex h-16 items-center justify-between gap-4">
        <Link
          href="/hackathon"
          className="flex shrink-0 items-center gap-2.5"
          onClick={() => setOpen(false)}
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-brand-400/30 bg-brand-500/15">
            <span className="text-[13px] font-bold leading-none text-brand-300">I</span>
          </span>
          <span className="flex flex-col leading-none">
            <span className="text-[13px] font-semibold tracking-[0.16em] text-white">
              INFI<span className="text-brand-400">N</span>IUM
            </span>
            <span className="mt-0.5 text-[9px] uppercase tracking-[0.18em] text-zinc-500">
              IT Fest 2026
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-0.5 rounded-full border border-white/[0.08] bg-white/[0.03] p-1 lg:flex">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "rounded-full px-3.5 py-1.5 text-[13px] tracking-tight transition-colors",
                isActive(l.href, l.exact)
                  ? "bg-brand-500 text-white"
                  : "text-zinc-400 hover:text-white",
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          {isAdmin && (
            <Link
              href="/hackathon/admin"
              className={cn(
                "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-colors",
                pathname.startsWith("/hackathon/admin") ||
                  pathname.startsWith("/hackathon/manage")
                  ? "border-accent-400/50 bg-accent-500/15 text-accent-300"
                  : "border-white/10 text-zinc-400 hover:border-accent-400/40 hover:text-white",
              )}
            >
              <Settings2 className="h-3.5 w-3.5" /> Admin
            </Link>
          )}
          <Link
            href="/"
            className="flex items-center gap-1 text-xs text-zinc-500 transition-colors hover:text-white"
          >
            Avinya <ArrowUpRight className="h-3 w-3" />
          </Link>
          <Link
            href="/hackathon/team"
            className="rounded-full bg-white px-4 py-2 text-[13px] font-medium text-black transition-opacity hover:opacity-90"
          >
            Team portal
          </Link>
        </div>

        <button
          className="flex h-10 w-10 items-center justify-center rounded-xl text-white lg:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
          aria-expanded={open}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </Container>

      {open && (
        <div className="border-t border-white/[0.07] lg:hidden">
          <Container className="flex flex-col gap-1 py-4">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "rounded-xl px-3 py-2.5 text-sm transition-colors",
                  isActive(l.href, l.exact)
                    ? "bg-brand-500/15 text-brand-200"
                    : "text-zinc-300 hover:bg-white/5 hover:text-white",
                )}
              >
                {l.label}
              </Link>
            ))}
            {isAdmin && (
              <Link
                href="/hackathon/admin"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-accent-300 hover:bg-white/5"
              >
                <Settings2 className="h-4 w-4" /> Admin
              </Link>
            )}
            <Link
              href="/hackathon/team"
              onClick={() => setOpen(false)}
              className="mt-2 rounded-full bg-white px-4 py-2.5 text-center text-sm font-medium text-black"
            >
              Team portal
            </Link>
          </Container>
        </div>
      )}
    </header>
  );
}
