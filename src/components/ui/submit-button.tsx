"use client";

import React from "react";
import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Submit button that reflects its own form's pending state.
 *
 * `useFormStatus` reads the status of the enclosing <form>, so a plain
 * `<form action={serverAction}>` gets a spinner and a disabled control with no
 * per-form wiring. Without it a database write looks like nothing happened
 * until the page re-renders — the single biggest reason server actions feel
 * slow even when they are fast.
 *
 * `aria-busy` carries the same information to a screen reader that the spinner
 * carries visually, and the label itself changes, so the state is never
 * communicated by animation alone.
 */

type Variant = "primary" | "secondary" | "danger";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-gradient-to-b from-brand-400 to-brand-600 text-white shadow-[0_8px_28px_-10px_var(--color-brand-500)] hover:shadow-[0_12px_36px_-10px_var(--color-brand-500)] hover:brightness-110",
  secondary: "border border-white/15 bg-white/[0.03] text-white hover:bg-white/[0.07]",
  danger: "bg-red-500/90 text-white hover:bg-red-500",
};

export function SubmitButton({
  children,
  pendingLabel,
  className,
  icon,
  variant = "primary",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  pendingLabel?: string;
  icon?: React.ReactNode;
  variant?: Variant;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending || props.disabled}
      aria-busy={pending}
      className={cn(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl px-6 py-3.5 text-sm font-medium",
        "transition-[transform,box-shadow,background-color,opacity] duration-[var(--duration-fast)] ease-[var(--ease-out-quart)]",
        "hover:-translate-y-px active:translate-y-0 active:scale-[0.99]",
        "disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:translate-y-0",
        VARIANTS[variant],
        className,
      )}
      {...props}
    >
      {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : icon}
      {pending && pendingLabel ? pendingLabel : children}
    </button>
  );
}
