"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { type Column, FilterableTable } from "@/components/FilterableTable";
import { LoadStatusPill } from "@/components/loads/LoadStatusPill";
import { TopBar } from "@/components/TopBar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { SelectMenu } from "@/components/ui/SelectMenu";
import { formatLoadNumber, getBillingQuantity } from "@/lib/loads";
import { useAppData } from "@/lib/store";
import {
  LOAD_STATUS_LABELS,
  type Load,
  UNIT_OF_MEASURE_LABELS,
} from "@/lib/types";
import { getUserDisplayName } from "@/lib/users";

export default function LoadsPage() {
  const { loads, customers, productTypes, locations, users, isLoading } =
    useAppData();
  const [customerFilter, setCustomerFilter] = useState("");

  const rows = customerFilter
    ? loads.filter((l) => l.customerId === customerFilter)
    : loads;

  const locationOptions = useMemo(
    () =>
      locations
        .filter((l) => !customerFilter || l.customerId === customerFilter)
        .map((l) => l.name),
    [locations, customerFilter],
  );
  const workTypeOptions = useMemo(
    () =>
      productTypes
        .filter((p) => !customerFilter || p.customerId === customerFilter)
        .map((p) => p.name),
    [productTypes, customerFilter],
  );

  function customerName(id: string) {
    return customers.find((c) => c.id === id)?.displayName ?? "—";
  }
  function locationName(id: string) {
    return locations.find((l) => l.id === id)?.name ?? "—";
  }
  function workTypeName(id: string) {
    return productTypes.find((p) => p.id === id)?.name ?? "—";
  }
  function supervisorName(id: string | null) {
    if (!id) return "—";
    const user = users.find((u) => u.id === id);
    return user ? getUserDisplayName(user) : "—";
  }

  function primaryQuantity(load: Load) {
    const workType = productTypes.find((p) => p.id === load.productTypeId);
    if (!workType || workType.unitOfMeasure === "hour") return "—";
    const qty = getBillingQuantity(load, workType.unitOfMeasure);
    return `${qty} ${UNIT_OF_MEASURE_LABELS[workType.unitOfMeasure]}${qty === 1 ? "" : "s"}`;
  }

  function searchLoad(load: Load, query: string): boolean {
    return (
      formatLoadNumber(load.ticketNumber).toLowerCase().includes(query) ||
      load.containerNumber.toLowerCase().includes(query) ||
      load.trailerNumber.toLowerCase().includes(query) ||
      customerName(load.customerId).toLowerCase().includes(query) ||
      locationName(load.locationId).toLowerCase().includes(query) ||
      workTypeName(load.productTypeId).toLowerCase().includes(query) ||
      supervisorName(load.supervisorUserId).toLowerCase().includes(query)
    );
  }

  const columns: Column<Load>[] = [
    {
      key: "loadNumber",
      header: "Load Number",
      accessor: (l) => formatLoadNumber(l.ticketNumber),
    },
    {
      key: "customer",
      header: "Customer",
      accessor: (l) => customerName(l.customerId),
    },
    {
      key: "location",
      header: "Location",
      accessor: (l) => locationName(l.locationId),
      filter: "select",
      filterOptions: locationOptions,
    },
    {
      key: "workType",
      header: "Work Type",
      accessor: (l) => workTypeName(l.productTypeId),
      filter: "select",
      filterOptions: workTypeOptions,
    },
    {
      key: "container",
      header: "Container",
      accessor: (l) => l.containerNumber || "—",
    },
    {
      key: "date",
      header: "Date",
      accessor: (l) => l.scheduledDate ?? l.date,
    },
    {
      key: "crewCount",
      header: "Crew",
      accessor: (l) =>
        l.assignments.filter((a) => a.status !== "removed").length,
      align: "right",
    },
    {
      key: "quantity",
      header: "Production Qty",
      accessor: (l) => primaryQuantity(l),
      filterable: false,
    },
    {
      key: "supervisor",
      header: "Supervisor",
      accessor: (l) => supervisorName(l.supervisorUserId),
      filter: "select",
      filterOptions: [
        ...new Set(loads.map((l) => supervisorName(l.supervisorUserId))),
      ].filter((n) => n !== "—"),
    },
    {
      key: "status",
      header: "Status",
      accessor: (l) => LOAD_STATUS_LABELS[l.status],
      filter: "select",
      filterOptions: Object.values(LOAD_STATUS_LABELS),
      render: (l) => <LoadStatusPill status={l.status} />,
    },
    {
      key: "actions",
      header: "Actions",
      accessor: () => "",
      filterable: false,
      sortable: false,
      align: "right",
      render: (l) => (
        <Link href={`/loads/${l.id}`}>
          <Button variant="secondary">Open</Button>
        </Link>
      ),
    },
  ];

  return (
    <>
      <TopBar
        title="Loads"
        description="The operational record connecting Customer, Location, Work Type, crew time, and billing."
      />
      <main className="flex-1 space-y-4 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-steel">
              Customer
            </span>
            <SelectMenu
              className="w-56"
              value={customerFilter}
              onChange={setCustomerFilter}
              options={[
                { value: "", label: "All customers" },
                ...customers.map((c) => ({
                  value: c.id,
                  label: c.displayName,
                })),
              ]}
              placeholder="All customers"
            />
          </div>
          <Link href="/loads/new">
            <Button>New Load</Button>
          </Link>
        </div>
        <Card>
          <FilterableTable
            columns={columns}
            rows={rows}
            getRowKey={(l) => l.id}
            defaultFilterKeys={["status"]}
            searchFn={searchLoad}
            emptyMessage={
              isLoading ? "Loading…" : "No loads yet. Create your first one."
            }
          />
        </Card>
      </main>
    </>
  );
}
