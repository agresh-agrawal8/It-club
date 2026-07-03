import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { Logo } from "@/components/layout/logo";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Member login",
  description: "Sign in to the EHIS IT Club member area.",
};

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen items-center">
      <div className="glow-violet pointer-events-none absolute inset-0 -z-10" />
      <Container className="flex justify-center py-16">
        <div className="w-full max-w-md">
          <Link href="/" className="mb-8 flex w-fit items-center gap-2 text-sm text-zinc-400 hover:text-white">
            <ArrowLeft className="h-4 w-4" /> Back to site
          </Link>

          <div className="mb-8 flex flex-col items-center gap-4 text-center">
            <Logo />
            <h1 className="mt-2 text-3xl font-semibold tracking-tighter text-white">Member sign in</h1>
            <p className="text-sm text-zinc-400">
              Use the Member ID (or email) and password provided by your core team.
            </p>
          </div>

          <Card glass>
            <Suspense fallback={<div className="h-64" />}>
              <LoginForm />
            </Suspense>
          </Card>

          <p className="mt-6 text-center text-xs text-zinc-500">
            Don't have an account? Member accounts are created by the core team.
          </p>
        </div>
      </Container>
    </div>
  );
}
