"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { ApiError, api } from "@/lib/api/client";
import { type CustomerBillingRow, formatMoney } from "@/lib/billing";
import type { Invoice } from "@/lib/invoices";
import type { Customer } from "@/lib/types";

type Props = {
  open: boolean;
  onClose: () => void;
  selectedRows: CustomerBillingRow[];
  customer: Customer;
  onSuccess: () => void;
};

function todayStr(): string {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function CreateInvoiceDialog({
  open,
  onClose,
  selectedRows,
  customer,
  onSuccess,
}: Props) {
  const router = useRouter();

  const billingPeriodStart = useMemo(() => {
    const dates = selectedRows.map((r) => r.completedAt).sort();
    return dates[0] ?? "";
  }, [selectedRows]);

  const billingPeriodEnd = useMemo(() => {
    const dates = selectedRows.map((r) => r.completedAt).sort();
    return dates[dates.length - 1] ?? "";
  }, [selectedRows]);

  const subtotal = useMemo(
    () => selectedRows.reduce((s, r) => s + r.billingAmount, 0),
    [selectedRows],
  );

  const [invoiceDate, setInvoiceDate] = useState(todayStr());
  const [dueDate, setDueDate] = useState(addDays(todayStr(), 30));
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Dates always have sensible defaults, so only typed notes count as "unsaved work."
  function handleClose() {
    if (
      notes.trim().length > 0 &&
      !window.confirm("Discard the notes you've entered for this invoice?")
    ) {
      return;
    }
    onClose();
  }

  function validate(): Record<string, string> {
    const e: Record<string, string> = {};
    if (!invoiceDate) e.invoiceDate = "Invoice date is required.";
    if (!dueDate) e.dueDate = "Due date is required.";
    if (invoiceDate && dueDate && dueDate < invoiceDate) {
      e.dueDate = "Due date cannot be earlier than invoice date.";
    }
    if (selectedRows.length === 0) e.general = "At least one load is required.";
    if (subtotal <= 0) e.general = "Invoice total must be greater than zero.";
    return e;
  }

  async function handleSubmit() {
    const validationErrors = validate();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setSubmitting(true);
    try {
      const loadIds = selectedRows.map((r) => r.loadId);
      const created = await api.post<Invoice>("/invoices", {
        customerId: customer.id,
        loadIds,
        invoiceDate,
        dueDate,
        notes: notes.trim() || null,
      });
      toast.success("Invoice created.");
      onSuccess();
      onClose();
      router.push(`/finance/invoices/${created.id}`);
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : "Something went wrong.";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) return null;

  return (
    <Modal open={open} onClose={handleClose} title="Create Invoice">
      <div className="space-y-5">
        {/* Summary */}
        <div className="space-y-2 rounded-xl border border-manila-dark bg-cream p-3 text-sm">
          <div className="flex justify-between">
            <span className="text-steel">Customer</span>
            <span className="font-medium text-ink">{customer.displayName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-steel">Loads</span>
            <span className="font-medium text-ink">{selectedRows.length}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-steel">Billing Period</span>
            <span className="font-medium text-ink">
              {billingPeriodStart} — {billingPeriodEnd}
            </span>
          </div>
          <div className="flex justify-between border-t border-manila-dark pt-2">
            <span className="font-semibold text-ink">Invoice Total</span>
            <span className="font-tick font-semibold text-ink">
              {formatMoney(subtotal)}
            </span>
          </div>
        </div>

        {/* Line items */}
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-steel">
            Line Items
          </p>
          <div className="max-h-40 space-y-1 overflow-y-auto rounded-xl border border-manila-dark bg-cream p-2">
            {selectedRows.map((r) => (
              <div
                key={r.loadId}
                className="flex justify-between px-2 py-1 text-xs"
              >
                <span className="text-ink">
                  Load #{r.ticketNumber} — {r.productTypeName}
                </span>
                <span className="font-tick text-ink">
                  {formatMoney(r.billingAmount)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Form fields */}
        <div className="space-y-3">
          <Field label="Invoice Date" required>
            <Input
              type="date"
              value={invoiceDate}
              onChange={(e) => setInvoiceDate(e.target.value)}
            />
          </Field>
          {errors.invoiceDate && (
            <p className="text-xs text-stamp -mt-2">{errors.invoiceDate}</p>
          )}

          <Field label="Due Date" required>
            <Input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </Field>
          {errors.dueDate && (
            <p className="text-xs text-stamp -mt-2">{errors.dueDate}</p>
          )}

          <Field label="Notes">
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional invoice notes..."
              rows={2}
            />
          </Field>
        </div>

        {errors.general && (
          <p className="text-xs text-stamp">{errors.general}</p>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-2">
          <Button
            variant="secondary"
            onClick={handleClose}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Creating..." : "Create Invoice"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
