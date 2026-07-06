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
