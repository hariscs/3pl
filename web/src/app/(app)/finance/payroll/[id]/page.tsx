"use client";

import {
  ArrowLeft,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Copy,
  Printer,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { PayrollPdfDocument } from "@/components/PayrollPdfDocument";
import { RecordPaymentDialog } from "@/components/payroll/RecordPaymentDialog";
import { TopBar } from "@/components/TopBar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { DocumentViewer } from "@/components/ui/DocumentViewer";
import { StatCard } from "@/components/ui/StatCard";
import { StatusPill } from "@/components/ui/StatusPill";
import { ApiError, api } from "@/lib/api/client";
import { formatMoney } from "@/lib/billing";
import {
  type EmployeePayrollStatus,
  filterLoadsByPeriod,
  formatHours,
  getEmployeePayroll,
  getPayPeriods,
  PAYROLL_PAYMENT_METHOD_LABELS,
  type PayrollPayment,
  type PayrollPaymentMethod,
} from "@/lib/payroll";
import { useAppData } from "@/lib/store";
import { CREW_CATEGORY_LABELS } from "@/lib/types";

type PayrollRecord = {
  status: EmployeePayrollStatus;
  approvedAt: string | null;
  approvedByName: string | null;
  paidAt: string | null;
  paidByName: string | null;
  payment?: PayrollPayment | null;
};

const STATUS_LABELS: Record<EmployeePayrollStatus, string> = {
  pending_review: "Pending Review",
  approved: "Approved",
  paid: "Paid",
};

function statusTone(status: EmployeePayrollStatus) {
  if (status === "paid") return "success" as const;
  if (status === "approved") return "info" as const;
  return "warning" as const;
}

function fmtDateTime(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function EmployeePayrollPage() {
  const { id } = useParams<{ id: string }>();
  const { employees, loads, customers, productTypes, locations, isLoading } =
    useAppData();

  const employee = employees.find((e) => e.id === id);
  const locationName =
    locations.find((l) => l.id === employee?.locationId)?.name ?? "—";

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

  const payroll = useMemo(() => {
    if (!employee) return null;
    return getEmployeePayroll(
      employee,
      periodLoads,
      (cid) => customers.find((c) => c.id === cid)?.displayName ?? "—",
      (pid) => productTypes.find((p) => p.id === pid)?.name ?? "—",
    );
  }, [employee, periodLoads, customers, productTypes]);

  const [record, setRecord] = useState<PayrollRecord>({
    status: "pending_review",
    approvedAt: null,
    approvedByName: null,
    paidAt: null,
    paidByName: null,
  });
  const [recordLoading, setRecordLoading] = useState(false);
  const [confirmApprove, setConfirmApprove] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showDocument, setShowDocument] = useState(false);

  async function fetchRecord() {
    if (!employee) return;
    setRecordLoading(true);
    try {
      const data = await api.get<PayrollRecord>(
        `/payroll/records/${employee.id}`,
      );
      setRecord(data);
    } catch {
      // Keep default state
    } finally {
      setRecordLoading(false);
    }
  }

  useEffect(() => {
    fetchRecord();
  }, [employee?.id]);

  async function handleApprove() {
    if (!employee) return;
    try {
      const data = await api.post<PayrollRecord>(
        `/payroll/records/${employee.id}/approve`,
      );
      setRecord(data);
      setConfirmApprove(false);
      toast.success("Payroll approved.");
    } catch (e) {
      toast.error(
        e instanceof ApiError ? e.message : "Failed to approve payroll.",
      );
    }
  }

  async function handleRecordPayment(paymentData: {
    paidAt: string;
    method: PayrollPaymentMethod;
    reference: string;
    note?: string;
  }) {
    if (!employee || !payroll) return;
    try {
      const data = await api.post<PayrollRecord>(
        `/payroll/records/${employee.id}/mark-paid`,
        {
          ...paymentData,
          amount: payroll.totalPay,
        },
      );
      setRecord(data);
      setShowPaymentDialog(false);
      toast.success("Payroll payment recorded successfully.");
    } catch (e) {
      toast.error(
        e instanceof ApiError ? e.message : "Failed to record payment.",
      );
    }
  }

  async function copyReference(ref: string) {
    try {
      await navigator.clipboard.writeText(ref);
      toast.success("Payment reference copied.");
    } catch {
      toast.error("Could not copy to clipboard.");
    }
  }

  if (isLoading || recordLoading) {
    return (
      <>
        <TopBar title="Employee Payroll" />
        <main className="flex flex-1 items-center justify-center p-6">
          <p className="text-sm text-steel">Loading…</p>
        </main>
      </>
    );
  }

  if (!employee || !payroll) {
    return (
      <>
        <TopBar title="Employee not found" />
        <main className="flex-1 p-6">
          <Card>
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <p className="text-sm text-steel">
                This employee doesn&apos;t exist or was removed.
              </p>
              <Link href="/finance/payroll">
                <Button variant="secondary">Back to Payroll</Button>
              </Link>
            </div>
          </Card>
        </main>
      </>
    );
  }

  const approvalInfo = record.approvedAt
    ? `Approved by ${record.approvedByName ?? "Admin"} on ${fmtDateTime(record.approvedAt)}`
    : null;
  const paidInfo = record.paidAt
    ? `Paid by ${record.paidByName ?? "Admin"} on ${fmtDateTime(record.paidAt)}`
    : null;
  const payment = record.payment ?? null;

  return (
    <>
      <TopBar
        title={employee.name}
        description={`${employee.category ? CREW_CATEGORY_LABELS[employee.category] : "Uncategorized"} · ${locationName} · ${formatMoney(employee.hourlyRate)}/hr`}
      />
      <main className="flex-1 space-y-4 p-6">
        <Link
          href="/finance/payroll"
          className="inline-flex items-center gap-1.5 py-1 text-sm text-steel transition-colors hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" /> Back to payroll
        </Link>

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

        {/* Status & actions */}
        <Card>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <StatusPill tone={statusTone(record.status)}>
                {STATUS_LABELS[record.status]}
              </StatusPill>
              {selectedPeriod && (
                <span className="text-sm text-steel">
                  {selectedPeriod.label}
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {record.status === "pending_review" && (
                <Button onClick={() => setConfirmApprove(true)}>
                  <ShieldCheck className="h-3.5 w-3.5" /> Approve Payroll
                </Button>
              )}
              {record.status === "approved" && (
                <Button onClick={() => setShowPaymentDialog(true)}>
                  <CheckCircle className="h-3.5 w-3.5" /> Mark as Paid
                </Button>
              )}
              {record.status === "paid" && (
                <p className="text-sm text-steel">
                  This payroll has been marked as paid.
                </p>
              )}
            </div>
          </div>
          {(approvalInfo || paidInfo) && (
            <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 border-t border-manila-dark pt-3 text-xs text-steel-light">
              {approvalInfo && <span>{approvalInfo}</span>}
              {paidInfo && <span>{paidInfo}</span>}
            </div>
          )}
        </Card>

        {/* Summary cards */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard
            label="Base Hours"
            value={formatHours(payroll.regularHours)}
            hint={`${payroll.overtimeHours > 0 ? `${payroll.overtimeHours}h OT` : "No overtime"}`}
          />
          <StatCard
            label="Hourly Pay"
            value={formatMoney(payroll.hourlyPay)}
            hint={`${formatMoney(payroll.regularPay)} base + ${formatMoney(payroll.overtimePay)} OT`}
          />
          <StatCard
            label="Total Pay"
            value={formatMoney(payroll.totalPay)}
            hint={`+ ${formatMoney(payroll.productionPay)} production`}
          />
          <StatCard
            label="Loads Worked"
            value={payroll.entries.length}
            hint={selectedPeriod?.label}
          />
        </div>

        {/* Pay breakdown */}
        <Card title="Pay Breakdown">
          <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm sm:grid-cols-4">
            <div>
              <span className="text-steel-light">Pay rate</span>
              <p className="font-tick text-ink">
                {formatMoney(employee.hourlyRate)}/hr
              </p>
            </div>
            <div>
              <span className="text-steel-light">Base</span>
              <p className="font-tick text-ink">
                {formatHours(payroll.regularHours)} ×{" "}
                {formatMoney(employee.hourlyRate)} ={" "}
                {formatMoney(payroll.regularPay)}
              </p>
            </div>
            <div>
              <span className="text-steel-light">Overtime</span>
              <p className="font-tick text-ink">
                {formatHours(payroll.overtimeHours)} ×{" "}
                {formatMoney(employee.hourlyRate * 1.5)}/hr ={" "}
                {formatMoney(payroll.overtimePay)}
              </p>
            </div>
            <div>
              <span className="text-steel-light">Production</span>
              <p className="font-tick text-ink">
                {payroll.entries.length} load
                {payroll.entries.length !== 1 ? "s" : ""} ={" "}
                {formatMoney(payroll.productionPay)}
              </p>
            </div>
            <div className="col-span-2 sm:col-span-4 border-t border-manila-dark pt-2">
              <span className="text-steel-light">Deductions</span>
              <p className="text-steel-light">— (not yet configured)</p>
            </div>
            <div className="col-span-2 sm:col-span-4 border-t border-manila-dark pt-2">
              <span className="text-steel-light">Net pay</span>
              <p className="font-tick text-lg font-semibold text-ink">
                {formatMoney(payroll.totalPay)}
              </p>
            </div>
          </div>
        </Card>

        {/* Payment Details Card */}
        {record.status === "paid" && payment && (
          <Card title="Payment Details">
            <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm sm:grid-cols-4">
              <div>
                <span className="text-steel-light">Paid Amount</span>
                <p className="font-tick text-lg font-semibold text-ink">
                  {formatMoney(payment.amount)}
                </p>
              </div>
              <div>
                <span className="text-steel-light">Payment Date</span>
                <p className="font-tick text-ink">{payment.paidAt}</p>
              </div>
              <div>
                <span className="text-steel-light">Payment Method</span>
                <p className="text-ink">
                  {PAYROLL_PAYMENT_METHOD_LABELS[payment.method]}
                </p>
              </div>
              <div>
                <span className="text-steel-light">Payment Reference</span>
                <div className="flex items-center gap-1">
                  <span className="font-tick text-ink">
                    {payment.reference}
                  </span>
                  <button
                    type="button"
                    onClick={() => copyReference(payment.reference)}
                    aria-label="Copy payment reference"
                    className="flex h-7 w-7 items-center justify-center rounded-md text-steel transition-colors hover:bg-paper-dim hover:text-rust"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <div>
                <span className="text-steel-light">Payment Notes</span>
                <p className="text-ink">
                  {payment.note || "No payment notes."}
                </p>
              </div>
              <div>
                <span className="text-steel-light">Recorded By</span>
                <p className="text-ink">{payment.recordedByName}</p>
              </div>
              <div>
                <span className="text-steel-light">Recorded At</span>
                <p className="font-tick text-ink">
                  {fmtDateTime(payment.recordedAt)}
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Load history */}
        <Card
          title={`Load History · ${payroll.entries.length} load${payroll.entries.length !== 1 ? "s" : ""}`}
          action={
            <Button variant="secondary" onClick={() => setShowDocument(true)}>
              <Printer className="h-3.5 w-3.5" /> Print
            </Button>
          }
        >
          {payroll.entries.length === 0 ? (
            <p className="text-sm text-steel">
              No completed loads for this employee in this period.
            </p>
          ) : (
            <div className="divide-y divide-manila-dark/60">
              {payroll.entries.map((entry) => (
                <Link
                  key={entry.loadId}
                  href={`/loads/${entry.loadId}`}
                  className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between transition-colors hover:bg-manila/30"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-ink">
                        #{entry.ticketNumber}
                      </span>
                      <span className="text-xs text-steel-light">
                        {entry.date}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-steel">
                      {entry.customerName} · {entry.productTypeName}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    <span className="font-tick text-steel">
                      {entry.clockIn} → {entry.clockOut ?? "—"}
                    </span>
                    <span className="font-tick w-14 text-right text-steel">
                      {formatHours(entry.hours)}
                    </span>
                    <span className="font-tick w-20 text-right font-medium text-ink">
                      {formatMoney(entry.productionPay)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>

        {/* ── Dialogs ── */}
        <ConfirmDialog
          open={confirmApprove}
          onClose={() => setConfirmApprove(false)}
          title="Approve Payroll"
          body={`Approve ${employee.name}'s payroll${selectedPeriod ? ` for ${selectedPeriod.label}` : ""} with a total pay of ${formatMoney(payroll.totalPay)}?`}
          confirmLabel="Approve"
          variant="primary"
          onConfirm={handleApprove}
        />

        <RecordPaymentDialog
          open={showPaymentDialog}
          onClose={() => setShowPaymentDialog(false)}
          employeeName={employee.name}
          periodLabel={selectedPeriod?.label ?? ""}
          totalPay={payroll.totalPay}
          periodStartDate={selectedPeriod?.startDate ?? ""}
          onSubmit={handleRecordPayment}
        />

        <DocumentViewer
          open={showDocument}
          onClose={() => setShowDocument(false)}
          title="Payroll Report"
          subtitle={`${employee.name}${selectedPeriod ? ` · ${selectedPeriod.label}` : ""}`}
          fileName={`payroll-${employee.name.toLowerCase().replace(/\s+/g, "-")}`}
          documentNode={
            <PayrollPdfDocument
              title="Payroll Report"
              subtitle={`${employee.name}${selectedPeriod ? ` · ${selectedPeriod.label}` : ""}`}
              rows={[payroll]}
              locationName={() => locationName}
            />
          }
        />
      </main>
    </>
  );
}
