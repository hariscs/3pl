"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Field";
import { useAppData } from "@/lib/store";
import {
  CREW_CATEGORY_KEYS,
  CREW_CATEGORY_LABELS,
  type CrewCategory,
  type Employee,
} from "@/lib/types";

export type EmployeeFormValues = Omit<Employee, "id" | "status">;

const empty: EmployeeFormValues = {
  name: "",
  email: "",
  phone: "",
  address: "",
  hourlyRate: 0,
  category: null,
  locationId: "",
};

export function EmployeeForm({
  initial,
  submitLabel,
  onSubmit,
}: {
  initial?: EmployeeFormValues;
  submitLabel: string;
  onSubmit: (values: EmployeeFormValues) => void;
}) {
  const { locations } = useAppData();
  const [form, setForm] = useState<EmployeeFormValues>(
    initial ?? { ...empty, locationId: locations[0]?.id ?? "" },
  );

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(form);
      }}
      className="grid gap-4 sm:grid-cols-2"
    >
      <Field label="Name" required>
        <Input
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          required
        />
      </Field>
      <Field label="Email address" required>
        <Input
          type="email"
          value={form.email}
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          required
        />
      </Field>
      <Field label="Phone number">
        <Input
          value={form.phone}
          onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
        />
      </Field>
      <Field
        label="Hourly rate"
        hint="Used for timekeeping clock-ins only — not production payout."
      >
        <Input
          type="number"
          step="0.25"
          min="0"
          value={form.hourlyRate}
          onChange={(e) =>
            setForm((f) => ({ ...f, hourlyRate: Number(e.target.value) }))
          }
        />
      </Field>
      <Field label="Crew category" hint="Job type on the floor">
        <Select
          value={form.category ?? ""}
          onChange={(e) =>
            setForm((f) => ({
              ...f,
              category: (e.target.value || null) as CrewCategory | null,
            }))
          }
        >
          <option value="">Uncategorized</option>
          {CREW_CATEGORY_KEYS.map((key) => (
            <option key={key} value={key}>
              {CREW_CATEGORY_LABELS[key]}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Address" hint="Street, city, state">
        <Input
          value={form.address}
          onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
        />
      </Field>
      <Field label="Location" required className="sm:col-span-2">
        <Select
          value={form.locationId}
          onChange={(e) =>
            setForm((f) => ({ ...f, locationId: e.target.value }))
          }
          required
        >
          {locations.map((loc) => (
            <option key={loc.id} value={loc.id}>
              {loc.name}
            </option>
          ))}
        </Select>
      </Field>

      <div className="sm:col-span-2">
        <Button type="submit">{submitLabel}</Button>
      </div>
    </form>
  );
}
