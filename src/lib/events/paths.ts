/**
 * Base path for an event in the event-hub module.
 *
 * The hub mounts its events at `/events/hub/<slug>`, but Code Red is the
 * club's flagship event and gets the short address `/codered` instead. Every
 * link, redirect and revalidate in the module goes through this function, so
 * the two forms cannot drift apart — which is what would happen if the short
 * URL were bolted on with a rewrite alone while the module kept generating
 * links to the long one.
 *
 * `next.config.ts` completes the arrangement: it rewrites `/codered/*` onto
 * the hub route that renders it, and permanently redirects the old
 * `/events/hub/code-red/*` addresses here so nothing that was linked or
 * indexed under them breaks.
 */
const SHORT_PATHS: Record<string, string> = {
  "code-red": "/codered",
};

export function eventBasePath(slug: string): string {
  return SHORT_PATHS[slug] ?? `/events/hub/${slug}`;
}

/**
 * The canonical *internal* route for an event, i.e. where the files actually
 * live. Used for revalidatePath(), which addresses the route tree rather than
 * the public URL.
 */
export function eventRoutePath(slug: string): string {
  return `/events/hub/${slug}`;
}
