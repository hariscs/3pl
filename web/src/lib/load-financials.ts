import { getAssignmentWorkedMinutes } from "@/lib/load-time";
import { getBillingQuantity } from "@/lib/loads";
import type { Load, LoadCrewAssignment } from "@/lib/types";

export type LoadFinancials = { billedAmount: number; payoutAmount: number };

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function getTotalWorkedHours(assignments: LoadCrewAssignment[]): number {
  return assignments
    .filter((a) => a.status !== "removed")
    .reduce((sum, a) => sum + getAssignmentWorkedMinutes(a) / 60, 0);
}

/** The real replacement for the old, never-called calculateLoadAmounts.
 * Recomputes billed/payout from the Load's frozen snapshot rates and its
 * current quantities/worked-hours — never from the live Work Type, since
 * that's the entire point of snapshotting. Cancelled loads always zero out.
 * Called server-side by the mock handler on quantity/assignment changes
 * pre-closure; never called once a Load is closed or cancelled. */
export function computeLoadFinancials(
  load: Pick<
    Load,
    | "cases"
    | "palletCount"
    | "pieceCount"
    | "weight"
    | "assignments"
    | "paySnapshot"
    | "billingSnapshot"
    | "status"
  >,
): LoadFinancials {
  if (load.status === "cancelled") return { billedAmount: 0, payoutAmount: 0 };

  const { paySnapshot, billingSnapshot } = load;
  const workedHours = getTotalWorkedHours(load.assignments);

  const payoutAmount =
    paySnapshot.employeePayType === "hourly"
      ? round2(workedHours * paySnapshot.employeePayRate)
      : round2(
          getBillingQuantity(load, paySnapshot.unitOfMeasure) *
            paySnapshot.employeePayRate,
        );

  const billedAmount =
    billingSnapshot.customerBillingType === "hourly"
      ? round2(workedHours * billingSnapshot.customerBillingRate)
      : round2(
          getBillingQuantity(load, billingSnapshot.unitOfMeasure) *
            billingSnapshot.customerBillingRate,
        );

  return { billedAmount, payoutAmount };
}

/** Per-assignment share of a load's total production payout. Deliberate,
 * documented simplification: there is no per-worker unit-attribution
 * mechanism in this app (no "who packed which case"), so a production
 * load's payout is split evenly across every assignment that logged worked
 * time on it. Hourly-type pay is never split — getEmployeePayroll uses each
 * assignment's own worked hours directly instead of calling this. */
export function splitProductionPayout(load: Load): Map<string, number> {
  const contributors = load.assignments.filter(
    (a) => a.status !== "removed" && getAssignmentWorkedMinutes(a) > 0,
  );
  const share = new Map<string, number>();
  if (contributors.length === 0) return share;
  const each = round2(load.payoutAmount / contributors.length);
  for (const a of contributors) share.set(a.id, each);
  return share;
}
