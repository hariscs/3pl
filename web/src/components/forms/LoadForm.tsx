"use client";

import { X } from "lucide-react";
import { type FormEvent, useMemo, useState } from "react";
import { CustomerLocationWorkTypeFields } from "@/components/loads/CustomerLocationWorkTypeFields";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/Field";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { SelectMenu } from "@/components/ui/SelectMenu";
import { isEligibleSupervisor } from "@/lib/loads";
import { useAppData } from "@/lib/store";
import {
  type Load,
  UNIT_OF_MEASURE_LABELS,
  WORK_TYPE_PAY_TYPE_LABELS,
} from "@/lib/types";
import { getUserDisplayName } from "@/lib/users";

export type LoadFormValues = Omit<
  Load,
  | "id"
  | "ticketNumber"
  | "assignments"
  | "paySnapshot"
  | "billingSnapshot"
  | "status"
  | "billedAmount"
  | "payoutAmount"
  | "notes"
  | "completionNotes"
  | "createdAt"
  | "createdByUserId"
  | "startedAt"
  | "pausedAt"
  | "completedAt"
  | "closedAt"
  | "closedByUserId"
  | "cancelledAt"
  | "lastUpdatedAt"
>;

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

const empty: LoadFormValues = {
  date: today(),
  locationId: "",
  customerId: "",
  productTypeId: "",
  doorNumber: "",
  containerNumber: "",
  trailerNumber: "",
  sealNumber: "",
  vendor: "",
  poNumbers: [],
  sorts: 0,
  cases: 0,
  weight: 0,
  palletCount: undefined,
  pieceCount: undefined,
  supervisorUserId: null,
  operationalNotes: null,
  scheduledDate: null,
  scheduledStartTime: null,
};

let poKeyCounter = 0;
function newPoKey() {
  poKeyCounter += 1;
  return `po-${poKeyCounter}`;
}

