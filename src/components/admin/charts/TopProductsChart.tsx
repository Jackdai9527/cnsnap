"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartCard } from "@/components/admin/charts/ChartCard";
import type { TopProductPoint } from "@/types/admin-dashboard";

type TopProductsChartProps = {
  data: TopProductPoint[];
  loading?: boolean;
};

export function TopProductsChart({ data, loading }: TopProductsChartProps) {
  return (
    <ChartCard
      title="Top Products"
      description="Products ranked by order count with revenue context."
      loading={loading}
      empty={!data.length}
      className="xl:col-span-2"
      heightClassName="h-[330px]"
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 18, left: 42, bottom: 0 }}>
          <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="4 4" horizontal={false} />
          <XAxis type="number" tickLine={false} axisLine={false} tick={{ fill: "var(--chart-muted)", fontSize: 12 }} />
          <YAxis
            type="category"
            dataKey="product"
            width={118}
            tickLine={false}
            axisLine={false}
            tick={{ fill: "var(--chart-muted)", fontSize: 12 }}
          />
          <Tooltip formatter={(value, name) => [name === "revenueUsd" ? `$${Number(value).toLocaleString()}` : value, name === "revenueUsd" ? "Revenue" : "Orders"]} />
          <Bar dataKey="orders" name="Orders" fill="var(--chart-1)" radius={[0, 8, 8, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
