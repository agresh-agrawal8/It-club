"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Search, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Logo } from "./logo";

const NAV_LINKS = [
  { href: "/projects", label: "Projects" },
  { href: "/events", label: "Events" },
  { href: "/competitions", label: "Competitions" },
  { href: "/team", label: "Team" },
  { href: "/gallery", label: "Gallery" },
  { href: "/achievements", label: "Achievements" },
  { href: "/contact", label: "Contact" },
];

export function Navbar({ isAuthed }: { isAuthed: boolean }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 glass-strong">
      <Container className="flex h-16 items-center justify-between">
        <Logo onClick={() => setOpen(false)} />

        {/* Desktop nav — centred pill group */}
        <nav className="hidden items-center gap-1 rounded-full border border-white/10 bg-white/[0.03] p-1 lg:flex">
          {NAV_LINKS.map((link) => {
            const active = pathname === link.href || pathname.startsWith(link.href + "/");
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-full px-3.5 py-1.5 text-[13px] tracking-tight transition-colors",
                  active
                    ? "bg-brand-500/90 text-white shadow-[0_4px_16px_-6px_var(--color-brand-500)]"
                    : "text-zinc-400 hover:text-white",
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <Link
            href="/search"
            aria-label="Search"
            className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-white/5 hover:text-white"
          >
            <Search className="h-4 w-4" />
          </Link>
          {isAuthed ? (
            <ButtonLink href="/dashboard" variant="secondary" size="sm">
              <LayoutDashboard className="h-4 w-4" /> Dashboard
            </ButtonLink>
          ) : (
            <ButtonLink href="/login" variant="brand" size="sm" className="rounded-full">
              Member login
            </ButtonLink>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          className="flex h-10 w-10 items-center justify-center rounded-xl text-white lg:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </Container>

      {/* Mobile menu */}
      {open && (
        <div className="border-t border-white/10 lg:hidden">
          <Container className="flex flex-col gap-1 py-4">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-xl px-3 py-2.5 text-sm text-zinc-300 hover:bg-white/5 hover:text-white"
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-2 flex gap-2">
              <ButtonLink href="/search" variant="secondary" size="sm" className="flex-1" onClick={() => setOpen(false)}>
                <Search className="h-4 w-4" /> Search
              </ButtonLink>
              <ButtonLink
                href={isAuthed ? "/dashboard" : "/login"}
                variant="primary"
                size="sm"
                className="flex-1"
                onClick={() => setOpen(false)}
              >
                {isAuthed ? "Dashboard" : "Login"}
              </ButtonLink>
            </div>
          </Container>
        </div>
      )}
    </header>
  );
}
