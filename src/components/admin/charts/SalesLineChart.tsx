"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartCard } from "@/components/admin/charts/ChartCard";
import type { SalesTrendPoint } from "@/types/admin-dashboard";

type SalesLineChartProps = {
  data: SalesTrendPoint[];
  loading?: boolean;
};

export function SalesLineChart({ data, loading }: SalesLineChartProps) {
  return (
    <ChartCard
      title="Sales Trend"
      description="Gross sales and service fee revenue by day."
      loading={loading}
      empty={!data.length}
      className="xl:col-span-2"
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 18, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="4 4" vertical={false} />
          <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fill: "var(--chart-muted)", fontSize: 12 }} />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fill: "var(--chart-muted)", fontSize: 12 }}
            tickFormatter={(value) => `$${Number(value) / 1000}k`}
          />
          <Tooltip formatter={(value, name) => [`$${Number(value).toLocaleString()}`, name === "salesUsd" ? "Sales" : "Service fee"]} />
          <Line type="monotone" dataKey="salesUsd" stroke="var(--chart-1)" strokeWidth={3} dot={false} activeDot={{ r: 5 }} />
          <Line type="monotone" dataKey="serviceFeeUsd" stroke="var(--chart-2)" strokeWidth={2.5} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
