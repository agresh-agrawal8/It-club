import { Container } from "@/components/ui/container";

/**
 * Route-level loading fallback for the public site.
 *
 * Without a loading.tsx, App Router navigation blocks on the server response
 * before painting anything — the previous page just sits there and the click
 * reads as broken. React streams this in the moment the link is followed, so
 * a navigation always produces immediate visible feedback.
 *
 * It mirrors the shape of a real page (masthead, then a content grid) so the
 * layout does not jump when the actual content replaces it.
 */
export default function Loading() {
  return (
    <div aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading…</span>

      <section className="relative overflow-hidden border-b border-white/[0.07]">
        <div className="glow-club pointer-events-none absolute inset-0 opacity-60" aria-hidden />
        <Container className="relative py-20 md:py-28">
          <div className="flex flex-col gap-5">
            <div className="shimmer h-3 w-28 rounded-full bg-white/[0.06]" />
            <div className="shimmer h-12 w-[min(28rem,80%)] rounded-2xl bg-white/[0.06]" />
            <div className="shimmer h-4 w-[min(38rem,92%)] rounded-full bg-white/[0.04]" />
          </div>
        </Container>
      </section>

      <Container className="grid gap-6 py-16 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="shimmer h-64 rounded-3xl border border-white/[0.06] bg-white/[0.03]"
          />
        ))}
      </Container>
    </div>
  );
}
