import type { Employee, Load, ProductType, RateLine } from "./types";

export type ReadinessIssue = {
  label: string;
  /** severity = "blocker" (red), "warning" (amber) */
  severity: "blocker" | "warning";
};

export type ReadinessResult =
  | { status: "ready" }
  | { status: "review"; issues: ReadinessIssue[] }
  | { status: "voided" };

export function getLoadReadiness(
  load: Load,
  employees: Employee[],
  productType: ProductType | undefined,
): ReadinessResult {
  if (load.status === "void") return { status: "voided" };
  if (load.status === "archived") return { status: "ready" };

  const issues: ReadinessIssue[] = [];

  // Crew readiness
  if (load.assignments.length === 0) {
    issues.push({
      label: "No crew members have been assigned to this load.",
      severity: "warning",
    });
  } else {
    const stillClockedIn = load.assignments.filter((a) => !a.clockOut);
    if (stillClockedIn.length > 0) {
      const names = stillClockedIn
        .map(
          (a) =>
            employees.find((e) => e.id === a.employeeId)?.name ?? "Unknown",
        )
        .join(", ");
      issues.push({
        label: `${stillClockedIn.length} crew member${stillClockedIn.length > 1 ? "s" : ""} still clocked in: ${names}`,
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
  if (load.cases === 0 && load.sorts === 0 && load.weight === 0) {
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

  // Product type / rate card missing
  if (!productType || productType.rateLines.length === 0) {
    issues.push({
      label:
        "Product type or rate card is missing — billing and payout cannot be calculated.",
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
