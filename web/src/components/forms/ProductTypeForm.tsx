"use client";

import { type FormEvent, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/Field";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { SelectMenu } from "@/components/ui/SelectMenu";
import { useAppData } from "@/lib/store";
import {
  type ProductType,
  type ProductTypeStatus,
  UNIT_OF_MEASURE_KEYS,
  UNIT_OF_MEASURE_LABELS,
  type UnitOfMeasure,
  WORK_TYPE_PAY_TYPE_LABELS,
  type WorkTypePayType,
} from "@/lib/types";

export type ProductTypeFormValues = Omit<
  ProductType,
  "id" | "createdAt" | "updatedAt"
>;

const empty: ProductTypeFormValues = {
  customerId: "",
  name: "",
  code: "",
  status: "active",
  unitOfMeasure: "case",
  notes: "",
  employeePayType: "production",
  employeePayRate: 0,
  customerBillingType: "production",
  customerBillingRate: 0,
};

const STATUS_OPTIONS: { value: ProductTypeStatus; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "archived", label: "Archived" },
];

const UNIT_OPTIONS = UNIT_OF_MEASURE_KEYS.map((key) => ({
  value: key,
  label: UNIT_OF_MEASURE_LABELS[key],
}));

const PAY_TYPE_OPTIONS = (
  Object.keys(WORK_TYPE_PAY_TYPE_LABELS) as WorkTypePayType[]
).map((key) => ({ value: key, label: WORK_TYPE_PAY_TYPE_LABELS[key] }));

