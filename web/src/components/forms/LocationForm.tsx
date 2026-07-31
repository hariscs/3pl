"use client";

import { type FormEvent, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/Field";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { SelectMenu } from "@/components/ui/SelectMenu";
import { useAppData } from "@/lib/store";
import type { Location, LocationStatus } from "@/lib/types";

export type LocationFormValues = Omit<
  Location,
  "id" | "createdAt" | "updatedAt"
>;

const emptyForm: LocationFormValues = {
  name: "",
  customerId: "",
  region: "",
  code: "",
  group: "",
  addressL1: "",
  city: "",
  state: "",
  postalCode: "",
  country: "US",
  timezone: "America/New_York",
  notes: undefined,
  siteContact: undefined,
  status: "active",
  shiftStart: "08:00",
  shiftEnd: "17:00",
};

const TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
];
const TIMEZONE_OPTIONS = TIMEZONES.map((tz) => ({ value: tz, label: tz }));

const STATUS_OPTIONS: { value: LocationStatus; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "archived", label: "Archived" },
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[+]?[\d\s()-]{7,20}$/;

export function LocationForm({
  locationRecordId,
  initial,
  submitLabel,
  onSubmit,
}: {
  /** Excluded from the duplicate-name-per-customer check so editing a record
   * doesn't collide with itself. */
  locationRecordId?: string;
  initial?: LocationFormValues;
  submitLabel: string;
  onSubmit: (values: LocationFormValues) => void | Promise<void>;
}) {
  const { customers, locations } = useAppData();
  const [form, setForm] = useState<LocationFormValues>(initial ?? emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  function update(patch: Partial<LocationFormValues>) {
    setForm((f) => ({ ...f, ...patch }));
  }

  function updateSiteContact(
    patch: Partial<NonNullable<LocationFormValues["siteContact"]>>,
  ) {
    setForm((f) => ({ ...f, siteContact: { ...f.siteContact, ...patch } }));
  }

  // Active customers, plus the currently-assigned one even if it has since
  // been archived, so editing an existing location never silently blanks
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
    if (!form.name.trim()) e.name = "Location name is required.";
    if (!form.region.trim()) e.region = "Region is required.";
    if (!form.addressL1?.trim()) e.addressL1 = "Street address is required.";
    if (!form.city?.trim()) e.city = "City is required.";
    if (!form.state?.trim()) e.state = "State is required.";

    if (
      !e.name &&
      !e.customerId &&
      form.status !== "archived" &&
      locations.some(
        (l) =>
          l.id !== locationRecordId &&
          l.status !== "archived" &&
          l.customerId === form.customerId &&
          l.name.trim().toLowerCase() === form.name.trim().toLowerCase(),
      )
    ) {
      e.name = "This customer already has an active location with this name.";
    }

    const email = form.siteContact?.email?.trim();
    if (email && !EMAIL_RE.test(email)) {
      e.siteContactEmail = "Enter a valid email address.";
    }
    const phone = form.siteContact?.phone?.trim();
    if (phone && !PHONE_RE.test(phone)) {
      e.siteContactPhone = "Enter a valid phone number.";
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
          <Field label="Location Name" required>
            <Input
              value={form.name}
              invalid={!!errors.name}
              placeholder="e.g. Charlotte DC"
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
          <Field label="Location Code" hint="e.g. CLT-01, ATL-02">
            <Input
              value={form.code ?? ""}
              placeholder="Optional"
              onChange={(e) => update({ code: e.target.value || null })}
            />
          </Field>
          <Field label="Status" required>
            <SelectMenu
              value={form.status}
              onChange={(value) => update({ status: value as LocationStatus })}
              options={STATUS_OPTIONS}
            />
          </Field>
          <Field label="Region" required>
            <Input
              value={form.region}
              invalid={!!errors.region}
              placeholder="e.g. Southeast"
              onChange={(e) => update({ region: e.target.value })}
            />
            {errors.region && (
              <p className="mt-1 text-xs font-medium text-stamp">
                {errors.region}
              </p>
            )}
          </Field>
          <Field label="Group" hint="Optional grouping label">
            <Input
              value={form.group ?? ""}
              placeholder="Optional"
              onChange={(e) => update({ group: e.target.value || null })}
            />
          </Field>
        </div>
      </div>

      <div>
        <SectionHeader title="Address" />
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field label="Street Address" required>
              <Input
                value={form.addressL1 ?? ""}
                invalid={!!errors.addressL1}
                onChange={(e) => update({ addressL1: e.target.value })}
              />
              {errors.addressL1 && (
                <p className="mt-1 text-xs font-medium text-stamp">
                  {errors.addressL1}
                </p>
              )}
            </Field>
          </div>
          <Field label="City" required>
            <Input
              value={form.city ?? ""}
              invalid={!!errors.city}
              onChange={(e) => update({ city: e.target.value })}
            />
            {errors.city && (
              <p className="mt-1 text-xs font-medium text-stamp">
                {errors.city}
              </p>
            )}
          </Field>
          <Field label="State" required>
            <Input
              value={form.state ?? ""}
              invalid={!!errors.state}
              onChange={(e) => update({ state: e.target.value })}
            />
            {errors.state && (
              <p className="mt-1 text-xs font-medium text-stamp">
                {errors.state}
              </p>
            )}
          </Field>
          <Field label="ZIP / Postal Code">
            <Input
              value={form.postalCode ?? ""}
              onChange={(e) => update({ postalCode: e.target.value || null })}
            />
          </Field>
          <Field label="Country">
            <Input
              value={form.country ?? ""}
              onChange={(e) => update({ country: e.target.value || null })}
            />
          </Field>
        </div>
      </div>

      <div>
        <SectionHeader title="Site Contact" />
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Contact Name">
            <Input
              value={form.siteContact?.name ?? ""}
              placeholder="Optional"
              onChange={(e) =>
                updateSiteContact({ name: e.target.value || undefined })
              }
            />
          </Field>
          <Field label="Phone">
            <Input
              value={form.siteContact?.phone ?? ""}
              invalid={!!errors.siteContactPhone}
              placeholder="(555) 123-4567"
              onChange={(e) =>
                updateSiteContact({ phone: e.target.value || undefined })
              }
            />
            {errors.siteContactPhone && (
              <p className="mt-1 text-xs font-medium text-stamp">
                {errors.siteContactPhone}
              </p>
            )}
          </Field>
          <Field label="Email">
            <Input
              type="email"
              value={form.siteContact?.email ?? ""}
              invalid={!!errors.siteContactEmail}
              placeholder="name@example.com"
              onChange={(e) =>
                updateSiteContact({ email: e.target.value || undefined })
              }
            />
            {errors.siteContactEmail && (
              <p className="mt-1 text-xs font-medium text-stamp">
                {errors.siteContactEmail}
              </p>
            )}
          </Field>
        </div>
      </div>

      <div>
        <SectionHeader title="Operational Settings" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Time Zone">
            <SelectMenu
              value={form.timezone}
              onChange={(value) => update({ timezone: value })}
              options={TIMEZONE_OPTIONS}
            />
          </Field>
          <div />
          <Field label="Shift Start">
            <Input
              type="time"
              value={form.shiftStart}
              onChange={(e) => update({ shiftStart: e.target.value })}
            />
          </Field>
          <Field label="Shift End">
            <Input
              type="time"
              value={form.shiftEnd}
              onChange={(e) => update({ shiftEnd: e.target.value })}
            />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Notes">
              <Textarea
                rows={2}
                value={form.notes ?? ""}
                placeholder="Additional notes about this location…"
                onChange={(e) => update({ notes: e.target.value || undefined })}
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
