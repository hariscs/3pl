"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AdminOnly } from "@/components/AdminOnly";
import { type Column, FilterableTable } from "@/components/FilterableTable";
import { TopBar } from "@/components/TopBar";
import { ActionsMenu } from "@/components/ui/ActionsMenu";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { StatusPill } from "@/components/ui/StatusPill";
import { ApiError, api } from "@/lib/api/client";
import { formatMoney } from "@/lib/billing";
import { downloadCsv } from "@/lib/csv";
import type { Invoice, InvoiceLineItem } from "@/lib/invoices";

// ── Helpers ──────────────────────────────────────────────────────

function billingPeriodLabel(start: string, end: string): string {
  const s = new Date(start);
  const e = new Date(end);
  const sMonth = s.toLocaleDateString("en-US", { month: "short" });
  const eMonth = e.toLocaleDateString("en-US", { month: "short" });
  if (sMonth === eMonth) {
    return `${sMonth} ${s.getDate()}–${e.getDate()}, ${e.getFullYear()}`;
  }
  return `${sMonth} ${s.getDate()} – ${eMonth} ${e.getDate()}, ${e.getFullYear()}`;
}

function lineItemSearchText(items: InvoiceLineItem[]): string {
  return items
    .map((li) => [String(li.ticketNumber), li.containerNumber ?? ""].join(" "))
    .join(" ");
}

// ── Row type (augments Invoice with a pre-computed search blob) ──

type InvoiceRow = Invoice & { _search: string };

function toRow(invoice: Invoice): InvoiceRow {
  return {
    ...invoice,
    _search: [
      invoice.invoiceNumber,
      invoice.customerName,
      invoice.notes ?? "",
      lineItemSearchText(invoice.lineItems),
    ]
      .join(" ")
      .toLowerCase(),
  };
}

// ── Hook: fetch invoices ─────────────────────────────────────────

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; rows: InvoiceRow[] };

function useInvoiceRows(): LoadState & { retry: () => void } {
  const [state, setState] = useState<LoadState>({ status: "loading" });

  const fetchRef = useRef(async () => {
    setState({ status: "loading" });
    try {
      const invoices = await api.get<Invoice[]>("/invoices");
      setState({ status: "ready", rows: invoices.map(toRow) });
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : "Failed to load invoices.";
      setState({ status: "error", message });
    }
  });

  useEffect(() => {
    fetchRef.current();
  }, []);

  const retry = useCallback(() => {
    fetchRef.current();
  }, []);

  if (state.status === "ready") return { ...state, retry };
  return { ...state, retry };
}

// ── Page ─────────────────────────────────────────────────────────

const CSV_COLUMNS: {
  header: string;
  accessor: (r: InvoiceRow) => string | number;
}[] = [
  { header: "Invoice Number", accessor: (r) => r.invoiceNumber },
  { header: "Customer", accessor: (r) => r.customerName },
  { header: "Billing Period Start", accessor: (r) => r.billingPeriodStart },
  { header: "Billing Period End", accessor: (r) => r.billingPeriodEnd },
  { header: "Invoice Date", accessor: (r) => r.invoiceDate },
  { header: "Due Date", accessor: (r) => r.dueDate },
  { header: "Load Count", accessor: (r) => r.lineItems.length },
  { header: "Total", accessor: (r) => r.total },
  { header: "Status", accessor: (r) => r.status },
];

