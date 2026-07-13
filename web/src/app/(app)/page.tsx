"use client";

import Link from "next/link";
import { TopBar } from "@/components/TopBar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useAppData } from "@/lib/store";
import type { Role } from "@/lib/types";

// Quick actions are filtered to the roles that can actually use the target page,
// so nobody sees a button that just leads to an "Admin only" wall.
const QUICK_ACTIONS: Array<{
  href: string;
  label: string;
  variant: "primary" | "secondary";
  roles: Role[];
}> = [
  {
    href: "/loads/new",
    label: "Enter a load",
    variant: "primary",
    roles: ["admin", "lead"],
  },
  {
    href: "/loads",
    label: "View loads",
    variant: "secondary",
    roles: ["admin", "lead", "customer"],
  },
  {
    href: "/reports/invoice",
    label: "Run invoice report",
    variant: "secondary",
    roles: ["admin"],
  },
  {
    href: "/customers",
    label: "Manage customers",
    variant: "secondary",
    roles: ["admin"],
  },
];

export default function DashboardPage() {
  const { loads, customers, employees, currentLocationId, locations, role } =
    useAppData();

  const locationLoads = loads.filter((l) => l.locationId === currentLocationId);
  const activeLoads = locationLoads.filter((l) => l.status === "active");
  const completeToday = locationLoads.filter((l) => l.status === "complete");
  const activeCustomers = customers.filter(
    (c) => c.status === "active" && c.locationIds.includes(currentLocationId),
  );
  const activeEmployees = employees.filter(
    (e) => e.status === "active" && e.locationId === currentLocationId,
  );
  const locationName =
    locations.find((l) => l.id === currentLocationId)?.name ?? "";

  const stats = [
    { label: "Active loads", value: activeLoads.length },
    { label: "Completed loads", value: completeToday.length },
    { label: "Active customers", value: activeCustomers.length },
    { label: "Active employees", value: activeEmployees.length },
  ];

  return (
    <>
      <TopBar
        title="Dashboard"
        description={`Snapshot for ${locationName}. Switch locations at right to see a different site.`}
      />
      <main className="flex-1 p-6">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {stats.map((s) => (
            <Card key={s.label} className="text-center">
              <p className="font-tick text-3xl font-semibold text-ink">
                {s.value}
              </p>
              <p className="mt-1 text-xs uppercase tracking-wide text-steel">
                {s.label}
              </p>
            </Card>
          ))}
        </div>

        <Card title="Quick actions" className="mt-6">
          <div className="flex flex-wrap gap-3">
            {QUICK_ACTIONS.filter((action) => action.roles.includes(role)).map(
              (action) => (
                <Link key={action.href} href={action.href}>
                  <Button variant={action.variant}>{action.label}</Button>
                </Link>
              ),
            )}
          </div>
        </Card>
      </main>
    </>
  );
}
