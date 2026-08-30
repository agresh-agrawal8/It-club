import React from "react";
import { cn } from "@/lib/utils";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Lift + glow on hover — for clickable cards. */
  hoverLift?: boolean;
  /** Frosted glass surface (default). Set false for a solid panel. */
  glass?: boolean;
  /** Deeper, elevated glass for feature panels. */
  deep?: boolean;
  /**
   * Opaque brand surface instead of frosted glass. Used throughout the
   * signed-in app, where there is no imagery behind the panel for glass to
   * refract and the frosted treatment just reads as grey haze.
   */
  surface?: boolean;
}

/**
 * The surface every panel in the app sits on.
 *
 * The thin violet→blue gradient edge is applied here rather than per-usage, so
 * a card cannot end up with a plain grey border in one corner of the product
 * and the brand edge in another.
 */
export const Card = React.forwardRef<HTMLDivElement, CardProps>(function Card(
  { hoverLift = false, glass = true, deep = false, surface = false, className, children, ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn(
        "rounded-3xl p-8",
        surface
          ? "surface"
          : deep
            ? "glass-deep hairline-gradient"
            : glass
              ? "glass hairline-gradient"
              : "border border-white/10 bg-surface-1",
        hoverLift && (surface ? "surface-hover" : "glass-hover"),
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
});
