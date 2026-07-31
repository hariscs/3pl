import { splitProductionPayout } from "./load-financials";
import { getAssignmentWorkedMinutes } from "./load-time";
import type { Employee, Load } from "./types";

export type PayPeriodStatus = "pending" | "paid" | "overdue";

export type PayPeriod = {
  id: string;
  label: string;
  startDate: string;
  endDate: string;
};

export type PeriodPaymentStatus = {
  periodId: string;
  status: PayPeriodStatus;
  paidAt: string | null;
};

export function getPayPeriods(loads: Load[]): PayPeriod[] {
  const dates = loads
    .filter((l) => l.status === "completed" || l.status === "closed")
    .map((l) => new Date(l.date))
    .sort((a, b) => a.getTime() - b.getTime());
  if (dates.length === 0) return [];

  const cursor = new Date(dates[0]);
  cursor.setDate(cursor.getDate() - ((cursor.getDay() + 6) % 7));
  const last = new Date(dates[dates.length - 1]);

  const periods: PayPeriod[] = [];
  while (cursor <= last) {
    const start = cursor.toISOString().slice(0, 10);
    const endDate = new Date(cursor);
    endDate.setDate(endDate.getDate() + 6);
    const end = endDate.toISOString().slice(0, 10);
    const fmt = (d: Date) =>
      d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    periods.push({
      id: start,
      label: `${fmt(cursor)} \u2013 ${fmt(endDate)}`,
      startDate: start,
      endDate: end,
    });
    cursor.setDate(cursor.getDate() + 7);
  }
  return periods;
}

export function filterLoadsByPeriod(loads: Load[], period: PayPeriod): Load[] {
  return loads.filter(
    (l) => l.date >= period.startDate && l.date <= period.endDate,
  );
}

const OVERTIME_THRESHOLD = 40;

export function calcOvertimeHours(totalHours: number) {
  if (totalHours <= OVERTIME_THRESHOLD)
    return { regular: totalHours, overtime: 0 };
  return {
    regular: OVERTIME_THRESHOLD,
    overtime: Math.round((totalHours - OVERTIME_THRESHOLD) * 100) / 100,
  };
}

export type EmployeePayrollEntry = {
  loadId: string;
  ticketNumber: number;
  date: string;
  customerName: string;
  productTypeName: string;
  clockIn: string;
  clockOut: string | null;
  hours: number;
  productionPay: number;
};

export type EmployeePayrollStatus = "pending_review" | "approved" | "paid";

export type PayrollPaymentMethod =
  | "cash"
  | "check"
  | "direct_deposit"
  | "bank_transfer"
  | "other";

export const PAYROLL_PAYMENT_METHOD_LABELS: Record<
  PayrollPaymentMethod,
  string
> = {
  cash: "Cash",
  check: "Check",
  direct_deposit: "Direct Deposit",
  bank_transfer: "Bank Transfer",
  other: "Other",
};

export type PayrollPayment = {
  amount: number;
  paidAt: string;
  method: PayrollPaymentMethod;
  reference: string;
  note?: string | null;
  recordedAt: string;
  recordedByName: string;
};

export type EmployeePayroll = {
  employee: Employee;
  entries: EmployeePayrollEntry[];
  totalHours: number;
  regularHours: number;
  overtimeHours: number;
  regularPay: number;
  overtimePay: number;
  hourlyPay: number;
  productionPay: number;
  totalPay: number;
  status: EmployeePayrollStatus;
  approvedAt: string | null;
  approvedByName: string | null;
  paidAt: string | null;
  paidByName: string | null;
  payment?: PayrollPayment | null;
};

/** Payroll always reads a Load's frozen paySnapshot, never the employee's
 * general hourlyRate — different loads can carry different snapshot rates
 * for the same person. The one deliberate exception is the overtime
 * premium: attributing "whose rate applies to the 41st hour" across loads
 * with different snapshot rates in the same week is a genuine open business
 * question, so the overtime premium always uses employee.hourlyRate x 1.5
 * as a documented baseline, regardless of which load's hours pushed the
 * employee over the weekly threshold. */
export function getEmployeePayroll(
  employee: Employee,
  loads: Load[],
  getCustomerName: (id: string) => string,
  getProductTypeName: (id: string) => string,
): EmployeePayroll {
  const entries: EmployeePayrollEntry[] = [];
  let totalHours = 0;
  let regularPay = 0;
  let overtimePay = 0;
  let totalProductionPay = 0;
  let regularBudgetRemaining = OVERTIME_THRESHOLD;

  const orderedLoads = [...loads].sort((a, b) => a.date.localeCompare(b.date));

  for (const load of orderedLoads) {
    if (load.status !== "completed" && load.status !== "closed") continue;
    const a = load.assignments.find(
      (x) => x.employeeId === employee.id && x.clockIn !== null,
    );
    if (!a || !a.clockIn) continue;

    const hours = Math.round((getAssignmentWorkedMinutes(a) / 60) * 100) / 100;
    let productionPay = 0;

    if (load.paySnapshot.employeePayType === "hourly") {
      totalHours += hours;
      const regularHoursHere = Math.min(hours, regularBudgetRemaining);
      const overtimeHoursHere = hours - regularHoursHere;
      regularBudgetRemaining -= regularHoursHere;
      regularPay += regularHoursHere * load.paySnapshot.employeePayRate;
      overtimePay += overtimeHoursHere * employee.hourlyRate * 1.5;
    } else {
      productionPay = splitProductionPayout(load).get(a.id) ?? 0;
    }

    entries.push({
      loadId: load.id,
      ticketNumber: load.ticketNumber,
      date: load.date,
      customerName: getCustomerName(load.customerId),
      productTypeName: getProductTypeName(load.productTypeId),
      clockIn: a.clockIn,
      clockOut: a.clockOut,
      hours,
      productionPay: Math.round(productionPay * 100) / 100,
    });
    totalProductionPay += productionPay;
  }

  const { regular, overtime } = calcOvertimeHours(totalHours);
  regularPay = Math.round(regularPay * 100) / 100;
  overtimePay = Math.round(overtimePay * 100) / 100;

  return {
    employee,
    entries,
    totalHours: Math.round(totalHours * 100) / 100,
    regularHours: regular,
    overtimeHours: overtime,
    regularPay,
    overtimePay,
    hourlyPay: Math.round((regularPay + overtimePay) * 100) / 100,
    productionPay: Math.round(totalProductionPay * 100) / 100,
    totalPay:
      Math.round((regularPay + overtimePay + totalProductionPay) * 100) / 100,
    status: "pending_review",
    approvedAt: null,
    approvedByName: null,
    paidAt: null,
    paidByName: null,
  };
}

export function getAllPayroll(
  employees: Employee[],
  loads: Load[],
  getCustomerName: (id: string) => string,
  getProductTypeName: (id: string) => string,
): EmployeePayroll[] {
  return employees
    .filter((e) => e.employmentStatus === "active")
    .map((e) =>
      getEmployeePayroll(e, loads, getCustomerName, getProductTypeName),
    )
    .filter((p) => p.totalHours > 0 || p.productionPay > 0)
    .sort((a, b) => b.totalPay - a.totalPay);
}

export function formatHours(hours: number): string {
  if (hours <= 0) return "\u2014";
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}
