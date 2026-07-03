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
      {eyebrow && <span className="eyebrow text-brand-300">{eyebrow}</span>}
      <h2 className="text-balance text-4xl font-semibold tracking-tighter text-white md:text-5xl lg:text-6xl">
        {title}
      </h2>
      {description && (
        <p className="max-w-2xl text-balance text-lg leading-relaxed text-zinc-400">{description}</p>
      )}
    </div>
  );
}
