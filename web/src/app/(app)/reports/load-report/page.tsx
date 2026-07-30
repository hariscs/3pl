"use client";

import Link from "next/link";
import { useMemo } from "react";
import { AdminOnly } from "@/components/AdminOnly";
import { type Column, FilterableTable } from "@/components/FilterableTable";
import { StampBadge } from "@/components/StampBadge";
import { TopBar } from "@/components/TopBar";
import { ActionsMenu } from "@/components/ui/ActionsMenu";
import { Card } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { formatMoney } from "@/lib/billing";
import { downloadCsv } from "@/lib/csv";
import { useAppData } from "@/lib/store";
import type { Load, LoadEmployeeAssignment } from "@/lib/types";

// ── Helpers ──────────────────────────────────────────────────────

function totalLaborHours(assignments: LoadEmployeeAssignment[]): number {
  return assignments.reduce((sum, a) => {
    if (!a.clockOut) return sum;
    const hours =
      (new Date(a.clockOut).getTime() - new Date(a.clockIn).getTime()) /
      3600000;
    return sum + Math.max(0, hours);
  }, 0);
}

// ── Row type ─────────────────────────────────────────────────────

type Row = {
  load: Load;
  customerName: string;
  locationName: string;
  productTypeName: string;
  laborHours: number;
};

// ── CSV columns (outside component to keep stable) ───────────────

const CSV_COLUMNS = (columns: Column<Row>[]) =>
  columns
    .filter((c) => c.key !== "menu")
    .map((c) => ({
      header: c.header,
      accessor: (r: Row) => c.accessor(r),
    }));

// ── Page ─────────────────────────────────────────────────────────

export default function LoadReportPage() {
  const { loads, customers, locations, productTypes } = useAppData();

  const rows: Row[] = useMemo(
    () =>
      loads
        .filter((l) => l.status === "complete")
        .map((load) => ({
          load,
          customerName:
            customers.find((c) => c.id === load.customerId)?.displayName ?? "—",
          locationName:
            locations.find((loc) => loc.id === load.locationId)?.name ?? "—",
          productTypeName:
            productTypes.find((p) => p.id === load.productTypeId)?.name ?? "—",
          laborHours: totalLaborHours(load.assignments),
        })),
    [loads, customers, locations, productTypes],
  );

  // ── Summary (based on all completed loads) ────────────────────

  const totalCases = rows.reduce((s, r) => s + r.load.cases, 0);
  const totalWeight = rows.reduce((s, r) => s + r.load.weight, 0);
  const totalLabor = rows.reduce((s, r) => s + r.laborHours, 0);
  const totalBilling = rows.reduce((s, r) => s + r.load.billedAmount, 0);

  // ── Table columns ─────────────────────────────────────────────

  const columns: Column<Row>[] = useMemo(
    () => [
      {
        key: "ticketNumber",
        header: "Load",
        accessor: (r) => r.load.ticketNumber,
        render: (r) => (
          <Link
            href={`/loads/${r.load.id}`}
            className="font-tick font-medium text-ink hover:text-rust"
          >
            #{r.load.ticketNumber}
          </Link>
        ),
      },
      {
        key: "date",
        header: "Completed Date",
        accessor: (r) => r.load.date,
      },
      {
        key: "customerName",
        header: "Customer",
        accessor: (r) => r.customerName,
        filter: "select",
      },
      {
        key: "locationName",
        header: "Location",
        accessor: (r) => r.locationName,
        filter: "select",
      },
      {
        key: "productTypeName",
        header: "Product Type",
        accessor: (r) => r.productTypeName,
        filter: "select",
      },
      {
        key: "containerNumber",
        header: "Container",
        accessor: (r) => r.load.containerNumber || "—",
      },
      {
        key: "cases",
        header: "Cases",
        accessor: (r) => r.load.cases,
        align: "right",
      },
      {
        key: "weight",
        header: "Weight",
        accessor: (r) => r.load.weight,
        render: (r) => (
          <span className="font-tick">{r.load.weight.toLocaleString()} lb</span>
        ),
        align: "right",
      },
      {
        key: "laborHours",
        header: "Labor Hours",
        accessor: (r) => r.laborHours,
        render: (r) => (
          <span className="font-tick">{r.laborHours.toFixed(1)}h</span>
        ),
        align: "right",
      },
      {
        key: "billedAmount",
        header: "Customer Billing",
        accessor: (r) => r.load.billedAmount,
        render: (r) => (
          <span className="font-tick font-semibold text-ink">
            {formatMoney(r.load.billedAmount)}
          </span>
        ),
        align: "right",
      },
      {
        key: "status",
        header: "Status",
        accessor: (r) => r.load.status,
        filter: "select",
        render: (r) => <StampBadge status={r.load.status} />,
      },
      {
        key: "menu",
        header: "",
        accessor: () => "",
        render: (r) => (
          <ActionsMenu
            label="Load actions"
            actions={[
              {
                label: "View Load",
                onSelect: () => window.location.assign(`/loads/${r.load.id}`),
              },
            ]}
          />
        ),
        filterable: false,
        sortable: false,
      },
    ],
    [],
  );

  // ── Render ────────────────────────────────────────────────────

  return (
    <>
      <TopBar
        title="Load Report"
        description="Historical view of completed warehouse loads."
      />
      <AdminOnly>
        <main className="flex-1 space-y-4 p-6">
          {/* Summary */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            <StatCard label="Completed Loads" value={rows.length} />
            <StatCard label="Total Cases" value={totalCases.toLocaleString()} />
            <StatCard
              label="Total Weight"
              value={`${totalWeight.toLocaleString()} lb`}
            />
            <StatCard
              label="Total Labor Hours"
              value={`${totalLabor.toFixed(1)}h`}
            />
            <StatCard
              label="Total Customer Billing"
              value={formatMoney(totalBilling)}
            />
          </div>

          {/* Table */}
          <Card>
            {rows.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10 text-center">
                <p className="text-sm font-medium text-ink">
                  No completed loads found.
                </p>
                <p className="text-sm text-steel">
                  Completed warehouse loads will appear here.
                </p>
              </div>
            ) : (
              <FilterableTable
                columns={columns}
                rows={rows}
                getRowKey={(r) => r.load.id}
                defaultFilterKeys={["customerName", "status"]}
                onExport={(filteredRows) =>
                  downloadCsv(
                    "load-report.csv",
                    CSV_COLUMNS(columns),
                    filteredRows,
                  )
                }
              />
            )}
          </Card>
        </main>
      </AdminOnly>
    </>
  );
}
