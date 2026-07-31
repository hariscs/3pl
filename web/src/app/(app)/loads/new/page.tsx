"use client";

import { X } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { TopBar } from "@/components/TopBar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field, Input, Select } from "@/components/ui/Field";
import { useAppData } from "@/lib/store";
import type { Load } from "@/lib/types";

const today = () => new Date().toISOString().slice(0, 10);

let poCounter = 0;
function blankPo() {
  poCounter += 1;
  return { id: `po-${poCounter}`, value: "" };
}

function blankFields() {
  return {
    customerId: "",
    productTypeId: "",
    doorNumber: "",
    containerNumber: "",
    vendor: "",
    poNumbers: [blankPo()],
    sorts: 0,
    cases: 0,
    weight: 0,
  };
}

export default function LoadEntryPage() {
  const { currentLocationId, locations, customers, productTypes, addLoad } =
    useAppData();
  const [form, setForm] = useState(blankFields);
  const [savedLoad, setSavedLoad] = useState<Load | null>(null);
  const [saving, setSaving] = useState(false);

  const locationName =
    locations.find((l) => l.id === currentLocationId)?.name ?? "";

  const availableCustomers = useMemo(() => {
    const owningCustomerId = locations.find(
      (l) => l.id === currentLocationId,
    )?.customerId;
    return customers.filter(
      (c) => c.status === "active" && c.id === owningCustomerId,
    );
  }, [customers, locations, currentLocationId]);

  const availableProductTypes = useMemo(
    () =>
      productTypes.filter(
        (p) => p.status !== "archived" && p.customerId === form.customerId,
      ),
    [productTypes, form.customerId],
  );

  function handlePoChange(id: string, value: string) {
    setForm((f) => ({
      ...f,
      poNumbers: f.poNumbers.map((po) =>
        po.id === id ? { ...po, value } : po,
      ),
    }));
  }

  function addPoField() {
    setForm((f) => ({ ...f, poNumbers: [...f.poNumbers, blankPo()] }));
  }

  function removePoField(id: string) {
    setForm((f) => ({
      ...f,
      poNumbers:
        f.poNumbers.length > 1
          ? f.poNumbers.filter((po) => po.id !== id)
          : f.poNumbers,
    }));
  }

  async function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!form.customerId || !form.productTypeId) return;
    setSaving(true);
    try {
      const created = await addLoad({
        date: today(),
        locationId: currentLocationId,
        customerId: form.customerId,
        productTypeId: form.productTypeId,
        doorNumber: form.doorNumber,
        containerNumber: form.containerNumber,
        vendor: form.vendor,
        poNumbers: form.poNumbers.map((po) => po.value).filter(Boolean),
        sorts: form.sorts,
        cases: form.cases,
        weight: form.weight,
        assignments: [],
      });
      if (!created) return; // error already surfaced as a toast
      setSavedLoad(created);
      setForm(blankFields);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <TopBar
        title="Load Entry"
        description={`Working at ${locationName} — change location at right to see a different site's customers.`}
      />
      <main className="flex-1 space-y-6 p-6">
        {savedLoad && (
          <div className="flex items-center justify-between rounded-lg border border-freight bg-freight-soft px-4 py-3">
            <p className="text-sm text-freight-dark">
              Load{" "}
              <span className="font-tick font-semibold">
                #{savedLoad.ticketNumber}
              </span>{" "}
              saved. The form below is clear and ready for the next load.
            </p>
            <Link href={`/loads/${savedLoad.id}`}>
              <Button variant="secondary">Assign employees →</Button>
            </Link>
          </div>
        )}

        <Card title="New load">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Customer" required>
                <Select
                  value={form.customerId}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      customerId: e.target.value,
                      productTypeId: "",
                    }))
                  }
                  required
                >
                  <option value="">Select a customer…</option>
                  {availableCustomers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.displayName}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field
                label="Work Type"
                required
                hint={
                  form.customerId && availableProductTypes.length === 0
                    ? "No work types set up for this customer yet."
                    : undefined
                }
              >
                <Select
                  value={form.productTypeId}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, productTypeId: e.target.value }))
                  }
                  required
                  disabled={!form.customerId}
                >
                  <option value="">
                    {form.customerId
                      ? "Select a work type…"
                      : "Choose a customer first"}
                  </option>
                  {availableProductTypes.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field
                label="Door number"
                hint="If it's not out of a door (reboxing, picking, pallet building) just note that instead."
              >
                <Input
                  value={form.doorNumber}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, doorNumber: e.target.value }))
                  }
                  placeholder="12 or 'reboxing'"
                />
              </Field>
              <Field label="Container / trailer number">
                <Input
                  value={form.containerNumber}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, containerNumber: e.target.value }))
                  }
                />
              </Field>
              <Field label="Vendor">
                <Input
                  value={form.vendor}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, vendor: e.target.value }))
                  }
                />
              </Field>
              <Field label="Date">
                <Input value={today()} disabled />
              </Field>
            </div>

            <div className="rounded-xl border border-manila-dark bg-paper-dim p-4">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-steel">
                  PO numbers
                </p>
                <Button type="button" variant="secondary" onClick={addPoField}>
                  + Add additional PO
                </Button>
              </div>
              <div className="flex flex-col gap-2">
                {form.poNumbers.map((po, i) => (
                  <div key={po.id} className="flex gap-2">
                    <Input
                      value={po.value}
                      onChange={(e) => handlePoChange(po.id, e.target.value)}
                      placeholder={`PO number ${i + 1}`}
                      className="min-w-0 flex-1"
                    />
                    {form.poNumbers.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removePoField(po.id)}
                        aria-label={`Remove PO number ${i + 1}`}
                        className="flex w-11 flex-none items-center justify-center rounded-xl border border-manila-dark text-steel transition-colors hover:border-stamp/40 hover:bg-stamp-soft hover:text-stamp"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Number of sorts">
                <Input
                  type="number"
                  min="0"
                  value={form.sorts}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, sorts: Number(e.target.value) }))
                  }
                />
              </Field>
              <Field label="Number of cases">
                <Input
                  type="number"
                  min="0"
                  value={form.cases}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, cases: Number(e.target.value) }))
                  }
                />
              </Field>
              <Field label="Weight (lbs)">
                <Input
                  type="number"
                  min="0"
                  value={form.weight}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, weight: Number(e.target.value) }))
                  }
                />
              </Field>
            </div>

            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save load"}
            </Button>
          </form>
        </Card>
      </main>
    </>
  );
}
