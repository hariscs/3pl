// Dashboard aggregation layer — every number, row, and chart point the
// Dashboard renders is computed here from real shared domain data (Loads,
// Employees, Customers, Locations, Work Types, Users, Invoices, Payroll
// records). No dashboard-only arrays, no invented numbers. Role/location
// scoping happens once (buildScope + selectScopedLoads) before any other
// aggregation runs, since the mock API itself applies no scoping.

import { calculateMargin, calculateMarginPercent, getBillingStatus } from "./billing";
import { getEmployeeDisplayName, getCertificationStatus } from "./crew";
import type { Invoice } from "./invoices";
import { getLoadReadiness } from "./load-readiness";
import {
  formatDuration,
  getAssignmentLiveElapsedMinutes,
  getOpenBreakMinutes,
  nowHHMM,
} from "./load-time";
import { formatLoadNumber } from "./loads";
import { formatMoney } from "./billing";
import type { EmployeePayroll } from "./payroll";
import type { PayrollRecord } from "./use-payroll-records";
import { getUserDisplayName, roleIsLocationUnrestricted, roleRequiresLocations } from "./users";
import type {
  Customer,
  Employee,
  Load,
  LoadStatus,
  Location,
  ProductType,
  Role,
  SystemUser,
} from "./types";
import { LOAD_STATUS_LABELS } from "./types";

// ── Scope & filters ──────────────────────────────────────────────

export type DashboardScope = { allowedLocationIds: string[] | null };

/** admin/finance are location-unrestricted (null = no restriction);
 * manager/lead are scoped to their assigned locations; customer/employee
 * never reach this (blocked from the Dashboard page entirely). */
export function buildScope(
  role: Role,
  user: Pick<SystemUser, "locationIds"> | null,
): DashboardScope {
  if (roleIsLocationUnrestricted(role)) return { allowedLocationIds: null };
  if (roleRequiresLocations(role)) {
    return { allowedLocationIds: user?.locationIds ?? [] };
  }
  return { allowedLocationIds: [] };
}

export type DashboardDateRangeKey =
  | "today"
  | "last_7_days"
  | "last_30_days"
  | "this_month"
  | "all_time";

export const DATE_RANGE_LABELS: Record<DashboardDateRangeKey, string> = {
  today: "Today",
  last_7_days: "Last 7 Days",
  last_30_days: "Last 30 Days",
  this_month: "This Month",
  all_time: "All Time",
};
export const DATE_RANGE_KEYS = Object.keys(
  DATE_RANGE_LABELS,
) as DashboardDateRangeKey[];

