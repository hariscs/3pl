"use client";

import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/Field";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { SelectMenu } from "@/components/ui/SelectMenu";
import { useAppData } from "@/lib/store";
import {
  type Customer,
  type CustomerStatus,
  PAYMENT_TERMS_KEYS,
  PAYMENT_TERMS_LABELS,
} from "@/lib/types";

export type CustomerFormValues = Omit<
  Customer,
  "id" | "createdAt" | "updatedAt"
>;

const empty: CustomerFormValues = {
  displayName: "",
  code: "",
  legalCompanyName: "",
  status: "active",
  industry: "",
  website: "",
  taxId: "",
  contactName: "",
  contactTitle: "",
  email: "",
  phone: "",
  billingEmail: "",
  paymentTerms: null,
  notes: "",
};

const STATUS_OPTIONS: { value: CustomerStatus; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "archived", label: "Archived" },
];

const PAYMENT_TERMS_OPTIONS = [
  { value: "", label: "Not set" },
  ...PAYMENT_TERMS_KEYS.map((key) => ({
    value: key,
    label: PAYMENT_TERMS_LABELS[key],
  })),
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const WEBSITE_RE = /^(https?:\/\/)?([\w-]+\.)+[a-z]{2,}(\/\S*)?$/i;

export function CustomerForm({
  customerRecordId,
  initial,
  submitLabel,
  onSubmit,
}: {
  /** Excluded from the duplicate-name check so editing a record doesn't
   * collide with itself. */
  customerRecordId?: string;
  initial?: CustomerFormValues;
  submitLabel: string;
  onSubmit: (values: CustomerFormValues) => void | Promise<void>;
}) {
  const { customers } = useAppData();
  const [form, setForm] = useState<CustomerFormValues>(initial ?? empty);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  function update(patch: Partial<CustomerFormValues>) {
    setForm((f) => ({ ...f, ...patch }));
  }

  function validate(): Record<string, string> {
    const e: Record<string, string> = {};
    if (!form.displayName.trim()) e.displayName = "Customer name is required.";
    if (!form.contactName.trim()) {
      e.contactName = "Primary contact name is required.";
    }
    const email = form.email.trim();
    if (!email) {
      e.email = "Primary contact email is required.";
    } else if (!EMAIL_RE.test(email)) {
      e.email = "Enter a valid email address.";
    }

    if (
      !e.displayName &&
      form.status !== "archived" &&
      customers.some(
        (c) =>
          c.id !== customerRecordId &&
          c.status !== "archived" &&
          c.displayName.trim().toLowerCase() ===
            form.displayName.trim().toLowerCase(),
      )
    ) {
      e.displayName = "An active customer with this name already exists.";
    }

    const website = form.website?.trim();
    if (website && !WEBSITE_RE.test(website)) {
      e.website = "Enter a valid website (e.g. example.com).";
    }
    const billingEmail = form.billingEmail?.trim();
    if (billingEmail && !EMAIL_RE.test(billingEmail)) {
      e.billingEmail = "Enter a valid email address.";
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
          <Field label="Customer Name" required>
            <Input
              value={form.displayName}
              invalid={!!errors.displayName}
              placeholder="e.g. Geodis"
              onChange={(e) => update({ displayName: e.target.value })}
            />
            {errors.displayName && (
              <p className="mt-1 text-xs font-medium text-stamp">
                {errors.displayName}
              </p>
            )}
          </Field>
          <Field label="Customer Code" hint="e.g. AMZ, GEOD, DHL">
            <Input
              value={form.code ?? ""}
              placeholder="Optional"
              onChange={(e) => update({ code: e.target.value || null })}
            />
          </Field>
          <Field label="Legal Company Name">
            <Input
              value={form.legalCompanyName ?? ""}
              placeholder="Optional"
              onChange={(e) =>
                update({ legalCompanyName: e.target.value || null })
              }
            />
          </Field>
          <Field label="Status" required>
            <SelectMenu
              value={form.status}
              onChange={(value) => update({ status: value as CustomerStatus })}
              options={STATUS_OPTIONS}
            />
          </Field>
        </div>
      </div>

      <div>
        <SectionHeader title="Business Information" />
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Industry">
            <Input
              value={form.industry ?? ""}
              placeholder="e.g. Retail Distribution"
              onChange={(e) => update({ industry: e.target.value || null })}
            />
          </Field>
          <Field label="Website">
            <Input
              value={form.website ?? ""}
              invalid={!!errors.website}
              placeholder="example.com"
              onChange={(e) => update({ website: e.target.value || null })}
            />
            {errors.website && (
              <p className="mt-1 text-xs font-medium text-stamp">
                {errors.website}
              </p>
            )}
          </Field>
          <Field label="Tax ID">
            <Input
              value={form.taxId ?? ""}
              placeholder="Optional"
              onChange={(e) => update({ taxId: e.target.value || null })}
            />
          </Field>
        </div>
      </div>

      <div>
        <SectionHeader title="Primary Contact" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Contact Name" required>
            <Input
              value={form.contactName}
              invalid={!!errors.contactName}
              placeholder="e.g. Jordan Casey"
              onChange={(e) => update({ contactName: e.target.value })}
            />
            {errors.contactName && (
              <p className="mt-1 text-xs font-medium text-stamp">
                {errors.contactName}
              </p>
            )}
          </Field>
          <Field label="Job Title">
            <Input
              value={form.contactTitle ?? ""}
              placeholder="Optional"
              onChange={(e) => update({ contactTitle: e.target.value || null })}
            />
          </Field>
          <Field label="Email" required>
            <Input
              type="email"
              value={form.email}
              invalid={!!errors.email}
              placeholder="name@example.com"
              onChange={(e) => update({ email: e.target.value })}
            />
            {errors.email && (
              <p className="mt-1 text-xs font-medium text-stamp">
                {errors.email}
              </p>
            )}
          </Field>
          <Field label="Phone">
            <Input
              value={form.phone ?? ""}
              placeholder="(555) 123-4567"
              onChange={(e) => update({ phone: e.target.value || null })}
            />
          </Field>
        </div>
      </div>

      <div>
        <SectionHeader title="Billing" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Billing Email"
            hint="Defaults to the primary contact if left blank."
          >
            <Input
              type="email"
              value={form.billingEmail ?? ""}
              invalid={!!errors.billingEmail}
              placeholder="Optional"
              onChange={(e) => update({ billingEmail: e.target.value || null })}
            />
            {errors.billingEmail && (
              <p className="mt-1 text-xs font-medium text-stamp">
                {errors.billingEmail}
              </p>
            )}
          </Field>
          <Field label="Payment Terms">
            <SelectMenu
              value={form.paymentTerms ?? ""}
              onChange={(value) =>
                update({
                  paymentTerms: (value ||
                    null) as CustomerFormValues["paymentTerms"],
                })
              }
              options={PAYMENT_TERMS_OPTIONS}
              placeholder="Not set"
            />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Notes">
              <Textarea
                rows={2}
                value={form.notes ?? ""}
                placeholder="Additional notes about this customer…"
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