export function LoadForm({
  initial,
  submitLabel,
  onSubmit,
}: {
  initial?: LoadFormValues;
  submitLabel: string;
  onSubmit: (values: LoadFormValues) => void | Promise<void>;
}) {
  const { users } = useAppData();
  const [form, setForm] = useState<LoadFormValues>(initial ?? empty);
  const [poFields, setPoFields] = useState(() =>
    (form.poNumbers.length ? form.poNumbers : [""]).map((value) => ({
      key: newPoKey(),
      value,
    })),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  function update(patch: Partial<LoadFormValues>) {
    setForm((f) => ({ ...f, ...patch }));
  }

  function syncPoNumbers(fields: typeof poFields) {
    setPoFields(fields);
    update({ poNumbers: fields.map((f) => f.value).filter(Boolean) });
  }

  const workType = useAppData().productTypes.find(
    (p) => p.id === form.productTypeId,
  );

  const supervisorOptions = useMemo(() => {
    if (!form.locationId) return [];
    return users
      .filter((u) => isEligibleSupervisor(u, form.locationId))
      .map((u) => ({ value: u.id, label: getUserDisplayName(u) }));
  }, [users, form.locationId]);

  function validate(): Record<string, string> {
    const e: Record<string, string> = {};
    if (!form.customerId) e.customerId = "Customer is required.";
    if (!form.locationId) e.locationId = "Location is required.";
    if (!form.productTypeId) e.productTypeId = "Work Type is required.";
    if (form.sorts < 0) e.sorts = "Sorts cannot be negative.";
    if (form.cases < 0) e.cases = "Cases cannot be negative.";
    if (form.weight < 0) e.weight = "Weight cannot be negative.";
    if (form.palletCount != null && form.palletCount < 0) {
      e.palletCount = "Pallet count cannot be negative.";
    }
    if (form.pieceCount != null && form.pieceCount < 0) {
      e.pieceCount = "Piece count cannot be negative.";
    }
    return e;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (submitting) return;

    const validationErrors = validate();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setSubmitting(true);
    try {
      await onSubmit({
        ...form,
        containerNumber: form.containerNumber.trim().toUpperCase(),
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div>
        <SectionHeader title="Customer, Location & Work Type" />
        <CustomerLocationWorkTypeFields
          customerId={form.customerId}
          locationId={form.locationId}
          productTypeId={form.productTypeId}
          onCustomerChange={(customerId) =>
            update({ customerId, locationId: "", productTypeId: "" })
          }
          onLocationChange={(locationId) =>
            update({ locationId, supervisorUserId: null })
          }
          onWorkTypeChange={(productTypeId) => update({ productTypeId })}
          errors={errors}
        />
      </div>

      {workType && (
        <div className="rounded-xl border border-manila-dark bg-paper-dim p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-steel">
            Financial Summary — from this Work Type
          </p>
          <div className="grid gap-3 text-sm sm:grid-cols-3">
            <div>
              <p className="text-xs text-steel-light">Unit of Measure</p>
              <p className="text-ink">
                {UNIT_OF_MEASURE_LABELS[workType.unitOfMeasure]}
              </p>
            </div>
            <div>
              <p className="text-xs text-steel-light">Employee Pay</p>
              <p className="text-ink">
                {WORK_TYPE_PAY_TYPE_LABELS[workType.employeePayType]} · $
                {workType.employeePayRate.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-xs text-steel-light">Customer Billing</p>
              <p className="text-ink">
                {WORK_TYPE_PAY_TYPE_LABELS[workType.customerBillingType]} · $
                {workType.customerBillingRate.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      )}

      <div>
        <SectionHeader title="Container & Reference Details" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Door Number">
            <Input
              value={form.doorNumber}
              onChange={(e) => update({ doorNumber: e.target.value })}
              placeholder="12 or 'reboxing'"
            />
          </Field>
          <Field label="Container Number">
            <Input
              value={form.containerNumber}
              onChange={(e) => update({ containerNumber: e.target.value })}
              placeholder="e.g. MSCU7821931"
            />
          </Field>
          <Field label="Trailer Number">
            <Input
              value={form.trailerNumber}
              onChange={(e) => update({ trailerNumber: e.target.value })}
            />
          </Field>
          <Field label="Seal Number">
            <Input
              value={form.sealNumber}
              onChange={(e) => update({ sealNumber: e.target.value })}
            />
          </Field>
          <Field label="Vendor / Carrier">
            <Input
              value={form.vendor}
              onChange={(e) => update({ vendor: e.target.value })}
            />
          </Field>
          <Field label="Date">
            <Input
              type="date"
              value={form.date}
              onChange={(e) => update({ date: e.target.value })}
            />
          </Field>
        </div>

        <div className="mt-4 rounded-xl border border-manila-dark bg-paper-dim p-4">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-steel">
              PO Numbers
            </p>
            <Button
              type="button"
              variant="secondary"
              onClick={() =>
                syncPoNumbers([...poFields, { key: newPoKey(), value: "" }])
              }
            >
              + Add PO
            </Button>
          </div>
          <div className="flex flex-col gap-2">
            {poFields.map((po, i) => (
              <div key={po.key} className="flex gap-2">
                <Input
                  value={po.value}
                  onChange={(e) =>
                    syncPoNumbers(
                      poFields.map((f) =>
                        f.key === po.key ? { ...f, value: e.target.value } : f,
                      ),
                    )
                  }
                  placeholder={`PO number ${i + 1}`}
                  className="min-w-0 flex-1"
                />
                {poFields.length > 1 && (
                  <button
                    type="button"
                    onClick={() =>
                      syncPoNumbers(poFields.filter((f) => f.key !== po.key))
                    }
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

        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <Field label="Cases">
            <Input
              type="number"
              min="0"
              value={form.cases}
              invalid={!!errors.cases}
              onChange={(e) => update({ cases: Number(e.target.value) })}
            />
          </Field>
          <Field label="Sorts">
            <Input
              type="number"
              min="0"
              value={form.sorts}
              invalid={!!errors.sorts}
              onChange={(e) => update({ sorts: Number(e.target.value) })}
            />
          </Field>
          <Field label="Weight (lbs)">
            <Input
              type="number"
              min="0"
              value={form.weight}
              invalid={!!errors.weight}
              onChange={(e) => update({ weight: Number(e.target.value) })}
            />
          </Field>
          <Field label="Pallet Count" hint="Optional">
            <Input
              type="number"
              min="0"
              value={form.palletCount ?? ""}
              invalid={!!errors.palletCount}
              placeholder="Optional"
              onChange={(e) =>
                update({
                  palletCount:
                    e.target.value === "" ? undefined : Number(e.target.value),
                })
              }
            />
          </Field>
          <Field label="Piece Count" hint="Optional">
            <Input
              type="number"
              min="0"
              value={form.pieceCount ?? ""}
              invalid={!!errors.pieceCount}
              placeholder="Optional"
              onChange={(e) =>
                update({
                  pieceCount:
                    e.target.value === "" ? undefined : Number(e.target.value),
                })
              }
            />
          </Field>
        </div>
      </div>

      <div>
        <SectionHeader title="Scheduling" />
        <p className="mb-3 text-xs text-steel-light">
          Optional — leave blank to create this Load as a Draft you'll start
          later. Setting a scheduled date marks it Scheduled instead.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Scheduled Date">
            <Input
              type="date"
              value={form.scheduledDate ?? ""}
              onChange={(e) =>
                update({ scheduledDate: e.target.value || null })
              }
            />
          </Field>
          <Field label="Scheduled Start Time">
            <Input
              type="time"
              value={form.scheduledStartTime ?? ""}
              onChange={(e) =>
                update({ scheduledStartTime: e.target.value || null })
              }
            />
          </Field>
        </div>
      </div>

      <div>
        <SectionHeader title="Supervisor" />
        <Field
          label="Supervisor"
          hint={
            !form.locationId
              ? "Select a Location first."
              : supervisorOptions.length === 0
                ? "No eligible Admin, Manager, or Lead has access to this Location."
                : undefined
          }
        >
          <SelectMenu
            value={form.supervisorUserId ?? ""}
            onChange={(value) => update({ supervisorUserId: value || null })}
            options={[
              { value: "", label: "No supervisor assigned" },
              ...supervisorOptions,
            ]}
            placeholder="No supervisor assigned"
          />
        </Field>
      </div>

      <div>
        <SectionHeader title="Operational Notes" />
        <Textarea
          rows={3}
          value={form.operationalNotes ?? ""}
          placeholder="Additional operational notes for this load…"
          onChange={(e) => update({ operationalNotes: e.target.value || null })}
        />
      </div>

      <div>
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
