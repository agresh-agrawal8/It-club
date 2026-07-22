"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Bell,
  User,
  Shield,
  Eye,
  Users,
  CalendarDays,
} from "lucide-react";
import { cn, isAdminRole, isTeacherRole } from "@/lib/utils";

/**
 * Bottom tab bar for phones — the five things each role actually needs,
 * with large touch targets and a safe-area inset for notched devices.
 * The full navigation still lives in the top scroll bar / desktop sidebar.
 */
export function MobileTabBar({ role, unread }: { role: string; unread: number }) {
  const pathname = usePathname();

  const tabs = isAdminRole(role)
    ? [
        { href: "/admin", label: "Panel", icon: Shield, exact: true },
        { href: "/admin/members", label: "Members", icon: Users },
        { href: "/admin/events", label: "Events", icon: CalendarDays },
        { href: "/notifications", label: "Alerts", icon: Bell, badge: true },
        { href: "/profile", label: "Profile", icon: User },
      ]
    : isTeacherRole(role)
      ? [
          { href: "/teacher", label: "Overview", icon: Eye, exact: true },
          { href: "/team", label: "Members", icon: Users },
          { href: "/projects", label: "Projects", icon: FolderKanban },
          { href: "/notifications", label: "Alerts", icon: Bell, badge: true },
          { href: "/profile", label: "Profile", icon: User },
        ]
      : [
          { href: "/dashboard", label: "Home", icon: LayoutDashboard, exact: true },
          { href: "/my-projects", label: "Projects", icon: FolderKanban },
          { href: "/my-tasks", label: "Tasks", icon: CheckSquare },
          { href: "/notifications", label: "Alerts", icon: Bell, badge: true },
          { href: "/profile", label: "Profile", icon: User },
        ];

  return (
    <nav
      className="glass-strong fixed inset-x-0 bottom-0 z-50 border-t border-white/10 lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="Primary"
    >
      <ul className="flex items-stretch">
        {tabs.map(({ href, label, icon: Icon, exact, badge }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex min-h-[56px] flex-col items-center justify-center gap-1 px-1 py-2 text-[10px] font-medium transition-colors",
                  active ? "text-brand-300" : "text-zinc-500 hover:text-zinc-300",
                )}
              >
                <span className="relative">
                  <Icon className="h-5 w-5" />
                  {badge && unread > 0 && (
                    <span className="absolute -right-1.5 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-500 px-1 text-[9px] font-semibold text-white">
                      {unread > 9 ? "9+" : unread}
                    </span>
                  )}
                </span>
                {label}
                {active && (
                  <span className="absolute inset-x-4 top-0 h-0.5 rounded-full bg-brand-400" />
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
