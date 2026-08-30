"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Award,
  Bell,
  CalendarDays,
  CheckSquare,
  Home,
  ImageIcon,
  Inbox,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Menu,
  Send,
  Shield,
  User,
  Users,
  X,
} from "lucide-react";
import { signOutAction } from "@/lib/actions/auth";
import { cn, initials, isCoreTeam, roleLabel } from "@/lib/utils";
import { Logo } from "./logo";

/**
 * Navigation for the signed-in app.
 *
 * One module serves both interfaces. The Core Team panel and the Member area
 * are not two applications with two navigations that drift apart — they are
 * the same shell showing a different set of destinations, which is what makes
 * them feel like one product.
 *
 * There are exactly two link sets, because there are exactly two roles.
 */

type NavItem = { href: string; label: string; icon: typeof Home; exact?: boolean };

const MEMBER_NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/my-tasks", label: "My tasks", icon: CheckSquare },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/profile", label: "My profile", icon: User },
];

const CORE_NAV: NavItem[] = [
  { href: "/admin", label: "Overview", icon: Shield, exact: true },
  { href: "/admin/members", label: "Members", icon: Users },
  { href: "/admin/events", label: "Events", icon: CalendarDays },
  { href: "/admin/achievements", label: "Achievements", icon: Award },
  { href: "/admin/gallery", label: "Gallery", icon: ImageIcon },
  { href: "/admin/submissions", label: "Submissions", icon: Inbox },
  { href: "/admin/notifications", label: "Send notice", icon: Send },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/profile", label: "My profile", icon: User },
];

/** The five destinations that fit a phone's bottom bar, per role. */
const MEMBER_TABS: NavItem[] = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard, exact: true },
  { href: "/my-tasks", label: "Tasks", icon: CheckSquare },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/notifications", label: "Alerts", icon: Bell },
  { href: "/profile", label: "Profile", icon: User },
];

const CORE_TABS: NavItem[] = [
  { href: "/admin", label: "Panel", icon: Shield, exact: true },
  { href: "/admin/members", label: "Members", icon: Users },
  { href: "/admin/gallery", label: "Gallery", icon: ImageIcon },
  { href: "/notifications", label: "Alerts", icon: Bell },
  { href: "/profile", label: "Profile", icon: User },
];

function navFor(role: string) {
  return isCoreTeam(role) ? CORE_NAV : MEMBER_NAV;
}
function tabsFor(role: string) {
  return isCoreTeam(role) ? CORE_TABS : MEMBER_TABS;
}

function useIsActive() {
  const pathname = usePathname();
  return (item: NavItem) =>
    item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);
}

/* ── Shared pieces ──────────────────────────────────────────────────────── */

