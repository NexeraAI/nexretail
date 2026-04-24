import type { ReactNode } from "react";

export function PageHeader({
  eyebrow,
  title,
  desc,
  action,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  desc?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 px-6 pt-6">
      <div>
        {eyebrow && (
          <div className="text-[11px] font-medium tracking-wider uppercase text-muted-2 mb-1">
            {eyebrow}
          </div>
        )}
        <h1 className="text-[20px] font-bold tracking-tight text-foreground leading-tight">
          {title}
        </h1>
        {desc && (
          <p className="mt-1 text-[12px] text-muted-2">{desc}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
