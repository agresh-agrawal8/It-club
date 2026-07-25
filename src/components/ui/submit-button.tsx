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
 * per-form `useActionState` wiring. Without this, a Supabase write looks like
 * nothing happened until the page re-renders — the single biggest reason server
 * actions feel slow even when they are fast.
 */
export function SubmitButton({
  children,
  pendingText,
  className,
  icon,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  pendingText?: string;
  icon?: React.ReactNode;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending || props.disabled}
      aria-busy={pending}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 transition-opacity disabled:cursor-not-allowed disabled:opacity-55",
        className,
      )}
      {...props}
    >
      {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : icon}
      {pending && pendingText ? pendingText : children}
    </button>
  );
}
