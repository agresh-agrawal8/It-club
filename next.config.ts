import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        // Supabase Storage public URLs — replace project ref via env at deploy time.
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "8mb",
    },
  },

  /**
   * One canonical host.
   *
   * Vercel recreates its own system aliases (`it-club-agresh`, `it-club-rho`,
   * `it-club-git-main-agresh`) on every single deployment, so deleting them is
   * futile — they come back within a minute. Redirecting them instead makes
   * avinya-club.vercel.app the only address anyone ends up on, and a 308 tells
   * search engines to fold the duplicates into it.
   *
   * Only these three fixed hosts are matched. The per-deployment
   * `it-club-<hash>-agresh.vercel.app` URLs are deliberately left alone: those
   * are how preview builds get tested, and redirecting them to production
   * would make a preview impossible to open.
   */
  async redirects() {
    const canonical = "https://avinya-club.vercel.app";
    const stale = [
      "it-club-agresh.vercel.app",
      "it-club-rho.vercel.app",
      "it-club-git-main-agresh.vercel.app",
    ];

    return [
      ...stale.map((host) => ({
        source: "/:path*",
        has: [{ type: "host" as const, value: host }],
        destination: `${canonical}/:path*`,
        permanent: true,
      })),

      /**
       * Code Red lives at /codered.
       *
       * The pages themselves stay where they are, under the event hub's
       * `[event]` route — this only changes the address. Anything already
       * linked or indexed at the old path is folded into the new one with a
       * 308 so no inbound link breaks.
       */
      {
        source: "/events/hub/code-red",
        destination: "/codered",
        permanent: true,
      },

      /**
       * Competitions merged into events. A competition is now an event with
       * `kind = "competition"`, so the old route folds into the new one
       * rather than 404-ing anything already linked or indexed.
       */
      { source: "/competitions", destination: "/events", permanent: true },
      { source: "/competitions/:path*", destination: "/events", permanent: true },
      {
        source: "/events/hub/code-red/:path*",
        destination: "/codered/:path*",
        permanent: true,
      },
    ];
  },

  /**
   * Serve /codered from the event-hub route that renders Code Red.
   *
   * These run after redirects and after the filesystem, so they only catch
   * paths that have no file of their own — and the rewritten destination is
   * not re-checked against the redirects above, so this does not loop.
   */
  async rewrites() {
    return [
      { source: "/codered", destination: "/events/hub/code-red" },
      { source: "/codered/:path*", destination: "/events/hub/code-red/:path*" },
    ];
  },
};

export default nextConfig;
