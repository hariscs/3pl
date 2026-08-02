"use client";

import { Check } from "lucide-react";
import { type FormEvent, useState } from "react";
import { CrewMemberLinkField } from "@/components/forms/CrewMemberLinkField";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { SelectMenu } from "@/components/ui/SelectMenu";
import { useAppData } from "@/lib/store";
import type { Role, SystemUser } from "@/lib/types";
import { ROLE_KEYS, ROLE_LABELS, roleRequiresLocations } from "@/lib/users";

export type UserFormValues = Omit<SystemUser, "id" | "status"> & {
  status: SystemUser["status"];
  password: string;
};

const emptyForm: UserFormValues = {
  firstName: "",
  lastName: "",
  email: "",
  role: "lead",
  status: "active",
  locationIds: [],
  customerId: undefined,
  linkedCrewMemberId: undefined,
  password: "",
};

const ROLE_OPTIONS = ROLE_KEYS.map((key) => ({
  value: key,
  label: ROLE_LABELS[key],
}));

const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "archived", label: "Archived" },
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function UserForm({
  mode,
  userRecordId,
  initial,
  submitLabel,
  onSubmit,
}: {
  mode: "create" | "edit";
  /** Excluded from uniqueness/crew-linkage checks so editing a record
   * doesn't collide with itself. */
  userRecordId?: string;
  initial?: UserFormValues;
  submitLabel: string;
  onSubmit: (values: UserFormValues) => void | Promise<void>;
}) {
  const { locations, customers, users, employees } = useAppData();
  const [form, setForm] = useState<UserFormValues>(initial ?? emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  function update(patch: Partial<UserFormValues>) {
    setForm((f) => ({ ...f, ...patch }));
  }

  function setRole(role: Role) {
    // Clear the fields that only apply to the previous role so switching
    // roles never leaves a stale locationIds/customerId/linkedCrewMemberId
    // behind for a role it no longer applies to.
    update({
      role,
      locationIds: [],
      customerId: undefined,
      linkedCrewMemberId: undefined,
    });
  }

  function toggleLocation(id: string) {
    setForm((f) => ({
      ...f,
      locationIds: f.locationIds.includes(id)
        ? f.locationIds.filter((l) => l !== id)
        : [...f.locationIds, id],
    }));
  }

  function validate(): Record<string, string> {
    const e: Record<string, string> = {};
    if (!form.firstName.trim()) e.firstName = "First name is required.";
    if (!form.lastName.trim()) e.lastName = "Last name is required.";
    const trimmedEmail = form.email.trim();
    if (!trimmedEmail) {
      e.email = "Email is required.";
    } else if (!EMAIL_RE.test(trimmedEmail)) {
      e.email = "Enter a valid email address.";
    } else if (
      users.some((u) => u.email === trimmedEmail && u.id !== userRecordId)
    ) {
      e.email = "This email is already registered.";
    }
    if (mode === "create" && !form.password.trim()) {
      e.password = "Password is required.";
    }
    if (roleRequiresLocations(form.role) && form.locationIds.length === 0) {
      e.locationIds = "Select at least one location.";
    }
    if (form.role === "employee") {
      if (!form.linkedCrewMemberId) {
        e.linkedCrewMemberId = "Select a crew member to link.";
      } else {
        const linkedCrew = employees.find(
          (emp) => emp.id === form.linkedCrewMemberId,
        );
        if (linkedCrew?.employmentStatus === "archived") {
          e.linkedCrewMemberId = "This crew member is archived.";
        } else if (
          users.some(
            (u) =>
              u.role === "employee" &&
              u.status === "active" &&
              u.linkedCrewMemberId === form.linkedCrewMemberId &&
              u.id !== userRecordId,
          )
        ) {
          e.linkedCrewMemberId =
            "This crew member is already linked to another active account.";
        }
      }
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
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="First Name" required>
          <Input
            value={form.firstName}
            invalid={!!errors.firstName}
            placeholder="e.g. Jordan"
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
            placeholder="e.g. Casey"
            onChange={(e) => update({ lastName: e.target.value })}
          />
          {errors.lastName && (
            <p className="mt-1 text-xs font-medium text-stamp">
              {errors.lastName}
            </p>
          )}
        </Field>
        <Field label="Email Address" required>
          <Input
            type="email"
            value={form.email}
            invalid={!!errors.email}
            placeholder="jordan@example.com"
            onChange={(e) => update({ email: e.target.value })}
          />
          {errors.email && (
            <p className="mt-1 text-xs font-medium text-stamp">
              {errors.email}
            </p>
          )}
        </Field>
        {mode === "create" && (
          <Field label="Password" required>
            <Input
              type="password"
              value={form.password}
              invalid={!!errors.password}
              onChange={(e) => update({ password: e.target.value })}
            />
            {errors.password && (
              <p className="mt-1 text-xs font-medium text-stamp">
                {errors.password}
              </p>
            )}
          </Field>
        )}
        <Field label="Role" required>
          <SelectMenu
            value={form.role}
            onChange={(value) => setRole(value as Role)}
            options={ROLE_OPTIONS}
          />
        </Field>
        <Field label="Status" required>
          <SelectMenu
            value={form.status}
            onChange={(value) =>
              update({ status: value as SystemUser["status"] })
            }
            options={STATUS_OPTIONS}
          />
        </Field>
      </div>

      <div className="rounded-2xl border border-manila-dark bg-cream p-5 shadow-card">
        <p className="text-xs font-semibold uppercase tracking-wider text-steel">
          Access
        </p>

        {(form.role === "admin" || form.role === "finance") && (
          <p className="mt-2 text-sm text-steel">
            {ROLE_LABELS[form.role]} accounts have access to all locations — no
            location selection is needed.
          </p>
        )}

        {roleRequiresLocations(form.role) && (
          <>
            <p className="mb-3.5 mt-1.5 text-sm text-steel">
              This account will only see data from the locations selected here.
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
              {locations.map((loc) => (
                <label
                  key={loc.id}
                  className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-manila-dark bg-paper px-3.5 py-2.5 text-sm text-ink transition-colors has-checked:border-rust has-checked:bg-rust-soft has-focus-visible:ring-2 has-focus-visible:ring-rust/30"
                >
                  <input
                    type="checkbox"
                    checked={form.locationIds.includes(loc.id)}
                    onChange={() => toggleLocation(loc.id)}
                    className="peer sr-only"
                  />
                  <span className="flex h-4 w-4 flex-none items-center justify-center rounded-md border border-manila-dark bg-cream text-transparent transition-colors peer-checked:border-rust peer-checked:bg-rust peer-checked:text-cream">
                    <Check className="h-3 w-3" strokeWidth={3} />
                  </span>
                  <span className="truncate">{loc.name}</span>
                </label>
              ))}
            </div>
            {errors.locationIds && (
              <p className="mt-2 text-xs font-medium text-stamp">
                {errors.locationIds}
              </p>
            )}
          </>
        )}

        {form.role === "customer" && (
          <div className="mt-2">
            <p className="mb-2 text-xs text-steel-light">
              Optionally link this login to a customer account.
            </p>
            <SelectMenu
              value={form.customerId ?? ""}
              onChange={(value) => update({ customerId: value || undefined })}
              options={[
                { value: "", label: "No customer assigned" },
                ...customers.map((c) => ({
                  value: c.id,
                  label: c.displayName,
                })),
              ]}
              placeholder="No customer assigned"
            />
          </div>
        )}

        {form.role === "employee" && (
          <div className="mt-2">
            <p className="mb-2 text-xs text-steel-light">
              Employee accounts must link to an existing Crew Member — this
              screen doesn't create one.
            </p>
            <CrewMemberLinkField
              value={form.linkedCrewMemberId}
              onChange={(id) => update({ linkedCrewMemberId: id })}
              excludeUserId={userRecordId}
              invalid={!!errors.linkedCrewMemberId}
            />
            {errors.linkedCrewMemberId && (
              <p className="mt-1 text-xs font-medium text-stamp">
                {errors.linkedCrewMemberId}
              </p>
            )}
          </div>
        )}
      </div>

      <div>
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
