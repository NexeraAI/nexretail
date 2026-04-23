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
    <div className="flex items-start justify-between gap-4 px-6 py-5 bg-surface border-b border-border">
      <div>
        {eyebrow && (
          <div className="text-[11px] font-medium tracking-wider uppercase text-muted mb-1">
            {eyebrow}
          </div>
        )}
        <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
        {desc && <p className="mt-1 text-sm text-muted">{desc}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
