"use client";

import { type FormEvent, useEffect, useState } from "react";
import { CrewCertificationsField } from "@/components/forms/CrewCertificationsField";
import { CrewProfilePhotoField } from "@/components/forms/CrewProfilePhotoField";
import { CrewSkillsField } from "@/components/forms/CrewSkillsField";
import { CrewTrainingField } from "@/components/forms/CrewTrainingField";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/Field";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { SelectMenu } from "@/components/ui/SelectMenu";
import { suggestNextEmployeeId } from "@/lib/crew";
import { useAppData } from "@/lib/store";
import {
  CREW_CATEGORY_KEYS,
  CREW_CATEGORY_LABELS,
  type CrewCategory,
  EMPLOYMENT_TYPE_KEYS,
  EMPLOYMENT_TYPE_LABELS,
  type Employee,
  type EmploymentStatus,
  type EmploymentType,
  PAY_TYPE_KEYS,
  PAY_TYPE_LABELS,
  type PayType,
} from "@/lib/types";

export type CrewMemberFormValues = Omit<Employee, "id">;

const EMPLOYMENT_STATUS_OPTIONS: { value: EmploymentStatus; label: string }[] =
  [
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
    { value: "archived", label: "Archived" },
  ];

const EMPLOYMENT_TYPE_OPTIONS = [
  { value: "", label: "Not set" },
  ...EMPLOYMENT_TYPE_KEYS.map((key) => ({
    value: key,
    label: EMPLOYMENT_TYPE_LABELS[key],
  })),
];

const CATEGORY_OPTIONS = [
  { value: "", label: "Uncategorized" },
  ...CREW_CATEGORY_KEYS.map((key) => ({
    value: key,
    label: CREW_CATEGORY_LABELS[key],
  })),
];

const PAY_TYPE_OPTIONS = PAY_TYPE_KEYS.map((key) => ({
  value: key,
  label: PAY_TYPE_LABELS[key],
}));

