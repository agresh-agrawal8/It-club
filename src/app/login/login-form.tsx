"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { LogIn } from "lucide-react";
import { loginAction, type AuthState } from "@/lib/actions/auth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function LoginForm() {
  const params = useSearchParams();
  const redirect = params.get("redirect") ?? "/dashboard";
  const [state, formAction, pending] = useActionState<AuthState, FormData>(loginAction, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <input type="hidden" name="redirect" value={redirect} />
      <Input
        name="memberId"
        label="Member ID or Email"
        placeholder="AVN-0001 or you@email.com"
        autoComplete="username"
        required
      />
      <Input
        name="password"
        type="password"
        label="Password"
        placeholder="••••••••"
        autoComplete="current-password"
        required
      />
      {state?.error && (
        <p className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-300">
          {state.error}
        </p>
      )}
      <Button type="submit" size="lg" disabled={pending}>
        <LogIn className="h-4 w-4" />
        {pending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
