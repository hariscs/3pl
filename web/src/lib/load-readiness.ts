import { getEmployeeDisplayName } from "./crew";
import type { Employee, Load, ProductType } from "./types";

export type ReadinessIssue = {
  label: string;
  /** severity = "blocker" (red), "warning" (amber) */
  severity: "blocker" | "warning";
};

export type ReadinessResult =
  | { status: "ready" }
  | { status: "review"; issues: ReadinessIssue[] }
  | { status: "cancelled" };

/** The gate a Load must pass to move → completed. Wired into the
 * completeLoad mock handler — a blocker issue rejects the transition. */
export function getLoadReadiness(
  load: Load,
  employees: Employee[],
  productType: ProductType | undefined,
): ReadinessResult {
  if (load.status === "cancelled") return { status: "cancelled" };
  if (load.status === "closed") return { status: "ready" };

  const issues: ReadinessIssue[] = [];

  // Crew readiness
  if (load.assignments.length === 0) {
    issues.push({
      label: "No crew members have been assigned to this load.",
      severity: "warning",
    });
  } else {
    const stillWorking = load.assignments.filter(
      (a) => a.status === "clocked_in" || a.status === "on_break",
    );
    if (stillWorking.length > 0) {
      const names = stillWorking
        .map((a) => {
          const employee = employees.find((e) => e.id === a.employeeId);
          return employee ? getEmployeeDisplayName(employee) : "Unknown";
        })
        .join(", ");
      issues.push({
        label: `${stillWorking.length} crew member${stillWorking.length > 1 ? "s" : ""} still clocked in: ${names}`,
        severity: "blocker",
      });
    }
  }

  // Container
  if (!load.containerNumber || load.containerNumber.trim() === "") {
    issues.push({
      label: "Container / trailer number is missing.",
      severity: "warning",
    });
  }

  // PO numbers
  if (load.poNumbers.length === 0 || load.poNumbers.every((po) => !po.trim())) {
    issues.push({
      label: "No PO number has been entered.",
      severity: "warning",
    });
  }

  // Quantities
  if (
    load.cases === 0 &&
    load.sorts === 0 &&
    load.weight === 0 &&
    !load.palletCount &&
    !load.pieceCount
  ) {
    issues.push({
      label: "All production quantities are zero (cases, sorts, weight).",
      severity: "blocker",
    });
  }

  // Billing / payout
  if (load.billedAmount <= 0) {
    issues.push({
      label: "Customer billing amount is zero.",
      severity: "warning",
    });
  }
  if (load.payoutAmount <= 0) {
    issues.push({ label: "Crew payout amount is zero.", severity: "warning" });
  }

  // Work type missing
  if (!productType) {
    issues.push({
      label: "Work Type is missing — billing and payout cannot be calculated.",
      severity: "blocker",
    });
  }

  // Door
  if (!load.doorNumber || load.doorNumber.trim() === "") {
    issues.push({ label: "Door number is missing.", severity: "warning" });
  }

  if (issues.length === 0) return { status: "ready" };
  return { status: "review", issues };
}
