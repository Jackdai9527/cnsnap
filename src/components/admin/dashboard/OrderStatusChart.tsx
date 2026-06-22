"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { Bar, BarChart, CartesianGrid, Tooltip, XAxis, YAxis } from "recharts";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { ChartCard } from "@/components/admin/charts/ChartCard";
import { DashboardChartContainer } from "@/components/admin/dashboard/DashboardChartContainer";
import type { DistributionPoint } from "@/types/dashboard";

type OrderStatusChartProps = {
  data: DistributionPoint[];
  loading?: boolean;
};

export function OrderStatusChart({ data, loading = false }: OrderStatusChartProps) {
  const t = useTranslations("dashboard.charts.orderStatus");
  const localizedData = useMemo(
    () => {
      const labelMap: Record<string, string> = {
        pending_payment: t("statuses.pendingPayment"),
        paid: t("statuses.paid"),
        purchasing: t("statuses.purchasing"),
        warehouse_pending: t("statuses.warehousePending"),
        shipping_pending: t("statuses.shippingPending"),
        shipped: t("statuses.shipped"),
        completed: t("statuses.completed"),
        cancelled: t("statuses.cancelled"),
        refunded: t("statuses.refunded"),
        abnormal: t("statuses.abnormal")
      };
      return data.map((item) => ({ ...item, label: item.status ? (labelMap[item.status] ?? item.label) : item.label }));
    },
    [data, t]
  );

  return (
    <ChartCard
      title={t("title")}
      description={t("description")}
      loading={loading}
      empty={!localizedData.length}
      emptyText={t("empty")}
      className="xl:col-span-2"
      heightClassName="h-[350px]"
    >
      <div className="grid h-full min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
        <DashboardChartContainer minHeight={260}>
          {({ width, height }) => (
            <BarChart width={width} height={height} data={localizedData} margin={{ top: 8, right: 16, left: 0, bottom: 42 }}>
              <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="4 4" vertical={false} />
              <XAxis dataKey="label" interval={0} angle={-28} textAnchor="end" tickLine={false} axisLine={false} tick={{ fill: "var(--chart-muted)", fontSize: 11 }} />
              <YAxis tickLine={false} axisLine={false} tick={{ fill: "var(--chart-muted)", fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="value" name={t("series.orders")} fill="var(--chart-1)" radius={[8, 8, 0, 0]} />
            </BarChart>
          )}
        </DashboardChartContainer>
        <div className="hidden content-start gap-2 overflow-hidden lg:grid">
          {localizedData.map((item) => (
            <div key={item.label} className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-2">
              <StatusBadge status={item.status ?? item.label.toLowerCase().replaceAll(" ", "_")} kind="order" />
              <span className="text-sm font-black tabular-nums text-slate-900">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </ChartCard>
  );
}