function Identity({
  name,
  role,
  avatarUrl,
}: {
  name: string;
  role: string;
  avatarUrl: string | null;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
      {avatarUrl ? (
        /* Avatars are arbitrary remote URLs a member can set; routing them
           through next/image would mean allow-listing every possible host. */
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={avatarUrl}
          alt=""
          aria-hidden
          width={40}
          height={40}
          className="h-10 w-10 shrink-0 rounded-xl object-cover ring-1 ring-white/15"
        />
      ) : (
        <span
          aria-hidden
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-500/15 text-xs font-semibold text-brand-200 ring-1 ring-white/15"
        >
          {initials(name)}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-white">{name}</p>
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-brand-300">
          {roleLabel(role)}
        </p>
      </div>
    </div>
  );
}

function NavLinks({
  items,
  unread,
  onNavigate,
}: {
  items: NavItem[];
  unread: number;
  onNavigate?: () => void;
}) {
  const isActive = useIsActive();

  return (
    <ul className="flex flex-col gap-1">
      {items.map((item) => {
        const active = isActive(item);
        const showBadge = item.href === "/notifications" && unread > 0;
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                "group flex min-h-11 items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm transition-colors",
                active
                  ? "bg-white/[0.07] text-white"
                  : "text-ink-3 hover:bg-white/[0.04] hover:text-white",
              )}
            >
              <item.icon
                className={cn(
                  "h-4 w-4 shrink-0 transition-colors",
                  active ? "text-brand-300" : "text-ink-4 group-hover:text-ink-2",
                )}
                aria-hidden
              />
              <span className="flex-1 truncate">{item.label}</span>
              {showBadge && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-500 px-1.5 text-[10px] font-semibold text-white">
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
              {active && (
                <span
                  aria-hidden
                  className="h-4 w-px bg-gradient-to-b from-brand-400 to-electric-400"
                />
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function FooterLinks({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex flex-col gap-1 border-t border-white/10 pt-3">
      <Link
        href="/account/password"
        onClick={onNavigate}
        className="flex min-h-11 items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm text-ink-3 transition-colors hover:bg-white/[0.04] hover:text-white"
      >
        <KeyRound className="h-4 w-4 text-ink-4" aria-hidden />
        Change password
      </Link>
      <Link
        href="/"
        onClick={onNavigate}
        className="flex min-h-11 items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm text-ink-3 transition-colors hover:bg-white/[0.04] hover:text-white"
      >
        <Home className="h-4 w-4 text-ink-4" aria-hidden />
        Public site
      </Link>
      <form action={signOutAction}>
        <button
          type="submit"
          className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm text-ink-3 transition-colors hover:bg-red-500/10 hover:text-red-200"
        >
          <LogOut className="h-4 w-4 text-ink-4" aria-hidden />
          Sign out
        </button>
      </form>
    </div>
  );
}

/* ── Desktop sidebar ────────────────────────────────────────────────────── */

export function AppSidebar({
  name,
  role,
  avatarUrl,
  unread,
}: {
  name: string;
  role: string;
  avatarUrl: string | null;
  unread: number;
}) {
  return (
    <nav aria-label="Member area" className="flex h-full flex-col gap-5 overflow-y-auto p-5">
      <Logo size={36} />
      <Identity name={name} role={role} avatarUrl={avatarUrl} />
      <div className="flex-1">
        <NavLinks items={navFor(role)} unread={unread} />
      </div>
      <FooterLinks />
    </nav>
  );
}

/* ── Mobile header + drawer ─────────────────────────────────────────────── */

export function AppTopBar({
  name,
  role,
  avatarUrl,
  unread,
}: {
  name: string;
  role: string;
  avatarUrl: string | null;
  unread: number;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open]);

  return (
    <>
      <header className="glass-strong sticky top-0 z-40 flex h-16 items-center justify-between gap-3 border-b border-white/10 px-4 lg:hidden">
        <Logo size={32} />
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-expanded={open}
          aria-controls="app-drawer"
          aria-label="Open menu"
          className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 text-white"
        >
          <Menu className="h-5 w-5" aria-hidden />
        </button>
      </header>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />
          <nav
            id="app-drawer"
            aria-label="Member area"
            className="glass-strong absolute inset-y-0 right-0 flex w-[min(88vw,20rem)] flex-col gap-5 overflow-y-auto p-5"
          >
            <div className="flex items-center justify-between">
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
            <Identity name={name} role={role} avatarUrl={avatarUrl} />
            <div className="flex-1">
              <NavLinks items={navFor(role)} unread={unread} onNavigate={() => setOpen(false)} />
            </div>
            <FooterLinks onNavigate={() => setOpen(false)} />
          </nav>
        </div>
      )}
    </>
  );
}

/* ── Mobile bottom tab bar ──────────────────────────────────────────────── */

export function AppTabBar({ role, unread }: { role: string; unread: number }) {
  const isActive = useIsActive();

  return (
    <nav
      aria-label="Quick navigation"
      className="glass-strong fixed inset-x-0 bottom-0 z-40 border-t border-white/10 lg:hidden"
      // Keeps the bar clear of the home indicator on notched phones.
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="flex items-stretch">
        {tabsFor(role).map((tab) => {
          const active = isActive(tab);
          const showBadge = tab.href === "/notifications" && unread > 0;
          return (
            <li key={tab.href} className="flex-1">
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex min-h-[58px] flex-col items-center justify-center gap-1 px-1 py-2 text-[10px] font-medium transition-colors",
                  active ? "text-brand-300" : "text-ink-4 hover:text-ink-2",
                )}
              >
                <span className="relative">
                  <tab.icon className="h-5 w-5" aria-hidden />
                  {showBadge && (
                    <span className="absolute -right-1.5 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-500 px-1 text-[9px] font-semibold text-white">
                      {unread > 9 ? "9+" : unread}
                    </span>
                  )}
                </span>
                {tab.label}
                {active && (
                  <span
                    aria-hidden
                    className="absolute inset-x-5 top-0 h-0.5 rounded-full bg-gradient-to-r from-brand-400 to-electric-400"
                  />
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
