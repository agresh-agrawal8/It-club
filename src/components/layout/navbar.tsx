"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, ArrowUpRight } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Logo } from "./logo";
import { cn } from "@/lib/utils";

/**
 * Public site navigation.
 *
 * Desktop is a docked glass bar; mobile gets a real full-height drawer rather
 * than a squeezed copy of the desktop row. The drawer traps nothing and closes
 * on Escape, on route change, and on backdrop click — all three, because a menu
 * that can only be dismissed by the button that opened it is a trap on a phone.
 */

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/#about", label: "About" },
  { href: "/events", label: "Events" },
  { href: "/gallery", label: "Gallery" },
  { href: "/team", label: "Team" },
  { href: "/contact", label: "Contact" },
] as const;

/**
 * The CTA always reads "Sign in". The public layout no longer resolves the
 * session just to change this label — that cost an auth round-trip on every
 * public page view. A visitor who is already signed in and clicks it is
 * redirected to their dashboard by middleware.
 */
export function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Close the drawer whenever the route changes — otherwise tapping a link
  // navigates behind a menu that stays open on top of the new page.
  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    // Stop the page scrolling underneath the open drawer.
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    // Move focus into the panel so the next Tab is inside the menu.
    panelRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    // Passive: this listener never calls preventDefault, and saying so keeps
    // scrolling off the main thread's critical path.
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href.split("#")[0]) && href !== "/#about";

  return (
    <header
      className={cn(
        "sticky top-0 z-50 transition-colors duration-[var(--duration-base)]",
        scrolled ? "glass-strong" : "bg-transparent",
      )}
    >
      <Container>
        <nav aria-label="Primary" className="flex h-[68px] items-center justify-between gap-6">
          <Logo size={34} />

          {/* Desktop links — hairline slashes between them, as in the
              reference. The separators are decorative and marked so, or a
              screen reader reads "slash" between every destination. */}
          <ul className="hidden items-center lg:flex">
            {LINKS.map(({ href, label }, i) => (
              <li key={href} className="flex items-center">
                {i > 0 && (
                  <span aria-hidden className="mx-1 select-none text-sm text-white/15">
                    /
                  </span>
                )}
                <Link
                  href={href}
                  aria-current={isActive(href) ? "page" : undefined}
                  className={cn(
                    "relative rounded-lg px-3.5 py-2 font-mono text-[11px] uppercase tracking-[0.16em] transition-colors",
                    isActive(href) ? "text-white" : "text-ink-3 hover:text-white",
                  )}
                >
                  {label}
                  {isActive(href) && (
                    <span
                      aria-hidden
                      className="absolute inset-x-3.5 -bottom-px h-px bg-gradient-to-r from-brand-400 to-electric-400"
                    />
                  )}
                </Link>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="hairline-gradient hidden rounded-full px-5 py-2.5 font-mono text-[11px] uppercase tracking-[0.16em] text-white transition-colors hover:bg-white/5 sm:inline-flex sm:items-center sm:gap-1.5"
            >
              Sign in
              <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
            </Link>

            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-controls="mobile-nav"
              aria-label={open ? "Close menu" : "Open menu"}
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 text-white transition-colors hover:bg-white/5 lg:hidden"
            >
              {open ? <X className="h-5 w-5" aria-hidden /> : <Menu className="h-5 w-5" aria-hidden />}
            </button>
          </div>
        </nav>
      </Container>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />
          <div
            id="mobile-nav"
            ref={panelRef}
            tabIndex={-1}
            className="glass-strong absolute inset-y-0 right-0 flex w-[min(88vw,22rem)] flex-col outline-none"
          >
            <div className="flex h-[68px] items-center justify-between px-6">
              <Logo size={32} showWordmark={false} />
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 text-white"
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>

            <ul className="flex flex-1 flex-col gap-1 overflow-y-auto px-4 py-4">
              {LINKS.map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    aria-current={isActive(href) ? "page" : undefined}
                    className={cn(
                      "headline block rounded-2xl px-4 py-4 text-2xl transition-colors",
                      isActive(href)
                        ? "bg-white/[0.06] text-white"
                        : "text-ink-2 hover:bg-white/[0.04] hover:text-white",
                    )}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>

            <div className="border-t border-white/10 p-4">
              <Link
                href="/login"
                className="hairline-gradient flex items-center justify-center gap-2 rounded-2xl px-5 py-4 font-mono text-[11px] uppercase tracking-[0.16em] text-white"
              >
                Member sign in
                <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