export type DashboardFilters = {
  dateRange: DashboardDateRangeKey;
  customerId: string;
  locationId: string;
};

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function addDaysISO(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function getDateRangeBounds(key: DashboardDateRangeKey): {
  start: string | null;
  end: string;
} {
  const end = todayISO();
  switch (key) {
    case "today":
      return { start: end, end };
    case "last_7_days":
      return { start: addDaysISO(end, -6), end };
    case "last_30_days":
      return { start: addDaysISO(end, -29), end };
    case "this_month":
      return { start: `${end.slice(0, 7)}-01`, end };
    case "all_time":
      return { start: null, end };
  }
}

/** The "now" set — role/location-scoped + Customer/Location filters, but
 * never date-bound. Operational widgets (Top Summary, Operations Now,
 * Attention Required, Workforce) are always "live" and read from this. */
export function selectScopedLoads(
  loads: Load[],
  scope: DashboardScope,
  filters: Pick<DashboardFilters, "customerId" | "locationId">,
): Load[] {
  return loads.filter((load) => {
    if (
      scope.allowedLocationIds &&
      !scope.allowedLocationIds.includes(load.locationId)
    ) {
      return false;
    }
    if (filters.customerId && load.customerId !== filters.customerId) {
      return false;
    }
    if (filters.locationId && load.locationId !== filters.locationId) {
      return false;
    }
    return true;
  });
}

/** Further narrows an already-scoped set to the selected date range, by
 * `load.date`. Financial Workflow, Performance Trends, and Customer/Location
 * Performance read from this; "now" sections never do. */
export function selectPeriodLoads(
  scopedLoads: Load[],
  dateRange: DashboardDateRangeKey,
): Load[] {
  const { start, end } = getDateRangeBounds(dateRange);
  if (!start) return scopedLoads;
  return scopedLoads.filter((l) => l.date >= start && l.date <= end);
}

// ── Data definitions ─────────────────────────────────────────────
//
// Active Load: status === "in_progress".
// Crew Working Now: a non-removed assignment with status === "clocked_in".
// Crew On Break: a non-removed assignment with status === "on_break".
// Completed Today: load.completedAt falls on today's local calendar date.
// Needs Review: status === "completed" (physically done, not yet closed).
// Extended break: an open break whose elapsed time exceeds 30 minutes
//   (stated assumption — no business rule for this threshold exists yet).
// Unbilled Amount: billedAmount summed over completed/closed loads with
//   billedAmount > 0 whose billing status is still "unbilled".
// Gross Margin: calculateMargin(billed, payout) over the same loads — never
//   labeled "Profit", since it only nets direct crew payout against billing.

export type OperationalSummary = {
  activeLoads: number;
  activeLocationCount: number;
  crewWorkingNow: number;
  crewOnBreak: number;
  loadsCompletedToday: number;
  loadsNeedingReview: number;
};

export function getOperationalSummary(scopedLoads: Load[]): OperationalSummary {
  const active = scopedLoads.filter((l) => l.status === "in_progress");
  const today = todayISO();
  const completedToday = scopedLoads.filter(
    (l) => l.completedAt?.slice(0, 10) === today,
  );
  const needsReview = scopedLoads.filter((l) => l.status === "completed");

  let crewWorkingNow = 0;
  let crewOnBreak = 0;
  for (const load of scopedLoads) {
    if (load.status !== "in_progress" && load.status !== "paused") continue;
    for (const a of load.assignments) {
      if (a.status === "clocked_in") crewWorkingNow += 1;
      if (a.status === "on_break") crewOnBreak += 1;
    }
  }

  return {
    activeLoads: active.length,
    activeLocationCount: new Set(active.map((l) => l.locationId)).size,
    crewWorkingNow,
    crewOnBreak,
    loadsCompletedToday: completedToday.length,
    loadsNeedingReview: needsReview.length,
  };
}

// ── Operations Now ───────────────────────────────────────────────

export type OperationalLoadRow = {
  loadId: string;
  loadNumber: string;
  customerName: string;
  locationName: string;
  workTypeName: string;
  containerNumber: string;
  status: LoadStatus;
  elapsedMinutes: number | null;
  crewWorking: number;
  crewOnBreak: number;
  supervisorName: string | null;
  attentionLabel: string | null;
};

export function getOperationsNow(
  scopedLoads: Load[],
  employees: Employee[],
  customers: Customer[],
  locations: Location[],
  productTypes: ProductType[],
  users: SystemUser[],
): OperationalLoadRow[] {
  return scopedLoads
    .filter((l) => l.status === "in_progress" || l.status === "paused")
    .map((load) => {
      const productType = productTypes.find((p) => p.id === load.productTypeId);
      const readiness = getLoadReadiness(load, employees, productType);
      const topIssue =
        readiness.status === "review"
          ? (readiness.issues.find((i) => i.severity === "blocker") ??
            readiness.issues[0])
          : null;
      const supervisor = users.find((u) => u.id === load.supervisorUserId);
      let crewWorking = 0;
      let crewOnBreak = 0;
      for (const a of load.assignments) {
        if (a.status === "clocked_in") crewWorking += 1;
        if (a.status === "on_break") crewOnBreak += 1;
      }
      return {
        loadId: load.id,
        loadNumber: formatLoadNumber(load.ticketNumber),
        customerName:
          customers.find((c) => c.id === load.customerId)?.displayName ?? "—",
        locationName:
          locations.find((l) => l.id === load.locationId)?.name ?? "—",
        workTypeName: productType?.name ?? "—",
        containerNumber: load.containerNumber,
        status: load.status,
        elapsedMinutes: load.startedAt
          ? Math.floor((Date.now() - new Date(load.startedAt).getTime()) / 60000)
          : null,
        crewWorking,
        crewOnBreak,
        supervisorName: supervisor ? getUserDisplayName(supervisor) : null,
        attentionLabel: topIssue?.label ?? null,
      };
    })
    .sort((a, b) => (b.elapsedMinutes ?? 0) - (a.elapsedMinutes ?? 0));
}

// ── Attention Required ───────────────────────────────────────────

export type AttentionCategory =
  | "operations"
  | "workforce"
  | "payroll"
  | "billing"
  | "compliance";

export const ATTENTION_CATEGORY_LABELS: Record<AttentionCategory, string> = {
  operations: "Operations",
  workforce: "Workforce",
  payroll: "Payroll",
  billing: "Billing",
  compliance: "Compliance",
};

export type AttentionItem = {
  id: string;
  category: AttentionCategory;
  severity: "blocker" | "warning";
  message: string;
  href?: string;
};

export type CertificationAlert = {
  employeeId: string;
  employeeName: string;
  certificationTypeId: string;
  status: "expired" | "expiring_soon";
  expiresAt?: string;
};

export function getCertificationAlerts(employees: Employee[]): CertificationAlert[] {
  const alerts: CertificationAlert[] = [];
  for (const employee of employees) {
    for (const cert of employee.certifications) {
      const status = getCertificationStatus(cert);
      if (status !== "expired" && status !== "expiring_soon") continue;
      alerts.push({
        employeeId: employee.id,
        employeeName: getEmployeeDisplayName(employee),
        certificationTypeId: cert.certificationTypeId,
        status,
        expiresAt: cert.expiresAt,
      });
    }
  }
  return alerts;
}

export function getAttentionItems(
  scopedLoads: Load[],
  employees: Employee[],
  customers: Customer[],
  locations: Location[],
  productTypes: ProductType[],
  livePayroll: EmployeePayroll[],
  payrollRecords: Record<string, PayrollRecord>,
): AttentionItem[] {
  const items: AttentionItem[] = [];
  const now = nowHHMM();

  for (const load of scopedLoads) {
    if (
      load.status !== "in_progress" &&
      load.status !== "paused" &&
      load.status !== "completed"
    ) {
      continue;
    }
    const loadNumber = formatLoadNumber(load.ticketNumber);
    const productType = productTypes.find((p) => p.id === load.productTypeId);
    const readiness = getLoadReadiness(load, employees, productType);
    if (readiness.status === "review") {
      for (const issue of readiness.issues) {
        items.push({
          id: `readiness-${load.id}-${issue.label}`,
          category: "operations",
          severity: issue.severity,
          message: `${loadNumber}: ${issue.label}`,
          href: `/loads/${load.id}`,
        });
      }
    }
    if (
      !load.supervisorUserId &&
      (load.status === "in_progress" || load.status === "paused")
    ) {
      items.push({
        id: `supervisor-${load.id}`,
        category: "operations",
        severity: "warning",
        message: `${loadNumber} has no supervisor assigned.`,
        href: `/loads/${load.id}`,
      });
    }
    const customer = customers.find((c) => c.id === load.customerId);
    if (customer?.status === "archived") {
      items.push({
        id: `archived-customer-${load.id}`,
        category: "operations",
        severity: "warning",
        message: `${loadNumber} references an archived customer (${customer.displayName}).`,
        href: `/loads/${load.id}`,
      });
    }
    const location = locations.find((l) => l.id === load.locationId);
    if (location?.status === "archived") {
      items.push({
        id: `archived-location-${load.id}`,
        category: "operations",
        severity: "warning",
        message: `${loadNumber} references an archived location (${location.name}).`,
        href: `/loads/${load.id}`,
      });
    }
    if (load.status === "in_progress" || load.status === "paused") {
      for (const a of load.assignments) {
        if (a.status !== "on_break") continue;
        const minutes = getOpenBreakMinutes(a, now);
        if (minutes === null || minutes <= 30) continue;
        const employee = employees.find((e) => e.id === a.employeeId);
        items.push({
          id: `break-${load.id}-${a.id}`,
          category: "workforce",
          severity: "warning",
          message: `${employee ? getEmployeeDisplayName(employee) : "A crew member"} has been on break for ${formatDuration(minutes)} on ${loadNumber}.`,
          href: `/loads/${load.id}`,
        });
      }
    }
  }

  for (const alert of getCertificationAlerts(employees)) {
    items.push({
      id: `cert-${alert.employeeId}-${alert.certificationTypeId}`,
      category: "compliance",
      severity: alert.status === "expired" ? "blocker" : "warning",
      message: `${alert.employeeName}'s ${alert.certificationTypeId.replace(/_/g, " ")} certification ${
        alert.status === "expired" ? "has expired" : "expires soon"
      }${alert.expiresAt ? ` (${alert.expiresAt})` : ""}.`,
    });
  }

  const pendingReview = livePayroll.filter(
    (p) => (payrollRecords[p.employee.id]?.status ?? "pending_review") === "pending_review",
  );
  if (pendingReview.length > 0) {
    const amount = pendingReview.reduce((s, p) => s + p.totalPay, 0);
    items.push({
      id: "payroll-pending-review",
      category: "payroll",
      severity: "warning",
      message: `${pendingReview.length} payroll record${pendingReview.length === 1 ? "" : "s"} (${formatMoney(amount)}) pending review.`,
      href: "/finance/payroll",
    });
  }
  const approvedAwaitingPayment = livePayroll.filter(
    (p) => payrollRecords[p.employee.id]?.status === "approved",
  );
  if (approvedAwaitingPayment.length > 0) {
    const amount = approvedAwaitingPayment.reduce((s, p) => s + p.totalPay, 0);
    items.push({
      id: "payroll-approved",
      category: "payroll",
      severity: "warning",
      message: `${approvedAwaitingPayment.length} approved payroll record${approvedAwaitingPayment.length === 1 ? "" : "s"} (${formatMoney(amount)}) awaiting payment.`,
      href: "/finance/payroll",
    });
  }

  const billable = scopedLoads.filter(
    (l) => (l.status === "completed" || l.status === "closed") && l.billedAmount > 0,
  );
  const unbilled = billable.filter((l) => getBillingStatus(l.id).status === "unbilled");
  if (unbilled.length > 0) {
    const amount = unbilled.reduce((s, l) => s + l.billedAmount, 0);
    items.push({
      id: "billing-unbilled",
      category: "billing",
      severity: "warning",
      message: `${unbilled.length} completed load${unbilled.length === 1 ? " is" : "s are"} ready to bill (${formatMoney(amount)}).`,
      href: "/finance/customer-billing",
    });
  }

  return items.sort((a, b) => {
    if (a.severity === b.severity) return 0;
    return a.severity === "blocker" ? -1 : 1;
  });
}

// ── Financial Workflow ───────────────────────────────────────────

export type FinancialWorkflowSummary = {
  payrollPendingReviewAmount: number;
  payrollPendingReviewCount: number;
  payrollApprovedAmount: number;
  payrollApprovedCount: number;
  payrollPaidAmount: number;
  payrollPaidCount: number;
  unbilledAmount: number;
  unbilledCount: number;
  invoicedAmount: number;
  invoiceCount: number;
  billableAmount: number;
  payrollCostAmount: number;
  grossMarginAmount: number | null;
  grossMarginPercent: number | null;
};

export function getFinancialWorkflow(
  periodLoads: Load[],
  periodPayroll: EmployeePayroll[],
  payrollRecords: Record<string, PayrollRecord>,
  invoices: Invoice[],
  periodLoadIds: Set<string>,
  customerId: string,
): FinancialWorkflowSummary {
  let pendingAmount = 0;
  let pendingCount = 0;
  let approvedAmount = 0;
  let approvedCount = 0;
  let paidAmount = 0;
  let paidCount = 0;
  for (const p of periodPayroll) {
    const status = payrollRecords[p.employee.id]?.status ?? "pending_review";
    if (status === "pending_review") {
      pendingAmount += p.totalPay;
      pendingCount += 1;
    } else if (status === "approved") {
      approvedAmount += p.totalPay;
      approvedCount += 1;
    } else {
      paidAmount += p.totalPay;
      paidCount += 1;
    }
  }

  const billable = periodLoads.filter(
    (l) => (l.status === "completed" || l.status === "closed") && l.billedAmount > 0,
  );
  const unbilledLoads = billable.filter(
    (l) => getBillingStatus(l.id).status === "unbilled",
  );
  const billableAmount = billable.reduce((s, l) => s + l.billedAmount, 0);
  const payrollCostAmount = billable.reduce((s, l) => s + l.payoutAmount, 0);

  const relevantInvoices = invoices.filter((inv) => {
    if (customerId && inv.customerId !== customerId) return false;
    return inv.lineItems.some((li) => periodLoadIds.has(li.loadId));
  });

  return {
    payrollPendingReviewAmount: pendingAmount,
    payrollPendingReviewCount: pendingCount,
    payrollApprovedAmount: approvedAmount,
    payrollApprovedCount: approvedCount,
    payrollPaidAmount: paidAmount,
    payrollPaidCount: paidCount,
    unbilledAmount: unbilledLoads.reduce((s, l) => s + l.billedAmount, 0),
    unbilledCount: unbilledLoads.length,
    invoicedAmount: relevantInvoices.reduce((s, i) => s + i.total, 0),
    invoiceCount: relevantInvoices.length,
    billableAmount,
    payrollCostAmount,
    grossMarginAmount:
      billableAmount > 0 ? calculateMargin(billableAmount, payrollCostAmount) : null,
    grossMarginPercent:
      billableAmount > 0
        ? calculateMarginPercent(billableAmount, payrollCostAmount)
        : null,
  };
}

// ── Performance Trends (charts) ──────────────────────────────────

export type TrendPoint = { date: string; label: string; value: number };

export function getLoadsCompletedTrend(periodLoads: Load[]): TrendPoint[] {
  const byDay = new Map<string, number>();
  for (const l of periodLoads) {
    if (!l.completedAt) continue;
    const key = l.completedAt.slice(0, 10);
    byDay.set(key, (byDay.get(key) ?? 0) + 1);
  }
  return [...byDay.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, value]) => ({ date, label: date.slice(5), value }));
}

