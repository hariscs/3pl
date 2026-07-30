"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { useAppData } from "@/lib/store";
import type { Customer } from "@/lib/types";

export type CustomerFormValues = Omit<Customer, "id" | "status">;

const empty: CustomerFormValues = {
  contactName: "",
  email: "",
  phone: "",
  displayName: "",
  legalCompanyName: "",
  locationIds: [],
};

export function CustomerForm({
  initial,
  submitLabel,
  onSubmit,
}: {
  initial?: CustomerFormValues;
  submitLabel: string;
  onSubmit: (values: CustomerFormValues) => void;
}) {
  const { locations } = useAppData();
  const [form, setForm] = useState<CustomerFormValues>(initial ?? empty);

  function toggleLocation(id: string) {
    setForm((f) => ({
      ...f,
      locationIds: f.locationIds.includes(id)
        ? f.locationIds.filter((l) => l !== id)
        : [...f.locationIds, id],
    }));
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(form);
      }}
      className="grid gap-4 sm:grid-cols-2"
    >
      <Field label="Contact name" required>
        <Input
          value={form.contactName}
          onChange={(e) =>
            setForm((f) => ({ ...f, contactName: e.target.value }))
          }
          required
        />
      </Field>
      <Field label="Contact email" required>
        <Input
          type="email"
          value={form.email}
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          required
        />
      </Field>
      <Field label="Phone">
        <Input
          value={form.phone}
          onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
        />
      </Field>
      <Field label="Display name (as shown in the app)" required>
        <Input
          value={form.displayName}
          onChange={(e) =>
            setForm((f) => ({ ...f, displayName: e.target.value }))
          }
          required
        />
      </Field>
      <Field label="Legal company name" required className="sm:col-span-2">
        <Input
          value={form.legalCompanyName}
          onChange={(e) =>
            setForm((f) => ({ ...f, legalCompanyName: e.target.value }))
          }
          required
        />
      </Field>

      <div className="rounded-xl border border-manila-dark bg-paper-dim p-4 sm:col-span-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-steel">
          Locations
        </p>
        <p className="mb-3 text-xs text-steel">
          Every product type and load for this customer must belong to one of
          these locations.
        </p>
        <div className="flex flex-wrap gap-3">
          {locations.map((loc) => (
            <label
              key={loc.id}
              className="flex items-center gap-2 rounded-lg border border-manila-dark bg-cream px-3 py-1.5 text-sm text-ink transition-colors has-checked:border-rust has-checked:bg-rust-soft has-focus-visible:ring-2 has-focus-visible:ring-rust/30"
            >
              <input
                type="checkbox"
                checked={form.locationIds.includes(loc.id)}
                onChange={() => toggleLocation(loc.id)}
                className="accent-rust"
              />
              {loc.name}
            </label>
          ))}
        </div>
      </div>

      <div className="sm:col-span-2">
        <Button type="submit">{submitLabel}</Button>
      </div>
    </form>
  );
}
