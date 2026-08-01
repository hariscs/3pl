"use client";

import { AlertTriangle, CheckCircle, Clock, Truck, Users } from "lucide-react";
import { useMemo, useState } from "react";
import {
  BillingPayoutChart,
  EmptyChart,
  LoadStatusDonutChart,
  LoadsCompletedTrendChart,
} from "@/components/DashboardCharts";
import { AttentionRequiredList } from "@/components/dashboard/AttentionRequiredList";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { FinancialWorkflowPanel } from "@/components/dashboard/FinancialWorkflowPanel";
import { OperationsNowTable } from "@/components/dashboard/OperationsNowTable";
import {
  RankedPerformanceTable,
  type RankedRow,
} from "@/components/dashboard/RankedPerformanceTable";
import { RecentActivityFeed } from "@/components/dashboard/RecentActivityFeed";
import { WorkforceOverview } from "@/components/dashboard/WorkforceOverview";
import { Card } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { useAuth } from "@/lib/auth";
import { formatMoney } from "@/lib/billing";
import {
  buildScope,
  DATE_RANGE_LABELS,
  type DashboardFilters,
  getAttentionItems,
  getBillingVsPayrollTrend,
  getCertificationAlerts,
  getCustomerPerformance,
  getFinancialWorkflow,
  getLoadStatusDistribution,
  getLoadsCompletedTrend,
  getLocationPerformance,
  getOperationalSummary,
  getOperationsNow,
  getRecentActivity,
  getWorkforceOverview,
  selectPeriodLoads,
  selectScopedLoads,
} from "@/lib/dashboard";
import { getAllPayroll } from "@/lib/payroll";
import { useAppData } from "@/lib/store";
import { LOAD_STATUS_LABELS } from "@/lib/types";
import { useInvoices } from "@/lib/use-invoices";
import { usePayrollRecords } from "@/lib/use-payroll-records";

