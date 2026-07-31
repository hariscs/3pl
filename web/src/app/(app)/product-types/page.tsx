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
import { type ProductType, UNIT_OF_MEASURE_LABELS } from "@/lib/types";

function workTypeSearch(p: ProductType, query: string): boolean {
  return (
    p.name.toLowerCase().includes(query) ||
    (p.code ?? "").toLowerCase().includes(query)
  );
}

function formatRate(type: ProductType["employeePayType"], rate: number) {
  const suffix = type === "hourly" ? "/hr" : "/unit";
  return `$${rate.toFixed(2)}${suffix}`;
}

export default function WorkTypesPage() {
  const { productTypes, customers, toggleProductTypeArchive } = useAppData();
  const [pending, setPending] = useState<{
    id: string;
    name: string;
    archiving: boolean;
  } | null>(null);

  const customerName = (id: string) =>
    customers.find((c) => c.id === id)?.displayName ?? "—";

  const columns: Column<ProductType>[] = [
    { key: "name", header: "Work Type", accessor: (p) => p.name },
    {
      key: "customer",
      header: "Customer",
      accessor: (p) => customerName(p.customerId),
      filter: "select",
      filterOptions: customers.map((c) => c.displayName),
    },
    {
      key: "unit",
      header: "Unit",
      accessor: (p) => UNIT_OF_MEASURE_LABELS[p.unitOfMeasure],
      filter: "select",
      filterOptions: Object.values(UNIT_OF_MEASURE_LABELS),
    },
    {
      key: "employeePay",
      header: "Employee Pay",
      accessor: (p) => formatRate(p.employeePayType, p.employeePayRate),
    },
    {
      key: "billingRate",
      header: "Billing Rate",
      accessor: (p) => formatRate(p.customerBillingType, p.customerBillingRate),
    },
    {
      key: "status",
      header: "Status",
      accessor: (p) => p.status,
      filter: "select",
      filterOptions: ["active", "inactive", "archived"],
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
            variant={p.status !== "archived" ? "danger" : "secondary"}
            onClick={() =>
              setPending({
                id: p.id,
                name: p.name,
                archiving: p.status !== "archived",
              })
            }
          >
            {p.status !== "archived" ? "Archive" : "Restore"}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <TopBar
        title="Work Types"
        description="Each work type belongs to one customer and drives the pay and billing rates used on its loads."
      />
      <AdminOnly>
        <main className="flex-1 space-y-4 p-6">
          <div className="flex justify-end">
            <Link href="/product-types/new">
              <Button>New work type</Button>
            </Link>
          </div>
          <Card>
            <FilterableTable
              columns={columns}
              rows={productTypes}
              getRowKey={(p) => p.id}
              defaultFilterKeys={["customer"]}
              searchFn={workTypeSearch}
            />
          </Card>
        </main>
      </AdminOnly>

      <ConfirmDialog
        open={pending !== null}
        onClose={() => setPending(null)}
        title={pending?.archiving ? "Archive work type" : "Restore work type"}
        body={
          pending?.archiving
            ? `${pending?.name} will drop off the load entry picker immediately, but past loads keep their billing and pay history.`
            : `${pending?.name} will reappear in the load entry picker.`
        }
        confirmLabel={pending?.archiving ? "Archive" : "Restore"}
        variant={pending?.archiving ? "danger" : "primary"}
        onConfirm={() => pending && toggleProductTypeArchive(pending.id)}
      />
    </>
  );
}
