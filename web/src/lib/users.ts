import type { Location, Role, SystemUser } from "@/lib/types";

export const ROLE_LABELS = {
  admin: "Admin",
  manager: "Manager",
  lead: "Lead",
  finance: "Finance",
  customer: "Customer",
  employee: "Employee",
} as const;
export const ROLE_KEYS = Object.keys(ROLE_LABELS) as Role[];

/** Manager/Lead are scoped to one or more selected locations. */
export function roleRequiresLocations(role: Role): boolean {
  return role === "manager" || role === "lead";
}

/** Admin/Finance are unrestricted — every location, no selection needed. */
export function roleIsLocationUnrestricted(role: Role): boolean {
  return role === "admin" || role === "finance";
}

export function getUserDisplayName(
  user: Pick<SystemUser, "firstName" | "lastName">,
): string {
  return `${user.firstName} ${user.lastName}`.trim();
}

/** Human-readable summary of what a user's account can see, for the user
 * list's Access column — derived, never stored. */
export function describeUserAccess(
  user: SystemUser,
  locations: Pick<Location, "id" | "name">[],
  customerName?: string,
): string {
  if (roleIsLocationUnrestricted(user.role)) return "All locations";
  if (roleRequiresLocations(user.role)) {
    if (user.locationIds.length === 0) return "No locations assigned";
    const names = user.locationIds
      .map((id) => locations.find((l) => l.id === id)?.name)
      .filter((name): name is string => !!name);
    return names.length > 0 ? names.join(", ") : "No locations assigned";
  }
  if (user.role === "customer") {
    return customerName ? `Customer: ${customerName}` : "No customer assigned";
  }
  // employee
  return "Linked to Crew Member";
}
