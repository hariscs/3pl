"use client";

import { Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Field";
import { useAppData } from "@/lib/store";
import type { ProductType, RateLine } from "@/lib/types";

export type ProductTypeFormValues = Omit<ProductType, "id" | "status">;

let rlCounter = 0;
function blankRateLine(): RateLine {
  rlCounter += 1;
  return {
    id: `draft-${rlCounter}`,
    unit: "case",
    billBase: 0,
    billThreshold: 0,
    billOverRate: 0,
    payThreshold: 0,
    payOverRate: 0,
    payBonus: 0,
  };
}

export function ProductTypeForm({
  initial,
  submitLabel,
  onSubmit,
}: {
  initial?: ProductTypeFormValues;
  submitLabel: string;
  onSubmit: (values: ProductTypeFormValues) => void;
}) {
  const { customers, locations } = useAppData();
  const activeCustomers = customers.filter((c) => c.status === "active");

  const [customerId, setCustomerId] = useState(
    initial?.customerId ?? activeCustomers[0]?.id ?? "",
  );
  const [locationId, setLocationId] = useState(initial?.locationId ?? "");
  const [name, setName] = useState(initial?.name ?? "");
  const [rateLines, setRateLines] = useState<RateLine[]>(
    initial?.rateLines ?? [blankRateLine()],
  );

  const availableLocations = locations.filter((loc) =>
    customers.find((c) => c.id === customerId)?.locationIds.includes(loc.id),
  );

  function updateLine(id: string, patch: Partial<RateLine>) {
    setRateLines((lines) =>
      lines.map((l) => (l.id === id ? { ...l, ...patch } : l)),
    );
  }

  function removeLine(id: string) {
    setRateLines((lines) =>
      lines.length > 1 ? lines.filter((l) => l.id !== id) : lines,
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!customerId || !locationId || !name) return;
        onSubmit({ customerId, locationId, name, rateLines });
      }}
      className="space-y-5"
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Customer" required>
          <Select
            value={customerId}
            onChange={(e) => {
              setCustomerId(e.target.value);
              setLocationId("");
            }}
            required
          >
            {activeCustomers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.displayName}
              </option>
            ))}
          </Select>
        </Field>
        <Field
          label="Location"
          required
          hint={
            availableLocations.length === 0
              ? "This customer has no locations assigned yet."
              : undefined
          }
        >
          <Select
            value={locationId}
            onChange={(e) => setLocationId(e.target.value)}
            required
            disabled={availableLocations.length === 0}
          >
            <option value="">Select a location…</option>
            {availableLocations.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Product type name" required>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Solar Panel Banding"
            required
          />
        </Field>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider text-steel">
            Rate card
          </p>
          <Button
            type="button"
            variant="secondary"
            onClick={() => setRateLines((lines) => [...lines, blankRateLine()])}
          >
            + Add unit of measure
          </Button>
        </div>
        <p className="mb-3 text-xs text-steel-light">
          Each unit gets its own Bill and Pay columns, so employee payout
          thresholds can differ from what you bill the customer.
        </p>

        <div className="overflow-x-auto rounded-xl border border-manila-dark">
          <table className="w-full min-w-max border-collapse text-sm">
            <thead>
              <tr className="bg-manila text-left font-display text-xs font-semibold uppercase tracking-wide text-ink">
                <th
                  rowSpan={2}
                  className="border-b border-manila-dark px-3 py-2 align-bottom"
                >
                  Unit
                </th>
                <th
                  colSpan={3}
                  className="border-b border-l border-manila-dark px-3 py-1 text-center text-rust"
                >
                  Bill (customer)
                </th>
                <th
                  colSpan={3}
                  className="border-b border-l border-manila-dark px-3 py-1 text-center text-steel"
                >
                  Pay (employee)
                </th>
                <th
                  rowSpan={2}
                  className="border-b border-manila-dark px-2 py-2"
                >
                  <span className="sr-only">Remove</span>
                </th>
              </tr>
              <tr className="bg-manila text-left font-display text-xs font-semibold uppercase tracking-wide text-steel">
                <th className="border-b border-l border-manila-dark px-3 py-1.5">
                  Base
                </th>
                <th className="border-b border-manila-dark px-3 py-1.5">
                  Included qty
                </th>
                <th className="border-b border-manila-dark px-3 py-1.5">
                  Rate over
                </th>
                <th className="border-b border-l border-manila-dark px-3 py-1.5">
                  Included qty
                </th>
                <th className="border-b border-manila-dark px-3 py-1.5">
                  Rate over
                </th>
                <th className="border-b border-manila-dark px-3 py-1.5">
                  Bonus
                </th>
              </tr>
            </thead>
            <tbody>
              {rateLines.map((line) => (
                <tr key={line.id} className="odd:bg-paper even:bg-paper-dim/40">
                  <td className="border-b border-manila-dark/60 p-2">
                    <Input
                      value={line.unit}
                      onChange={(e) =>
                        updateLine(line.id, { unit: e.target.value })
                      }
                      placeholder="case, pallet, lb…"
                      aria-label="Unit"
                      className="w-28"
                    />
                  </td>
                  <td className="border-b border-l border-manila-dark/60 p-2">
                    <Input
                      type="number"
                      min="0"
                      value={line.billBase}
                      onChange={(e) =>
                        updateLine(line.id, {
                          billBase: Number(e.target.value),
                        })
                      }
                      aria-label="Bill base"
                      className="w-24"
                    />
                  </td>
                  <td className="border-b border-manila-dark/60 p-2">
                    <Input
                      type="number"
                      min="0"
                      value={line.billThreshold}
                      onChange={(e) =>
                        updateLine(line.id, {
                          billThreshold: Number(e.target.value),
                        })
                      }
                      aria-label="Bill included quantity"
                      className="w-24"
                    />
                  </td>
                  <td className="border-b border-manila-dark/60 p-2">
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={line.billOverRate}
                      onChange={(e) =>
                        updateLine(line.id, {
                          billOverRate: Number(e.target.value),
                        })
                      }
                      aria-label="Bill rate over included quantity"
                      className="w-24"
                    />
                  </td>
                  <td className="border-b border-l border-manila-dark/60 p-2">
                    <Input
                      type="number"
                      min="0"
                      value={line.payThreshold}
                      onChange={(e) =>
                        updateLine(line.id, {
                          payThreshold: Number(e.target.value),
                        })
                      }
                      aria-label="Pay included quantity"
                      className="w-24"
                    />
                  </td>
                  <td className="border-b border-manila-dark/60 p-2">
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={line.payOverRate}
                      onChange={(e) =>
                        updateLine(line.id, {
                          payOverRate: Number(e.target.value),
                        })
                      }
                      aria-label="Pay rate over included quantity"
                      className="w-24"
                    />
                  </td>
                  <td className="border-b border-manila-dark/60 p-2">
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={line.payBonus}
                      onChange={(e) =>
                        updateLine(line.id, {
                          payBonus: Number(e.target.value),
                        })
                      }
                      aria-label="Pay bonus"
                      className="w-24"
                    />
                  </td>
                  <td className="border-b border-manila-dark/60 p-2 text-center">
                    <button
                      type="button"
                      onClick={() => removeLine(line.id)}
                      disabled={rateLines.length === 1}
                      aria-label="Remove rate line"
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-steel transition-colors hover:bg-stamp-soft hover:text-stamp disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-steel"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Button type="submit">{submitLabel}</Button>
    </form>
  );
}
