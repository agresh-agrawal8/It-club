import Link from "next/link";
import { Container } from "@/components/ui/container";
import { ButtonLink } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="relative flex min-h-screen items-center">
      <div className="glow-violet pointer-events-none absolute inset-0 -z-10" />
      <Container className="flex flex-col items-center gap-6 py-32 text-center">
        <span className="text-8xl font-bold tracking-tighter text-gradient">404</span>
        <h1 className="text-2xl font-semibold tracking-tight text-white">Page not found</h1>
        <p className="max-w-md text-zinc-400">
          The page you're looking for doesn't exist or may have been moved.
        </p>
        <div className="flex gap-3">
          <ButtonLink href="/">Back home</ButtonLink>
          <Link
            href="/search"
            className="inline-flex items-center rounded-2xl border border-white/20 px-6 py-3 text-sm text-white hover:bg-white/5"
          >
            Search
          </Link>
        </div>
      </Container>
    </div>
  );
}
