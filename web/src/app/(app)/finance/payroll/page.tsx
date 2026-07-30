"use client";

import { ChevronLeft, ChevronRight, Printer } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { type Column, FilterableTable } from "@/components/FilterableTable";
import { PayrollPdfDocument } from "@/components/PayrollPdfDocument";
import { TopBar } from "@/components/TopBar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { DocumentViewer } from "@/components/ui/DocumentViewer";
import { StatCard } from "@/components/ui/StatCard";
import { StatusPill } from "@/components/ui/StatusPill";
import { formatMoney } from "@/lib/billing";
import { downloadCsv } from "@/lib/csv";
import {
  type EmployeePayroll,
  filterLoadsByPeriod,
  formatHours,
  getAllPayroll,
  getPayPeriods,
} from "@/lib/payroll";
import { useAppData } from "@/lib/store";

export default function PayrollPage() {
  const router = useRouter();
  const { employees, loads, customers, productTypes, locations, isLoading } =
    useAppData();
  const [showDocument, setShowDocument] = useState(false);
  const [printRows, setPrintRows] = useState<EmployeePayroll[]>([]);

  const customerName = useCallback(
    (id: string) => customers.find((c) => c.id === id)?.displayName ?? "—",
    [customers],
  );
  const productTypeName = useCallback(
    (id: string) => productTypes.find((p) => p.id === id)?.name ?? "—",
    [productTypes],
  );
  const locationName = useCallback(
    (id: string) => locations.find((l) => l.id === id)?.name ?? "—",
    [locations],
  );

  const periods = useMemo(() => getPayPeriods(loads), [loads]);
  const latestPeriod = periods[periods.length - 1] ?? null;
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>(
    latestPeriod?.id ?? "",
  );

  const selectedPeriod =
    periods.find((p) => p.id === selectedPeriodId) ?? latestPeriod;
  const periodIndex = selectedPeriod ? periods.indexOf(selectedPeriod) : -1;
  const prevPeriod = periodIndex > 0 ? periods[periodIndex - 1] : null;
  const nextPeriod =
    periodIndex < periods.length - 1 ? periods[periodIndex + 1] : null;

  const periodLoads = useMemo(
    () => (selectedPeriod ? filterLoadsByPeriod(loads, selectedPeriod) : loads),
    [loads, selectedPeriod],
  );

  const payroll = useMemo(
    () => getAllPayroll(employees, periodLoads, customerName, productTypeName),
    [employees, periodLoads, customerName, productTypeName],
  );

  const totals = useMemo(() => {
    let hours = 0,
      overtime = 0,
      regularPay = 0,
      overtimePay = 0,
      production = 0,
      total = 0;
    for (const p of payroll) {
      hours += p.totalHours;
      overtime += p.overtimeHours;
      regularPay += p.regularPay;
      overtimePay += p.overtimePay;
      production += p.productionPay;
      total += p.totalPay;
    }
    return { hours, overtime, regularPay, overtimePay, production, total };
  }, [payroll]);

  const columns: Column<EmployeePayroll>[] = useMemo(
    () => [
      {
        key: "name",
        header: "Employee",
        accessor: (p) => p.employee.name,
        render: (p) => (
          <Link
            href={`/finance/payroll/${p.employee.id}`}
            className="font-medium text-ink hover:text-rust"
            onClick={(e) => e.stopPropagation()}
          >
            {p.employee.name}
          </Link>
        ),
      },
      {
        key: "category",
        header: "Category",
        accessor: (p) => p.employee.category ?? "—",
        filter: "select",
        filterOptions: [
          ...new Set(
            employees
              .filter((e) => e.category)
              .map((e) => e.category as string),
          ),
        ],
        render: (p) =>
          p.employee.category ? (
            <StatusPill tone="muted">
              {p.employee.category.charAt(0).toUpperCase() +
                p.employee.category.slice(1)}
            </StatusPill>
          ) : (
            <span className="text-steel-light">—</span>
          ),
      },
      {
        key: "location",
        header: "Location",
        accessor: (p) => locationName(p.employee.locationId),
        filter: "select",
        filterOptions: locations.map((l) => l.name),
      },
      {
        key: "loads",
        header: "Loads",
        accessor: (p) => p.entries.length,
        render: (p) => <span className="font-tick">{p.entries.length}</span>,
      },
      {
        key: "hours",
        header: "Hours",
        accessor: (p) => p.totalHours,
        render: (p) => (
          <span className="font-tick">{formatHours(p.totalHours)}</span>
        ),
      },
      {
        key: "regularPay",
        header: "Base",
        accessor: (p) => p.regularPay,
        render: (p) => (
          <span className="font-tick">{formatMoney(p.regularPay)}</span>
        ),
      },
      {
        key: "overtimePay",
        header: "Overtime",
        accessor: (p) => p.overtimePay,
        render: (p) => (
          <span className="font-tick">{formatMoney(p.overtimePay)}</span>
        ),
      },
      {
        key: "productionPay",
        header: "Production",
        accessor: (p) => p.productionPay,
        render: (p) => (
          <span className="font-tick">{formatMoney(p.productionPay)}</span>
        ),
      },
      {
        key: "totalPay",
        header: "Total Pay",
        accessor: (p) => p.totalPay,
        render: (p) => (
          <span className="font-tick font-semibold text-ink">
            {formatMoney(p.totalPay)}
          </span>
        ),
      },
    ],
    [employees, locations, locationName],
  );

  if (isLoading) {
    return (
      <>
        <TopBar
          title="Payroll"
          description="Hourly and production pay for all active crew members across completed loads."
        />
        <main className="flex flex-1 items-center justify-center p-6">
          <output aria-live="polite" className="text-sm text-steel">
            Loading…
          </output>
        </main>
      </>
    );
  }

  return (
    <>
      <TopBar
        title="Payroll"
        description="Hourly and production pay for all active crew members across completed loads."
      />
      <main className="flex-1 space-y-4 p-6">
        {/* Period selector */}
        {periods.length > 1 && (
          <Card>
            <div className="flex items-center justify-between gap-4">
              <Button
                variant="ghost"
                aria-label="Previous pay period"
                onClick={() => prevPeriod && setSelectedPeriodId(prevPeriod.id)}
                disabled={!prevPeriod}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex flex-wrap items-center justify-center gap-2">
                {periods.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedPeriodId(p.id)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${p.id === (selectedPeriod?.id ?? "") ? "bg-rust text-cream" : "bg-cream text-ink border border-manila-dark hover:bg-paper-dim"}`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              <Button
                variant="ghost"
                aria-label="Next pay period"
                onClick={() => nextPeriod && setSelectedPeriodId(nextPeriod.id)}
                disabled={!nextPeriod}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        )}

        {/* Summary */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Crew Members" value={payroll.length} />
          <StatCard
            label="Total Hours"
            value={formatHours(totals.hours)}
            hint={`${totals.overtime.toFixed(1)}h overtime`}
          />
          <StatCard label="Base Pay" value={formatMoney(totals.regularPay)} />
          <StatCard
            label="Total Pay"
            value={formatMoney(totals.total)}
            hint={`+ ${formatMoney(totals.overtimePay)} OT, + ${formatMoney(totals.production)} prod`}
          />
        </div>

        {/* Table */}
        <Card>
          <div className="mb-3 flex items-center justify-end">
            <div className="flex items-center gap-2">
              <Button variant="secondary" onClick={() => setShowDocument(true)}>
                <Printer className="h-3.5 w-3.5" /> Print
              </Button>
              <Button
                variant="secondary"
                onClick={() =>
                  downloadCsv(
                    "payroll.csv",
                    columns
                      .filter((c) => c.key !== "name")
                      .map((c) => ({
                        header: c.header,
                        accessor: (row: EmployeePayroll) => c.accessor(row),
                      })),
                    payroll,
                  )
                }
              >
                Export to Excel
              </Button>
            </div>
          </div>
          <FilterableTable
            columns={columns}
            rows={payroll}
            getRowKey={(p) => p.employee.id}
            defaultFilterKeys={["category", "location"]}
            onRowClick={(p) => router.push(`/finance/payroll/${p.employee.id}`)}
            onFilteredRowsChange={setPrintRows}
            emptyMessage="No completed loads with crew assignments in this period."
          />
        </Card>
      </main>

      <DocumentViewer
        open={showDocument}
        onClose={() => setShowDocument(false)}
        title="Payroll Report"
        subtitle={selectedPeriod?.label}
        fileName="payroll-report"
        documentNode={
          <PayrollPdfDocument
            title="Payroll Report"
            subtitle={selectedPeriod?.label}
            rows={printRows.length > 0 ? printRows : payroll}
            locationName={locationName}
          />
        }
      />
    </>
  );
}
