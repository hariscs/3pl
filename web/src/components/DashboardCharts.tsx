"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type DayPoint = {
  label: string;
  loads: number;
  billed: number;
  payout: number;
};

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

export function LoadsPerDayChart({ data }: { data: DayPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -14 }}>
        <CartesianGrid
          stroke={gridStroke}
          strokeDasharray="3 3"
          vertical={false}
        />
        <XAxis
          dataKey="label"
          tick={axisTick}
          tickLine={false}
          axisLine={{ stroke: gridStroke }}
        />
        <YAxis
          allowDecimals={false}
          tick={axisTick}
          tickLine={false}
          axisLine={false}
          width={32}
        />
        <Tooltip
          cursor={{ fill: "var(--color-rust-soft)" }}
          contentStyle={tooltipStyle}
          labelStyle={tooltipLabelStyle}
        />
        <Bar
          dataKey="loads"
          name="Loads"
          fill="var(--color-chart-1)"
          radius={[4, 4, 0, 0]}
          maxBarSize={34}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function BillingPayoutChart({ data }: { data: DayPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -4 }}>
        <CartesianGrid
          stroke={gridStroke}
          strokeDasharray="3 3"
          vertical={false}
        />
        <XAxis
          dataKey="label"
          tick={axisTick}
          tickLine={false}
          axisLine={{ stroke: gridStroke }}
        />
        <YAxis
          tickFormatter={money}
          tick={axisTick}
          tickLine={false}
          axisLine={false}
          width={56}
        />
        <Tooltip
          cursor={{ fill: "var(--color-rust-soft)" }}
          contentStyle={tooltipStyle}
          labelStyle={tooltipLabelStyle}
          formatter={(value) => money(Number(value))}
        />
        <Legend
          iconType="circle"
          wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
        />
        <Bar
          dataKey="billed"
          name="Billed"
          fill="var(--color-chart-1)"
          radius={[4, 4, 0, 0]}
          maxBarSize={18}
        />
        <Bar
          dataKey="payout"
          name="Payout"
          fill="var(--color-chart-2)"
          radius={[4, 4, 0, 0]}
          maxBarSize={18}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
