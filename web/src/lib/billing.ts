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
