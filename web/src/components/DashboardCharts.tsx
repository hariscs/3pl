"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type {
  BillingPayoutPoint,
  StatusDistributionSlice,
  TrendPoint,
} from "@/lib/dashboard";
import type { LoadStatus } from "@/lib/types";

const axisTick = { fontSize: 12, fill: "var(--color-steel)" };
const gridStroke = "var(--color-manila-dark)";
const tooltipStyle = {
  borderRadius: 12,
  border: "1px solid var(--color-manila-dark)",
  boxShadow: "0 8px 24px rgb(15 23 42 / 0.10)",
  fontSize: 12,
};
const tooltipLabelStyle = { color: "var(--color-ink)", fontWeight: 600 };

function money(n: number) {
  return `$${Math.round(n).toLocaleString()}`;
}

export function EmptyChart({ message }: { message: string }) {
  return (
    <div className="flex h-55 items-center justify-center text-center text-sm text-steel-light">
      {message}
    </div>
  );
}

/** Loads Completed Over Time — one point per day within the selected
 * period, counted by completedAt (draft/in-progress loads never appear). */
export function LoadsCompletedTrendChart({ data }: { data: TrendPoint[] }) {
  return (
    <ResponsiveContainer
      width="100%"
      height={220}
      role="img"
      aria-label="Line chart of loads completed per day"
    >
      <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -14 }}>
        <defs>
          <linearGradient id="loadsCompletedFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.25} />
            <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={gridStroke} strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="label" tick={axisTick} tickLine={false} axisLine={{ stroke: gridStroke }} />
        <YAxis allowDecimals={false} tick={axisTick} tickLine={false} axisLine={false} width={32} />
        <Tooltip
          cursor={{ stroke: "var(--color-chart-1)", strokeWidth: 1 }}
          contentStyle={tooltipStyle}
          labelStyle={tooltipLabelStyle}
          formatter={(value) => [value, "Completed"]}
        />
        <Area
          type="monotone"
          dataKey="value"
          name="Completed"
          stroke="var(--color-chart-1)"
          strokeWidth={2}
          fill="url(#loadsCompletedFill)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

/** Billing vs Payroll Cost — grouped bars, sourced from completed/closed
 * loads' billedAmount/payoutAmount snapshots within the selected period. */
export function BillingPayoutChart({ data }: { data: BillingPayoutPoint[] }) {
  return (
    <ResponsiveContainer
      width="100%"
      height={220}
      role="img"
      aria-label="Bar chart comparing billed and payroll cost amounts per day"
    >
      <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -4 }}>
        <CartesianGrid stroke={gridStroke} strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="label" tick={axisTick} tickLine={false} axisLine={{ stroke: gridStroke }} />
        <YAxis tickFormatter={money} tick={axisTick} tickLine={false} axisLine={false} width={56} />
        <Tooltip
          cursor={{ fill: "var(--color-rust-soft)" }}
          contentStyle={tooltipStyle}
          labelStyle={tooltipLabelStyle}
          formatter={(value) => money(Number(value))}
        />
        <Legend iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
        <Bar dataKey="billed" name="Billed" fill="var(--color-chart-1)" radius={[4, 4, 0, 0]} maxBarSize={18} />
        <Bar dataKey="payout" name="Payroll Cost" fill="var(--color-chart-2)" radius={[4, 4, 0, 0]} maxBarSize={18} />
      </BarChart>
    </ResponsiveContainer>
  );
}

const STATUS_DONUT_COLORS: Record<LoadStatus, string> = {
  draft: "var(--color-steel-light)",
  scheduled: "var(--color-chart-1)",
  in_progress: "var(--color-chart-3)",
  paused: "var(--color-amber)",
  completed: "var(--color-chart-4)",
  closed: "var(--color-freight)",
  cancelled: "var(--color-stamp)",
};

/** Load Status Distribution — compact donut over loads within the selected
 * period/scope. Only statuses with at least one load render a slice. */
export function LoadStatusDonutChart({ data }: { data: StatusDistributionSlice[] }) {
  const total = data.reduce((s, d) => s + d.count, 0);
  return (
    <div className="flex items-center gap-4">
      <ResponsiveContainer
        width={140}
        height={140}
        role="img"
        aria-label="Donut chart of load status distribution"
      >
        <PieChart>
          <Pie
            data={data}
            dataKey="count"
            nameKey="label"
            innerRadius={42}
            outerRadius={64}
            paddingAngle={data.length > 1 ? 2 : 0}
            stroke="none"
          >
            {data.map((slice) => (
              <Cell key={slice.status} fill={STATUS_DONUT_COLORS[slice.status]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={tooltipStyle}
            labelStyle={tooltipLabelStyle}
            formatter={(value, _name, item) => [value, item?.payload?.label ?? ""]}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex-1 space-y-1.5">
        {data.map((slice) => (
          <div key={slice.status} className="flex items-center gap-2 text-xs">
            <span
              className="h-2 w-2 flex-none rounded-full"
              style={{ backgroundColor: STATUS_DONUT_COLORS[slice.status] }}
            />
            <span className="flex-1 truncate text-steel">{slice.label}</span>
            <span className="font-tick font-medium text-ink">{slice.count}</span>
            <span className="w-9 flex-none text-right text-steel-light">
              {total > 0 ? `${Math.round((slice.count / total) * 100)}%` : "—"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
