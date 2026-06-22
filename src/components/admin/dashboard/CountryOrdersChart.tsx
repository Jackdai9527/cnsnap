"use client";

import { Bar, BarChart, CartesianGrid, Tooltip, XAxis, YAxis } from "recharts";
import { useTranslations } from "next-intl";
import { ChartCard } from "@/components/admin/charts/ChartCard";
import { DashboardChartContainer } from "@/components/admin/dashboard/DashboardChartContainer";
import type { DistributionPoint } from "@/types/dashboard";

type CountryOrdersChartProps = {
  data: DistributionPoint[];
  loading?: boolean;
};

export function CountryOrdersChart({ data, loading = false }: CountryOrdersChartProps) {
  const t = useTranslations("dashboard.charts.countryOrders");

  return (
    <ChartCard title={t("title")} description={t("description")} loading={loading} empty={!data.length} emptyText={t("empty")}>
      <DashboardChartContainer minHeight={220}>
        {({ width, height }) => (
          <BarChart width={width} height={height} data={data} layout="vertical" margin={{ top: 8, right: 18, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="4 4" horizontal={false} />
            <XAxis type="number" tickLine={false} axisLine={false} tick={{ fill: "var(--chart-muted)", fontSize: 12 }} />
            <YAxis dataKey="label" type="category" width={46} tickLine={false} axisLine={false} tick={{ fill: "var(--chart-muted)", fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="value" name={t("series.orders")} fill="var(--chart-2)" radius={[0, 8, 8, 0]} />
          </BarChart>
        )}
      </DashboardChartContainer>
    </ChartCard>
  );
}
