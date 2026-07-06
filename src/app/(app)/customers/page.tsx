"use client";

import Link from "next/link";
import { useState } from "react";
import { type Column, FilterableTable } from "@/components/FilterableTable";
import { StampBadge } from "@/components/StampBadge";
import { TopBar } from "@/components/TopBar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useAppData } from "@/lib/store";
import type { Customer } from "@/lib/types";

export default function CustomersPage() {
  const { customers, locations, toggleCustomerArchive } = useAppData();
  const [pending, setPending] = useState<{
    id: string;
    name: string;
    archiving: boolean;
  } | null>(null);

  const locationNames = (ids: string[]) =>
    ids
      .map((id) => locations.find((l) => l.id === id)?.name)
      .filter(Boolean)
      .join(", ");

  const columns: Column<Customer>[] = [
    { key: "displayName", header: "Display Name", accessor: (c) => c.displayName },
    {
      key: "legalName",
      header: "Legal Name",
      accessor: (c) => c.legalCompanyName,
    },
    {
      key: "contact",
      header: "Contact",
      accessor: (c) => `${c.contactName} ${c.email}`,
      render: (c) => (
        <>
          {c.contactName}
          <br />
          <span className="text-xs text-steel">{c.email}</span>
        </>
      ),
    },
    {
      key: "locations",
      header: "Locations",
      accessor: (c) => locationNames(c.locationIds) || "—",
    },
    {
      key: "status",
      header: "Status",
      accessor: (c) => c.status,
      filter: "select",
      filterOptions: ["active", "archived"],
      render: (c) => <StampBadge status={c.status} />,
    },
    {
      key: "actions",
      header: "Actions",
      accessor: () => "",
      filterable: false,
      sortable: false,
      align: "right",
      render: (c) => (
        <div className="flex justify-end gap-2">
          <Link href={`/customers/${c.id}`}>
            <Button variant="secondary">Edit</Button>
          </Link>
          <Button
            variant={c.status === "active" ? "danger" : "secondary"}
            onClick={() =>
              setPending({
                id: c.id,
                name: c.displayName,
                archiving: c.status === "active",
              })
            }
          >
            {c.status === "active" ? "Archive" : "Restore"}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <TopBar
        title="Customers"
        description="Archive a customer instead of deleting it — their load and billing history stays in reports."
      />
      <main className="flex-1 p-6">
        <div className="mb-4 flex justify-end">
          <Link href="/customers/new">
            <Button>New customer</Button>
          </Link>
        </div>
        <Card>
          <FilterableTable
            columns={columns}
            rows={customers}
            getRowKey={(c) => c.id}
            defaultFilterKeys={["status"]}
          />
        </Card>
      </main>

      <ConfirmDialog
        open={pending !== null}
        onClose={() => setPending(null)}
        title={pending?.archiving ? "Archive customer" : "Restore customer"}
        body={
          pending?.archiving
            ? `${pending?.name} will be hidden from active pickers, but every past load and invoice stays in your reports.`
            : `${pending?.name} will reappear in customer pickers across the app.`
        }
        confirmLabel={pending?.archiving ? "Archive" : "Restore"}
        variant={pending?.archiving ? "danger" : "primary"}
        onConfirm={() => pending && toggleCustomerArchive(pending.id)}
      />
    </>
  );
}
