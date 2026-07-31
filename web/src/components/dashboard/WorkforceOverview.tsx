import { StatusPill } from "@/components/ui/StatusPill";
import type { CertificationAlert, WorkforceRow } from "@/lib/dashboard";
import { formatDuration } from "@/lib/load-time";

export function WorkforceOverview({
  workingNow,
  onBreak,
  certificationAlerts,
}: {
  workingNow: WorkforceRow[];
  onBreak: WorkforceRow[];
  certificationAlerts: CertificationAlert[];
}) {
  const combined = [...workingNow, ...onBreak].sort(
    (a, b) => b.elapsedMinutes - a.elapsedMinutes,
  );
  const rows = combined.slice(0, 10);
  const hiddenCount = combined.length - rows.length;

  return (
    <div className="space-y-3">
      {combined.length === 0 ? (
        <p className="py-6 text-center text-sm text-steel">
          No crew members are currently clocked in.
        </p>
      ) : (
        <>
          <div className="divide-y divide-manila-dark/60">
            {rows.map((r) => (
              <div
                key={r.assignmentId}
                className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink">{r.name}</p>
                  <p className="truncate text-xs text-steel">
                    {r.employeeCode} · {r.loadNumber} · {r.locationName}
                  </p>
                </div>
                <div className="flex flex-none items-center gap-3">
                  <span className="font-tick text-xs text-steel">
                    {formatDuration(r.elapsedMinutes)}
                  </span>
                  <StatusPill tone={r.status === "clocked_in" ? "success" : "warning"}>
                    {r.status === "clocked_in" ? "Working" : "On Break"}
                  </StatusPill>
                </div>
              </div>
            ))}
          </div>
          {hiddenCount > 0 && (
            <p className="text-xs text-steel-light">+{hiddenCount} more</p>
          )}
        </>
      )}

      {certificationAlerts.length > 0 && (
        <div className="rounded-lg border border-amber/30 bg-amber-soft px-3 py-2.5">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-amber">
            Certification Alerts
          </p>
          <ul className="space-y-1 text-xs text-amber">
            {certificationAlerts.slice(0, 4).map((a) => (
              <li key={`${a.employeeId}-${a.certificationTypeId}`}>
                {a.employeeName}'s {a.certificationTypeId.replace(/_/g, " ")}{" "}
                certification {a.status === "expired" ? "has expired" : "expires soon"}.
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
