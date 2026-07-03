import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

interface HeroProps {
  eyebrow: string;
  title: string;
  subtitle: string;
  primaryLabel: string;
  primaryHref: string;
  secondaryLabel: string;
  secondaryHref: string;
  stats: { value: string; label: string }[];
}

/**
 * Cinematic hero — the real IT Club lab photograph, full-bleed inside a large
 * rounded frame, with a directional scrim, film grain and an overlaid glass
 * stat bar. Editorial, photography-led; no clip-art or floating chips.
 */
export function Hero({
  eyebrow,
  title,
  subtitle,
  primaryLabel,
  primaryHref,
  secondaryLabel,
  secondaryHref,
  stats,
}: HeroProps) {
  return (
    <Container className="pt-4">
      <section className="grain relative overflow-hidden rounded-[28px] border border-white/10 bg-zinc-950">
        {/* Photograph */}
        <Image
          src="/it-club-lab.png"
          alt="Students of the soch.exe IT Club at work in the computer lab at Emerald Heights International School"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />

        {/* Directional cinematic scrim */}
        <div className="hero-scrim absolute inset-0" />

        {/* Content */}
        <div className="relative flex min-h-[560px] flex-col justify-end px-6 pb-40 pt-24 sm:px-10 md:min-h-[680px] md:pb-44 md:pt-32 lg:px-16">
          <div className="max-w-3xl">
            <p className="eyebrow text-brand-300">{eyebrow}</p>
            <h1 className="mt-5 text-balance text-4xl font-semibold leading-[1.02] tracking-tighter text-white sm:text-5xl lg:text-6xl xl:text-[4.75rem]">
              {title}
            </h1>
            <p className="mt-6 max-w-xl text-balance text-base leading-relaxed text-zinc-300/90 md:text-lg">
              {subtitle}
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href={primaryHref} size="lg">
                {primaryLabel}
                <ArrowRight className="h-4 w-4" />
              </ButtonLink>
              <ButtonLink href={secondaryHref} variant="secondary" size="lg">
                {secondaryLabel}
              </ButtonLink>
            </div>
          </div>
        </div>

        {/* Glass stat bar, docked to the bottom edge */}
        <div className="absolute inset-x-0 bottom-0 border-t border-white/10">
          <div className="glass-strong">
            <div className="mx-auto grid max-w-5xl grid-cols-2 divide-x divide-white/10 md:grid-cols-4">
              {stats.map((s) => (
                <div key={s.label} className="flex flex-col gap-0.5 px-5 py-5 md:px-8 md:py-6">
                  <span className="font-mono text-2xl font-semibold tracking-tight text-white md:text-3xl">
                    {s.value}
                  </span>
                  <span className="text-[11px] uppercase tracking-[0.14em] text-zinc-400 md:text-xs">
                    {s.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </Container>
  );
}
