"use client";

import Link from "next/link";
import {
  BillingPayoutChart,
  type DayPoint,
  LoadsPerDayChart,
} from "@/components/DashboardCharts";
import { TopBar } from "@/components/TopBar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { StatCard } from "@/components/ui/StatCard";
import { StatusPill } from "@/components/ui/StatusPill";
import { useAppData } from "@/lib/store";
import type { Role } from "@/lib/types";
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
      roles: ["admin", "lead"],
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

  const locationLoads = loads.filter(
    (l) =>
      l.locationId === currentLocationId &&
      l.status !== "void" &&
      l.status !== "archived",
  );
  const activeLoads = locationLoads.filter((l) => l.status === "active");
  const completed = locationLoads.filter((l) => l.status === "complete");
  const activeCustomers = customers.filter(
    (c) => c.status === "active" && c.locationIds.includes(currentLocationId),
  );
  const crew = employees.filter(
    (e) => e.status === "active" && e.locationId === currentLocationId,
  );
  const location = locations.find((l) => l.id === currentLocationId);
  const locationName = location?.name ?? "";

  // Bucket loads into day series (last 7 days present) for the charts.
  const byDay = new Map<string, DayPoint>();
  for (const l of locationLoads) {
    const key = (l.date ?? "").slice(0, 10);
    if (!key) continue;
    const bucket = byDay.get(key) ?? {
      label: key.slice(5),
      loads: 0,
      billed: 0,
      payout: 0,
    };
    bucket.loads += 1;
    bucket.billed += l.billedAmount;
    bucket.payout += l.payoutAmount;
    byDay.set(key, bucket);
  }
  const daily = [...byDay.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-7)
    .map(([, v]) => v);

  const customerName = (id: string) =>
    customers.find((c) => c.id === id)?.displayName ?? "Customer";

  const stats = [
    { label: "Active loads", value: activeLoads.length },
    { label: "Completed", value: completed.length },
    { label: "Crew on site", value: crew.length },
    { label: "Customers", value: activeCustomers.length },
  ];

  return (
    <>
      <TopBar
        title="Dashboard"
        description={`Live snapshot for ${locationName}.`}
      />
      <main className="flex-1 space-y-6 p-6">
        <div className="flex items-center justify-between rounded-2xl border border-manila-dark bg-cream p-5 shadow-card">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-steel">
              Current location
            </p>
            <p className="mt-1 text-lg font-semibold text-ink">
              {locationName || "—"}
            </p>
            <div className="mt-1.5 flex items-center gap-2 text-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-freight" />
              <span className="font-semibold text-freight">On shift</span>
              {location?.region ? (
                <span className="text-steel-light">· {location.region}</span>
              ) : null}
            </div>
          </div>
          <Link href="/loads/new">
            <Button>New load</Button>
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {stats.map((s) => (
            <StatCard key={s.label} label={s.label} value={s.value} />
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card title="Loads per day">
            {daily.length ? <LoadsPerDayChart data={daily} /> : <EmptyChart />}
          </Card>
          <Card title="Billed vs payout">
            {daily.length ? (
              <BillingPayoutChart data={daily} />
            ) : (
              <EmptyChart />
            )}
          </Card>
        </div>

        <section>
          <SectionHeader
            title="Active loads"
            actionLabel="View all"
            href="/loads"
          />
          {activeLoads.length ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {activeLoads.slice(0, 6).map((l) => (
                <div
                  key={l.id}
                  className="rounded-2xl border border-manila-dark bg-cream p-4 shadow-card"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-ink">
                        {customerName(l.customerId)}
                      </p>
                      <p className="mt-0.5 text-sm text-steel">
                        Container {l.containerNumber || "—"}
                      </p>
                    </div>
                    <StatusPill tone="success">In progress</StatusPill>
                  </div>
                  <div className="mt-3 flex items-center gap-4 text-sm text-steel">
                    <span>{l.assignments.length} crew</span>
                    <span>{l.cases} cases</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Card>
              <p className="text-sm text-steel">
                No active loads at this location.
              </p>
            </Card>
          )}
        </section>

        <section>
          <SectionHeader title="Quick actions" />
          <div className="flex flex-wrap gap-3">
            {QUICK_ACTIONS.filter((action) => action.roles.includes(role)).map(
              (action) => (
                <Link key={action.href} href={action.href}>
                  <Button variant={action.variant}>{action.label}</Button>
                </Link>
              ),
            )}
          </div>
        </section>
      </main>
    </>
  );
}

function EmptyChart() {
  return (
    <div className="flex h-55 items-center justify-center text-sm text-steel-light">
      No load data yet.
    </div>
  );
}
