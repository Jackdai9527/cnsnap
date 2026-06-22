"use client";

import { Bar, CartesianGrid, ComposedChart, Line, Tooltip, XAxis, YAxis } from "recharts";
import { useTranslations } from "next-intl";
import { ChartCard } from "@/components/admin/charts/ChartCard";
import { DashboardChartContainer } from "@/components/admin/dashboard/DashboardChartContainer";
import type { DashboardTrendPoint } from "@/types/dashboard";

type OrdersTrendChartProps = {
  data: DashboardTrendPoint[];
  loading?: boolean;
};

export function OrdersTrendChart({ data, loading = false }: OrdersTrendChartProps) {
  const t = useTranslations("dashboard.charts.ordersTrend");

  return (
    <ChartCard
      title={t("title")}
      description={t("description")}
      loading={loading}
      empty={!data.length}
      emptyText={t("empty")}
      className="xl:col-span-2"
      heightClassName="h-[320px]"
    >
      <DashboardChartContainer minHeight={240}>
        {({ width, height }) => (
          <ComposedChart width={width} height={height} data={data} margin={{ top: 12, right: 18, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="4 4" vertical={false} />
            <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fill: "var(--chart-muted)", fontSize: 12 }} />
            <YAxis tickLine={false} axisLine={false} tick={{ fill: "var(--chart-muted)", fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="createdOrders" name={t("series.created")} fill="var(--chart-1)" radius={[8, 8, 0, 0]} />
            <Bar dataKey="paidOrders" name={t("series.paid")} fill="var(--chart-3)" radius={[8, 8, 0, 0]} />
            <Line type="monotone" dataKey="completedOrders" name={t("series.completed")} stroke="var(--chart-2)" strokeWidth={2.5} dot={false} />
          </ComposedChart>
        )}
      </DashboardChartContainer>
    </ChartCard>
  );
}