const emptyForm: CrewMemberFormValues = {
  employeeId: "",
  firstName: "",
  lastName: "",
  preferredName: undefined,
  profilePhotoUrl: undefined,
  phone: "",
  email: undefined,
  address: undefined,
  emergencyContact: undefined,
  employmentStatus: "active",
  hireDate: undefined,
  employmentType: undefined,
  category: null,
  notes: undefined,
  payType: "hourly",
  hourlyRate: 0,
  productionPayEligible: false,
  skillIds: [],
  certifications: [],
  trainingRecords: [],
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const SECTION_FIELDS: Record<string, string[]> = {
  personal: ["employeeId", "firstName", "lastName", "phone", "email"],
  pay: ["hourlyRate"],
};

export function CrewMemberForm({
  mode,
  employeeRecordId,
  initial,
  submitLabel,
  onSubmit,
}: {
  mode: "create" | "edit";
  /** The employee's internal id (not the human-facing employeeId) — used to
   * exclude itself from uniqueness checks while editing. */
  employeeRecordId?: string;
  initial?: CrewMemberFormValues;
  submitLabel: string;
  onSubmit: (values: CrewMemberFormValues) => void | Promise<void>;
}) {
  const { employees } = useAppData();
  const [form, setForm] = useState<CrewMemberFormValues>(
    initial ?? { ...emptyForm, employeeId: suggestNextEmployeeId(employees) },
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  // The employees list loads asynchronously, so the very first suggestion
  // (computed before it resolves) can be stale. Keep it in sync until the
  // admin actually edits the field themselves.
  const [employeeIdEdited, setEmployeeIdEdited] = useState(mode === "edit");
  // Kept as a separate string so the field can sit empty mid-edit — mirroring
  // `form.hourlyRate` directly meant a lone "0" could never be backspaced
  // out, since clearing it just re-rendered the same "0" straight back.
  const [hourlyRateText, setHourlyRateText] = useState(String(form.hourlyRate));

  useEffect(() => {
    if (mode !== "create" || employeeIdEdited) return;
    const suggestion = suggestNextEmployeeId(employees);
    setForm((f) =>
      f.employeeId === suggestion ? f : { ...f, employeeId: suggestion },
    );
  }, [mode, employeeIdEdited, employees]);

  function update(patch: Partial<CrewMemberFormValues>) {
    setForm((f) => ({ ...f, ...patch }));
  }

  function updateAddress(
    patch: Partial<NonNullable<CrewMemberFormValues["address"]>>,
  ) {
    setForm((f) => ({ ...f, address: { ...f.address, ...patch } }));
  }

  function updateEmergencyContact(
    patch: Partial<NonNullable<CrewMemberFormValues["emergencyContact"]>>,
  ) {
    setForm((f) => ({
      ...f,
      emergencyContact: { ...f.emergencyContact, ...patch },
    }));
  }

  function handleHourlyRateChange(raw: string) {
    setHourlyRateText(raw);
    const parsed = Number(raw);
    update({ hourlyRate: raw === "" || Number.isNaN(parsed) ? 0 : parsed });
  }

  function handleHourlyRateBlur() {
    if (hourlyRateText === "") setHourlyRateText("0");
  }

  function validate(): Record<string, string> {
    const e: Record<string, string> = {};
    const trimmedId = form.employeeId.trim();
    if (!trimmedId) {
      e.employeeId = "Employee ID is required.";
    } else if (
      employees.some(
        (emp) => emp.employeeId === trimmedId && emp.id !== employeeRecordId,
      )
    ) {
      e.employeeId = "This Employee ID is already in use.";
    }
    if (!form.firstName.trim()) e.firstName = "First name is required.";
    if (!form.lastName.trim()) e.lastName = "Last name is required.";
    if (!form.phone.trim()) e.phone = "Phone number is required.";
    if (form.email && !EMAIL_RE.test(form.email)) {
      e.email = "Enter a valid email address.";
    }
    if (Number.isNaN(form.hourlyRate) || form.hourlyRate < 0) {
      e.hourlyRate = "Hourly rate must be zero or greater.";
    }
    return e;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (submitting) return;

    const validationErrors = validate();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      const firstSection = Object.entries(SECTION_FIELDS).find(([, fields]) =>
        fields.some((field) => validationErrors[field]),
      )?.[0];
      if (firstSection) {
        document
          .getElementById(`crew-section-${firstSection}`)
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(form);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Section 1 — Profile Photo */}
      <div>
        <CrewProfilePhotoField
          photoUrl={form.profilePhotoUrl}
          firstName={form.firstName}
          lastName={form.lastName}
          onChange={(profilePhotoUrl) => update({ profilePhotoUrl })}
        />
      </div>

      {/* Section 2 — Personal Information */}
      <div id="crew-section-personal">
        <SectionHeader title="Personal Information" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Employee ID"
            required
            hint={
              mode === "create"
                ? "Suggested — reviewable before saving."
                : undefined
            }
          >
            <Input
              value={form.employeeId}
              invalid={!!errors.employeeId}
              placeholder="EMP-0000"
              onChange={(e) => {
                setEmployeeIdEdited(true);
                update({ employeeId: e.target.value });
              }}
            />
            {errors.employeeId && (
              <p className="mt-1 text-xs font-medium text-stamp">
                {errors.employeeId}
              </p>
            )}
          </Field>
          <Field label="Preferred Name">
            <Input
              value={form.preferredName ?? ""}
              placeholder="Optional"
              onChange={(e) =>
                update({ preferredName: e.target.value || undefined })
              }
            />
          </Field>
          <Field label="First Name" required>
            <Input
              value={form.firstName}
              invalid={!!errors.firstName}
              placeholder="e.g. Marcus"
              onChange={(e) => update({ firstName: e.target.value })}
            />
            {errors.firstName && (
              <p className="mt-1 text-xs font-medium text-stamp">
                {errors.firstName}
              </p>
            )}
          </Field>
          <Field label="Last Name" required>
            <Input
              value={form.lastName}
              invalid={!!errors.lastName}
              placeholder="e.g. Bell"
              onChange={(e) => update({ lastName: e.target.value })}
            />
            {errors.lastName && (
              <p className="mt-1 text-xs font-medium text-stamp">
                {errors.lastName}
              </p>
            )}
          </Field>
          <Field label="Phone Number" required>
            <Input
              value={form.phone}
              invalid={!!errors.phone}
              placeholder="(555) 123-4567"
              onChange={(e) => update({ phone: e.target.value })}
            />
            {errors.phone && (
              <p className="mt-1 text-xs font-medium text-stamp">
                {errors.phone}
              </p>
            )}
          </Field>
          <Field label="Email Address">
            <Input
              type="email"
              value={form.email ?? ""}
              invalid={!!errors.email}
              placeholder="name@example.com"
              onChange={(e) => update({ email: e.target.value || undefined })}
            />
            {errors.email && (
              <p className="mt-1 text-xs font-medium text-stamp">
                {errors.email}
              </p>
            )}
          </Field>
          <div className="sm:col-span-2">
            <Field label="Address Line 1">
              <Input
                value={form.address?.line1 ?? ""}
                placeholder="Street address"
                onChange={(e) =>
                  updateAddress({ line1: e.target.value || undefined })
                }
              />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Address Line 2">
              <Input
                value={form.address?.line2 ?? ""}
                placeholder="Apt, suite, unit, etc. (optional)"
                onChange={(e) =>
                  updateAddress({ line2: e.target.value || undefined })
                }
              />
            </Field>
          </div>
          <Field label="City">
            <Input
              value={form.address?.city ?? ""}
              placeholder="City"
              onChange={(e) =>
                updateAddress({ city: e.target.value || undefined })
              }
            />
          </Field>
          <Field label="State">
            <Input
              value={form.address?.state ?? ""}
              placeholder="State"
              onChange={(e) =>
                updateAddress({ state: e.target.value || undefined })
              }
            />
          </Field>
          <Field label="ZIP / Postal Code">
            <Input
              value={form.address?.postalCode ?? ""}
              placeholder="ZIP / Postal code"
              onChange={(e) =>
                updateAddress({ postalCode: e.target.value || undefined })
              }
            />
          </Field>
        </div>

        <p className="mb-3 mt-6 text-xs font-semibold uppercase tracking-wider text-steel">
          Emergency Contact
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Name">
            <Input
              value={form.emergencyContact?.name ?? ""}
              placeholder="Full name"
              onChange={(e) =>
                updateEmergencyContact({ name: e.target.value || undefined })
              }
            />
          </Field>
          <Field label="Phone">
            <Input
              value={form.emergencyContact?.phone ?? ""}
              placeholder="(555) 123-4567"
              onChange={(e) =>
                updateEmergencyContact({ phone: e.target.value || undefined })
              }
            />
          </Field>
          <Field label="Relationship">
            <Input
              value={form.emergencyContact?.relationship ?? ""}
              placeholder="e.g. Spouse"
              onChange={(e) =>
                updateEmergencyContact({
                  relationship: e.target.value || undefined,
                })
              }
            />
          </Field>
        </div>
      </div>

      {/* Section 3 — Employment Information */}
      <div id="crew-section-employment">
        <SectionHeader title="Employment Information" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Employment Status" required>
            <SelectMenu
              value={form.employmentStatus}
              onChange={(value) =>
                update({ employmentStatus: value as EmploymentStatus })
              }
              options={EMPLOYMENT_STATUS_OPTIONS}
            />
          </Field>
          <Field label="Hire Date">
            <Input
              type="date"
              value={form.hireDate ?? ""}
              onChange={(e) =>
                update({ hireDate: e.target.value || undefined })
              }
            />
          </Field>
          <Field label="Employment Type">
            <SelectMenu
              value={form.employmentType ?? ""}
              onChange={(value) =>
                update({
                  employmentType: (value || undefined) as
                    | EmploymentType
                    | undefined,
                })
              }
              options={EMPLOYMENT_TYPE_OPTIONS}
              placeholder="Not set"
            />
          </Field>
          <Field
            label="Primary Job Category"
            hint="One primary category — see Skills below for capabilities."
          >
            <SelectMenu
              value={form.category ?? ""}
              onChange={(value) =>
                update({ category: (value || null) as CrewCategory | null })
              }
              options={CATEGORY_OPTIONS}
              placeholder="Uncategorized"
            />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Notes">
              <Textarea
                rows={2}
                value={form.notes ?? ""}
                placeholder="Additional notes about this crew member…"
                onChange={(e) => update({ notes: e.target.value || undefined })}
              />
            </Field>
          </div>
        </div>
      </div>

      {/* Section 4 — Pay Information */}
      <div id="crew-section-pay">
        <SectionHeader title="Pay Information" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Hourly Rate"
            hint="Used for timekeeping or hourly assignments. Production pay is calculated from eligible load assignments."
          >
            <Input
              type="number"
              step="0.25"
              min="0"
              inputMode="decimal"
              value={hourlyRateText}
              invalid={!!errors.hourlyRate}
              className="input-no-spinner"
              onChange={(e) => handleHourlyRateChange(e.target.value)}
              onBlur={handleHourlyRateBlur}
            />
            {errors.hourlyRate && (
              <p className="mt-1 text-xs font-medium text-stamp">
                {errors.hourlyRate}
              </p>
            )}
          </Field>
          <Field label="Pay Type">
            <SelectMenu
              value={form.payType}
              onChange={(value) => update({ payType: value as PayType })}
              options={PAY_TYPE_OPTIONS}
            />
          </Field>
          <label className="flex items-center gap-2 text-sm text-ink">
            <input
              type="checkbox"
              checked={form.productionPayEligible}
              onChange={(e) =>
                update({ productionPayEligible: e.target.checked })
              }
              className="accent-rust"
            />
            Production pay eligible
          </label>
        </div>
      </div>

      {/* Section 5 — Skills */}
      <div>
        <SectionHeader title="Skills" />
        <CrewSkillsField
          skillIds={form.skillIds}
          onChange={(skillIds) => update({ skillIds })}
        />
      </div>

      {/* Section 6 — Certifications */}
      <div>
        <SectionHeader title="Certifications" />
        <CrewCertificationsField
          certifications={form.certifications}
          onChange={(certifications) => update({ certifications })}
        />
      </div>

      {/* Section 7 — Training */}
      <div>
        <SectionHeader title="Training" />
        <CrewTrainingField
          trainingRecords={form.trainingRecords}
          onChange={(trainingRecords) => update({ trainingRecords })}
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
