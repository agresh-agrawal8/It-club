import { Container } from "@/components/ui/container";

/**
 * The masthead every public sub-page opens with.
 *
 * The title renders as the page's <h1> — there is exactly one per page, and
 * it is this. Section headings below it are <h2>, which keeps the document
 * outline correct for assistive technology and for crawlers.
 */
export function PageHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
}) {
  return (
    <section className="relative overflow-hidden border-b border-white/[0.07]">
      <div className="glow-club pointer-events-none absolute inset-0 opacity-80" aria-hidden />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        aria-hidden
        style={{
          backgroundImage:
            "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage: "radial-gradient(ellipse 70% 90% at 30% 0%, black 30%, transparent 75%)",
          WebkitMaskImage: "radial-gradient(ellipse 70% 90% at 30% 0%, black 30%, transparent 75%)",
        }}
      />
      <Container className="relative py-20 md:py-28">
        <div className="flex flex-col gap-4">
          {eyebrow && (
            <span className="eyebrow flex items-center gap-3 text-champagne-300">
              <span
                aria-hidden
                className="h-px w-8 bg-gradient-to-r from-champagne-400 to-transparent"
              />
              {eyebrow}
            </span>
          )}
          <h1 className="headline text-balance text-[clamp(2.1rem,1.3rem+3.2vw,4rem)] text-white">
            {title}
          </h1>
          {description && (
            <p className="max-w-2xl text-balance text-base leading-relaxed text-ink-2 md:text-lg">
              {description}
            </p>
          )}
        </div>
      </Container>
    </section>
  );
}
