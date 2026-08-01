import { ArrowRight } from "lucide-react";
import { formatMoney } from "@/lib/billing";
import type { FinancialWorkflowSummary } from "@/lib/dashboard";

type Tone = "warning" | "info" | "success";

const TONE_CLASSES: Record<Tone, string> = {
  warning: "border-amber/30 bg-amber-soft",
  info: "border-rust/30 bg-rust-soft",
  success: "border-freight/30 bg-freight-soft",
};

function FunnelStage({
  label,
  count,
  amount,
  tone,
}: {
  label: string;
  count: number;
  amount: number;
  tone: Tone;
}) {
  return (
    <div
      className={`flex-1 rounded-xl border p-3 text-center ${TONE_CLASSES[tone]}`}
    >
      <p className="text-lg font-bold text-ink">{formatMoney(amount)}</p>
      <p className="text-xs font-medium text-ink">{label}</p>
      <p className="text-[11px] text-steel">
        {count} record{count === 1 ? "" : "s"}
      </p>
    </div>
  );
}

function FunnelArrow() {
  return <ArrowRight className="h-4 w-4 flex-none text-steel-light" />;
}

export function FinancialWorkflowPanel({
  summary,
}: {
  summary: FinancialWorkflowSummary;
}) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-steel">
            Payroll
          </p>
          <div className="flex items-center gap-2">
            <FunnelStage
              label="Pending Review"
              count={summary.payrollPendingReviewCount}
              amount={summary.payrollPendingReviewAmount}
              tone="warning"
            />
            <FunnelArrow />
            <FunnelStage
              label="Approved"
              count={summary.payrollApprovedCount}
              amount={summary.payrollApprovedAmount}
              tone="info"
            />
            <FunnelArrow />
            <FunnelStage
              label="Paid"
              count={summary.payrollPaidCount}
              amount={summary.payrollPaidAmount}
              tone="success"
            />
          </div>
        </div>
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-steel">
            Billing
          </p>
          <div className="flex items-center gap-2">
            <FunnelStage
              label="Unbilled"
              count={summary.unbilledCount}
              amount={summary.unbilledAmount}
              tone="warning"
            />
            <FunnelArrow />
            <FunnelStage
              label="Invoiced"
              count={summary.invoiceCount}
              amount={summary.invoicedAmount}
              tone="success"
            />
          </div>
        </div>
      </div>

      {summary.grossMarginAmount != null &&
        summary.grossMarginPercent != null && (
          <div className="flex items-center justify-between rounded-xl border border-manila-dark bg-paper-dim px-4 py-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-steel">
                Gross Margin
              </p>
              <p className="text-xs text-steel-light">
                Billed {formatMoney(summary.billableAmount)} minus payroll cost{" "}
                {formatMoney(summary.payrollCostAmount)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold text-ink">
                {formatMoney(summary.grossMarginAmount)}
              </p>
              <p className="text-xs text-steel">
                {summary.grossMarginPercent.toFixed(1)}%
              </p>
            </div>
          </div>
        )}
    </div>
  );
}
