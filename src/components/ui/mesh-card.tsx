import React from "react";
import { cn } from "@/lib/utils";

/**
 * The club's feature card: a near-black panel with one saturated colour
 * bleeding in from a corner over a faint graph-paper grid.
 *
 * The accent is restricted to the brand's own cool range — violet, electric
 * blue and the cyan between them. Letting each card pick an arbitrary hue is
 * what turns a set of cards into a fruit bowl.
 */
export type MeshAccent = "violet" | "electric" | "cyan";

const ACCENTS: Record<MeshAccent, string> = {
  violet: "var(--color-brand-500)",
  electric: "var(--color-electric-500)",
  cyan: "#22d3ee",
};

export type MeshOrigin = "top-right" | "top-left" | "bottom-right";

const ORIGINS: Record<MeshOrigin, string> = {
  "top-right": "100% 0%",
  "top-left": "0% 0%",
  "bottom-right": "100% 100%",
};

export interface MeshCardProps extends React.HTMLAttributes<HTMLElement> {
  accent?: MeshAccent;
  origin?: MeshOrigin;
  /** Rendered element — `article` inside a list, `div` standalone. */
  as?: "div" | "article" | "section";
}

export function MeshCard({
  accent = "violet",
  origin = "top-right",
  as: Tag = "div",
  className,
  children,
  style,
  ...props
}: MeshCardProps) {
  return (
    <Tag
      className={cn("mesh-card rounded-3xl", className)}
      style={
        {
          "--card-accent": ACCENTS[accent],
          "--card-origin": ORIGINS[origin],
          ...style,
        } as React.CSSProperties
      }
      {...props}
    >
      {children}
    </Tag>
  );
}
