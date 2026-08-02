"use client";

import { Package } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AdminOnly } from "@/components/AdminOnly";
import { type Column, FilterableTable } from "@/components/FilterableTable";
import { StampBadge } from "@/components/StampBadge";
import { TopBar } from "@/components/TopBar";
import { ActionsMenu } from "@/components/ui/ActionsMenu";
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
  const router = useRouter();
  const {
    productTypes,
    customers,
    toggleProductTypeArchive,
    isLoading,
    isError,
    retry,
  } = useAppData();
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
      header: "",
      accessor: () => "",
      filterable: false,
      sortable: false,
      render: (p) => (
        <ActionsMenu
          label={`${p.name} actions`}
          actions={[
            {
              label: "Edit",
              onSelect: () => router.push(`/product-types/${p.id}`),
            },
            {
              label: p.status !== "archived" ? "Archive" : "Restore",
              danger: p.status !== "archived",
              onSelect: () =>
                setPending({
                  id: p.id,
                  name: p.name,
                  archiving: p.status !== "archived",
                }),
            },
          ]}
        />
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
              isLoading={isLoading}
              isError={isError}
              onRetry={retry}
              emptyIcon={Package}
              emptyTitle="No work types yet"
              emptyDescription="Work types define the pay and billing rates a customer's loads use."
              emptyAction={{
                label: "New work type",
                href: "/product-types/new",
              }}
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
        onConfirm={() =>
          pending ? toggleProductTypeArchive(pending.id) : undefined
        }
      />
    </>
  );
}
