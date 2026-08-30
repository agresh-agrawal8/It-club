import React from "react";
import { cn } from "@/lib/utils";

// `title` is omitted from the DOM attributes it inherits: the native one is a
// tooltip string, and this component takes a ReactNode heading.
export interface SectionHeadingProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  eyebrow?: string;
  title: React.ReactNode;
  description?: string;
  align?: "left" | "center";
  /**
   * Heading level. Sections on a page below the <h1> should be h2; a heading
   * nested inside one of those should be h3. Getting this right is what makes
   * the document outline navigable with a screen reader.
   */
  as?: "h2" | "h3";
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  as: Heading = "h2",
  className,
  ...props
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4",
        align === "center" && "items-center text-center",
        className,
      )}
      {...props}
    >
      {eyebrow && (
        <span className="eyebrow flex items-center gap-3 text-champagne-300">
          <span aria-hidden className="h-px w-8 bg-gradient-to-r from-champagne-400 to-transparent" />
          {eyebrow}
        </span>
      )}
      <Heading className="headline text-balance text-[clamp(1.9rem,1.2rem+2.6vw,3.4rem)] text-white">
        {title}
      </Heading>
      {description && (
        <p className="max-w-2xl text-balance text-base leading-relaxed text-ink-2 md:text-lg">
          {description}
        </p>
      )}
    </div>
  );
}
