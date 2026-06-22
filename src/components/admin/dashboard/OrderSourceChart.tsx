"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { Cell, Pie, PieChart, Tooltip } from "recharts";
import { ChartCard } from "@/components/admin/charts/ChartCard";
import { DashboardChartContainer } from "@/components/admin/dashboard/DashboardChartContainer";
import type { DistributionPoint } from "@/types/dashboard";

type OrderSourceChartProps = {
  data: DistributionPoint[];
  loading?: boolean;
};

const chartColors = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)", "var(--chart-success)"];

export function OrderSourceChart({ data, loading = false }: OrderSourceChartProps) {
  const t = useTranslations("dashboard.charts.orderSource");
  const localizedData = useMemo(
    () => {
      const labelMap: Record<string, string> = {
        "URL Search": t("labels.urlSearch"),
        "Keyword Search": t("labels.keywordSearch"),
        "Image Search": t("labels.imageSearch"),
        "Shop Search": t("labels.shopSearch"),
        "DIY Order": t("labels.diyOrder"),
        "Admin Created": t("labels.adminCreated")
      };
      return data.map((item) => ({ ...item, label: labelMap[item.label] ?? item.label }));
    },
    [data, t]
  );

  return (
    <ChartCard title={t("title")} description={t("description")} loading={loading} empty={!localizedData.length} emptyText={t("empty")}>
      <div className="grid h-full min-w-0 grid-rows-[minmax(0,1fr)_auto] gap-3">
        <DashboardChartContainer minHeight={220}>
          {({ width, height }) => (
            <PieChart width={width} height={height}>
              <Pie data={localizedData} dataKey="value" nameKey="label" innerRadius="50%" outerRadius="84%" paddingAngle={2}>
                {localizedData.map((item, index) => (
                  <Cell key={item.label} fill={chartColors[index % chartColors.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          )}
        </DashboardChartContainer>
        <div className="grid gap-2 sm:grid-cols-2">
          {localizedData.map((item, index) => (
            <div key={item.label} className="flex items-center justify-between gap-3 text-xs font-bold text-slate-600">
              <span className="flex min-w-0 items-center gap-2">
                <span className="size-2.5 rounded-full" style={{ background: chartColors[index % chartColors.length] }} />
                <span className="truncate">{item.label}</span>
              </span>
              <span className="tabular-nums text-slate-950">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </ChartCard>
  );
}
