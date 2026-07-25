import { notFound } from "next/navigation";
import Link from "next/link";
import { Lock, Users, KeyRound, Rocket } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { getEvent, getEventSettings, countRegistered } from "@/lib/events/engine";
import { registrationOpen } from "@/lib/events/rules";
import { EventRegisterForm } from "@/components/events/register-form";

export const metadata = { title: "Register" };

export default async function EventRegisterPage({
  params,
}: {
  params: Promise<{ event: string }>;
}) {
  const { event: slug } = await params;
  const event = await getEvent(slug);
  if (!event) notFound();

  const [settings, registered] = await Promise.all([
    getEventSettings(event.id),
    countRegistered(event.id),
  ]);

  // The same rule the server action enforces — the UI just explains it.
  const status = registrationOpen(event, settings, registered);
  const base = `/events/hub/${event.slug}`;

  return (
    <Container className="grid gap-8 py-14 lg:grid-cols-[1fr_1.5fr]">
      {/* Explainer */}
      <div className="flex flex-col gap-5">
        <div>
          <span className="font-mono text-[11px] uppercase tracking-[0.25em] text-zinc-500">
            Team registration
          </span>
          <h1 className="mt-2 text-3xl font-semibold tracking-tighter text-white md:text-4xl">
            Enlist your team
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-zinc-400">
            Teams of {event.team_min}–{event.team_max}. One person registers everyone.
          </p>
        </div>

        {event.capacity != null && (
          <div className="rounded-full border border-white/10 px-4 py-2 text-center font-mono text-xs text-zinc-400">
            {registered} / {event.capacity} places claimed
          </div>
        )}

        <div className="flex flex-col gap-3">
          {[
            {
              icon: Users,
              title: "1 · Register",
              desc: "Add your team name and every member — name, email, class.",
            },
            {
              icon: KeyRound,
              title: "2 · Credentials on screen",
              desc: "Your Team ID and password appear immediately. Save them; the password is shown once.",
            },
            {
              icon: Rocket,
              title: "3 · Sign in and start",
              desc: "Use them to reach your dashboard, missions and the live leaderboard.",
            },
          ].map(({ icon: Icon, title, desc }) => (
            <Card key={title} className="flex items-start gap-4 p-5">
              <span
                className="grid h-9 w-9 shrink-0 place-items-center rounded-xl"
                style={{
                  background: "color-mix(in oklab, var(--ev-accent) 15%, transparent)",
                  color: "var(--ev-accent)",
                }}
              >
                <Icon className="h-4 w-4" />
              </span>
              <div>
                <h2 className="text-sm font-semibold text-white">{title}</h2>
                <p className="mt-0.5 text-xs leading-relaxed text-zinc-400">{desc}</p>
              </div>
            </Card>
          ))}
        </div>

        <p className="text-xs text-zinc-500">
          Already registered?{" "}
          <Link href={`${base}/login`} className="text-white underline underline-offset-4">
            Sign in to your dashboard →
          </Link>
        </p>
      </div>

      {/* Form */}
      <Card deep className="p-6 md:p-8">
        {status.ok ? (
          <EventRegisterForm
            eventSlug={event.slug}
            teamMin={event.team_min}
            teamMax={event.team_max}
            loginHref={`${base}/login`}
          />
        ) : (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <span className="grid h-14 w-14 place-items-center rounded-full bg-amber-500/15 text-amber-300">
              <Lock className="h-6 w-6" />
            </span>
            <h2 className="text-xl font-semibold tracking-tight text-white">
              Registration is not open
            </h2>
            <p className="max-w-sm text-sm text-zinc-400">{status.reason}</p>
            <Link
              href={base}
              className="mt-2 text-xs text-zinc-400 underline underline-offset-4 hover:text-white"
            >
              Back to {event.name}
            </Link>
          </div>
        )}
      </Card>
    </Container>
  );
}
