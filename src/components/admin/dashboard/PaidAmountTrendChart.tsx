"use client";

import { Area, AreaChart, CartesianGrid, Tooltip, XAxis, YAxis } from "recharts";
import { useTranslations } from "next-intl";
import { ChartCard } from "@/components/admin/charts/ChartCard";
import { DashboardChartContainer } from "@/components/admin/dashboard/DashboardChartContainer";
import type { DashboardTrendPoint } from "@/types/dashboard";

type PaidAmountTrendChartProps = {
  data: DashboardTrendPoint[];
  loading?: boolean;
};

export function PaidAmountTrendChart({ data, loading = false }: PaidAmountTrendChartProps) {
  const t = useTranslations("dashboard.charts.paidAmountTrend");

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
          <AreaChart width={width} height={height} data={data} margin={{ top: 12, right: 18, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="4 4" vertical={false} />
            <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fill: "var(--chart-muted)", fontSize: 12 }} />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fill: "var(--chart-muted)", fontSize: 12 }}
              tickFormatter={(value) => `$${Math.round(Number(value) / 1000)}k`}
            />
            <Tooltip formatter={(value) => [`$${Number(value).toLocaleString()}`, ""]} />
            <Area type="monotone" dataKey="productPayment" name={t("series.productPayment")} stackId="1" stroke="var(--chart-1)" fill="var(--chart-1)" fillOpacity={0.22} />
            <Area type="monotone" dataKey="shippingPayment" name={t("series.shippingPayment")} stackId="1" stroke="var(--chart-3)" fill="var(--chart-3)" fillOpacity={0.2} />
            <Area type="monotone" dataKey="recharge" name={t("series.recharge")} stackId="1" stroke="var(--chart-4)" fill="var(--chart-4)" fillOpacity={0.18} />
            <Area type="monotone" dataKey="refund" name={t("series.refund")} stroke="var(--chart-danger)" fill="var(--chart-danger)" fillOpacity={0.1} />
          </AreaChart>
        )}
      </DashboardChartContainer>
    </ChartCard>
  );
}
