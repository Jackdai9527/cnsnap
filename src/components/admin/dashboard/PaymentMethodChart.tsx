"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { Cell, Pie, PieChart, Tooltip } from "recharts";
import { ChartCard } from "@/components/admin/charts/ChartCard";
import { DashboardChartContainer } from "@/components/admin/dashboard/DashboardChartContainer";
import type { DistributionPoint } from "@/types/dashboard";

type PaymentMethodChartProps = {
  data: DistributionPoint[];
  loading?: boolean;
};

const chartColors = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

export function PaymentMethodChart({ data, loading = false }: PaymentMethodChartProps) {
  const t = useTranslations("dashboard.charts.paymentMethod");
  const localizedData = useMemo(
    () => {
      const labelMap: Record<string, string> = {
        Wallet: t("labels.wallet"),
        PayPal: t("labels.payPal"),
        Stripe: t("labels.stripe"),
        "Manual Payment": t("labels.manualPayment"),
        "Credit Card": t("labels.creditCard")
      };
      return data.map((item) => ({ ...item, label: labelMap[item.label] ?? item.label }));
    },
    [data, t]
  );

  return (
    <ChartCard title={t("title")} description={t("description")} loading={loading} empty={!localizedData.length} emptyText={t("empty")} heightClassName="h-[300px]">
      <div className="grid h-full min-w-0 grid-rows-[minmax(0,1fr)_auto] gap-3">
        <DashboardChartContainer minHeight={220}>
          {({ width, height }) => (
            <PieChart width={width} height={height}>
              <Pie data={localizedData} dataKey="value" nameKey="label" innerRadius="58%" outerRadius="86%" paddingAngle={3}>
                {localizedData.map((item, index) => (
                  <Cell key={item.label} fill={chartColors[index % chartColors.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          )}
        </DashboardChartContainer>
        <LegendList data={localizedData} />
      </div>
    </ChartCard>
  );
}

function LegendList({ data }: { data: DistributionPoint[] }) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {data.map((item, index) => (
        <div key={item.label} className="flex items-center justify-between gap-3 text-xs font-bold text-slate-600">
          <span className="flex min-w-0 items-center gap-2">
            <span className="size-2.5 rounded-full" style={{ background: chartColors[index % chartColors.length] }} />
            <span className="truncate">{item.label}</span>
          </span>
          <span className="tabular-nums text-slate-950">{item.value}</span>
        </div>
      ))}
    </div>
  );
}
