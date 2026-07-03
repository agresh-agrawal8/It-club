import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";

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
      {/* Ambient glow + faint grid, masked toward the heading */}
      <div className="glow-violet pointer-events-none absolute inset-0 opacity-80" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage: "radial-gradient(ellipse 70% 90% at 30% 0%, black 30%, transparent 75%)",
          WebkitMaskImage: "radial-gradient(ellipse 70% 90% at 30% 0%, black 30%, transparent 75%)",
        }}
      />
      <Container className="relative py-20 md:py-28">
        <SectionHeading eyebrow={eyebrow} title={title} description={description} />
      </Container>
    </section>
  );
}
