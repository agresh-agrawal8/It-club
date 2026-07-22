"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  User,
  FolderKanban,
  CheckSquare,
  Bell,
  CalendarDays,
  Home,
  Users,
  LogOut,
  Shield,
  Trophy,
  Award,
  ImageIcon,
  Mail,
  Inbox,
  UserPlus,
} from "lucide-react";
import { cn, initials, isAdminRole, roleLabel } from "@/lib/utils";
import { Logo } from "./logo";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/my-projects", label: "My Projects", icon: FolderKanban },
  { href: "/my-tasks", label: "My Tasks", icon: CheckSquare },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/profile", label: "My Profile", icon: User },
];

/** Core Team Panel navigation — shown only to admins. */
const ADMIN_NAV = [
  { href: "/admin", label: "Overview", icon: Shield },
  { href: "/admin/members", label: "Members", icon: Users },
  { href: "/admin/events", label: "Events", icon: CalendarDays },
  { href: "/admin/competitions", label: "Competitions", icon: Trophy },
  { href: "/admin/achievements", label: "Achievements", icon: Award },
  { href: "/admin/gallery", label: "Gallery", icon: ImageIcon },
  { href: "/admin/messages", label: "Messages", icon: Mail },
  { href: "/admin/submissions", label: "Submissions", icon: Inbox },
  { href: "/admin/applications", label: "Applications", icon: UserPlus },
  { href: "/admin/notifications", label: "Send notice", icon: Bell },
];

export function MemberSidebar({
  name,
  memberId,
  role,
  avatarUrl,
  unread,
}: {
  name: string;
  memberId: string | null;
  role: string;
  avatarUrl: string | null;
  unread: number;
}) {
  const pathname = usePathname();

  return (
    <aside className="flex h-full flex-col gap-6 p-5">
      <div className="px-2">
        <Logo />
      </div>

      <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-zinc-900 p-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-500/20 text-sm font-semibold text-brand-200">
          {initials(name)}
        </span>
        <div className="min-w-0">
          <div className="truncate text-sm font-medium text-white">{name}</div>
          <div className="truncate text-xs text-zinc-500">
            {memberId ? `${memberId} · ${roleLabel(role)}` : roleLabel(role)}
          </div>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto">
        {isAdminRole(role) && (
          <>
            <p className="px-3 pb-1 pt-1 text-[10px] font-semibold uppercase tracking-[2px] text-amber-300/70">
              Core Team Panel
            </p>
            {ADMIN_NAV.map(({ href, label, icon: Icon }) => {
              const active =
                href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
                    active
                      ? "bg-amber-500/15 text-amber-200"
                      : "text-zinc-400 hover:bg-amber-500/10 hover:text-amber-200",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              );
            })}
            <p className="px-3 pb-1 pt-4 text-[10px] font-semibold uppercase tracking-[2px] text-zinc-600">
              Personal
            </p>
          </>
        )}

        {NAV.filter(({ href }) => !(isAdminRole(role) && href === "/dashboard")).map(
          ({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
                  active
                    ? "bg-brand-500/15 text-white"
                    : "text-zinc-400 hover:bg-white/5 hover:text-white",
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
                {href === "/notifications" && unread > 0 && (
                  <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-500 px-1.5 text-[10px] font-semibold text-white">
                    {unread}
                  </span>
                )}
              </Link>
            );
          },
        )}
      </nav>

      <div className="flex flex-col gap-1 border-t border-white/10 pt-4">
        <Link
          href="/"
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-zinc-400 hover:bg-white/5 hover:text-white"
        >
          <Home className="h-4 w-4" /> Public site
        </Link>
        <Link
          href="/team"
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-zinc-400 hover:bg-white/5 hover:text-white"
        >
          <Users className="h-4 w-4" /> Team
        </Link>
        <form action="/auth/signout" method="post">
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-zinc-400 hover:bg-red-500/10 hover:text-red-300"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </form>
      </div>
    </aside>
  );
}

/**
 * Mobile member navigation — sticky glass top bar with a horizontally
 * scrollable link row. The desktop sidebar is hidden below lg, so without
 * this the member area had no navigation on phones.
 */
export function MemberMobileNav({ role, unread }: { role: string; unread: number }) {
  const pathname = usePathname();
  // Admins see the Core Team Panel first, then personal pages (no dashboard —
  // it redirects them to /admin anyway).
  const links = isAdminRole(role)
    ? [...ADMIN_NAV, ...NAV.filter((l) => l.href !== "/dashboard")]
    : NAV;

  return (
    <div className="sticky top-0 z-40 flex flex-col gap-1 border-b border-white/10 glass-strong lg:hidden">
      <div className="flex items-center justify-between px-4 pt-3">
        <Logo size="sm" />
        <form action="/auth/signout" method="post">
          <button
            type="submit"
            aria-label="Sign out"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-white/5 hover:text-white"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </form>
      </div>
      <nav className="flex gap-1 overflow-x-auto px-3 pb-2 pt-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {links.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/admin" ? pathname === "/admin" : pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs transition-colors",
                active
                  ? "bg-brand-500/20 text-white"
                  : "text-zinc-400 hover:bg-white/5 hover:text-white",
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
              {href === "/notifications" && unread > 0 && (
                <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-500 px-1 text-[9px] font-semibold text-white">
                  {unread}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
