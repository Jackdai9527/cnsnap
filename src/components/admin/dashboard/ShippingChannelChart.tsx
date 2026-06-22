"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { Bar, BarChart, CartesianGrid, Tooltip, XAxis, YAxis } from "recharts";
import { ChartCard } from "@/components/admin/charts/ChartCard";
import { DashboardChartContainer } from "@/components/admin/dashboard/DashboardChartContainer";
import type { DistributionPoint } from "@/types/dashboard";

type ShippingChannelChartProps = {
  data: DistributionPoint[];
  loading?: boolean;
};

export function ShippingChannelChart({ data, loading = false }: ShippingChannelChartProps) {
  const t = useTranslations("dashboard.charts.shippingChannel");
  const localizedData = useMemo(
    () => {
      const labelMap: Record<string, string> = {
        DHL: t("labels.dhl"),
        FedEx: t("labels.fedEx"),
        UPS: t("labels.ups"),
        EMS: t("labels.ems"),
        "Air Cargo": t("labels.airCargo"),
        "Sea Shipping": t("labels.seaShipping"),
        "Economy Line": t("labels.economyLine")
      };
      return data.map((item) => ({ ...item, label: labelMap[item.label] ?? item.label }));
    },
    [data, t]
  );

  return (
    <ChartCard title={t("title")} description={t("description")} loading={loading} empty={!localizedData.length} emptyText={t("empty")}>
      <DashboardChartContainer minHeight={220}>
        {({ width, height }) => (
          <BarChart width={width} height={height} data={localizedData} margin={{ top: 10, right: 18, left: 0, bottom: 34 }}>
            <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="4 4" vertical={false} />
            <XAxis dataKey="label" interval={0} angle={-24} textAnchor="end" tickLine={false} axisLine={false} tick={{ fill: "var(--chart-muted)", fontSize: 11 }} />
            <YAxis tickLine={false} axisLine={false} tick={{ fill: "var(--chart-muted)", fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="value" name={t("series.packages")} fill="var(--chart-3)" radius={[8, 8, 0, 0]} />
          </BarChart>
        )}
      </DashboardChartContainer>
    </ChartCard>
  );
}
