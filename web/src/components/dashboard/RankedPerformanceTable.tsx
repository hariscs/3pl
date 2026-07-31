import Link from "next/link";

export type RankedRow = {
  id: string;
  name: string;
  subtitle?: string;
  stats: { label: string; value: string }[];
  href: string;
};

/** Shared by Customer Performance and Location Performance — both are a
 * ranked list of {name, 2-3 stat columns, a link}, so one generic
 * presentational component serves both rather than two near-duplicates. */
export function RankedPerformanceTable({
  rows,
  emptyMessage,
}: {
  rows: RankedRow[];
  emptyMessage: string;
}) {
  if (rows.length === 0) {
    return <p className="py-6 text-center text-sm text-steel">{emptyMessage}</p>;
  }

  return (
    <div className="space-y-1.5">
      {rows.map((row) => (
        <Link
          key={row.id}
          href={row.href}
          className="flex items-center justify-between gap-3 rounded-lg border border-manila-dark bg-cream px-3 py-2.5 transition-colors hover:border-rust/30"
        >
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-ink">{row.name}</p>
            {row.subtitle && (
              <p className="truncate text-xs text-steel">{row.subtitle}</p>
            )}
          </div>
          <div className="flex flex-none items-center gap-4">
            {row.stats.map((s) => (
              <div key={s.label} className="text-right">
                <p className="font-tick text-sm font-semibold text-ink">{s.value}</p>
                <p className="text-[10px] uppercase tracking-wide text-steel-light">
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </Link>
      ))}
    </div>
  );
}
