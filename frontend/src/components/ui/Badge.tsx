import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

type Tone =
  | "default"
  | "accent"
  | "success"
  | "warning"
  | "danger"
  | "pink"
  | "purple"
  | "teal";

export function Badge({
  tone = "default",
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  const map: Record<Tone, string> = {
    default: "bg-surface-2 text-muted",
    accent: "bg-accent/10 text-accent",
    success: "bg-success/10 text-success",
    warning: "bg-warning/10 text-warning",
    danger: "bg-danger/10 text-danger",
    pink: "bg-pink/10 text-pink",
    purple: "bg-purple/10 text-purple",
    teal: "bg-teal/10 text-teal",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium",
        map[tone],
        className
      )}
      {...props}
    />
  );
}
