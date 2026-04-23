import { cn } from "@/lib/utils";
import type { HTMLAttributes, ReactNode } from "react";

export function Card({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-surface shadow-[0_1px_2px_rgba(16,24,40,0.04)]",
        className
      )}
      {...props}
    />
  );
}

export function CardHeader({
  title,
  desc,
  action,
  className,
}: {
  title: ReactNode;
  desc?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-start justify-between gap-3 px-5 pt-4 pb-3",
        className
      )}
    >
      <div>
        <div className="text-sm font-semibold">{title}</div>
        {desc && <div className="text-xs text-muted mt-0.5">{desc}</div>}
      </div>
      {action}
    </div>
  );
}

export function CardBody({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-5 pb-5", className)} {...props} />;
}
