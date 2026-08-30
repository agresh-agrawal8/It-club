import type { MetadataRoute } from "next";
import { createPublicClient } from "@/lib/supabase/server";
import { absoluteUrl } from "@/lib/site";

/**
 * XML sitemap at /sitemap.xml.
 *
 * Public content only. Anything behind a sign-in — the member area, the Core
 * Team panel, the login form itself — is deliberately absent: listing a route
 * a crawler cannot reach wastes crawl budget and puts login pages in results.
 *
 * Event detail pages are enumerated from the database, so publishing an event
 * adds it to the sitemap without anyone remembering to.
 */
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"), lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: absoluteUrl("/events"), lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: absoluteUrl("/gallery"), lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: absoluteUrl("/team"), lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: absoluteUrl("/achievements"), lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: absoluteUrl("/contact"), lastModified: now, changeFrequency: "yearly", priority: 0.5 },
  ];

  try {
    const supabase = createPublicClient();
    const { data: events } = await supabase
      .from("events")
      .select("slug, updated_at")
      .order("starts_at", { ascending: false })
      .limit(500);

    for (const event of events ?? []) {
      staticRoutes.push({
        url: absoluteUrl(`/events/${event.slug}`),
        lastModified: event.updated_at ? new Date(event.updated_at) : now,
        changeFrequency: "monthly",
        priority: 0.7,
      });
    }
  } catch {
    // A database hiccup should degrade the sitemap, not 500 it.
  }

  return staticRoutes;
}
