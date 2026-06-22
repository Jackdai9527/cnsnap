"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartCard } from "@/components/admin/charts/ChartCard";
import type { ApiUsagePoint } from "@/types/admin-dashboard";

type ApiUsageChartProps = {
  data: ApiUsagePoint[];
  loading?: boolean;
};

export function ApiUsageChart({ data, loading }: ApiUsageChartProps) {
  return (
    <ChartCard
      title="OneBound API Usage"
      description="Successful and failed product API calls."
      loading={loading}
      empty={!data.length}
      className="xl:col-span-2"
      heightClassName="h-[330px]"
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 18, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="4 4" vertical={false} />
          <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fill: "var(--chart-muted)", fontSize: 12 }} />
          <YAxis tickLine={false} axisLine={false} tick={{ fill: "var(--chart-muted)", fontSize: 12 }} />
          <Tooltip />
          <Area type="monotone" dataKey="success" name="Success" stroke="var(--chart-success)" fill="var(--chart-success)" fillOpacity={0.16} strokeWidth={2.5} />
          <Area type="monotone" dataKey="failed" name="Failed" stroke="var(--chart-danger)" fill="var(--chart-danger)" fillOpacity={0.12} strokeWidth={2.5} />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
