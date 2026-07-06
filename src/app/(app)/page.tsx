"use client";

import Link from "next/link";
import { TopBar } from "@/components/TopBar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useAppData } from "@/lib/store";

export default function DashboardPage() {
  const { loads, customers, employees, currentLocationId, locations } =
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
            <Link href="/loads/new">
              <Button>Enter a load</Button>
            </Link>
            <Link href="/loads">
              <Button variant="secondary">View loads</Button>
            </Link>
            <Link href="/reports/invoice">
              <Button variant="secondary">Run invoice report</Button>
            </Link>
            <Link href="/customers">
              <Button variant="secondary">Manage customers</Button>
            </Link>
          </div>
        </Card>
      </main>
    </>
  );
}
