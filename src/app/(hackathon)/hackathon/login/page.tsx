import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { TeamLoginForm } from "./login-form";

export const metadata: Metadata = { title: "Team sign in" };

export default function TeamLoginPage() {
  return (
    <Container className="flex justify-center py-20">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <span className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 via-brand-600 to-accent-600">
            <span className="h-3.5 w-3.5 rotate-45 rounded-[2px] bg-white" />
          </span>
          <h1 className="text-3xl font-semibold tracking-tighter text-white">Team sign in</h1>
          <p className="text-sm text-zinc-400">
            Use the Team ID and password issued by the core team.
          </p>
        </div>

        <Card deep className="p-7">
          <TeamLoginForm />
        </Card>

        <p className="mt-6 text-center text-xs text-zinc-500">
          No team yet?{" "}
          <Link href="/hackathon/register" className="text-brand-300 hover:text-brand-200">
            Register your team →
          </Link>
        </p>
      </div>
    </Container>
  );
}
