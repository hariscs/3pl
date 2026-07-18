"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Field";

export type LocationFormValues = {
  name: string;
  region: string;
  code: string;
  group: string;
  addressL1: string;
  city: string;
  state: string;
  postalCode: string;
  timezone: string;
  status: string;
  shiftStart: string;
  shiftEnd: string;
};

const empty: LocationFormValues = {
  name: "",
  region: "",
  code: "",
  group: "",
  addressL1: "",
  city: "",
  state: "",
  postalCode: "",
  timezone: "America/New_York",
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

export function LocationForm({
  initial,
  submitLabel,
  onSubmit,
}: {
  initial?: LocationFormValues;
  submitLabel: string;
  onSubmit: (values: LocationFormValues) => void;
}) {
  const [form, setForm] = useState<LocationFormValues>(initial ?? empty);
  const set = (patch: Partial<LocationFormValues>) =>
    setForm((f) => ({ ...f, ...patch }));

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
          onChange={(e) => set({ name: e.target.value })}
          required
        />
      </Field>
      <Field label="Region" required>
        <Input
          value={form.region}
          onChange={(e) => set({ region: e.target.value })}
          required
        />
      </Field>
      <Field label="Code" hint="Short unique code, e.g. CLT">
        <Input
          value={form.code}
          onChange={(e) => set({ code: e.target.value })}
        />
      </Field>
      <Field label="Group" hint="Optional grouping label">
        <Input
          value={form.group}
          onChange={(e) => set({ group: e.target.value })}
        />
      </Field>
      <Field label="Address">
        <Input
          value={form.addressL1}
          onChange={(e) => set({ addressL1: e.target.value })}
        />
      </Field>
      <Field label="City">
        <Input
          value={form.city}
          onChange={(e) => set({ city: e.target.value })}
        />
      </Field>
      <Field label="State">
        <Input
          value={form.state}
          onChange={(e) => set({ state: e.target.value })}
        />
      </Field>
      <Field label="Postal code">
        <Input
          value={form.postalCode}
          onChange={(e) => set({ postalCode: e.target.value })}
        />
      </Field>
      <Field label="Timezone">
        <Select
          value={form.timezone}
          onChange={(e) => set({ timezone: e.target.value })}
        >
          {TIMEZONES.map((tz) => (
            <option key={tz} value={tz}>
              {tz}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Status">
        <Select
          value={form.status}
          onChange={(e) => set({ status: e.target.value })}
        >
          <option value="active">Active</option>
          <option value="archived">Archived</option>
        </Select>
      </Field>
      <Field label="Shift start">
        <Input
          type="time"
          value={form.shiftStart}
          onChange={(e) => set({ shiftStart: e.target.value })}
        />
      </Field>
      <Field label="Shift end">
        <Input
          type="time"
          value={form.shiftEnd}
          onChange={(e) => set({ shiftEnd: e.target.value })}
        />
      </Field>

      <div className="sm:col-span-2">
        <Button type="submit">{submitLabel}</Button>
      </div>
    </form>
  );
}
