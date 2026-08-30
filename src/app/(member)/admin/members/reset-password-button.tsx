"use client";

import { useActionState, useState } from "react";
import { Check, Copy, KeyRound, AlertCircle } from "lucide-react";
import { resetMemberPasswordAction, type ResetPasswordState } from "@/lib/actions/admin";
import { SubmitButton } from "@/components/ui/submit-button";

/**
 * Reset a member's password.
 *
 * There is deliberately no "view password" anywhere in this interface. The
 * database holds a bcrypt hash, so the old password is not recoverable even in
 * principle — this issues a new one and flags the account so the member has to
 * replace it at their next sign-in.
 */
export function ResetPasswordButton({ id, name }: { id: string; name: string }) {
  const [state, formAction] = useActionState<ResetPasswordState, FormData>(
    resetMemberPasswordAction,
    undefined,
  );
  const [copied, setCopied] = useState(false);

  async function copy(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard may be unavailable; the value is on screen.
    }
  }

  if (state?.success && state.tempPassword) {
    return (
      <div
        role="status"
        className="flex flex-col gap-2 rounded-xl border border-emerald-400/25 bg-emerald-500/[0.07] p-3"
      >
        <p className="text-xs text-ink-2">
          New password for <span className="font-medium text-white">{state.name}</span> — shown once:
        </p>
        <div className="flex items-center gap-2">
          <code className="flex-1 break-all font-mono text-sm text-white">
            {state.tempPassword}
          </code>
          <button
            type="button"
            onClick={() => copy(state.tempPassword!)}
            aria-label="Copy password"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/15 text-white transition-colors hover:bg-white/5"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5" aria-hidden />
            ) : (
              <Copy className="h-3.5 w-3.5" aria-hidden />
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-1.5">
      <input type="hidden" name="id" value={id} />
      <SubmitButton
        variant="secondary"
        icon={<KeyRound className="h-3.5 w-3.5" aria-hidden />}
        pendingLabel="Resetting…"
        aria-label={`Reset password for ${name}`}
        className="px-4 py-2.5 text-xs"
      >
        Reset password
      </SubmitButton>
      {state?.error && (
        <p role="alert" className="flex items-center gap-1.5 text-[11px] text-red-300">
          <AlertCircle className="h-3 w-3 shrink-0" aria-hidden />
          {state.error}
        </p>
      )}
    </form>
  );
}
