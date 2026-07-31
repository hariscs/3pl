"use client";

import { useMemo } from "react";
import { Field } from "@/components/ui/Field";
import { SelectMenu } from "@/components/ui/SelectMenu";
import { useAppData } from "@/lib/store";

/** The Customer → Location → Work Type cascading trio every Load creation
 * flow needs — shared verbatim between the admin LoadForm and the field
 * wizard's first step so both stay in sync with the same relationship
 * rules (Location and Work Type must both belong to the selected Customer).
 * When `lockLocationId` is set, Location is shown as fixed context text
 * instead of a picker — the field view's location comes from the Lead's
 * active check-in, not a per-load choice. */
export function CustomerLocationWorkTypeFields({
  customerId,
  locationId,
  productTypeId,
  onCustomerChange,
  onLocationChange,
  onWorkTypeChange,
  errors,
  lockLocationId,
}: {
  customerId: string;
  locationId: string;
  productTypeId: string;
  onCustomerChange: (id: string) => void;
  onLocationChange: (id: string) => void;
  onWorkTypeChange: (id: string) => void;
  errors?: {
    customerId?: string;
    locationId?: string;
    productTypeId?: string;
  };
  lockLocationId?: string;
}) {
  const { customers, locations, productTypes } = useAppData();

  const customerOptions = useMemo(() => {
    const active = customers.filter((c) => c.status === "active");
    const current = customers.find((c) => c.id === customerId);
    const list =
      current && !active.some((c) => c.id === current.id)
        ? [...active, current]
        : active;
    return list.map((c) => ({ value: c.id, label: c.displayName }));
  }, [customers, customerId]);

  const availableLocations = useMemo(
    () =>
      locations.filter(
        (l) => l.customerId === customerId && l.status === "active",
      ),
    [locations, customerId],
  );
  const locationOptions = useMemo(() => {
    const current = locations.find((l) => l.id === locationId);
    const list =
      current && !availableLocations.some((l) => l.id === current.id)
        ? [...availableLocations, current]
        : availableLocations;
    return list.map((l) => ({
      value: l.id,
      label: [l.name, l.code, l.city].filter(Boolean).join(" · "),
    }));
  }, [availableLocations, locations, locationId]);

  const availableWorkTypes = useMemo(
    () =>
      productTypes.filter(
        (p) => p.customerId === customerId && p.status === "active",
      ),
    [productTypes, customerId],
  );
  const workTypeOptions = useMemo(() => {
    const current = productTypes.find((p) => p.id === productTypeId);
    const list =
      current && !availableWorkTypes.some((p) => p.id === current.id)
        ? [...availableWorkTypes, current]
        : availableWorkTypes;
    return list.map((p) => ({ value: p.id, label: p.name }));
  }, [availableWorkTypes, productTypes, productTypeId]);

  const lockedLocation = lockLocationId
    ? locations.find((l) => l.id === lockLocationId)
    : undefined;

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Customer" required>
        <SelectMenu
          value={customerId}
          onChange={onCustomerChange}
          options={customerOptions}
          placeholder="Select a customer…"
          invalid={!!errors?.customerId}
        />
        {errors?.customerId && (
          <p className="mt-1 text-xs font-medium text-stamp">
            {errors.customerId}
          </p>
        )}
      </Field>

      {lockLocationId ? (
        <Field label="Location">
          <p className="text-sm text-steel">
            {lockedLocation?.name ?? "—"}
            {lockedLocation?.code ? ` · ${lockedLocation.code}` : ""}
          </p>
        </Field>
      ) : (
        <Field
          label="Location"
          required
          hint={
            customerId && availableLocations.length === 0
              ? "This customer has no active locations yet."
              : undefined
          }
        >
          <SelectMenu
            value={locationId}
            onChange={onLocationChange}
            options={locationOptions}
            placeholder={
              customerId ? "Select a location…" : "Choose a customer first"
            }
            invalid={!!errors?.locationId}
          />
          {errors?.locationId && (
            <p className="mt-1 text-xs font-medium text-stamp">
              {errors.locationId}
            </p>
          )}
        </Field>
      )}

      <Field
        label="Work Type"
        required
        hint={
          customerId && availableWorkTypes.length === 0
            ? "This customer has no active work types yet."
            : undefined
        }
        className="sm:col-span-2"
      >
        <SelectMenu
          value={productTypeId}
          onChange={onWorkTypeChange}
          options={workTypeOptions}
          placeholder={
            customerId ? "Select a work type…" : "Choose a customer first"
          }
          invalid={!!errors?.productTypeId}
        />
        {errors?.productTypeId && (
          <p className="mt-1 text-xs font-medium text-stamp">
            {errors.productTypeId}
          </p>
        )}
      </Field>
    </div>
  );
}
