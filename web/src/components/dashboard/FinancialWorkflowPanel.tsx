import { ArrowRight } from "lucide-react";
import { formatMoney } from "@/lib/billing";
import type { FinancialWorkflowSummary } from "@/lib/dashboard";

function FunnelStage({
  label,
  count,
  amount,
  actionable = false,
}: {
  label: string;
  count: number;
  amount: number;
  actionable?: boolean;
}) {
  return (
    <div className="flex-1 text-center">
      <p
        className={`text-lg font-bold tracking-tight ${actionable ? "text-rust" : "text-ink"}`}
      >
        {formatMoney(amount)}
      </p>
      <p className="text-xs font-medium text-ink">{label}</p>
      <p className="text-[11px] text-steel-light">
        {count} record{count === 1 ? "" : "s"}
      </p>
    </div>
  );
}

function FunnelArrow() {
  return <ArrowRight className="h-4 w-4 flex-none text-steel-light" />;
}

function FunnelRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-steel">
        {label}
      </p>
      <div className="flex items-center gap-3">{children}</div>
    </div>
  );
}

export function FinancialWorkflowPanel({
  summary,
}: {
  summary: FinancialWorkflowSummary;
}) {
  return (
    <div className="space-y-5">
      <FunnelRow label="Payroll">
        <FunnelStage
          label="Pending Review"
          count={summary.payrollPendingReviewCount}
          amount={summary.payrollPendingReviewAmount}
          actionable
        />
        <FunnelArrow />
        <FunnelStage
          label="Approved"
          count={summary.payrollApprovedCount}
          amount={summary.payrollApprovedAmount}
        />
        <FunnelArrow />
        <FunnelStage
          label="Paid"
          count={summary.payrollPaidCount}
          amount={summary.payrollPaidAmount}
        />
      </FunnelRow>

      <div className="border-t border-manila-dark" />

      <FunnelRow label="Billing">
        <FunnelStage
          label="Unbilled"
          count={summary.unbilledCount}
          amount={summary.unbilledAmount}
          actionable
        />
        <FunnelArrow />
        <FunnelStage
          label="Invoiced"
          count={summary.invoiceCount}
          amount={summary.invoicedAmount}
        />
      </FunnelRow>

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