export type BillingPayoutPoint = {
  date: string;
  label: string;
  billed: number;
  payout: number;
};

export function getBillingVsPayrollTrend(periodLoads: Load[]): BillingPayoutPoint[] {
  const byDay = new Map<string, { billed: number; payout: number }>();
  for (const l of periodLoads) {
    if (l.status !== "completed" && l.status !== "closed") continue;
    const key = (l.completedAt ?? l.date).slice(0, 10);
    const bucket = byDay.get(key) ?? { billed: 0, payout: 0 };
    bucket.billed += l.billedAmount;
    bucket.payout += l.payoutAmount;
    byDay.set(key, bucket);
  }
  return [...byDay.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, v]) => ({ date, label: date.slice(5), ...v }));
}

export type StatusDistributionSlice = { status: LoadStatus; label: string; count: number };

export function getLoadStatusDistribution(
  periodLoads: Load[],
): StatusDistributionSlice[] {
  const counts = new Map<LoadStatus, number>();
  for (const l of periodLoads) counts.set(l.status, (counts.get(l.status) ?? 0) + 1);
  return (Object.keys(LOAD_STATUS_LABELS) as LoadStatus[])
    .map((status) => ({
      status,
      label: LOAD_STATUS_LABELS[status],
      count: counts.get(status) ?? 0,
    }))
    .filter((s) => s.count > 0);
}

