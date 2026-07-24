import type { ReactNode } from "react";

export function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-manila-dark bg-cream p-5 text-center shadow-card">
      <p className="text-3xl font-bold tracking-tight text-ink">{value}</p>
      <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-steel">
        {label}
      </p>
      {hint ? <p className="mt-1.5 text-xs text-steel-light">{hint}</p> : null}
    </div>
  );
}
