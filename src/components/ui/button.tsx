import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export type ButtonVariant = "primary" | "brand" | "secondary" | "link" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

// Motion uses the system tokens so every button shares one timing language.
// Transform-only hover keeps it on the compositor at 60fps.
const base =
  "group/btn relative inline-flex items-center justify-center gap-2 rounded-2xl font-medium tracking-tight transition-[transform,background-color,border-color,box-shadow,color] duration-[var(--duration-fast)] ease-[var(--ease-out-quart)] hover:-translate-y-px active:translate-y-0 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40 disabled:saturate-50";

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-4 py-2 text-xs",
  md: "px-6 py-3 text-sm",
  lg: "px-8 py-4 text-base",
};

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-white text-zinc-950 shadow-[0_6px_20px_-8px_rgba(0,0,0,0.6)] hover:bg-zinc-100",
  brand:
    "bg-gradient-to-b from-brand-400 to-brand-600 text-white shadow-[0_8px_28px_-10px_var(--color-brand-500)] hover:shadow-[0_12px_36px_-10px_var(--color-brand-500)] hover:brightness-110",
  secondary:
    "bg-white/[0.03] text-white border border-white/15 hover:bg-white/[0.07] hover:border-brand-400/50",
  ghost: "bg-transparent text-zinc-300 hover:bg-white/5 hover:text-white",
  danger: "bg-red-500/90 text-white shadow-[0_8px_28px_-12px_#ef4444] hover:bg-red-500",
  link: "bg-transparent text-white underline underline-offset-4 hover:text-brand-300 px-0 py-0",
};

interface CommonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
}

export interface ButtonProps
  extends CommonProps,
    React.ButtonHTMLAttributes<HTMLButtonElement> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", className, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(base, variant !== "link" && sizeClasses[size], variantClasses[variant], className)}
      {...props}
    />
  ),
);
Button.displayName = "Button";

/** Button-styled Next.js link for navigation CTAs. */
export function ButtonLink({
  variant = "primary",
  size = "md",
  className,
  ...props
}: CommonProps & React.ComponentProps<typeof Link>) {
  return (
    <Link
      className={cn(base, variant !== "link" && sizeClasses[size], variantClasses[variant], className)}
      {...props}
    />
  );
}
