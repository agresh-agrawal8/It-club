import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
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

          <div className="mb-8 flex flex-col items-center gap-3 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 font-mono text-lg font-bold text-white">
              &gt;_
            </span>
            <h1 className="text-3xl font-semibold tracking-tighter text-white">
              Welcome to <span className="font-mono">soch<span className="text-brand-300">.exe</span></span>
            </h1>
            <p className="text-sm text-zinc-400">
              Sign in with your Member ID (or email) and the password provided by your core team.
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
