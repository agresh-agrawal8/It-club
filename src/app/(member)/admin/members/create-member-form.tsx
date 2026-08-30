"use client";

import { useActionState, useState } from "react";
import { AlertCircle, Check, Copy, UserPlus } from "lucide-react";
import { createMemberAction, type CreateMemberState } from "@/lib/actions/admin";
import { Field, SelectField } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";

/**
 * Create an account.
 *
 * The generated password is shown here exactly once, immediately after
 * creation, so it can be handed to the member. It is not stored anywhere in
 * readable form and cannot be retrieved again — if it is lost, the only path
 * is Reset, which issues a different one.
 */
export function CreateMemberForm() {
  const [state, formAction] = useActionState<CreateMemberState, FormData>(
    createMemberAction,
    undefined,
  );

  if (state?.success && state.tempPassword) {
    return <CredentialHandover name={state.name!} password={state.tempPassword} />;
  }

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          name="fullName"
          label="Full name"
          placeholder="Firstname Lastname"
          hint="This is what they type to sign in, so spell it the way they will."
          autoComplete="off"
          required
        />
        <SelectField
          name="role"
          label="Role"
          defaultValue="member"
          hint="Core team can manage everything the club publishes."
          options={[
            { value: "member", label: "Member" },
            { value: "core_team", label: "Core team" },
          ]}
        />
      </div>

      {state?.error && (
        <p
          role="alert"
          className="flex items-start gap-2.5 rounded-2xl border border-red-400/25 bg-red-500/10 px-4 py-3 text-sm text-red-200"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          {state.error}
        </p>
      )}

      <p className="text-xs leading-relaxed text-ink-4">
        A one-time password is generated automatically and shown once. The member is asked to
        replace it the first time they sign in.
      </p>

      <SubmitButton
        icon={<UserPlus className="h-4 w-4" aria-hidden />}
        pendingLabel="Creating…"
        className="w-fit"
      >
        Create account
      </SubmitButton>
    </form>
  );
}

function CredentialHandover({ name, password }: { name: string; password: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard can be blocked; the password is on screen to read out.
    }
  }

  return (
    <div
      role="status"
      className="flex flex-col gap-5 rounded-2xl border border-emerald-400/25 bg-emerald-500/[0.07] p-6"
    >
      <div className="flex items-start gap-3">
        <Check className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" aria-hidden />
        <div className="flex flex-col gap-1">
          <h3 className="text-sm font-semibold text-white">Account created for {name}</h3>
          <p className="text-sm leading-relaxed text-ink-2">
            Give them this password now — it is shown once and cannot be looked up again.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-white/10 bg-black/40 p-4">
        <code className="flex-1 break-all font-mono text-base tracking-wide text-white">
          {password}
        </code>
        <button
          type="button"
          onClick={copy}
          className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/15 px-4 py-2.5 text-xs font-medium text-white transition-colors hover:bg-white/5"
        >
          {copied ? (
            <Check className="h-3.5 w-3.5" aria-hidden />
          ) : (
            <Copy className="h-3.5 w-3.5" aria-hidden />
          )}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>

      <button
        type="button"
        onClick={() => window.location.reload()}
        className="w-fit text-sm text-brand-300 underline-offset-4 hover:underline"
      >
        Create another account
      </button>
    </div>
  );
}
