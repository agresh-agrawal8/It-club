import type { Metadata } from "next";
import Link from "next/link";
import { Mail, MapPin, Github, Users } from "lucide-react";
import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/layout/page-header";
import { SubscribeForm } from "@/components/features/subscribe-form";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact",
  description: `How to reach the ${SITE.name} core team at ${SITE.school}, and how to join the club.`,
  alternates: { canonical: "/contact" },
};

/**
 * Public content changes when the core team publishes something, and the
 * mutating actions call revalidatePath() for exactly that. Between those
 * events this page is served from the cache instead of re-querying Postgres
 * on every visit — which is what makes navigation feel instant rather than
 * waiting on a round-trip per page.
 */
export const revalidate = 300;


/**
 * Contact.
 *
 * There is no message form here any more, and no membership application form:
 * both wrote to inboxes inside the admin panel that nobody was reading, which
 * is worse than no form at all — it silently swallows the message and leaves
 * the sender expecting a reply. The page now says how to actually reach the
 * club, which for a school society is in person or by email.
 */
export default function ContactPage() {
  return (
    <>
      <PageHeader
        eyebrow="Get in touch"
        title="Talk to the club"
        description="Joining, collaborating, or asking about something we built — here is where to find us."
      />

      <Container className="grid gap-6 py-16 lg:grid-cols-3">
        <article className="glass hairline-gradient flex flex-col gap-4 rounded-3xl p-7">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-500/12 text-brand-300">
            <Users className="h-5 w-5" aria-hidden />
          </span>
          <h2 className="headline-wide text-sm text-white">Joining</h2>
          <p className="text-sm leading-relaxed text-ink-3">
            Membership is open to students of {SITE.school}. Come to a session or speak to any
            member of the core team — there is no form and no selection test.
          </p>
          <Link
            href="/team"
            className="mt-auto pt-2 font-mono text-[11px] uppercase tracking-[0.16em] text-brand-300 transition-colors hover:text-white"
          >
            See who to ask →
          </Link>
        </article>

        <article className="glass hairline-gradient flex flex-col gap-4 rounded-3xl p-7">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-500/12 text-brand-300">
            <Mail className="h-5 w-5" aria-hidden />
          </span>
          <h2 className="headline-wide text-sm text-white">Email</h2>
          <p className="text-sm leading-relaxed text-ink-3">
            For collaborations, press, or anything that needs a written reply.
          </p>
          <a
            href={`mailto:${SITE.contact.email}`}
            className="mt-auto break-all pt-2 text-sm text-white underline decoration-brand-400/50 underline-offset-4 transition-colors hover:decoration-brand-300"
          >
            {SITE.contact.email}
          </a>
        </article>

        <article className="glass hairline-gradient flex flex-col gap-4 rounded-3xl p-7">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-500/12 text-brand-300">
            <MapPin className="h-5 w-5" aria-hidden />
          </span>
          <h2 className="headline-wide text-sm text-white">Find us</h2>
          <address className="text-sm not-italic leading-relaxed text-ink-3">
            {SITE.school}
            <br />
            {SITE.city}, {SITE.region}
          </address>
          <a
            href={SITE.contact.github}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-auto inline-flex items-center gap-2 pt-2 font-mono text-[11px] uppercase tracking-[0.16em] text-brand-300 transition-colors hover:text-white"
          >
            <Github className="h-3.5 w-3.5" aria-hidden />
            Our code
          </a>
        </article>
      </Container>

      <Container className="pb-16">
        <div className="glass-deep hairline-gradient flex flex-col gap-5 rounded-3xl p-8 md:flex-row md:items-center md:justify-between md:p-10">
          <div className="flex flex-col gap-2">
            <h2 className="headline text-xl text-white">Hear about the next one</h2>
            <p className="max-w-md text-sm leading-relaxed text-ink-3">
              One message when a session, workshop or hackathon is announced. Nothing else.
            </p>
          </div>
          <div className="w-full md:max-w-sm">
            <SubscribeForm />
          </div>
        </div>
      </Container>
    </>
  );
}
