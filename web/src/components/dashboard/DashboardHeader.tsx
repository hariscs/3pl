"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ActionsMenu } from "@/components/ui/ActionsMenu";
import { Button } from "@/components/ui/Button";
import { SelectMenu } from "@/components/ui/SelectMenu";
import {
  DATE_RANGE_KEYS,
  DATE_RANGE_LABELS,
  type DashboardDateRangeKey,
  type DashboardFilters,
} from "@/lib/dashboard";
import type { Role } from "@/lib/types";

// Mirrors each target page's real access control (AdminOnly vs. open) so
// this menu never links somewhere a role would immediately be gated out of.
const SECONDARY_ACTIONS: { label: string; href: string; roles: Role[] }[] = [
  { label: "Add Crew Member", href: "/crew/new", roles: ["admin"] },
  { label: "Add Customer", href: "/customers/new", roles: ["admin"] },
  { label: "Add Location", href: "/locations/new", roles: ["admin"] },
  { label: "Add Work Type", href: "/product-types/new", roles: ["admin"] },
  {
    label: "Review Payroll",
    href: "/finance/payroll",
    roles: ["admin", "finance"],
  },
  {
    label: "Open Customer Billing",
    href: "/finance/customer-billing",
    roles: ["admin", "finance"],
  },
  { label: "View Invoices", href: "/finance/invoices", roles: ["admin"] },
];

export function DashboardHeader({
  filters,
  onDateRangeChange,
  onCustomerChange,
  onLocationChange,
  customerOptions,
  locationOptions,
  role,
}: {
  filters: DashboardFilters;
  onDateRangeChange: (key: DashboardDateRangeKey) => void;
  onCustomerChange: (id: string) => void;
  onLocationChange: (id: string) => void;
  customerOptions: { value: string; label: string }[];
  locationOptions: { value: string; label: string }[];
  role: Role;
}) {
  const router = useRouter();
  const secondaryActions = SECONDARY_ACTIONS.filter((a) =>
    a.roles.includes(role),
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-steel">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        </div>
        <div className="flex flex-none flex-wrap items-center gap-2">
          <Link href="/loads/new">
            <Button>Create Load</Button>
          </Link>
          {secondaryActions.length > 0 && (
            <ActionsMenu
              label="More actions"
              actions={secondaryActions.map((a) => ({
                label: a.label,
                onSelect: () => router.push(a.href),
              }))}
            />
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-1 rounded-xl border border-manila-dark bg-cream p-1">
          {DATE_RANGE_KEYS.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => onDateRangeChange(key)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                filters.dateRange === key
                  ? "bg-rust text-cream"
                  : "text-steel hover:bg-paper-dim hover:text-ink"
              }`}
            >
              {DATE_RANGE_LABELS[key]}
            </button>
          ))}
        </div>
        <SelectMenu
          className="w-48"
          value={filters.customerId}
          onChange={onCustomerChange}
          options={[{ value: "", label: "All customers" }, ...customerOptions]}
          placeholder="All customers"
        />
        <SelectMenu
          className="w-48"
          value={filters.locationId}
          onChange={onLocationChange}
          options={[{ value: "", label: "All locations" }, ...locationOptions]}
          placeholder="All locations"
        />
      </div>
    </div>
  );
}
