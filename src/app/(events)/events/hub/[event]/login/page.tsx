import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { getEvent, resolveTheme } from "@/lib/events/engine";
import { readEventSession } from "@/lib/events/session";
import { EventLoginForm } from "@/components/events/login-form";

export const metadata = { title: "Team sign in" };

export default async function EventLoginPage({
  params,
}: {
  params: Promise<{ event: string }>;
}) {
  const { event: slug } = await params;
  const event = await getEvent(slug);
  if (!event) notFound();

  // Already signed in — go straight through.
  const existing = await readEventSession(event.slug).catch(() => null);
  if (existing) redirect(`/events/hub/${event.slug}/dashboard`);

  const theme = resolveTheme(event);
  const base = `/events/hub/${event.slug}`;

  return (
    <Container className="flex min-h-[70vh] items-center justify-center py-14">
      <Card deep className="w-full max-w-md p-7 md:p-8">
        <div className="mb-6 text-center">
          <span
            className="mx-auto grid h-11 w-11 place-items-center rounded-xl text-xs font-bold text-white"
            style={{ background: theme.accent }}
          >
            {theme.codename}
          </span>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight text-white">Team sign in</h1>
          <p className="mt-1.5 text-sm text-zinc-400">
            Use the Team ID and password issued when you registered.
          </p>
        </div>

        <EventLoginForm eventSlug={event.slug} codeHint={`${theme.codename}-XXXX`} />

        <p className="mt-6 text-center text-xs text-zinc-500">
          No team yet?{" "}
          <Link href={`${base}/register`} className="text-white underline underline-offset-4">
            Register your team →
          </Link>
        </p>
        <p className="mt-2 text-center text-[11px] text-zinc-600">
          Lost your password? The organisers can re-issue it.
        </p>
      </Card>
    </Container>
  );
}