// ── Customer / Location performance ──────────────────────────────

export type CustomerPerformanceRow = {
  customerId: string;
  name: string;
  activeLoads: number;
  completedLoads: number;
  billableAmount: number;
  invoicedAmount: number;
  grossMarginAmount: number | null;
};

export function getCustomerPerformance(
  nowLoads: Load[],
  periodLoads: Load[],
  periodLoadIds: Set<string>,
  customers: Customer[],
  invoices: Invoice[],
): CustomerPerformanceRow[] {
  const activeById = new Map<string, number>();
  for (const l of nowLoads) {
    if (l.status !== "in_progress") continue;
    activeById.set(l.customerId, (activeById.get(l.customerId) ?? 0) + 1);
  }
  const completedById = new Map<string, number>();
  const billableById = new Map<string, number>();
  const payoutById = new Map<string, number>();
  for (const l of periodLoads) {
    if (l.status !== "completed" && l.status !== "closed") continue;
    completedById.set(l.customerId, (completedById.get(l.customerId) ?? 0) + 1);
    billableById.set(l.customerId, (billableById.get(l.customerId) ?? 0) + l.billedAmount);
    payoutById.set(l.customerId, (payoutById.get(l.customerId) ?? 0) + l.payoutAmount);
  }
  const invoicedById = new Map<string, number>();
  for (const inv of invoices) {
    if (!inv.lineItems.some((li) => periodLoadIds.has(li.loadId))) continue;
    invoicedById.set(inv.customerId, (invoicedById.get(inv.customerId) ?? 0) + inv.total);
  }

  const customerIds = new Set([...activeById.keys(), ...completedById.keys()]);
  return [...customerIds]
    .map((id) => {
      const customer = customers.find((c) => c.id === id);
      const billable = billableById.get(id) ?? 0;
      const payout = payoutById.get(id) ?? 0;
      return {
        customerId: id,
        name: customer?.displayName ?? "—",
        activeLoads: activeById.get(id) ?? 0,
        completedLoads: completedById.get(id) ?? 0,
        billableAmount: billable,
        invoicedAmount: invoicedById.get(id) ?? 0,
        grossMarginAmount: billable > 0 ? calculateMargin(billable, payout) : null,
      };
    })
    .sort((a, b) => b.billableAmount - a.billableAmount || b.activeLoads - a.activeLoads)
    .slice(0, 8);
}

