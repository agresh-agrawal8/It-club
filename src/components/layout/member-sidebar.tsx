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
} from "lucide-react";
import { cn, initials } from "@/lib/utils";
import { Logo } from "./logo";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/my-projects", label: "My Projects", icon: FolderKanban },
  { href: "/my-tasks", label: "My Tasks", icon: CheckSquare },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/profile", label: "My Profile", icon: User },
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
          <div className="truncate text-xs text-zinc-500">{memberId ?? role}</div>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {NAV.map(({ href, label, icon: Icon }) => {
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
        })}

        {role === "admin" && (
          <Link
            href="/admin"
            className={cn(
              "mt-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
              pathname.startsWith("/admin")
                ? "bg-amber-500/15 text-amber-200"
                : "text-amber-300/80 hover:bg-amber-500/10 hover:text-amber-200",
            )}
          >
            <Shield className="h-4 w-4" />
            Admin Console
          </Link>
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
