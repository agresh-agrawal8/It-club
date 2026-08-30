import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";

/**
 * robots.txt.
 *
 * Everything signed-in is disallowed. This is a crawling directive, not a
 * security control — the actual protection for those routes is the session
 * check in middleware, the role guards in each page, and RLS underneath both.
 * A robots rule only stops well-behaved crawlers from wasting requests on
 * pages that would redirect them to the login form anyway.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/admin/",
          "/dashboard",
          "/profile",
          "/my-tasks",
          "/notifications",
          "/calendar",
          "/account",
          "/login",
          "/auth/",
          "/api/",
        ],
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
    host: absoluteUrl("/").replace(/\/$/, ""),
  };
}
