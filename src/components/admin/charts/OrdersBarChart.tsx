"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartCard } from "@/components/admin/charts/ChartCard";
import type { OrdersTrendPoint } from "@/types/admin-dashboard";

type OrdersBarChartProps = {
  data: OrdersTrendPoint[];
  loading?: boolean;
};

export function OrdersBarChart({ data, loading }: OrdersBarChartProps) {
  return (
    <ChartCard title="Orders Trend" description="Submitted orders compared with paid orders." loading={loading} empty={!data.length}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="4 4" vertical={false} />
          <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fill: "var(--chart-muted)", fontSize: 12 }} />
          <YAxis tickLine={false} axisLine={false} tick={{ fill: "var(--chart-muted)", fontSize: 12 }} />
          <Tooltip />
          <Bar dataKey="orders" name="Orders" fill="var(--chart-1)" radius={[8, 8, 0, 0]} />
          <Bar dataKey="paidOrders" name="Paid orders" fill="var(--chart-3)" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
