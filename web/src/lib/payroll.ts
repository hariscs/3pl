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
    .filter((l) => l.status === "complete")
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

export function calcHours(clockIn: string, clockOut: string | null): number {
  if (!clockOut) return 0;
  const [inH, inM] = clockIn.split(":").map(Number);
  const [outH, outM] = clockOut.split(":").map(Number);
  const mins = outH * 60 + outM - (inH * 60 + inM);
  return Math.round((mins / 60) * 100) / 100;
}

export function getEmployeePayroll(
  employee: Employee,
  loads: Load[],
  getCustomerName: (id: string) => string,
  getProductTypeName: (id: string) => string,
): EmployeePayroll {
  const entries: EmployeePayrollEntry[] = [];
  let totalHours = 0;
  let totalProductionPay = 0;

  for (const load of loads) {
    if (load.status !== "complete") continue;
    const a = load.assignments.find((x) => x.employeeId === employee.id);
    if (!a) continue;
    const crewCount = load.assignments.length || 1;
    const hours = calcHours(a.clockIn, a.clockOut);
    const productionPay = load.payoutAmount / crewCount;
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
    totalHours += hours;
    totalProductionPay += productionPay;
  }

  const { regular, overtime } = calcOvertimeHours(totalHours);
  const regularPay = Math.round(regular * employee.hourlyRate * 100) / 100;
  const overtimePay =
    Math.round(overtime * employee.hourlyRate * 1.5 * 100) / 100;

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
