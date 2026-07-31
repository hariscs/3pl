import { AlertTriangle } from "lucide-react";
import Link from "next/link";
import { LoadStatusPill } from "@/components/loads/LoadStatusPill";
import { Button } from "@/components/ui/Button";
import type { OperationalLoadRow } from "@/lib/dashboard";
import { formatDuration } from "@/lib/load-time";

/** A small, always-fits-on-screen live list of in-progress/paused loads —
 * deliberately not FilterableTable, which is built for paginated/sortable
 * datasets, not a compact "what's happening right now" glance. */
export function OperationsNowTable({ rows }: { rows: OperationalLoadRow[] }) {
  if (rows.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-steel">
        No active or paused loads right now.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-manila-dark">
      <table className="w-full min-w-max border-collapse text-sm">
        <thead>
          <tr className="bg-manila">
            {[
              "Load",
              "Customer",
              "Location",
              "Work Type",
              "Container",
              "Status",
              "Elapsed",
              "Crew",
              "Supervisor",
              "Attention",
              "",
            ].map((header) => (
              <th
                key={header}
                className="border-b border-manila-dark px-3 py-2.5 text-left font-display text-xs font-semibold uppercase tracking-wide text-ink"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.loadId} className="odd:bg-paper even:bg-paper-dim/40">
              <td className="border-b border-manila-dark/60 px-3 py-2.5">
                <Link
                  href={`/loads/${r.loadId}`}
                  className="font-tick font-medium text-ink hover:text-rust"
                >
                  {r.loadNumber}
                </Link>
              </td>
              <td className="border-b border-manila-dark/60 px-3 py-2.5 text-ink">
                {r.customerName}
              </td>
              <td className="border-b border-manila-dark/60 px-3 py-2.5 text-ink">
                {r.locationName}
              </td>
              <td className="border-b border-manila-dark/60 px-3 py-2.5 text-ink">
                {r.workTypeName}
              </td>
              <td className="border-b border-manila-dark/60 px-3 py-2.5 font-tick text-ink">
                {r.containerNumber || "—"}
              </td>
              <td className="border-b border-manila-dark/60 px-3 py-2.5">
                <LoadStatusPill status={r.status} />
              </td>
              <td className="border-b border-manila-dark/60 px-3 py-2.5 font-tick text-ink">
                {r.elapsedMinutes != null ? formatDuration(r.elapsedMinutes) : "—"}
              </td>
              <td className="border-b border-manila-dark/60 px-3 py-2.5 font-tick text-ink">
                {r.crewWorking} working
                {r.crewOnBreak > 0 ? ` · ${r.crewOnBreak} on break` : ""}
              </td>
              <td className="border-b border-manila-dark/60 px-3 py-2.5 text-ink">
                {r.supervisorName ?? "—"}
              </td>
              <td className="border-b border-manila-dark/60 px-3 py-2.5">
                {r.attentionLabel && (
                  <span className="inline-flex items-center gap-1 text-xs text-amber">
                    <AlertTriangle className="h-3 w-3 flex-none" />
                    <span className="max-w-40 truncate">{r.attentionLabel}</span>
                  </span>
                )}
              </td>
              <td className="border-b border-manila-dark/60 px-3 py-2.5 text-right">
                <Link href={`/loads/${r.loadId}`}>
                  <Button variant="secondary">View</Button>
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
