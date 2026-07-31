import type { Load, Role, SystemUser, UnitOfMeasure } from "@/lib/types";
import { roleIsLocationUnrestricted, roleRequiresLocations } from "@/lib/users";

const LOAD_NUMBER_BASE = 1000;

/** Human-readable, unique, predictable — the only load reference ever shown
 * to users. The internal ticketNumber sequence stays the source of truth. */
export function formatLoadNumber(ticketNumber: number): string {
  return `LD-${LOAD_NUMBER_BASE + ticketNumber}`;
}

/** This app has no distinct "Supervisor" role — Admin/Manager/Lead stand in
 * for it, matching every other place operational authority is checked. */
export function isEligibleSupervisorRole(role: Role): boolean {
  return role === "admin" || role === "manager" || role === "lead";
}

/** A Supervisor must be active, hold an eligible role, and either be
 * location-unrestricted (admin) or have access to the Load's location
 * (manager/lead) — reuses the same helpers User location-access already
 * relies on. */
export function isEligibleSupervisor(
  user: Pick<SystemUser, "role" | "status" | "locationIds">,
  locationId: string,
): boolean {
  if (user.status !== "active") return false;
  if (!isEligibleSupervisorRole(user.role)) return false;
  if (roleIsLocationUnrestricted(user.role)) return true;
  if (roleRequiresLocations(user.role)) {
    return user.locationIds.includes(locationId);
  }
  return false;
}

/** Maps a Work Type's Unit of Measure to the Load's own quantity field.
 * Never consulted for hourly pay/billing types — worked hours drive those
 * instead (see load-financials.ts). */
export function getBillingQuantity(
  load: Pick<Load, "cases" | "palletCount" | "pieceCount" | "weight">,
  unit: UnitOfMeasure,
): number {
  switch (unit) {
    case "case":
      return load.cases;
    case "pallet":
      return load.palletCount ?? 0;
    case "piece":
      return load.pieceCount ?? 0;
    case "pound":
    case "kilogram":
    case "ton":
      return load.weight;
    case "container":
      return 1;
    case "hour":
      return 0;
  }
}
