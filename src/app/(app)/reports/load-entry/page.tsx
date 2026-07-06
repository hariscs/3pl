"use client";

import { useMemo } from "react";
import { AdminOnly } from "@/components/AdminOnly";
import { type Column, FilterableTable } from "@/components/FilterableTable";
import { StampBadge } from "@/components/StampBadge";
import { TopBar } from "@/components/TopBar";
import { Card } from "@/components/ui/Card";
import { downloadCsv } from "@/lib/csv";
import { useAppData } from "@/lib/store";
import type { Load } from "@/lib/types";

type Row = {
  load: Load;
  customerName: string;
  locationName: string;
  productTypeName: string;
  employeeCount: number;
};

export default function LoadEntryReportPage() {
  const { loads, customers, productTypes, locations, employees } = useAppData();

  const rows: Row[] = useMemo(
    () =>
      loads.map((load) => ({
        load,
        customerName:
          customers.find((c) => c.id === load.customerId)?.displayName ?? "—",
        locationName:
          locations.find((l) => l.id === load.locationId)?.name ?? "—",
        productTypeName:
          productTypes.find((p) => p.id === load.productTypeId)?.name ?? "—",
        employeeCount: load.assignments.length,
      })),
    [loads, customers, productTypes, locations],
  );

  const columns: Column<Row>[] = [
    { key: "ticket", header: "Ticket #", accessor: (r) => r.load.ticketNumber },
    { key: "date", header: "Date", accessor: (r) => r.load.date },
    {
      key: "customer",
      header: "Customer",
      accessor: (r) => r.customerName,
      filter: "select",
      filterOptions: [...new Set(rows.map((r) => r.customerName))],
    },
    {
      key: "location",
      header: "Location",
      accessor: (r) => r.locationName,
      filter: "select",
      filterOptions: [...new Set(rows.map((r) => r.locationName))],
    },
    {
      key: "product",
      header: "Product Type",
      accessor: (r) => r.productTypeName,
    },
    { key: "employees", header: "Employees", accessor: (r) => r.employeeCount },
    {
      key: "cases",
      header: "Cases",
      accessor: (r) => r.load.cases,
      align: "right",
    },
    {
      key: "sorts",
      header: "Sorts",
      accessor: (r) => r.load.sorts,
      align: "right",
    },
    {
      key: "billed",
      header: "Billed",
      accessor: (r) => r.load.billedAmount,
      align: "right",
      render: (r) =>
        r.load.status === "complete"
          ? `$${r.load.billedAmount.toFixed(2)}`
          : "—",
    },
    {
      key: "payout",
      header: "Payout",
      accessor: (r) => r.load.payoutAmount,
      align: "right",
      render: (r) =>
        r.load.status === "complete"
          ? `$${r.load.payoutAmount.toFixed(2)}`
          : "—",
    },
    {
      key: "status",
      header: "Status",
      accessor: (r) => r.load.status,
      filter: "select",
      filterOptions: ["active", "complete", "void", "archived"],
      render: (r) => <StampBadge status={r.load.status} />,
    },
  ];

  return (
    <>
      <TopBar
        title="Load Entry Report"
        description="Filter any column below, Excel-style, instead of one generic search box."
      />
      <AdminOnly>
        <main className="flex-1 p-6">
          <Card>
            <FilterableTable
              columns={columns}
              rows={rows}
              getRowKey={(r) => r.load.id}
              defaultFilterKeys={["customer", "status"]}
              onExport={(filteredRows) =>
                downloadCsv(
                  "load-entry-report.csv",
                  columns.map((c) => ({
                    header: c.header,
                    accessor: (r: Row) => c.accessor(r),
                  })),
                  filteredRows,
                )
              }
            />
          </Card>
          <p className="mt-4 text-xs text-steel-light">
            Employees count is shown separately from the {employees.length}{" "}
            total registered employees to make thin staffing easy to spot.
          </p>
        </main>
      </AdminOnly>
    </>
  );
}
