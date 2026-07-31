"use client";

import { ArrowLeft, Eye, Loader2 } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { InvoicePdfDocument } from "@/components/invoices/InvoicePdfDocument";
import { TopBar } from "@/components/TopBar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { DocumentViewer } from "@/components/ui/DocumentViewer";
import { StatusPill } from "@/components/ui/StatusPill";
import { ApiError, api } from "@/lib/api/client";
import { formatMoney } from "@/lib/billing";
import type { Invoice } from "@/lib/invoices";
import { COMPANY_INFO } from "@/lib/invoices";

// ── Helpers ──────────────────────────────────────────────────────

function dateLabel(iso?: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

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

// ── State management ─────────────────────────────────────────────

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "not-found" }
  | { status: "ready"; invoice: Invoice };

function useInvoice(id: string) {
  const [state, setState] = useState<LoadState>({ status: "loading" });

  const fetchInvoice = useCallback(async () => {
    setState({ status: "loading" });
    try {
      const invoice = await api.get<Invoice>(`/invoices/${id}`);
      setState({ status: "ready", invoice });
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        setState({ status: "not-found" });
      } else {
        const message =
          error instanceof ApiError ? error.message : "Failed to load invoice.";
        setState({ status: "error", message });
      }
    }
  }, [id]);

  useEffect(() => {
    fetchInvoice();
  }, [fetchInvoice]);

  return { state, retry: fetchInvoice };
}

// ── Page ─────────────────────────────────────────────────────────