export type LocationPerformanceRow = {
  locationId: string;
  name: string;
  customerName: string;
  activeLoads: number;
  completedLoads: number;
  crewWorking: number;
  supervisorName: string | null;
};

export function getLocationPerformance(
  nowLoads: Load[],
  periodLoads: Load[],
  locations: Location[],
  customers: Customer[],
  users: SystemUser[],
): LocationPerformanceRow[] {
  const activeById = new Map<string, number>();
  const crewById = new Map<string, number>();
  const supervisorById = new Map<string, string>();
  for (const l of nowLoads) {
    if (l.status !== "in_progress" && l.status !== "paused") continue;
    if (l.status === "in_progress") {
      activeById.set(l.locationId, (activeById.get(l.locationId) ?? 0) + 1);
    }
    const working = l.assignments.filter((a) => a.status === "clocked_in").length;
    crewById.set(l.locationId, (crewById.get(l.locationId) ?? 0) + working);
    if (l.supervisorUserId && !supervisorById.has(l.locationId)) {
      supervisorById.set(l.locationId, l.supervisorUserId);
    }
  }
  const completedById = new Map<string, number>();
  for (const l of periodLoads) {
    if (l.status !== "completed" && l.status !== "closed") continue;
    completedById.set(l.locationId, (completedById.get(l.locationId) ?? 0) + 1);
  }

  const locationIds = new Set([
    ...activeById.keys(),
    ...completedById.keys(),
    ...crewById.keys(),
  ]);
  return [...locationIds]
    .map((id) => {
      const location = locations.find((l) => l.id === id);
      const customer = customers.find((c) => c.id === location?.customerId);
      const supervisor = users.find((u) => u.id === supervisorById.get(id));
      return {
        locationId: id,
        name: location?.name ?? "—",
        customerName: customer?.displayName ?? "—",
        activeLoads: activeById.get(id) ?? 0,
        completedLoads: completedById.get(id) ?? 0,
        crewWorking: crewById.get(id) ?? 0,
        supervisorName: supervisor ? getUserDisplayName(supervisor) : null,
      };
    })
    .sort(
      (a, b) =>
        b.activeLoads + b.completedLoads - (a.activeLoads + a.completedLoads),
    )
    .slice(0, 8);
}