export default function InvoicesPage() {
  const state = useInvoiceRows();

  const rows = state.status === "ready" ? state.rows : [];

  // ── Date range filters (not supported by FilterableTable natively) ──
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const dateRangeInvalid = Boolean(dateFrom && dateTo && dateTo < dateFrom);

  // Apply date filter before handing rows to FilterableTable
  const dateFiltered = useMemo(() => {
    if (!dateFrom && !dateTo) return rows;
    let result = rows;
    if (dateFrom && !dateRangeInvalid) {
      result = result.filter((r) => r.invoiceDate >= dateFrom);
    }
    if (dateTo && !dateRangeInvalid) {
      result = result.filter((r) => r.invoiceDate <= dateTo);
    }
    return result;
  }, [rows, dateFrom, dateTo, dateRangeInvalid]);

  // ── Derived data for summary ─────────────────────────────────

  const totalInvoices = rows.length;
  const totalAmount = rows.reduce((s, r) => s + r.total, 0);
  const draftCount = rows.filter((r) => r.status === "draft").length;
  const averageAmount = totalInvoices > 0 ? totalAmount / totalInvoices : 0;

  // ── CSV export ────────────────────────────────────────────────

  const handleExport = useCallback((filteredRows: InvoiceRow[]) => {
    downloadCsv(
      `invoices-${new Date().toISOString().slice(0, 10)}.csv`,
      CSV_COLUMNS,
      filteredRows,
    );
  }, []);

  // ── Table columns ─────────────────────────────────────────────

  const columns: Column<InvoiceRow>[] = useMemo(
    () => [
      {
        key: "invoiceNumber",
        header: "Invoice",
        accessor: (r) => r.invoiceNumber,
        render: (r) => (
          <Link
            href={`/finance/invoices/${r.id}`}
            className="font-tick font-medium text-ink hover:text-rust"
          >
            {r.invoiceNumber}
          </Link>
        ),
      },
      {
        key: "customerName",
        header: "Customer",
        accessor: (r) => r.customerName,
        filter: "select",
      },
      {
        key: "billingPeriod",
        header: "Billing Period",
        accessor: (r) =>
          billingPeriodLabel(r.billingPeriodStart, r.billingPeriodEnd),
        sortable: false,
      },
      {
        key: "invoiceDate",
        header: "Invoice Date",
        accessor: (r) => r.invoiceDate,
      },
      {
        key: "dueDate",
        header: "Due Date",
        accessor: (r) => r.dueDate,
      },
      {
        key: "lineItemCount",
        header: "Loads",
        accessor: (r) => r.lineItems.length,
        render: (r) => (
          <span className="text-steel">
            {r.lineItems.length} load{r.lineItems.length !== 1 ? "s" : ""}
          </span>
        ),
        sortable: false,
        align: "right" as const,
      },
      {
        key: "total",
        header: "Total",
        accessor: (r) => r.total,
        render: (r) => (
          <span className="font-tick font-semibold text-ink">
            {formatMoney(r.total)}
          </span>
        ),
        align: "right" as const,
      },
      {
        key: "status",
        header: "Status",
        accessor: (r) => r.status,
        filter: "select",
        render: () => <StatusPill tone="muted">Draft</StatusPill>,
      },
      {
        key: "menu",
        header: "",
        accessor: () => "",
        render: (r) => (
          <ActionsMenu
            label="Invoice actions"
            actions={[
              {
                label: "View Invoice",
                onSelect: () =>
                  window.location.assign(`/finance/invoices/${r.id}`),
              },
              {
                label: "View Customer Billing",
                onSelect: () =>
                  window.location.assign("/finance/customer-billing"),
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
    <AdminOnly>
      <TopBar
        title="Invoices"
        description="Review customer invoices created from completed loads."
      />
      <main className="flex-1 space-y-4 p-6">
        {/* Loading */}
        {state.status === "loading" && (
          <>
            {/* Summary skeletons */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i}>
                  <div className="animate-pulse py-3 text-center">
                    <div className="mx-auto h-5 w-16 rounded bg-manila" />
                    <div className="mx-auto mt-1.5 h-3 w-20 rounded bg-manila" />
                  </div>
                </Card>
              ))}
            </div>
            <Card>
              <div className="animate-pulse space-y-3 p-6">
                <div className="h-8 w-full rounded bg-manila" />
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-6 w-full rounded bg-manila/60" />
                ))}
              </div>
            </Card>
          </>
        )}

        {/* Error */}
        {state.status === "error" && (
          <Card>
            <div className="flex flex-col items-center gap-4 py-10 text-center">
              <p className="text-sm font-medium text-stamp">{state.message}</p>
              <Button variant="secondary" onClick={state.retry}>
                Retry
              </Button>
            </div>
          </Card>
        )}

        {/* Ready with no invoices */}
        {state.status === "ready" && rows.length === 0 && (
          <>
            {/* Summary: all zeros */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Card>
                <div className="text-center">
                  <p className="text-xs font-medium uppercase tracking-wide text-steel-light">
                    Total Invoices
                  </p>
                  <p className="mt-1 font-tick text-xl font-semibold text-ink">
                    0
                  </p>
                </div>
              </Card>
              <Card>
                <div className="text-center">
                  <p className="text-xs font-medium uppercase tracking-wide text-steel-light">
                    Total Invoice Amount
                  </p>
                  <p className="mt-1 font-tick text-xl font-semibold text-ink">
                    {formatMoney(0)}
                  </p>
                </div>
              </Card>
              <Card>
                <div className="text-center">
                  <p className="text-xs font-medium uppercase tracking-wide text-steel-light">
                    Draft Invoices
                  </p>
                  <p className="mt-1 font-tick text-xl font-semibold text-ink">
                    0
                  </p>
                </div>
              </Card>
              <Card>
                <div className="text-center">
                  <p className="text-xs font-medium uppercase tracking-wide text-steel-light">
                    Average Invoice Amount
                  </p>
                  <p className="mt-1 font-tick text-xl font-semibold text-ink">
                    {formatMoney(0)}
                  </p>
                </div>
              </Card>
            </div>
            <Card>
              <div className="flex flex-col items-center gap-4 py-10 text-center">
                <p className="text-sm font-medium text-ink">
                  No invoices have been created yet.
                </p>
                <p className="max-w-xs text-sm text-steel">
                  Create an invoice from completed loads in Customer Billing.
                </p>
                <Link href="/finance/customer-billing">
                  <Button>Go to Customer Billing</Button>
                </Link>
              </div>
            </Card>
          </>
        )}

        {/* Ready with data */}
        {state.status === "ready" && rows.length > 0 && (
          <>
            {/* Summary metrics — same pattern as Customer Billing */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Card>
                <div className="text-center">
                  <p className="text-xs font-medium uppercase tracking-wide text-steel-light">
                    Total Invoices
                  </p>
                  <p className="mt-1 font-tick text-xl font-semibold text-ink">
                    {totalInvoices}
                  </p>
                </div>
              </Card>
              <Card>
                <div className="text-center">
                  <p className="text-xs font-medium uppercase tracking-wide text-steel-light">
                    Total Invoice Amount
                  </p>
                  <p className="mt-1 font-tick text-xl font-semibold text-ink">
                    {formatMoney(totalAmount)}
                  </p>
                </div>
              </Card>
              <Card>
                <div className="text-center">
                  <p className="text-xs font-medium uppercase tracking-wide text-steel-light">
                    Draft Invoices
                  </p>
                  <p className="mt-1 font-tick text-xl font-semibold text-ink">
                    {draftCount}
                  </p>
                </div>
              </Card>
              <Card>
                <div className="text-center">
                  <p className="text-xs font-medium uppercase tracking-wide text-steel-light">
                    Average Invoice Amount
                  </p>
                  <p className="mt-1 font-tick text-xl font-semibold text-ink">
                    {formatMoney(averageAmount)}
                  </p>
                </div>
              </Card>
            </div>

            {/* Create Invoice action — same placement as Customer Billing */}
            <div className="flex items-center justify-between">
              <Link href="/finance/customer-billing">
                <Button>Create Invoice</Button>
              </Link>
            </div>

            {/* Date-range filters (above FilterableTable, matching the
                select-all checkbox placement in Customer Billing) */}
            <div className="flex flex-wrap items-end gap-3">
              <div className="min-w-[140px]">
                <label
                  htmlFor="inv-date-from"
                  className="mb-1 block text-xs font-semibold uppercase tracking-wide text-steel-light"
                >
                  Invoice Date From
                </label>
                <input
                  id="inv-date-from"
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full rounded-xl border border-manila-dark bg-cream px-3 py-2 text-sm text-ink focus:border-rust focus:outline-none"
                />
              </div>
              <div className="min-w-[140px]">
                <label
                  htmlFor="inv-date-to"
                  className="mb-1 block text-xs font-semibold uppercase tracking-wide text-steel-light"
                >
                  Invoice Date To
                </label>
                <input
                  id="inv-date-to"
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full rounded-xl border border-manila-dark bg-cream px-3 py-2 text-sm text-ink focus:border-rust focus:outline-none"
                />
                {dateRangeInvalid && (
                  <p className="mt-1 text-xs text-stamp">
                    To date cannot be earlier than From date.
                  </p>
                )}
              </div>
              {(dateFrom || dateTo) && (
                <div className="flex items-end pb-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      setDateFrom("");
                      setDateTo("");
                    }}
                    className="text-xs text-steel underline hover:text-rust"
                  >
                    Clear dates
                  </button>
                </div>
              )}
            </div>

            {/* Replace the built-in search placeholder to hint at line-item search too */}
            <Card>
              <FilterableTable
                columns={columns}
                rows={dateFiltered}
                getRowKey={(r) => r.id}
                defaultFilterKeys={["customerName", "status"]}
                onExport={handleExport}
                searchFn={(row, query) => row._search.includes(query)}
                defaultSort={{ key: "invoiceDate", dir: "desc" }}
              />
            </Card>
          </>
        )}
      </main>
    </AdminOnly>
  );
}
