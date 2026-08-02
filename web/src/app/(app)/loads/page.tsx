"use client";

import { Truck } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
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
  const router = useRouter();
  const {
    loads,
    customers,
    productTypes,
    locations,
    users,
    isLoading,
    isError,
    retry,
  } = useAppData();
  const [customerFilter, setCustomerFilter] = useState("");

  // Deep-linked from Dashboard tiles, e.g. /loads?status=In%20Progress —
  // captured once on mount, matching the value format FilterableTable's
  // own status column already renders (LOAD_STATUS_LABELS), not the raw key.
  const searchParams = useSearchParams();
  const [initialStatus] = useState(() => searchParams.get("status"));
  const initialFilterValues = initialStatus
    ? { status: initialStatus }
    : undefined;

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
      render: (l) => {
        const name = locationName(l.locationId);
        return (
          <span className="block max-w-40 truncate" title={name}>
            {name}
          </span>
        );
      },
    },
    {
      key: "workType",
      header: "Work Type",
      accessor: (l) => workTypeName(l.productTypeId),
      filter: "select",
      filterOptions: workTypeOptions,
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
            onRowClick={(l) => router.push(`/loads/${l.id}`)}
            defaultFilterKeys={["status"]}
            initialFilterValues={initialFilterValues}
            searchFn={searchLoad}
            isLoading={isLoading}
            isError={isError}
            onRetry={retry}
            emptyIcon={Truck}
            emptyTitle="No loads yet"
            emptyDescription="Create a load to start tracking crew time and billing."
            emptyAction={{ label: "New load", href: "/loads/new" }}
          />
        </Card>
      </main>
    </>
  );
}
