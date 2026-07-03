import React from "react";
import { cn } from "@/lib/utils";

export interface DividerProps extends React.HTMLAttributes<HTMLHRElement> {
  thickness?: "thin" | "thick";
}

export function Divider({ thickness = "thin", className, ...props }: DividerProps) {
  return (
    <hr
      className={cn(
        "border-0 border-t",
        thickness === "thick" ? "border-t-8 border-zinc-900" : "border-zinc-800",
        className,
      )}
      {...props}
    />
  );
}
