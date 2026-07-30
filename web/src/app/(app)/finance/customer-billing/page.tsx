"use client";

import { ArrowUpRight, X } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { type Column, FilterableTable } from "@/components/FilterableTable";
import { CreateInvoiceDialog } from "@/components/invoices/CreateInvoiceDialog";
import { TopBar } from "@/components/TopBar";
import { ActionsMenu } from "@/components/ui/ActionsMenu";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { SidekickPanel } from "@/components/ui/SidekickPanel";
import { StatCard } from "@/components/ui/StatCard";
import { StatusPill } from "@/components/ui/StatusPill";
import {
  type BillingStatus,
  type CustomerBillingRow,
  deriveBillingRow,
  formatMoney,
} from "@/lib/billing";
import { useAppData } from "@/lib/store";

const BILLING_STATUS_LABELS: Record<BillingStatus, string> = {
  unbilled: "Unbilled",
  invoiced: "Invoiced",
};

const BILLING_STATUS_TONES: Record<BillingStatus, "warning" | "success"> = {
  unbilled: "warning",
  invoiced: "success",
};

export default function CustomerBillingPage() {
  const { loads, customers, productTypes, locations, isLoading } = useAppData();

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sidekickLoadId, setSidekickLoadId] = useState<string | null>(null);
  const [visibleRows, setVisibleRows] = useState<CustomerBillingRow[]>([]);
  const [createInvoiceOpen, setCreateInvoiceOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const sidekickLoad = useMemo(
    () =>
      sidekickLoadId
        ? (loads.find((l) => l.id === sidekickLoadId) ?? null)
        : null,
    [loads, sidekickLoadId],
  );
  const sidekickCustomerName = useMemo(
    () =>
      sidekickLoad
        ? (customers.find((c) => c.id === sidekickLoad.customerId)
            ?.displayName ?? "—")
        : "",
    [customers, sidekickLoad],
  );
  const sidekickLocationName = useMemo(
    () =>
      sidekickLoad
        ? (locations.find((loc) => loc.id === sidekickLoad.locationId)?.name ??
          "—")
        : "",
    [locations, sidekickLoad],
  );
  const sidekickProductTypeName = useMemo(
    () =>
      sidekickLoad
        ? (productTypes.find((p) => p.id === sidekickLoad.productTypeId)
            ?.name ?? "—")
        : "",
    [productTypes, sidekickLoad],
  );

  const billingRows = useMemo<CustomerBillingRow[]>(() => {
    return loads
      .filter((l) => l.status === "complete" && l.billedAmount > 0)
      .map((l) => {
        const customerName =
          customers.find((c) => c.id === l.customerId)?.displayName ?? "—";
        const locationName =
          locations.find((loc) => loc.id === l.locationId)?.name ?? "—";
        const productTypeName =
          productTypes.find((p) => p.id === l.productTypeId)?.name ?? "—";
        return deriveBillingRow(l, customerName, locationName, productTypeName);
      })
      .sort((a, b) => b.ticketNumber - a.ticketNumber);
    // refreshKey forces re-derivation when billing status changes
  }, [loads, customers, productTypes, locations, refreshKey]);

  const unbilledRows = useMemo(
    () => billingRows.filter((r) => r.billingStatus === "unbilled"),
    [billingRows],
  );
  const unbilledAmount = useMemo(
    () => unbilledRows.reduce((s, r) => s + r.billingAmount, 0),
    [unbilledRows],
  );

  const selectedRows = useMemo(
    () => billingRows.filter((r) => selectedIds.has(r.loadId)),
    [billingRows, selectedIds],
  );
  const selectedAmount = useMemo(
    () => selectedRows.reduce((s, r) => s + r.billingAmount, 0),
    [selectedRows],
  );

  function selectAllVisible(visibleRows: CustomerBillingRow[]) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      const visibleUnbilled = visibleRows.filter(
        (r) => r.billingStatus === "unbilled",
      );
      const allSelected = visibleUnbilled.every((r) => next.has(r.loadId));
      if (allSelected) {
        for (const r of visibleUnbilled) next.delete(r.loadId);
      } else {
        for (const r of visibleUnbilled) next.add(r.loadId);
      }
      return next;
    });
  }

  function clearSelection() {
    setSelectedIds(new Set());
  }

  function handleCreateInvoice() {
    if (selectedRows.length === 0) {
      toast.error("Select at least one load to create an invoice.");
      return;
    }
    const invalid = selectedRows.some((r) => r.billingStatus !== "unbilled");
    if (invalid) {
      toast.error("Only unbilled loads can be included in an invoice.");
      return;
    }
    const customerIds = [...new Set(selectedRows.map((r) => r.customerId))];
    if (customerIds.length > 1) {
      toast.error(
        "Select loads for one customer at a time to create an invoice.",
      );
      return;
    }
    setCreateInvoiceOpen(true);
  }

  const columns: Column<CustomerBillingRow>[] = useMemo(
    () => [
      {
        key: "selection",
        header: "",
        accessor: (r) => (selectedIds.has(r.loadId) ? "1" : "0"),
        render: (r) => {
          const isInvoiced = r.billingStatus === "invoiced";
          return (
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-manila-dark accent-rust"
              disabled={isInvoiced}
              checked={selectedIds.has(r.loadId)}
              aria-label={`Select load #${r.ticketNumber}`}
              onChange={() => {
                setSelectedIds((prev) => {
                  const next = new Set(prev);
                  if (next.has(r.loadId)) next.delete(r.loadId);
                  else next.add(r.loadId);
                  return next;
                });
              }}
            />
          );
        },
        filterable: false,
        sortable: false,
      },
      {
        key: "ticketNumber",
        header: "Load",
        accessor: (r) => r.ticketNumber,
        render: (r) => (
          <Link
            href={`/loads/${r.loadId}`}
            className="font-tick font-medium text-ink hover:text-rust"
          >
            #{r.ticketNumber}
          </Link>
        ),
      },
      {
        key: "completedAt",
        header: "Completed Date",
        accessor: (r) => r.completedAt,
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
      },
      {
        key: "productTypeName",
        header: "Product Type",
        accessor: (r) => r.productTypeName,
      },
      {
        key: "containerNumber",
        header: "Container",
        accessor: (r) => r.containerNumber ?? "—",
      },
      {
        key: "caseCount",
        header: "Cases",
        accessor: (r) => r.caseCount,
        align: "right",
      },
      {
        key: "billingAmount",
        header: "Billing Amount",
        accessor: (r) => r.billingAmount,
        render: (r) => (
          <span className="font-tick font-semibold text-ink">
            {formatMoney(r.billingAmount)}
          </span>
        ),
        align: "right",
      },
      {
        key: "billingStatus",
        header: "Billing Status",
        accessor: (r) => r.billingStatus,
        filter: "select",
        render: (r) => (
          <StatusPill tone={BILLING_STATUS_TONES[r.billingStatus]}>
            {BILLING_STATUS_LABELS[r.billingStatus]}
          </StatusPill>
        ),
      },
      {
        key: "action",
        header: "",
        accessor: () => "",
        render: (r) => {
          const actions = [
            { label: "View Load", onSelect: () => setSidekickLoadId(r.loadId) },
          ];
          if (r.billingStatus === "invoiced" && r.invoiceId) {
            actions.unshift({
              label: "View Invoice",
              onSelect: () =>
                window.location.assign(`/finance/invoices/${r.invoiceId}`),
            });
          }
          return <ActionsMenu label="Load actions" actions={actions} />;
        },
        filterable: false,
        sortable: false,
      },
    ],
    [selectedIds],
  );

  if (isLoading) {
    return (
      <>
        <TopBar
          title="Customer Billing"
          description="Review completed loads that are ready to be invoiced."
        />
        <main className="flex flex-1 items-center justify-center p-6">
          <p className="text-sm text-steel">Loading…</p>
        </main>
      </>
    );
  }

  return (
    <>
      <TopBar
        title="Customer Billing"
        description="Review completed loads that are ready to be invoiced."
      />
      <main className="flex-1 space-y-4 p-6">
        {/* Summary metrics */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Unbilled Loads" value={unbilledRows.length} />
          <StatCard
            label="Unbilled Amount"
            value={formatMoney(unbilledAmount)}
          />
          <StatCard label="Selected Loads" value={selectedRows.length} />
          <StatCard
            label="Selected Amount"
            value={formatMoney(selectedAmount)}
          />
        </div>

        {/* Selected loads action bar */}
        {selectedRows.length > 0 && (
          <div className="flex items-center justify-between gap-4 rounded-2xl border border-rust/30 bg-rust-soft px-5 py-3">
            <div className="flex items-center gap-4 text-sm">
              <span className="font-semibold text-ink">
                {selectedRows.length} load{selectedRows.length !== 1 ? "s" : ""}{" "}
                selected
              </span>
              <span className="font-tick font-semibold text-ink">
                {formatMoney(selectedAmount)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="secondary" onClick={clearSelection}>
                <X className="h-3.5 w-3.5" /> Clear Selection
              </Button>
              <Button onClick={handleCreateInvoice}>Create Invoice</Button>
            </div>
          </div>
        )}

        {/* Table */}
        <Card>
          {/* Select-all placed outside FilterableTable's own toolbar */}
          {billingRows.length > 0 &&
            (() => {
              const visibleUnbilled = (
                visibleRows.length > 0 ? visibleRows : billingRows
              ).filter((r) => r.billingStatus === "unbilled");
              const allSelected =
                visibleUnbilled.length > 0 &&
                visibleUnbilled.every((r) => selectedIds.has(r.loadId));
              const someSelected = visibleUnbilled.some((r) =>
                selectedIds.has(r.loadId),
              );
              return (
                <label className="mb-3 flex w-fit items-center gap-2">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-manila-dark accent-rust"
                    onChange={() => selectAllVisible(visibleUnbilled)}
                    checked={allSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = someSelected && !allSelected;
                    }}
                  />
                  <span className="text-xs text-steel">
                    Select all unbilled
                  </span>
                </label>
              );
            })()}
          {billingRows.length === 0 ? (
            <p className="py-8 text-center text-sm text-steel">
              No completed loads are ready for billing.
            </p>
          ) : (
            <FilterableTable
              columns={columns}
              rows={billingRows}
              getRowKey={(r) => r.loadId}
              defaultFilterKeys={["customerName", "billingStatus"]}
              onFilteredRowsChange={setVisibleRows}
            />
          )}
        </Card>
      </main>

      {/* Sidekick Panel — load details */}
      <SidekickPanel
        open={sidekickLoadId !== null}
        onClose={() => setSidekickLoadId(null)}
        title={`Load #${sidekickLoad?.ticketNumber ?? ""}`}
      >
        {sidekickLoad && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <div>
                <span className="text-xs text-steel">Status</span>
                <StatusPill
                  tone={
                    sidekickLoad.status === "complete"
                      ? "success"
                      : sidekickLoad.status === "active"
                        ? "info"
                        : sidekickLoad.status === "void"
                          ? "danger"
                          : "muted"
                  }
                >
                  {sidekickLoad.status.charAt(0).toUpperCase() +
                    sidekickLoad.status.slice(1)}
                </StatusPill>
              </div>
              <div>
                <span className="text-xs text-steel">Date</span>
                <p className="font-tick text-ink">{sidekickLoad.date}</p>
              </div>
              <div>
                <span className="text-xs text-steel">Customer</span>
                <p className="text-ink">{sidekickCustomerName}</p>
              </div>
              <div>
                <span className="text-xs text-steel">Location</span>
                <p className="text-steel">{sidekickLocationName}</p>
              </div>
              <div>
                <span className="text-xs text-steel">Product Type</span>
                <p className="text-steel">{sidekickProductTypeName}</p>
              </div>
              <div>
                <span className="text-xs text-steel">Door</span>
                <p className="font-tick text-ink">
                  {sidekickLoad.doorNumber || "—"}
                </p>
              </div>
              <div>
                <span className="text-xs text-steel">Container</span>
                <p className="font-tick text-ink">
                  {sidekickLoad.containerNumber || "—"}
                </p>
              </div>
              <div>
                <span className="text-xs text-steel">Cases</span>
                <p className="font-tick text-ink">{sidekickLoad.cases}</p>
              </div>
              <div>
                <span className="text-xs text-steel">Sorts</span>
                <p className="font-tick text-ink">{sidekickLoad.sorts}</p>
              </div>
              <div>
                <span className="text-xs text-steel">Weight</span>
                <p className="font-tick text-ink">{sidekickLoad.weight} lb</p>
              </div>
              <div>
                <span className="text-xs text-steel">Billing Amount</span>
                <p className="font-tick font-semibold text-ink">
                  {formatMoney(sidekickLoad.billedAmount)}
                </p>
              </div>
              <div>
                <span className="text-xs text-steel">Vendor</span>
                <p className="text-ink">{sidekickLoad.vendor || "—"}</p>
              </div>
              {sidekickLoad.poNumbers.length > 0 && (
                <div className="col-span-2">
                  <span className="text-xs text-steel">PO Numbers</span>
                  <p className="text-ink">
                    {sidekickLoad.poNumbers.join(", ")}
                  </p>
                </div>
              )}
            </div>

            <div className="border-t border-manila-dark pt-4">
              <Link
                href={`/loads/${sidekickLoad.id}`}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-rust hover:text-rust-dark"
              >
                Open full load details <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        )}
        {!sidekickLoad && <p className="text-sm text-steel">Load not found.</p>}
      </SidekickPanel>

      {/* Create Invoice Dialog */}
      <CreateInvoiceDialog
        open={createInvoiceOpen}
        onClose={() => setCreateInvoiceOpen(false)}
        selectedRows={selectedRows}
        customer={
          customers.find((c) => c.id === selectedRows[0]?.customerId) ?? {
            id: "",
            displayName: "",
            contactName: "",
            email: "",
            phone: "",
            legalCompanyName: "",
            locationIds: [],
            status: "active" as const,
          }
        }
        onSuccess={() => {
          clearSelection();
          setRefreshKey((k) => k + 1);
        }}
      />
    </>
  );
}
