"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { formatMoney } from "@/lib/billing";
import {
  PAYROLL_PAYMENT_METHOD_LABELS,
  type PayrollPaymentMethod,
} from "@/lib/payroll";

type Props = {
  open: boolean;
  onClose: () => void;
  employeeName: string;
  periodLabel: string;
  totalPay: number;
  periodStartDate: string;
  onSubmit: (data: {
    paidAt: string;
    method: PayrollPaymentMethod;
    reference: string;
    note?: string;
  }) => void | Promise<void>;
};

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export function RecordPaymentDialog({
  open,
  onClose,
  employeeName,
  periodLabel,
  totalPay,
  periodStartDate,
  onSubmit,
}: Props) {
  const [paidAt, setPaidAt] = useState(todayStr());
  const [method, setMethod] = useState<PayrollPaymentMethod>("direct_deposit");
  const [reference, setReference] = useState("");
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  function validate(): boolean {
    const e: Record<string, string> = {};
    const date = new Date(paidAt);
    const startDate = new Date(periodStartDate);
    if (!paidAt.trim()) e.paidAt = "Payment date is required.";
    else if (Number.isNaN(date.getTime())) e.paidAt = "Invalid date.";
    else if (date < startDate)
      e.paidAt =
        "Payment date cannot be earlier than the payroll period start date.";
    if (!reference.trim()) e.reference = "Payment reference is required.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      await onSubmit({
        paidAt,
        method,
        reference: reference.trim(),
        note: note.trim() || undefined,
      });
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) return null;

  return (
    <Modal open={open} onClose={onClose} title="Record Payroll Payment">
      <div className="mb-4 rounded-lg border border-manila-dark bg-paper-dim px-4 py-3 text-sm">
        <p className="font-semibold text-ink">{employeeName}</p>
        <p className="text-steel">{periodLabel}</p>
        <p className="mt-1 font-tick font-semibold text-ink">
          Total Pay: {formatMoney(totalPay)}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Field
          label="Payment Date"
          required
          hint="The date the payment was made."
        >
          <Input
            type="date"
            value={paidAt}
            onChange={(e) => setPaidAt(e.target.value)}
            required
          />
          {errors.paidAt && (
            <p className="mt-1 text-xs text-stamp">{errors.paidAt}</p>
          )}
        </Field>

        <Field label="Payment Method" required>
          <Select
            value={method}
            onChange={(e) => setMethod(e.target.value as PayrollPaymentMethod)}
            required
          >
            {(
              Object.keys(
                PAYROLL_PAYMENT_METHOD_LABELS,
              ) as PayrollPaymentMethod[]
            ).map((k) => (
              <option key={k} value={k}>
                {PAYROLL_PAYMENT_METHOD_LABELS[k]}
              </option>
            ))}
          </Select>
        </Field>

        <Field
          label="Payment Reference"
          required
          hint="Check number, direct deposit ID, or transaction code."
        >
          <Input
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            placeholder="CHK-10293"
            required
          />
          {errors.reference && (
            <p className="mt-1 text-xs text-stamp">{errors.reference}</p>
          )}
        </Field>

        <Field label="Payment Notes" hint="Optional note about this payment.">
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            placeholder="Any additional notes..."
          />
        </Field>

        <p className="text-xs text-steel-light">
          This records the payroll as paid in Dockmaster. It does not initiate a
          bank transfer.
        </p>

        <div className="flex justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? "Recording…" : "Record Payment"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
