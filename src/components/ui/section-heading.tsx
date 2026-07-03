import React from "react";
import { cn } from "@/lib/utils";

export interface SectionHeadingProps extends React.HTMLAttributes<HTMLDivElement> {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  className,
  ...props
}: SectionHeadingProps) {
  return (
    <div
      className={cn("flex flex-col gap-4", align === "center" && "items-center text-center", className)}
      {...props}
    >
      {eyebrow && (
        <span className="text-xs font-medium uppercase tracking-[2px] text-brand-400">{eyebrow}</span>
      )}
      <h2 className="text-4xl font-semibold tracking-tighter text-white md:text-6xl">{title}</h2>
      {description && (
        <p className={cn("text-lg leading-relaxed text-zinc-300", align === "center" ? "max-w-2xl" : "max-w-2xl")}>
          {description}
        </p>
      )}
    </div>
  );
}
