"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

/**
 * Event navigation.
 *
 * Links are derived from the event's capability flags, so an event with
 * missions disabled simply has no Missions tab — no per-event conditionals.
 */
export function EventNav({
  base,
  codename,
  name,
  links,
  signedIn,
}: {
  base: string;
  codename: string;
  name: string;
  links: { href: string; label: string }[];
  signedIn: boolean;
}) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.07] bg-[var(--ev-surface)]/85 backdrop-blur-xl">
      <div className="mx-auto flex h-14 w-full max-w-7xl items-center gap-6 px-5">
        <Link href={base} className="flex items-center gap-2.5">
          <span
            className="grid h-7 w-7 place-items-center rounded-lg text-[11px] font-bold tracking-tight text-white"
            style={{ background: "var(--ev-accent)" }}
          >
            {codename}
          </span>
          <span className="hidden text-sm font-semibold tracking-tight text-white sm:block">
            {name}
          </span>
        </Link>

        <nav className="flex flex-1 items-center gap-1 overflow-x-auto">
          {links.map((link) => {
            const active =
              link.href === base ? pathname === base : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                  active
                    ? "bg-white/[0.08] text-white"
                    : "text-zinc-400 hover:bg-white/[0.04] hover:text-white",
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="hidden text-xs text-zinc-500 transition-colors hover:text-zinc-300 md:block"
          >
            Avinya
          </Link>
          <Link
            href={signedIn ? `${base}/dashboard` : `${base}/login`}
            className="rounded-full px-3.5 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: "var(--ev-accent)" }}
          >
            {signedIn ? "Dashboard" : "Sign in"}
          </Link>
        </div>
      </div>
    </header>
  );
}
