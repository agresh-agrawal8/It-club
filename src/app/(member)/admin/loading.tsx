/**
 * Loading fallback for the Core Team panel.
 *
 * These routes are dynamic and database-backed, so they are the slowest
 * navigations in the app and the ones most likely to read as an unresponsive
 * click. This paints the panel's shape immediately while the query runs.
 */
export default function Loading() {
  return (
    <div className="flex flex-col gap-10" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading…</span>

      <div className="flex flex-col gap-3">
        <div className="shimmer h-3 w-24 rounded-full bg-white/[0.06]" />
        <div className="shimmer h-9 w-64 rounded-xl bg-white/[0.06]" />
        <div className="shimmer h-4 w-80 rounded-full bg-white/[0.04]" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="shimmer h-24 rounded-2xl border border-white/[0.06] bg-white/[0.03]"
          />
        ))}
      </div>

      <div className="shimmer h-72 rounded-3xl border border-white/[0.06] bg-white/[0.03]" />
    </div>
  );
}
