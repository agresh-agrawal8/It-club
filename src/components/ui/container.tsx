import React from "react";
import { cn } from "@/lib/utils";

/** Centered max-width content wrapper with responsive horizontal padding. */
export function Container({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mx-auto w-full max-w-7xl px-6 md:px-10", className)} {...props} />;
}
