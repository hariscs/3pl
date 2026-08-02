const ROW_IDS = ["a", "b", "c", "d", "e", "f", "g", "h"];

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="animate-pulse space-y-3 p-6" aria-hidden>
      <div className="h-8 w-full rounded bg-manila" />
      {ROW_IDS.slice(0, rows).map((id) => (
        <div key={id} className="h-6 w-full rounded bg-manila/60" />
      ))}
    </div>
  );
}
