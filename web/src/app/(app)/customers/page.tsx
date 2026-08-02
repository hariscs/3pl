"use client";

import { Building2 } from "lucide-react";
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
import type { Customer } from "@/lib/types";

function customerSearch(c: Customer, query: string): boolean {
  return (
    c.displayName.toLowerCase().includes(query) ||
    (c.code ?? "").toLowerCase().includes(query) ||
    c.contactName.toLowerCase().includes(query) ||
    c.email.toLowerCase().includes(query)
  );
}

export default function CustomersPage() {
  const router = useRouter();
  const {
    customers,
    locations,
    toggleCustomerArchive,
    isLoading,
    isError,
    retry,
  } = useAppData();
  const [pending, setPending] = useState<{
    id: string;
    name: string;
    archiving: boolean;
  } | null>(null);

  const locationCount = (customerId: string) =>
    locations.filter((l) => l.customerId === customerId).length;

  const industryOptions = [
    ...new Set(
      customers.map((c) => c.industry).filter((i): i is string => !!i),
    ),
  ].sort();

  const columns: Column<Customer>[] = [
    {
      key: "displayName",
      header: "Customer Name",
      accessor: (c) => c.displayName,
    },
    {
      key: "contact",
      header: "Primary Contact",
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
      key: "billingEmail",
      header: "Billing Email",
      accessor: (c) => c.billingEmail ?? "—",
    },
    {
      key: "industry",
      header: "Industry",
      accessor: (c) => c.industry ?? "—",
      filter: "select",
      filterOptions: industryOptions,
    },
    {
      key: "locationCount",
      header: "Locations",
      accessor: (c) => locationCount(c.id),
      align: "right",
    },
    {
      key: "status",
      header: "Status",
      accessor: (c) => c.status,
      filter: "select",
      filterOptions: ["active", "inactive", "archived"],
      render: (c) => <StampBadge status={c.status} />,
    },
    {
      key: "actions",
      header: "",
      accessor: () => "",
      filterable: false,
      sortable: false,
      render: (c) => (
        <ActionsMenu
          label={`${c.displayName} actions`}
          actions={[
            {
              label: "Edit",
              onSelect: () => router.push(`/customers/${c.id}`),
            },
            {
              label: c.status !== "archived" ? "Archive" : "Restore",
              danger: c.status !== "archived",
              onSelect: () =>
                setPending({
                  id: c.id,
                  name: c.displayName,
                  archiving: c.status !== "archived",
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
        title="Customers"
        description="Archive a customer instead of deleting it — their load and billing history stays in reports."
      />
      <AdminOnly>
        <main className="flex-1 space-y-4 p-6">
          <div className="flex justify-end">
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
              searchFn={customerSearch}
              isLoading={isLoading}
              isError={isError}
              onRetry={retry}
              emptyIcon={Building2}
              emptyTitle="No customers yet"
              emptyDescription="Add your first customer to start creating locations, work types, and loads for them."
              emptyAction={{ label: "New customer", href: "/customers/new" }}
            />
          </Card>
        </main>
      </AdminOnly>

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
        onConfirm={() =>
          pending ? toggleCustomerArchive(pending.id) : undefined
        }
      />
    </>
  );
}