function SectionLabel({
  title,
  badge,
  tone = "live",
}: {
  title: string;
  badge: string;
  tone?: "live" | "period";
}) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <p className="text-xs font-semibold uppercase tracking-wider text-steel">
        {title}
      </p>
      <span
        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
          tone === "live"
            ? "bg-freight-soft text-freight"
            : "bg-rust-soft text-rust"
        }`}
      >
        {badge}
      </span>
    </div>
  );
}

export default function DashboardPage() {
  const {
    loads,
    customers,
    locations,
    productTypes,
    employees,
    users,
    role,
    isLoading,
  } = useAppData();
  const { user } = useAuth();
  const { invoices } = useInvoices();

  const [filters, setFilters] = useState<DashboardFilters>({
    dateRange: "last_7_days",
    customerId: "",
    locationId: "",
  });

  const scope = useMemo(() => buildScope(role, user), [role, user]);

  const scopedLoads = useMemo(
    () => selectScopedLoads(loads, scope, filters),
    [loads, scope, filters],
  );
  const periodLoads = useMemo(
    () => selectPeriodLoads(scopedLoads, filters.dateRange),
    [scopedLoads, filters.dateRange],
  );
  const scopedLoadIds = useMemo(
    () => new Set(scopedLoads.map((l) => l.id)),
    [scopedLoads],
  );
  const periodLoadIds = useMemo(
    () => new Set(periodLoads.map((l) => l.id)),
    [periodLoads],
  );

  const livePayroll = useMemo(
    () =>
      getAllPayroll(
        employees,
        scopedLoads,
        (id) => customers.find((c) => c.id === id)?.displayName ?? "—",
        (id) => productTypes.find((p) => p.id === id)?.name ?? "—",
      ),
    [employees, scopedLoads, customers, productTypes],
  );
  const periodPayroll = useMemo(
    () =>
      getAllPayroll(
        employees,
        periodLoads,
        (id) => customers.find((c) => c.id === id)?.displayName ?? "—",
        (id) => productTypes.find((p) => p.id === id)?.name ?? "—",
      ),
    [employees, periodLoads, customers, productTypes],
  );
  const payrollEmployeeIds = useMemo(
    () => livePayroll.map((p) => p.employee.id),
    [livePayroll],
  );
  const { records: payrollRecords } = usePayrollRecords(payrollEmployeeIds);

  const summary = useMemo(
    () => getOperationalSummary(scopedLoads),
    [scopedLoads],
  );
  const operationsNow = useMemo(
    () =>
      getOperationsNow(
        scopedLoads,
        employees,
        customers,
        locations,
        productTypes,
        users,
      ),
    [scopedLoads, employees, customers, locations, productTypes, users],
  );
  const attentionItems = useMemo(
    () =>
      getAttentionItems(
        scopedLoads,
        employees,
        customers,
        locations,
        productTypes,
        livePayroll,
        payrollRecords,
      ),
    [
      scopedLoads,
      employees,
      customers,
      locations,
      productTypes,
      livePayroll,
      payrollRecords,
    ],
  );
  const financialWorkflow = useMemo(
    () =>
      getFinancialWorkflow(
        periodLoads,
        periodPayroll,
        payrollRecords,
        invoices,
        periodLoadIds,
        filters.customerId,
      ),
    [
      periodLoads,
      periodPayroll,
      payrollRecords,
      invoices,
      periodLoadIds,
      filters.customerId,
    ],
  );
  const loadsCompletedTrend = useMemo(
    () => getLoadsCompletedTrend(periodLoads),
    [periodLoads],
  );
  const billingVsPayrollTrend = useMemo(
    () => getBillingVsPayrollTrend(periodLoads),
    [periodLoads],
  );
  const statusDistribution = useMemo(
    () => getLoadStatusDistribution(periodLoads),
    [periodLoads],
  );
  const customerPerformance = useMemo(
    () =>
      getCustomerPerformance(
        scopedLoads,
        periodLoads,
        periodLoadIds,
        customers,
        invoices,
      ),
    [scopedLoads, periodLoads, periodLoadIds, customers, invoices],
  );
  const locationPerformance = useMemo(
    () =>
      getLocationPerformance(
        scopedLoads,
        periodLoads,
        locations,
        customers,
        users,
      ),
    [scopedLoads, periodLoads, locations, customers, users],
  );
  const workforce = useMemo(
    () => getWorkforceOverview(scopedLoads, employees, locations),
    [scopedLoads, employees, locations],
  );
  const certificationAlerts = useMemo(
    () => getCertificationAlerts(employees),
    [employees],
  );
  const recentActivity = useMemo(
    () =>
      getRecentActivity(
        scopedLoads,
        employees,
        invoices,
        payrollRecords,
        scopedLoadIds,
      ),
    [scopedLoads, employees, invoices, payrollRecords, scopedLoadIds],
  );

  const customerOptions = useMemo(
    () =>
      customers
        .filter((c) => c.status === "active")
        .map((c) => ({ value: c.id, label: c.displayName })),
    [customers],
  );
  const locationOptions = useMemo(
    () =>
      locations
        .filter((l) => {
          if (l.status !== "active") return false;
          if (
            scope.allowedLocationIds &&
            !scope.allowedLocationIds.includes(l.id)
          ) {
            return false;
          }
          if (filters.customerId && l.customerId !== filters.customerId)
            return false;
          return true;
        })
        .map((l) => ({ value: l.id, label: l.name })),
    [locations, scope, filters.customerId],
  );

  const customerRows: RankedRow[] = useMemo(
    () =>
      customerPerformance.map((c) => ({
        id: c.customerId,
        name: c.name,
        href: `/customers/${c.customerId}`,
        stats: [
          { label: "Active", value: String(c.activeLoads) },
          { label: "Billable", value: formatMoney(c.billableAmount) },
          { label: "Invoiced", value: formatMoney(c.invoicedAmount) },
        ],
      })),
    [customerPerformance],
  );
  const locationRows: RankedRow[] = useMemo(
    () =>
      locationPerformance.map((l) => ({
        id: l.locationId,
        name: l.name,
        subtitle: l.customerName,
        href: `/locations/${l.locationId}`,
        stats: [
          { label: "Active", value: String(l.activeLoads) },
          { label: "Crew", value: String(l.crewWorking) },
          { label: "Completed", value: String(l.completedLoads) },
        ],
      })),
    [locationPerformance],
  );

  const showFinancials =
    role === "admin" || role === "manager" || role === "finance";
  const showOperationsAndWorkforce = role !== "finance";
  const periodLabel = DATE_RANGE_LABELS[filters.dateRange];

  if (role === "customer" || role === "employee") {
    return (
      <main className="flex flex-1 items-center justify-center p-6">
        <Card>
          <p className="text-sm text-steel">
            This dashboard isn't available for your role. Contact your
            administrator.
          </p>
        </Card>
      </main>
    );
  }

  if (isLoading) {
    return (
      <main className="flex flex-1 items-center justify-center p-6">
        <output aria-live="polite" className="text-sm text-steel">
          Loading…
        </output>
      </main>
    );
  }

  return (
    <main className="flex-1 space-y-6 p-6">
      <DashboardHeader
        filters={filters}
        onDateRangeChange={(dateRange) =>
          setFilters((f) => ({ ...f, dateRange }))
        }
        onCustomerChange={(customerId) =>
          setFilters((f) => ({ ...f, customerId, locationId: "" }))
        }
        onLocationChange={(locationId) =>
          setFilters((f) => ({ ...f, locationId }))
        }
        customerOptions={customerOptions}
        locationOptions={locationOptions}
        role={role}
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard
          icon={Truck}
          label="Active Loads"
          value={summary.activeLoads}
          hint={
            summary.activeLocationCount > 0
              ? `Across ${summary.activeLocationCount} location${summary.activeLocationCount === 1 ? "" : "s"}`
              : "Live"
          }
          href={`/loads?status=${encodeURIComponent(LOAD_STATUS_LABELS.in_progress)}`}
        />
        <StatCard
          icon={Users}
          label="Crew Working"
          value={summary.crewWorkingNow}
          hint="Live"
          href="#operations-now"
        />
        <StatCard
          icon={Clock}
          label="Crew On Break"
          value={summary.crewOnBreak}
          hint="Live"
          tone={summary.crewOnBreak > 0 ? "warning" : "default"}
          href="#workforce"
        />
        <StatCard
          icon={CheckCircle}
          label="Completed Today"
          value={summary.loadsCompletedToday}
          hint="Live"
        />
        <StatCard
          icon={AlertTriangle}
          label="Needs Review"
          value={summary.loadsNeedingReview}
          hint="Not yet closed"
          tone={summary.loadsNeedingReview > 0 ? "warning" : "default"}
          href={`/loads?status=${encodeURIComponent(LOAD_STATUS_LABELS.completed)}`}
        />
      </div>

      {showOperationsAndWorkforce && (
        <section id="operations-now">
          <SectionLabel title="Operations Now" badge="Live" />
          <Card>
            <OperationsNowTable rows={operationsNow} />
          </Card>
        </section>
      )}

      <section>
        <SectionLabel title="Attention Required" badge="Live" />
        <Card>
          <AttentionRequiredList items={attentionItems} />
        </Card>
      </section>

      {showFinancials && (
        <section>
          <SectionLabel
            title="Financial Workflow"
            badge={periodLabel}
            tone="period"
          />
          <Card>
            <FinancialWorkflowPanel summary={financialWorkflow} />
          </Card>
        </section>
      )}

      <section>
        <SectionLabel
          title="Performance Trends"
          badge={periodLabel}
          tone="period"
        />
        <div className="grid gap-4 lg:grid-cols-3">
          <Card title="Loads Completed">
            {loadsCompletedTrend.length ? (
              <LoadsCompletedTrendChart data={loadsCompletedTrend} />
            ) : (
              <EmptyChart message="No completed loads in this period." />
            )}
          </Card>
          <Card title="Billing vs Payroll Cost">
            {billingVsPayrollTrend.length ? (
              <BillingPayoutChart data={billingVsPayrollTrend} />
            ) : (
              <EmptyChart message="No billable activity in this period." />
            )}
          </Card>
          <Card title="Load Status">
            {statusDistribution.length ? (
              <LoadStatusDonutChart data={statusDistribution} />
            ) : (
              <EmptyChart message="No loads in this period." />
            )}
          </Card>
        </div>
      </section>

      <section>
        <SectionLabel
          title="Customer & Location Performance"
          badge={periodLabel}
          tone="period"
        />
        <div className="grid gap-4 lg:grid-cols-2">
          <Card title="Top Customers">
            <RankedPerformanceTable
              rows={customerRows}
              emptyMessage="No customer activity in this period."
            />
          </Card>
          <Card title="Top Locations">
            <RankedPerformanceTable
              rows={locationRows}
              emptyMessage="No location activity right now."
            />
          </Card>
        </div>
      </section>

      {showOperationsAndWorkforce && (
        <section id="workforce">
          <SectionLabel title="Workforce Overview" badge="Live" />
          <Card>
            <WorkforceOverview
              workingNow={workforce.workingNow}
              onBreak={workforce.onBreak}
              certificationAlerts={certificationAlerts}
            />
          </Card>
        </section>
      )}

      <section>
        <SectionLabel title="Recent Activity" badge="Live" />
        <Card>
          <RecentActivityFeed entries={recentActivity} />
        </Card>
      </section>
    </main>
  );
}
