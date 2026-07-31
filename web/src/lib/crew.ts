import type { CrewCertification, Employee } from "@/lib/types";

/** Casual display name — preferred name if set, else "First Last". */
export function getEmployeeDisplayName(
  employee: Pick<Employee, "firstName" | "lastName" | "preferredName">,
): string {
  if (employee.preferredName?.trim()) return employee.preferredName.trim();
  return `${employee.firstName} ${employee.lastName}`.trim();
}

/** Formal full name — always "First Last", regardless of preferred name.
 * Used for payroll/print contexts where the legal name is expected. */
export function getEmployeeFullName(
  employee: Pick<Employee, "firstName" | "lastName">,
): string {
  return `${employee.firstName} ${employee.lastName}`.trim();
}

export type CertificationStatus =
  | "no_expiry"
  | "expired"
  | "expiring_soon"
  | "valid";

const DAY_MS = 86_400_000;
const DEFAULT_WARNING_DAYS = 30;

/** Certification status is always derived from expiresAt — never stored or
 * admin-selected. Shared here so every place a status badge is rendered
 * agrees on the same rule. */
export function getCertificationStatus(
  certification: Pick<CrewCertification, "expiresAt">,
  warningDays: number = DEFAULT_WARNING_DAYS,
): CertificationStatus {
  if (!certification.expiresAt) return "no_expiry";
  const expiresAt = new Date(certification.expiresAt).getTime();
  const now = Date.now();
  if (expiresAt < now) return "expired";
  const daysUntilExpiry = (expiresAt - now) / DAY_MS;
  if (daysUntilExpiry <= warningDays) return "expiring_soon";
  return "valid";
}

const EMPLOYEE_ID_PREFIX = "EMP-";
const EMPLOYEE_ID_PAD = 4;

/** Suggests the next sequential EMP-#### code by scanning existing employee
 * ids — a predictable, editable starting point, not a hard-enforced format. */
export function suggestNextEmployeeId(
  employees: Pick<Employee, "employeeId">[],
): string {
  let highest = 0;
  for (const employee of employees) {
    const match = employee.employeeId?.match(/^EMP-(\d+)$/);
    if (match) highest = Math.max(highest, Number(match[1]));
  }
  const next = highest + 1;
  return `${EMPLOYEE_ID_PREFIX}${String(next).padStart(EMPLOYEE_ID_PAD, "0")}`;
}
