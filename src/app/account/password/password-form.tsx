"use client";

import { useActionState } from "react";
import { KeyRound, AlertCircle, CheckCircle2 } from "lucide-react";
import { changePasswordAction, type PasswordState } from "@/lib/actions/auth";
import { Field } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";

export function PasswordForm({ forced }: { forced: boolean }) {
  const [state, formAction] = useActionState<PasswordState, FormData>(
    changePasswordAction,
    undefined,
  );

  if (state?.success) {
    return (
      <div
        role="status"
        className="flex flex-col items-center gap-4 rounded-2xl border border-emerald-400/25 bg-emerald-500/10 px-6 py-10 text-center"
      >
        <CheckCircle2 className="h-8 w-8 text-emerald-300" aria-hidden />
        <div className="flex flex-col gap-1.5">
          <h2 className="text-base font-semibold text-white">Password changed</h2>
          <p className="text-sm text-ink-2">
            Use your new password next time you sign in.
          </p>
        </div>
        <a
          href="/dashboard"
          className="mt-2 rounded-2xl bg-white px-6 py-3 text-sm font-medium text-zinc-950"
        >
          Continue
        </a>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-6" noValidate>
      <Field
        name="currentPassword"
        type="password"
        label={forced ? "Temporary password" : "Current password"}
        autoComplete="current-password"
        required
        autoFocus
      />
      <Field
        name="newPassword"
        type="password"
        label="New password"
        hint="At least 8 characters. Longer is better than complicated."
        autoComplete="new-password"
        minLength={8}
        required
      />
      <Field
        name="confirmPassword"
        type="password"
        label="Confirm new password"
        autoComplete="new-password"
        minLength={8}
        required
      />

      {state?.error && (
        <p
          role="alert"
          aria-live="polite"
          className="flex items-start gap-2.5 rounded-2xl border border-red-400/25 bg-red-500/10 px-4 py-3 text-sm text-red-200"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          {state.error}
        </p>
      )}

      <SubmitButton
        icon={<KeyRound className="h-4 w-4" aria-hidden />}
        pendingLabel="Updating…"
      >
        Change password
      </SubmitButton>
    </form>
  );
}
