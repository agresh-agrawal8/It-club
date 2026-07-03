import React from "react";
import { cn } from "@/lib/utils";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Lift the card on hover — for clickable project/event cards. */
  hoverLift?: boolean;
  /** Use the frosted glassmorphism surface instead of solid zinc-900. */
  glass?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ hoverLift = false, glass = false, className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-3xl border p-8",
        glass ? "glass" : "border-white/10 bg-zinc-900",
        hoverLift && "transition-transform duration-300 ease-out hover:-translate-y-2",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  ),
);
Card.displayName = "Card";
