import type { RateLine } from "./types";

export type LoadQuantities = {
  cases: number;
  sorts: number;
  weight: number;
};

function quantityForUnit(unit: string, qty: LoadQuantities): number {
  const key = unit.trim().toLowerCase();
  if (key.startsWith("case")) return qty.cases;
  if (key.startsWith("sort")) return qty.sorts;
  if (key === "lb" || key.startsWith("lb") || key.startsWith("pound"))
    return qty.weight;
  return 0;
}

export function calculateLoadAmounts(
  rateLines: RateLine[],
  qty: LoadQuantities,
) {
  let billed = 0;
  let payout = 0;

  for (const line of rateLines) {
    const amount = quantityForUnit(line.unit, qty);

    const billOverage = Math.max(0, amount - line.billThreshold);
    billed += line.billBase + billOverage * line.billOverRate;

    const payOverage = Math.max(0, amount - line.payThreshold);
    payout += payOverage * line.payOverRate + line.payBonus;
  }

  return {
    billed: Math.round(billed * 100) / 100,
    payout: Math.round(payout * 100) / 100,
  };
}

/** Gross margin = billed - payout. */
export function calculateMargin(billed: number, payout: number): number {
  return Math.round((billed - payout) * 100) / 100;
}

/** Margin percentage. Returns 0 when billed is 0 to avoid Infinity / NaN. */
export function calculateMarginPercent(billed: number, payout: number): number {
  if (billed <= 0) return 0;
  return Math.round(((billed - payout) / billed) * 10000) / 100;
}

/** Format a dollar value consistently. */
export function formatMoney(value: number): string {
  return `$${value.toFixed(2)}`;
}

/** Format a time string like "06:02" from a HH:MM string. */
export function formatTime(time: string | null | undefined): string {
  if (!time) return "—";
  return time;
}

// ── Customer Billing ──────────────────────────────────────────────

export type BillingStatus = "unbilled" | "invoiced";

export type BillingStatusRecord = {
  loadId: string;
  status: BillingStatus;
  invoiceId?: string | null;
  invoicedAt?: string | null;
};

export type CustomerBillingRow = {
  loadId: string;
  ticketNumber: number;
  completedAt: string;
  customerId: string;
  customerName: string;
  locationName: string;
  productTypeName: string;
  containerNumber: string | null;
  caseCount: number;
  billingAmount: number;
  billingStatus: BillingStatus;
  invoiceId?: string | null;
};

// ── Dynamic billing status store ─────────────────────────────────

/** In-memory billing status records keyed by loadId. */
const billingStatusMap = new Map<string, BillingStatusRecord>();

/** Initial hardcoded invoiced loads (backwards compat). */
const SEED_INVOICED = new Set<string>(["load-195", "load-222"]);

function initBillingStatus(): void {
  if (billingStatusMap.size > 0) return;
  for (const loadId of SEED_INVOICED) {
    billingStatusMap.set(loadId, {
      loadId,
      status: "invoiced",
      invoiceId: null,
      invoicedAt: null,
    });
  }
}

export function getBillingStatus(loadId: string): BillingStatusRecord {
  initBillingStatus();
  const existing = billingStatusMap.get(loadId);
  if (existing) return existing;
  return { loadId, status: "unbilled", invoiceId: null, invoicedAt: null };
}

export function markLoadsAsInvoiced(
  loadIds: string[],
  invoiceId: string,
): void {
  initBillingStatus();
  const now = new Date().toISOString();
  for (const id of loadIds) {
    billingStatusMap.set(id, {
      loadId: id,
      status: "invoiced",
      invoiceId,
      invoicedAt: now,
    });
  }
}

export function deriveBillingRow(
  load: {
    id: string;
    ticketNumber: number;
    date: string;
    customerId: string;
    productTypeId: string;
    locationId: string;
    containerNumber: string;
    cases: number;
    billedAmount: number;
    status: string;
  },
  customerName: string,
  locationName: string,
  productTypeName: string,
): CustomerBillingRow {
  const billing = getBillingStatus(load.id);
  return {
    loadId: load.id,
    ticketNumber: load.ticketNumber,
    completedAt: load.date,
    customerId: load.customerId,
    customerName,
    locationName,
    productTypeName,
    containerNumber: load.containerNumber || null,
    caseCount: load.cases,
    billingAmount: load.billedAmount,
    billingStatus: billing.status,
    invoiceId: billing.invoiceId ?? null,
  };
}
