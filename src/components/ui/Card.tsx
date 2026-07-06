import type { ReactNode } from "react";

export function Card({
  title,
  action,
  children,
  className = "",
}: {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-md border border-manila-dark bg-paper-dim/60 ${className}`}
    >
      {title && (
        <div className="flex items-center justify-between border-b border-manila-dark px-5 py-3.5">
          <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-ink">
            {title}
          </h2>
          {action}
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
}
