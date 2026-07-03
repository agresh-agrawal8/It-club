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
    <section className="relative overflow-hidden border-b border-white/10">
      <div className="glow-violet pointer-events-none absolute inset-0 -z-10 opacity-70" />
      <Container className="py-20 md:py-28">
        <SectionHeading eyebrow={eyebrow} title={title} description={description} />
      </Container>
    </section>
  );
}
