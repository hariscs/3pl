"use client";

import Link from "next/link";
import { useState } from "react";
import { AdminOnly } from "@/components/AdminOnly";
import { type Column, FilterableTable } from "@/components/FilterableTable";
import { StampBadge } from "@/components/StampBadge";
import { TopBar } from "@/components/TopBar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useAppData } from "@/lib/store";
import type { Employee } from "@/lib/types";

export default function EmployeesPage() {
  const { employees, locations, toggleEmployeeArchive } = useAppData();
  const [pending, setPending] = useState<{
    id: string;
    name: string;
    archiving: boolean;
  } | null>(null);

  const locationName = (id: string) =>
    locations.find((l) => l.id === id)?.name ?? "—";

  const columns: Column<Employee>[] = [
    { key: "name", header: "Name", accessor: (e) => e.name },
    {
      key: "contact",
      header: "Contact",
      accessor: (e) => `${e.email} ${e.phone}`,
      render: (e) => (
        <>
          {e.email}
          <br />
          <span className="text-xs text-steel">{e.phone}</span>
        </>
      ),
    },
    { key: "address", header: "Address", accessor: (e) => e.address || "—" },
    {
      key: "location",
      header: "Location",
      accessor: (e) => locationName(e.locationId),
      filter: "select",
      filterOptions: locations.map((l) => l.name),
    },
    {
      key: "hourlyRate",
      header: "Hourly Rate",
      accessor: (e) => e.hourlyRate,
      align: "right",
      render: (e) => `$${e.hourlyRate.toFixed(2)}`,
    },
    {
      key: "status",
      header: "Status",
      accessor: (e) => e.status,
      filter: "select",
      filterOptions: ["active", "archived"],
      render: (e) => <StampBadge status={e.status} />,
    },
    {
      key: "actions",
      header: "Actions",
      accessor: () => "",
      filterable: false,
      sortable: false,
      align: "right",
      render: (e) => (
        <div className="flex justify-end gap-2">
          <Link href={`/employees/${e.id}`}>
            <Button variant="secondary">Edit</Button>
          </Link>
          <Button
            variant={e.status === "active" ? "danger" : "secondary"}
            onClick={() =>
              setPending({
                id: e.id,
                name: e.name,
                archiving: e.status === "active",
              })
            }
          >
            {e.status === "active" ? "Archive" : "Restore"}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <TopBar
        title="Employees"
        description="Archive an employee to remove them from load pickers without losing their payout history."
      />
      <AdminOnly>
        <main className="flex-1 p-6">
          <div className="mb-4 flex justify-end">
            <Link href="/employees/new">
              <Button>New employee</Button>
            </Link>
          </div>
          <Card>
            <FilterableTable
              columns={columns}
              rows={employees}
              getRowKey={(e) => e.id}
              defaultFilterKeys={["status"]}
            />
          </Card>
        </main>
      </AdminOnly>

      <ConfirmDialog
        open={pending !== null}
        onClose={() => setPending(null)}
        title={pending?.archiving ? "Archive employee" : "Restore employee"}
        body={
          pending?.archiving
            ? `${pending?.name} will drop out of the load employee picker, but past payout records stay intact.`
            : `${pending?.name} will reappear in the load employee picker.`
        }
        confirmLabel={pending?.archiving ? "Archive" : "Restore"}
        variant={pending?.archiving ? "danger" : "primary"}
        onConfirm={() => pending && toggleEmployeeArchive(pending.id)}
      />
    </>
  );
}
