import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { UserRole } from "@/types/database";

/**
 * The club has exactly two roles. `core_team` runs the club and manages
 * content; `member` takes part. There is no tier above core team, so there is
 * no predicate for one.
 */
export function isCoreTeam(role: UserRole | string | null | undefined) {
  return role === "core_team";
}

/** Human label for a role. */
export function roleLabel(role: UserRole | string | null | undefined) {
  return isCoreTeam(role) ? "Core Team" : "Member";
}

/**
 * Where each role lands after signing in.
 *
 * `/admin` is a URL prefix, not a role — the panel it serves is the Core Team
 * interface and is labelled as such throughout. The brief removed the two
 * routes under it that are obsolete (applications, messages), not the prefix.
 */
export function homeForRole(role: UserRole | string | null | undefined) {
  return isCoreTeam(role) ? "/admin" : "/dashboard";
}

/** Tailwind-aware className combiner. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** URL-safe slug from a title. */
export function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

/** Initials for avatar fallbacks. */
export function initials(name: string) {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase())
      .join("") || "?"
  );
}

/** Format an ISO date range for events. */
export function formatDate(
  iso: string | null | undefined,
  opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" },
) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-GB", opts);
}

export function formatTime(iso: string | null | undefined) {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

/** Relative "time ago" for notifications/feeds. */
export function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(iso);
}
