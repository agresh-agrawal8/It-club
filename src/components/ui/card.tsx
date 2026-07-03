import React from "react";
import { cn } from "@/lib/utils";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Lift + glow on hover — for clickable project/event cards. */
  hoverLift?: boolean;
  /** Frosted glassmorphism surface (default). Set false for solid zinc. */
  glass?: boolean;
  /** Deeper, elevated glass for feature panels and auth cards. */
  deep?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ hoverLift = false, glass = true, deep = false, className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-3xl p-8",
        deep ? "glass-deep" : glass ? "glass" : "border border-white/10 bg-zinc-900",
        hoverLift && "glass-hover",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  ),
);
Card.displayName = "Card";
