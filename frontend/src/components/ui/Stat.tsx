import { cn } from "@/lib/utils";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import type { ReactNode } from "react";

export function Stat({
  label,
  value,
  delta,
  unit,
  icon,
  tone = "default",
  hint,
}: {
  label: string;
  value: ReactNode;
  delta?: number;
  unit?: string;
  icon?: ReactNode;
  tone?: "default" | "accent" | "success" | "warning" | "purple" | "pink" | "teal";
  hint?: string;
}) {
  const toneBg = {
    default: "bg-surface-2 text-muted",
    accent: "bg-accent/10 text-accent",
    success: "bg-success/10 text-success",
    warning: "bg-warning/10 text-warning",
    purple: "bg-purple/10 text-purple",
    pink: "bg-pink/10 text-pink",
    teal: "bg-teal/10 text-teal",
  }[tone];
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="flex items-center justify-between">
        <div className="text-xs text-muted">{label}</div>
        {icon && (
          <div className={cn("w-7 h-7 rounded-md grid place-items-center", toneBg)}>
            {icon}
          </div>
        )}
      </div>
      <div className="mt-2 flex items-baseline gap-1.5">
        <div className="text-2xl font-semibold tracking-tight">{value}</div>
        {unit && <div className="text-xs text-muted">{unit}</div>}
      </div>
      <div className="mt-1 flex items-center gap-2 text-[11px]">
        {typeof delta === "number" && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-medium",
              delta >= 0
                ? "bg-success/10 text-success"
                : "bg-danger/10 text-danger"
            )}
          >
            {delta >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {Math.abs(delta).toFixed(1)}%
          </span>
        )}
        {hint && <span className="text-muted">{hint}</span>}
      </div>
    </div>
  );
}