// ── Workforce overview ───────────────────────────────────────────

export type WorkforceRow = {
  assignmentId: string;
  employeeId: string;
  name: string;
  employeeCode: string;
  status: "clocked_in" | "on_break";
  loadNumber: string;
  loadId: string;
  locationName: string;
  elapsedMinutes: number;
};

export function getWorkforceOverview(
  nowLoads: Load[],
  employees: Employee[],
  locations: Location[],
): { workingNow: WorkforceRow[]; onBreak: WorkforceRow[] } {
  const now = nowHHMM();
  const rows: WorkforceRow[] = [];
  for (const load of nowLoads) {
    if (load.status !== "in_progress" && load.status !== "paused") continue;
    for (const a of load.assignments) {
      if (a.status !== "clocked_in" && a.status !== "on_break") continue;
      const employee = employees.find((e) => e.id === a.employeeId);
      rows.push({
        assignmentId: a.id,
        employeeId: a.employeeId,
        name: employee ? getEmployeeDisplayName(employee) : "Unknown",
        employeeCode: employee?.employeeId ?? "—",
        status: a.status,
        loadNumber: formatLoadNumber(load.ticketNumber),
        loadId: load.id,
        locationName: locations.find((l) => l.id === load.locationId)?.name ?? "—",
        elapsedMinutes: getAssignmentLiveElapsedMinutes(a, now),
      });
    }
  }
  return {
    workingNow: rows
      .filter((r) => r.status === "clocked_in")
      .sort((a, b) => b.elapsedMinutes - a.elapsedMinutes),
    onBreak: rows
      .filter((r) => r.status === "on_break")
      .sort((a, b) => b.elapsedMinutes - a.elapsedMinutes),
  };
}

