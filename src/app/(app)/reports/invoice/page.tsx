"use client";

import { useMemo } from "react";
import { type Column, FilterableTable } from "@/components/FilterableTable";
import { TopBar } from "@/components/TopBar";
import { Card } from "@/components/ui/Card";
import { downloadCsv } from "@/lib/csv";
import { useAppData } from "@/lib/store";
import type { Load } from "@/lib/types";

type Row = {
  load: Load;
  customerName: string;
  locationName: string;
};

export default function InvoiceReportPage() {
  const { loads, customers, locations } = useAppData();

  const rows: Row[] = useMemo(
    () =>
      loads
        .filter((load) => load.status === "complete")
        .map((load) => ({
          load,
          customerName:
            customers.find((c) => c.id === load.customerId)?.displayName ?? "—",
          locationName:
            locations.find((l) => l.id === load.locationId)?.name ?? "—",
        })),
    [loads, customers, locations],
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
    { key: "door", header: "Door", accessor: (r) => r.load.doorNumber || "—" },
    {
      key: "carrier",
      header: "Carrier / Vendor",
      accessor: (r) => r.load.vendor || "—",
    },
    { key: "po", header: "PO #", accessor: (r) => r.load.poNumbers.join(", ") },
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
      render: (r) => `$${r.load.billedAmount.toFixed(2)}`,
    },
  ];

  const totalBilled = rows.reduce((sum, r) => sum + r.load.billedAmount, 0);

  return (
    <>
      <TopBar
        title="Invoice Report"
        description="Everything needed to bill a customer, sortable and filterable — no more exporting to Excel to regroup it yourself."
      />
      <main className="flex-1 space-y-4 p-6">
        <Card>
          <FilterableTable
            columns={columns}
            rows={rows}
            getRowKey={(r) => r.load.id}
            defaultFilterKeys={["customer", "location"]}
            onExport={(filteredRows) =>
              downloadCsv(
                "invoice-report.csv",
                columns.map((c) => ({
                  header: c.header,
                  accessor: (r: Row) => c.accessor(r),
                })),
                filteredRows,
              )
            }
          />
        </Card>
        <p className="text-sm text-steel">
          Total billed across {rows.length} completed loads:{" "}
          <span className="font-tick font-semibold text-ink">
            ${totalBilled.toFixed(2)}
          </span>
        </p>
      </main>
    </>
  );
}
