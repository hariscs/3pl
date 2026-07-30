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
import type { ProductType } from "@/lib/types";

export default function ProductTypesPage() {
  const { productTypes, customers, locations, toggleProductTypeArchive } =
    useAppData();
  const [pending, setPending] = useState<{
    id: string;
    name: string;
    archiving: boolean;
  } | null>(null);

  const customerName = (id: string) =>
    customers.find((c) => c.id === id)?.displayName ?? "—";
  const locationName = (id: string) =>
    locations.find((l) => l.id === id)?.name ?? "—";

  const columns: Column<ProductType>[] = [
    { key: "name", header: "Name", accessor: (p) => p.name },
    {
      key: "customer",
      header: "Customer",
      accessor: (p) => customerName(p.customerId),
      filter: "select",
      filterOptions: customers.map((c) => c.displayName),
    },
    {
      key: "location",
      header: "Location",
      accessor: (p) => locationName(p.locationId),
      filter: "select",
      filterOptions: locations.map((l) => l.name),
    },
    {
      key: "units",
      header: "Units Billed",
      accessor: (p) => p.rateLines.map((l) => l.unit).join(", "),
      render: (p) => (
        <span className="block max-w-64 truncate">
          {p.rateLines.map((l) => l.unit).join(", ")}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      accessor: (p) => p.status,
      filter: "select",
      filterOptions: ["active", "archived"],
      render: (p) => <StampBadge status={p.status} />,
    },
    {
      key: "actions",
      header: "Actions",
      accessor: () => "",
      filterable: false,
      sortable: false,
      align: "right",
      render: (p) => (
        <div className="flex justify-end gap-2">
          <Link href={`/product-types/${p.id}`}>
            <Button variant="secondary">Edit</Button>
          </Link>
          <Button
            variant={p.status === "active" ? "danger" : "secondary"}
            onClick={() =>
              setPending({
                id: p.id,
                name: p.name,
                archiving: p.status === "active",
              })
            }
          >
            {p.status === "active" ? "Archive" : "Restore"}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <TopBar
        title="Product Types"
        description="Each product type belongs to one customer and one location, so load entry only shows what's relevant."
      />
      <AdminOnly>
        <main className="flex-1 space-y-4 p-6">
          <div className="flex justify-end">
            <Link href="/product-types/new">
              <Button>New product type</Button>
            </Link>
          </div>
          <Card>
            <FilterableTable
              columns={columns}
              rows={productTypes}
              getRowKey={(p) => p.id}
              defaultFilterKeys={["customer"]}
            />
          </Card>
        </main>
      </AdminOnly>

      <ConfirmDialog
        open={pending !== null}
        onClose={() => setPending(null)}
        title={
          pending?.archiving ? "Archive product type" : "Restore product type"
        }
        body={
          pending?.archiving
            ? `${pending?.name} will drop off the load entry picker immediately.`
            : `${pending?.name} will reappear in the load entry picker.`
        }
        confirmLabel={pending?.archiving ? "Archive" : "Restore"}
        variant={pending?.archiving ? "danger" : "primary"}
        onConfirm={() => pending && toggleProductTypeArchive(pending.id)}
      />
    </>
  );
}