export default function InvoiceDetailPage() {
  const params = useParams<{ id: string }>();
  const { state, retry } = useInvoice(params.id);
  const [showDocument, setShowDocument] = useState(false);

  // Loading
  if (state.status === "loading") {
    return (
      <>
        <TopBar title="Invoice" description="" />
        <main className="flex flex-1 items-center justify-center p-6">
          <Loader2 className="h-6 w-6 animate-spin text-steel" />
        </main>
      </>
    );
  }

  // Not found
  if (state.status === "not-found") {
    return (
      <>
        <TopBar title="Invoice" description="" />
        <main className="flex flex-1 items-center justify-center p-6">
          <Card className="w-full max-w-md">
            <div className="flex flex-col items-center gap-4 py-10 text-center">
              <p className="text-sm font-medium text-ink">Invoice not found</p>
              <Link href="/finance/invoices">
                <Button variant="secondary">Back to Invoices</Button>
              </Link>
            </div>
          </Card>
        </main>
      </>
    );
  }

  // Error
  if (state.status === "error") {
    return (
      <>
        <TopBar title="Invoice" description="" />
        <main className="flex flex-1 items-center justify-center p-6">
          <Card className="w-full max-w-md">
            <div className="flex flex-col items-center gap-4 py-10 text-center">
              <p className="text-sm text-stamp">{state.message}</p>
              <Button variant="secondary" onClick={retry}>
                Retry
              </Button>
            </div>
          </Card>
        </main>
      </>
    );
  }

  const { invoice } = state;

  return (
    <>
      <TopBar
        title={`Invoice ${invoice.invoiceNumber}`}
        description={invoice.status === "draft" ? "Draft invoice" : ""}
      />
      <main className="flex-1">
        {/* ── Toolbar ─────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 pt-4">
          <Link
            href="/finance/invoices"
            className="inline-flex items-center gap-1.5 text-sm text-steel hover:text-ink transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Invoices
          </Link>
          <div className="flex items-center gap-2">
            <StatusPill tone="muted">Draft Invoice</StatusPill>
            <Button variant="secondary" onClick={() => setShowDocument(true)}>
              <Eye className="h-3.5 w-3.5" />
              Preview PDF
            </Button>
          </div>
        </div>

        {/* ── Invoice Sheet ───────────────────────────────────── */}
        <div className="mx-auto max-w-4xl space-y-8 px-6 py-8">
          {/* Invoice Header */}
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-steel">
                Invoice
              </p>
              <h1 className="mt-1 font-tick text-3xl font-bold tracking-tight text-ink">
                {invoice.invoiceNumber}
              </h1>
              <div className="mt-3">
                <StatusPill tone="muted">Draft Invoice</StatusPill>
              </div>
            </div>
            <div className="text-right text-sm text-steel">
              <p className="font-semibold text-ink">{COMPANY_INFO.name}</p>
              <p>{COMPANY_INFO.byline}</p>
              {COMPANY_INFO.address.map((line) => (
                <p key={line}>{line}</p>
              ))}
              <p className="mt-1">{COMPANY_INFO.phone}</p>
              <p>{COMPANY_INFO.email}</p>
            </div>
          </div>

          {/* Bill To + Invoice Info */}
          <div className="grid gap-6 sm:grid-cols-2">
            {/* Bill To */}
            <Card title="Bill To">
              <p className="text-sm font-semibold text-ink">
                {invoice.customerName}
              </p>
              <p className="mt-1 text-sm text-steel italic">
                Address not available.
              </p>
            </Card>

            {/* Invoice Information */}
            <Card title="Invoice Information">
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <InfoField
                  label="Invoice Number"
                  value={invoice.invoiceNumber}
                  mono
                />
                <InfoField
                  label="Invoice Date"
                  value={dateLabel(invoice.invoiceDate)}
                />
                <InfoField
                  label="Due Date"
                  value={dateLabel(invoice.dueDate)}
                />
                <InfoField
                  label="Billing Period"
                  value={billingPeriodLabel(
                    invoice.billingPeriodStart,
                    invoice.billingPeriodEnd,
                  )}
                />
                <InfoField label="Created By" value={invoice.createdByName} />
                <InfoField
                  label="Created At"
                  value={dateLabel(invoice.createdAt)}
                />
              </div>
            </Card>
          </div>

          {/* Line Items */}
          <Card title="Invoice Items">
            <div className="overflow-x-auto">
              <table className="w-full min-w-160 text-sm">
                <thead>
                  <tr className="border-b border-manila-dark text-left font-display text-xs font-semibold uppercase tracking-wide text-steel">
                    <th className="py-2 pr-3">Load</th>
                    <th className="py-2 pr-3">Completed</th>
                    <th className="py-2 pr-3">Location</th>
                    <th className="py-2 pr-3">Work Type</th>
                    <th className="py-2 pr-3">Container</th>
                    <th className="py-2 pr-3 text-right">Cases</th>
                    <th className="py-2 pr-3">Description</th>
                    <th className="py-2 pl-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.lineItems.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b border-manila-dark/50 odd:bg-paper even:bg-paper-dim/40"
                    >
                      <td className="py-2.5 pr-3">
                        <Link
                          href={`/loads/${item.loadId}`}
                          className="font-tick font-medium text-ink hover:text-rust"
                        >
                          #{item.ticketNumber}
                        </Link>
                      </td>
                      <td className="py-2.5 pr-3 text-steel">
                        {item.completedAt}
                      </td>
                      <td className="py-2.5 pr-3 text-steel">
                        {item.locationName}
                      </td>
                      <td className="py-2.5 pr-3 text-steel">
                        {item.productTypeName}
                      </td>
                      <td className="py-2.5 pr-3 text-steel">
                        {item.containerNumber ?? "—"}
                      </td>
                      <td className="py-2.5 pr-3 text-right font-tick text-ink">
                        {item.caseCount ?? "—"}
                      </td>
                      <td className="py-2.5 pr-3 text-ink">
                        {item.description}
                      </td>
                      <td className="py-2.5 pl-3 text-right font-tick font-semibold text-ink">
                        {formatMoney(item.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-64 space-y-2 rounded-xl border border-manila-dark bg-cream p-4 text-sm">
              <div className="flex justify-between">
                <span className="text-steel">Subtotal</span>
                <span className="font-tick text-ink">
                  {formatMoney(invoice.subtotal)}
                </span>
              </div>
              <div className="flex justify-between border-t border-manila-dark pt-2">
                <span className="font-semibold text-ink">Total</span>
                <span className="font-tick font-semibold text-ink">
                  {formatMoney(invoice.total)}
                </span>
              </div>
            </div>
          </div>

          {/* Notes */}
          <Card title="Notes">
            {invoice.notes ? (
              <p className="text-sm text-steel whitespace-pre-wrap">
                {invoice.notes}
              </p>
            ) : (
              <p className="text-sm text-steel">No invoice notes.</p>
            )}
          </Card>
        </div>
      </main>

      {/* ── PDF Preview / Download / Print ─────────────────────── */}
      <DocumentViewer
        open={showDocument}
        onClose={() => setShowDocument(false)}
        title={`Invoice ${invoice.invoiceNumber}`}
        subtitle="Draft Invoice"
        fileName={`invoice-${invoice.invoiceNumber}`}
        documentNode={<InvoicePdfDocument invoice={invoice} />}
      />
    </>
  );
}

// ── Small helper component ───────────────────────────────────────

function InfoField({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <p className="text-xs text-steel">{label}</p>
      <p className={`text-ink ${mono ? "font-tick font-medium" : ""}`}>
        {value}
      </p>
    </div>
  );
}
