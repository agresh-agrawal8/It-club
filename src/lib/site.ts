/**
 * Single source of truth for site-level identity and SEO.
 *
 * Titles, descriptions, canonicals, JSON-LD and the sitemap all read from
 * here, so the club's name and description cannot drift between the metadata
 * a crawler sees and the copy a visitor reads.
 */

const url = process.env.NEXT_PUBLIC_SITE_URL ?? "https://avinya-club.vercel.app";

export const SITE = {
  name: "Avinya",
  /** Used in the title template and OG title. */
  tagline: "IT & AI Club, Emerald Heights International School",
  school: "The Emerald Heights International School",
  city: "Indore",
  region: "Madhya Pradesh",
  country: "IN",
  description:
    "Avinya is the student-run IT & AI Club of The Emerald Heights International School, Indore. " +
    "We build software and hardware, run hackathons and workshops, and compete as a team.",
  url,
  /** Open Graph card (1200x630) — the emblem on the site's own violet field. */
  ogImage: "/og-image.png",
  ogImageWidth: 1200,
  ogImageHeight: 630,
  /** Circular, transparent club mark for use in UI over any surface. */
  mark: "/avinya-mark.png",
  /**
   * Real contact points only — these are the values held in the `settings`
   * table, not invented ones. The club has no published Instagram or Twitter
   * account, so neither is listed: a footer icon pointing at instagram.com is
   * a dead link pretending to be a presence. Add them here once they exist.
   */
  contact: {
    email: "agresh@agreshagrawal.com",
    github: "https://github.com/agresh-agrawal8/It-club",
    location: "The Emerald Heights International School, Indore, Madhya Pradesh",
  },
} as const;

/** Absolute URL for a site-relative path — for canonicals and the sitemap. */
export function absoluteUrl(path = "/") {
  return new URL(path, SITE.url).toString();
}