export function ProductTypeForm({
  workTypeRecordId,
  initial,
  submitLabel,
  onSubmit,
}: {
  /** Excluded from the duplicate-name-per-customer check so editing a
   * record doesn't collide with itself. */
  workTypeRecordId?: string;
  initial?: ProductTypeFormValues;
  submitLabel: string;
  onSubmit: (values: ProductTypeFormValues) => void | Promise<void>;
}) {
  const { customers, productTypes } = useAppData();
  const [form, setForm] = useState<ProductTypeFormValues>(initial ?? empty);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  // Kept as separate strings so a lone "0" can be backspaced out — binding
  // straight to the number re-renders the same "0" since Number("") === 0.
  const [employeeRateText, setEmployeeRateText] = useState(
    String(form.employeePayRate),
  );
  const [billingRateText, setBillingRateText] = useState(
    String(form.customerBillingRate),
  );

  function update(patch: Partial<ProductTypeFormValues>) {
    setForm((f) => ({ ...f, ...patch }));
  }

  function handleEmployeeRateChange(raw: string) {
    setEmployeeRateText(raw);
    const parsed = Number(raw);
    update({
      employeePayRate: raw === "" || Number.isNaN(parsed) ? 0 : parsed,
    });
  }

  function handleBillingRateChange(raw: string) {
    setBillingRateText(raw);
    const parsed = Number(raw);
    update({
      customerBillingRate: raw === "" || Number.isNaN(parsed) ? 0 : parsed,
    });
  }

  // Active customers, plus the currently-assigned one even if it has since
  // been archived, so editing an existing work type never silently blanks
  // out its customer.
  const customerOptions = useMemo(() => {
    const active = customers.filter((c) => c.status === "active");
    const current = customers.find((c) => c.id === form.customerId);
    const list =
      current && !active.some((c) => c.id === current.id)
        ? [...active, current]
        : active;
    return list.map((c) => ({ value: c.id, label: c.displayName }));
  }, [customers, form.customerId]);

  function validate(): Record<string, string> {
    const e: Record<string, string> = {};
    if (!form.customerId) e.customerId = "Customer is required.";
    if (!form.name.trim()) e.name = "Work type name is required.";
    if (!form.unitOfMeasure) e.unitOfMeasure = "Unit of measure is required.";
    if (Number.isNaN(form.employeePayRate) || form.employeePayRate < 0) {
      e.employeePayRate = "Employee pay rate must be zero or greater.";
    }
    if (
      Number.isNaN(form.customerBillingRate) ||
      form.customerBillingRate < 0
    ) {
      e.customerBillingRate = "Customer billing rate must be zero or greater.";
    }

    if (
      !e.name &&
      !e.customerId &&
      form.status !== "archived" &&
      productTypes.some(
        (p) =>
          p.id !== workTypeRecordId &&
          p.status !== "archived" &&
          p.customerId === form.customerId &&
          p.name.trim().toLowerCase() === form.name.trim().toLowerCase(),
      )
    ) {
      e.name = "This customer already has an active work type with this name.";
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
      await onSubmit(form);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div>
        <SectionHeader title="Basic Information" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Work Type Name" required>
            <Input
              value={form.name}
              invalid={!!errors.name}
              placeholder="e.g. Floor Loaded Containers"
              onChange={(e) => update({ name: e.target.value })}
            />
            {errors.name && (
              <p className="mt-1 text-xs font-medium text-stamp">
                {errors.name}
              </p>
            )}
          </Field>
          <Field label="Customer" required>
            <SelectMenu
              value={form.customerId}
              onChange={(value) => update({ customerId: value })}
              options={customerOptions}
              placeholder="Select a customer…"
              invalid={!!errors.customerId}
            />
            {errors.customerId && (
              <p className="mt-1 text-xs font-medium text-stamp">
                {errors.customerId}
              </p>
            )}
          </Field>
          <Field label="Work Type Code" hint="Optional">
            <Input
              value={form.code ?? ""}
              placeholder="Optional"
              onChange={(e) => update({ code: e.target.value || null })}
            />
          </Field>
          <Field label="Status" required>
            <SelectMenu
              value={form.status}
              onChange={(value) =>
                update({ status: value as ProductTypeStatus })
              }
              options={STATUS_OPTIONS}
            />
          </Field>
        </div>
      </div>

      <div>
        <SectionHeader title="Payroll" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Employee Pay Type" required>
            <SelectMenu
              value={form.employeePayType}
              onChange={(value) =>
                update({ employeePayType: value as WorkTypePayType })
              }
              options={PAY_TYPE_OPTIONS}
            />
          </Field>
          <Field
            label="Employee Pay Rate"
            required
            hint={
              form.employeePayType === "hourly"
                ? "Dollars per hour"
                : "Dollars per unit"
            }
          >
            <Input
              type="number"
              step="0.01"
              min="0"
              inputMode="decimal"
              value={employeeRateText}
              invalid={!!errors.employeePayRate}
              className="input-no-spinner"
              onChange={(e) => handleEmployeeRateChange(e.target.value)}
              onBlur={() => {
                if (employeeRateText === "") setEmployeeRateText("0");
              }}
            />
            {errors.employeePayRate && (
              <p className="mt-1 text-xs font-medium text-stamp">
                {errors.employeePayRate}
              </p>
            )}
          </Field>
        </div>
      </div>

      <div>
        <SectionHeader title="Billing" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Customer Billing Type" required>
            <SelectMenu
              value={form.customerBillingType}
              onChange={(value) =>
                update({ customerBillingType: value as WorkTypePayType })
              }
              options={PAY_TYPE_OPTIONS}
            />
          </Field>
          <Field
            label="Customer Billing Rate"
            required
            hint={
              form.customerBillingType === "hourly"
                ? "Dollars per hour"
                : "Dollars per unit"
            }
          >
            <Input
              type="number"
              step="0.01"
              min="0"
              inputMode="decimal"
              value={billingRateText}
              invalid={!!errors.customerBillingRate}
              className="input-no-spinner"
              onChange={(e) => handleBillingRateChange(e.target.value)}
              onBlur={() => {
                if (billingRateText === "") setBillingRateText("0");
              }}
            />
            {errors.customerBillingRate && (
              <p className="mt-1 text-xs font-medium text-stamp">
                {errors.customerBillingRate}
              </p>
            )}
          </Field>
        </div>
      </div>

      <div>
        <SectionHeader title="Operational Settings" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Unit of Measure"
            required
            hint="Drives production calculations later — not free text."
          >
            <SelectMenu
              value={form.unitOfMeasure}
              onChange={(value) =>
                update({ unitOfMeasure: value as UnitOfMeasure })
              }
              options={UNIT_OPTIONS}
              invalid={!!errors.unitOfMeasure}
            />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Notes">
              <Textarea
                rows={2}
                value={form.notes ?? ""}
                placeholder="Additional notes about this work type…"
                onChange={(e) => update({ notes: e.target.value || null })}
              />
            </Field>
          </div>
        </div>
      </div>

      <div>
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
