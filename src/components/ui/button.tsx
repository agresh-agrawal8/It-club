import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export type ButtonVariant = "primary" | "brand" | "secondary" | "link" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-2xl font-medium tracking-tight transition-all duration-300 ease-out hover:scale-[1.03] active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40";

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-4 py-2 text-xs",
  md: "px-6 py-3 text-sm",
  lg: "px-8 py-4 text-base",
};

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-white text-zinc-950 hover:bg-amber-200",
  brand:
    "bg-brand-500 text-white hover:bg-brand-400 shadow-[0_8px_28px_-10px_var(--color-brand-500)]",
  secondary:
    "bg-transparent text-white border border-white/20 hover:bg-white/5 hover:border-brand-400/50",
  ghost: "bg-transparent text-zinc-300 hover:bg-white/5 hover:text-white",
  danger: "bg-red-500/90 text-white hover:bg-red-500",
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
