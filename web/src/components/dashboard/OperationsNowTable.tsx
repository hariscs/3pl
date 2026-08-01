"use client";

import { AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";
import { LoadStatusPill } from "@/components/loads/LoadStatusPill";
import type { OperationalLoadRow } from "@/lib/dashboard";
import { formatDuration } from "@/lib/load-time";

const ONE_DAY_MINUTES = 24 * 60;

/** Elapsed time since startedAt, in HH:MM-style duration for a load that
 * genuinely started today, or a plain date once it crosses a day boundary —
 * this mock dataset's seed timestamps don't advance with real wall-clock
 * time, so a load "started" weeks ago would otherwise show as "672h 4m". */
function formatElapsed(
  elapsedMinutes: number | null,
  startedAt: string | null,
): string {
  if (elapsedMinutes == null) return "—";
  if (elapsedMinutes <= ONE_DAY_MINUTES) return formatDuration(elapsedMinutes);
  if (!startedAt) return formatDuration(elapsedMinutes);
  return `Since ${new Date(startedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
}

/** A small, always-fits-on-screen live list of in-progress/paused loads —
 * deliberately not FilterableTable, which is built for paginated/sortable
 * datasets, not a compact "what's happening right now" glance. Trimmed to
 * the columns that matter at a glance (Work Type/Location/Supervisor live
 * as subtitles or are one click away on the Load detail page instead) and
 * fixed-width so long values wrap/truncate rather than stretching the table
 * wider than its container. */
export function OperationsNowTable({ rows }: { rows: OperationalLoadRow[] }) {
  const router = useRouter();

  if (rows.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-steel">
        No active or paused loads right now.
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-manila-dark">
      <table className="w-full table-fixed border-collapse text-sm">
        <thead>
          <tr className="bg-manila">
            <th className="w-[26%] border-b border-manila-dark px-3 py-2.5 text-left font-display text-xs font-semibold uppercase tracking-wide text-ink">
              Load
            </th>
            <th className="w-[26%] border-b border-manila-dark px-3 py-2.5 text-left font-display text-xs font-semibold uppercase tracking-wide text-ink">
              Customer
            </th>
            <th className="w-[14%] border-b border-manila-dark px-3 py-2.5 text-left font-display text-xs font-semibold uppercase tracking-wide text-ink">
              Status
            </th>
            <th className="w-[13%] border-b border-manila-dark px-3 py-2.5 text-left font-display text-xs font-semibold uppercase tracking-wide text-ink">
              Elapsed
            </th>
            <th className="w-[11%] border-b border-manila-dark px-3 py-2.5 text-left font-display text-xs font-semibold uppercase tracking-wide text-ink">
              Crew
            </th>
            <th className="border-b border-manila-dark px-3 py-2.5 text-left font-display text-xs font-semibold uppercase tracking-wide text-ink">
              Attention
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr
              key={r.loadId}
              onClick={() => router.push(`/loads/${r.loadId}`)}
              className="cursor-pointer odd:bg-paper even:bg-paper-dim/40 transition-colors hover:bg-manila/40"
            >
              <td className="border-b border-manila-dark/60 px-3 py-2.5">
                <p className="truncate font-tick font-medium text-ink">
                  {r.loadNumber}
                </p>
                <p className="truncate text-xs text-steel">{r.workTypeName}</p>
              </td>
              <td className="border-b border-manila-dark/60 px-3 py-2.5">
                <p className="truncate text-ink">{r.customerName}</p>
                <p
                  className="truncate text-xs text-steel"
                  title={r.locationName}
                >
                  {r.locationName}
                </p>
              </td>
              <td className="border-b border-manila-dark/60 px-3 py-2.5">
                <LoadStatusPill status={r.status} />
              </td>
              <td className="border-b border-manila-dark/60 px-3 py-2.5 font-tick text-ink">
                {formatElapsed(r.elapsedMinutes, r.startedAt)}
              </td>
              <td className="border-b border-manila-dark/60 px-3 py-2.5">
                <p className="font-tick text-ink">{r.crewWorking}</p>
                {r.crewOnBreak > 0 && (
                  <p className="text-xs text-amber">{r.crewOnBreak} break</p>
                )}
              </td>
              <td className="border-b border-manila-dark/60 px-3 py-2.5">
                {r.attentionLabel && (
                  <span
                    className="inline-flex max-w-full items-center gap-1 text-xs text-amber"
                    title={r.attentionLabel}
                  >
                    <AlertTriangle className="h-3 w-3 flex-none" />
                    <span className="truncate">{r.attentionLabel}</span>
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
