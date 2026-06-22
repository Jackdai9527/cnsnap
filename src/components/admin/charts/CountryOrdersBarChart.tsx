"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartCard } from "@/components/admin/charts/ChartCard";
import type { CountryOrdersPoint } from "@/types/admin-dashboard";

type CountryOrdersBarChartProps = {
  data: CountryOrdersPoint[];
  loading?: boolean;
};

export function CountryOrdersBarChart({ data, loading }: CountryOrdersBarChartProps) {
  return (
    <ChartCard title="Country Orders" description="Destination countries with the highest order volume." loading={loading} empty={!data.length}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 18, left: 24, bottom: 0 }}>
          <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="4 4" horizontal={false} />
          <XAxis type="number" tickLine={false} axisLine={false} tick={{ fill: "var(--chart-muted)", fontSize: 12 }} />
          <YAxis
            type="category"
            dataKey="country"
            width={92}
            tickLine={false}
            axisLine={false}
            tick={{ fill: "var(--chart-muted)", fontSize: 12 }}
          />
          <Tooltip />
          <Bar dataKey="orders" name="Orders" fill="var(--chart-2)" radius={[0, 8, 8, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
