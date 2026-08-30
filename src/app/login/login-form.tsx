"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { LogIn, AlertCircle } from "lucide-react";
import { loginAction, type AuthState } from "@/lib/actions/auth";
import { Field } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";

export function LoginForm() {
  const params = useSearchParams();
  const redirect = params.get("redirect") ?? "";
  const inactive = params.get("error") === "inactive";
  const [state, formAction] = useActionState<AuthState, FormData>(loginAction, undefined);

  const message = state?.error ?? (inactive ? "That account is no longer active." : null);

  return (
    <form action={formAction} className="flex flex-col gap-6" noValidate>
      <input type="hidden" name="redirect" value={redirect} />

      <Field
        name="name"
        label="Your name"
        placeholder="Firstname Lastname"
        // `username` rather than `name`: password managers key their entry off
        // this, and `name` would make them offer a postal-address autofill.
        autoComplete="username"
        autoCapitalize="words"
        required
        autoFocus
      />

      <Field
        name="password"
        type="password"
        label="Password"
        placeholder="••••••••"
        autoComplete="current-password"
        required
      />

      {message && (
        <p
          // Announced by a screen reader the moment it appears, without
          // stealing focus from the field the person is still in.
          role="alert"
          aria-live="polite"
          className="flex items-start gap-2.5 rounded-2xl border border-red-400/25 bg-red-500/10 px-4 py-3 text-sm text-red-200"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          {message}
        </p>
      )}

      <SubmitButton icon={<LogIn className="h-4 w-4" aria-hidden />} pendingLabel="Signing in…">
        Sign in
      </SubmitButton>
    </form>
  );
}
