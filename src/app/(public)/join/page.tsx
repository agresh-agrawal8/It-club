import type { Metadata } from "next";
import { Sparkles, Users, Rocket, GraduationCap } from "lucide-react";
import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/layout/page-header";
import { Reveal } from "@/components/landing/reveal";
import { JoinForm } from "./join-form";
import { getPlatformStats } from "@/lib/data";

export const metadata: Metadata = {
  title: "Join the club",
  description:
    "Apply to join Avinya — the IT & AI Club of Emerald Heights International School. Open to all students, no experience required.",
};

const PERKS = [
  {
    icon: Rocket,
    title: "Ship real projects",
    desc: "Publish your work to the showcase from day one — no approvals, no gatekeeping.",
  },
  {
    icon: GraduationCap,
    title: "Learn by building",
    desc: "Workshops, hack nights and mentoring across six tracks, from web to AI.",
  },
  {
    icon: Users,
    title: "Compete as a team",
    desc: "Hackathons, olympiads and contests with the club behind you.",
  },
];

export default async function JoinPage() {
  const stats = await getPlatformStats();

  return (
    <>
      <PageHeader
        eyebrow="Membership"
        title="Join Avinya"
        description="Open to every EHIS student — from complete beginners to seasoned builders. Fill the form and the core team will set up your member account."
      />

      <Container className="grid gap-12 py-16 lg:grid-cols-[1fr_1.25fr]">
        {/* Why join */}
        <div className="flex flex-col gap-6">
          {PERKS.map(({ icon: Icon, title, desc }, i) => (
            <Reveal key={title} delay={i * 100}>
              <div className="glass glass-hover flex items-start gap-4 rounded-3xl p-6">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-500/15 text-brand-300">
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="text-sm font-semibold tracking-tight text-white">{title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-zinc-400">{desc}</p>
                </div>
              </div>
            </Reveal>
          ))}

          <Reveal delay={300}>
            <div className="glass rounded-3xl p-6">
              <div className="flex items-center gap-2 text-brand-300">
                <Sparkles className="h-4 w-4" />
                <span className="text-xs font-medium uppercase tracking-[2px]">Right now</span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-6">
                <div>
                  <div className="text-4xl font-semibold tracking-tighter text-white">
                    {stats.members}
                    <span className="text-brand-400">+</span>
                  </div>
                  <div className="mt-1 text-xs text-zinc-500">members building</div>
                </div>
                <div>
                  <div className="text-4xl font-semibold tracking-tighter text-white">
                    {stats.projects}
                    <span className="text-brand-400">+</span>
                  </div>
                  <div className="mt-1 text-xs text-zinc-500">projects shipped</div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>

        {/* Application form */}
        <Reveal delay={150}>
          <div className="glass-deep rounded-3xl p-7 md:p-9">
            <h2 className="text-lg font-semibold tracking-tight text-white">Membership application</h2>
            <p className="mb-6 mt-1 text-sm text-zinc-400">
              Takes two minutes. We review applications every week.
            </p>
            <JoinForm />
          </div>
        </Reveal>
      </Container>
    </>
  );
}