// ── Recent activity ──────────────────────────────────────────────

export type ActivityEntry = { id: string; time: string; label: string; href?: string };

/** One event per Load per lifecycle milestone (created/started/completed/
 * closed) — deliberately not every clock-in/break/note, which would be far
 * too noisy on a global feed spanning every in-scope load (unlike the
 * per-load Activity Timeline on loads/[id], which does show that detail). */
export function getRecentActivity(
  scopedLoads: Load[],
  employees: Employee[],
  invoices: Invoice[],
  payrollRecords: Record<string, PayrollRecord>,
  scopedLoadIds: Set<string>,
  limit = 15,
): ActivityEntry[] {
  const entries: ActivityEntry[] = [];

  for (const load of scopedLoads) {
    const loadNumber = formatLoadNumber(load.ticketNumber);
    const href = `/loads/${load.id}`;
    entries.push({ id: `${load.id}-created`, time: load.createdAt, label: `${loadNumber} created`, href });
    if (load.startedAt) {
      entries.push({ id: `${load.id}-started`, time: load.startedAt, label: `${loadNumber} started`, href });
    }
    if (load.completedAt) {
      entries.push({ id: `${load.id}-completed`, time: load.completedAt, label: `${loadNumber} completed`, href });
    }
    if (load.closedAt) {
      entries.push({ id: `${load.id}-closed`, time: load.closedAt, label: `${loadNumber} closed`, href });
    }
  }

  for (const inv of invoices) {
    if (!inv.lineItems.some((li) => scopedLoadIds.has(li.loadId))) continue;
    entries.push({
      id: `invoice-${inv.id}`,
      time: inv.createdAt,
      label: `Invoice ${inv.invoiceNumber} created for ${inv.customerName}`,
      href: `/finance/invoices/${inv.id}`,
    });
  }

  for (const [employeeId, record] of Object.entries(payrollRecords)) {
    const employee = employees.find((e) => e.id === employeeId);
    const name = employee ? getEmployeeDisplayName(employee) : "an employee";
    if (record.approvedAt) {
      entries.push({
        id: `payroll-approved-${employeeId}`,
        time: record.approvedAt,
        label: `Payroll approved for ${name}`,
        href: `/finance/payroll/${employeeId}`,
      });
    }
    if (record.paidAt) {
      entries.push({
        id: `payroll-paid-${employeeId}`,
        time: record.paidAt,
        label: `Payroll paid for ${name}`,
        href: `/finance/payroll/${employeeId}`,
      });
    }
  }

  return entries.sort((a, b) => b.time.localeCompare(a.time)).slice(0, limit);
}
