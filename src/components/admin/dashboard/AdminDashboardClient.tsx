"use client";

import { useMemo, useState } from "react";
import { RefreshCcw, TriangleAlert } from "lucide-react";
import { useTranslations } from "next-intl";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { DashboardDateRangeSelect } from "@/components/admin/dashboard/DashboardDateRangeSelect";
import { DashboardMetricCard } from "@/components/admin/dashboard/DashboardMetricCard";
import { OrdersTrendChart } from "@/components/admin/dashboard/OrdersTrendChart";
import { PaidAmountTrendChart } from "@/components/admin/dashboard/PaidAmountTrendChart";
import { OrderStatusChart } from "@/components/admin/dashboard/OrderStatusChart";
import { PaymentMethodChart } from "@/components/admin/dashboard/PaymentMethodChart";
import { CountryOrdersChart } from "@/components/admin/dashboard/CountryOrdersChart";
import { ShippingChannelChart } from "@/components/admin/dashboard/ShippingChannelChart";
import { OrderSourceChart } from "@/components/admin/dashboard/OrderSourceChart";
import { TaskListCard } from "@/components/admin/dashboard/TaskListCard";
import { ApiHealthCard } from "@/components/admin/dashboard/ApiHealthCard";
import { RiskAlertCard } from "@/components/admin/dashboard/RiskAlertCard";
import { EmptyState } from "@/components/admin/EmptyState";
import { Button } from "@/components/ui/button";
import { useDashboardSummary } from "@/hooks/admin/useDashboardSummary";
import { useDashboardTrends } from "@/hooks/admin/useDashboardTrends";
import { useDashboardDistribution } from "@/hooks/admin/useDashboardDistribution";
import { useDashboardTasks } from "@/hooks/admin/useDashboardTasks";
import type { DashboardDateRange } from "@/types/dashboard";

export function AdminDashboardClient() {
  const t = useTranslations("dashboard");
  const [range, setRange] = useState<DashboardDateRange>("30d");
  const summary = useDashboardSummary("today");
  const trends = useDashboardTrends(range);
  const distribution = useDashboardDistribution(range);
  const tasks = useDashboardTasks(range);
  const hasError = summary.isError || trends.isError || distribution.isError || tasks.isError;
  const isRefreshing = summary.isFetching || trends.isFetching || distribution.isFetching || tasks.isFetching;
  const metrics = summary.data?.metrics ?? [];
  const taskSections = useMemo(
    () => [
      {
        title: t("tasks.pendingPurchase.title"),
        description: t("tasks.pendingPurchase.description"),
        items: tasks.data?.pendingPurchaseOrders ?? []
      },
      {
        title: t("tasks.overduePurchase.title"),
        description: t("tasks.overduePurchase.description"),
        items: tasks.data?.overduePurchaseOrders ?? []
      },
      {
        title: t("tasks.warehouseAbnormal.title"),
        description: t("tasks.warehouseAbnormal.description"),
        items: tasks.data?.warehouseAbnormal ?? []
      },
      {
        title: t("tasks.waitingShippingPayment.title"),
        description: t("tasks.waitingShippingPayment.description"),
        items: tasks.data?.waitingShippingPayment ?? []
      },
      {
        title: t("tasks.readyToShip.title"),
        description: t("tasks.readyToShip.description"),
        items: tasks.data?.readyToShip ?? []
      },
      {
        title: t("tasks.shippingExceptions.title"),
        description: t("tasks.shippingExceptions.description"),
        items: tasks.data?.shippingExceptions ?? []
      },
      {
        title: t("tasks.apiErrors.title"),
        description: t("tasks.apiErrors.description"),
        items: tasks.data?.apiErrors ?? []
      }
    ],
    [tasks.data, t]
  );

  const refetchAll = () => {
    void summary.refetch();
    void trends.refetch();
    void distribution.refetch();
    void tasks.refetch();
  };

  return (
    <section className="space-y-5">
      <AdminPageHeader
        title={t("page.title")}
        description={t("page.description")}
        action={
          <div className="flex items-center gap-2">
            <DashboardDateRangeSelect value={range} onValueChange={setRange} />
            <Button type="button" variant="outline" size="sm" className="rounded-full bg-white" disabled={isRefreshing} onClick={refetchAll}>
              <RefreshCcw className={isRefreshing ? "size-4 animate-spin" : "size-4"} />
              {t("actions.refresh")}
            </Button>
          </div>
        }
      />

      {hasError ? <DashboardError onRetry={refetchAll} /> : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-6">
        {summary.isLoading
          ? Array.from({ length: 12 }).map((_, index) => <DashboardMetricSkeleton key={index} />)
          : metrics.map((metric) => <DashboardMetricCard key={metric.id} metric={metric} />)}
      </div>

      <div className="grid gap-5 xl:grid-cols-2 2xl:grid-cols-4">
        <OrdersTrendChart data={trends.data?.points ?? []} loading={trends.isLoading} />
        <PaidAmountTrendChart data={trends.data?.points ?? []} loading={trends.isLoading} />
        <OrderStatusChart data={distribution.data?.orderStatuses ?? []} loading={distribution.isLoading} />
        <PaymentMethodChart data={distribution.data?.paymentMethods ?? []} loading={distribution.isLoading} />
        <CountryOrdersChart data={distribution.data?.countryOrders ?? []} loading={distribution.isLoading} />
        <ShippingChannelChart data={distribution.data?.shippingChannels ?? []} loading={distribution.isLoading} />
        <OrderSourceChart data={distribution.data?.orderSources ?? []} loading={distribution.isLoading} />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(360px,0.65fr)]">
        <div className="grid gap-5 lg:grid-cols-2">
          {tasks.isLoading ? (
            Array.from({ length: 4 }).map((_, index) => (
              <TaskListCard key={index} title={t("tasks.loadingTitle")} description={t("tasks.loadingDescription")} items={[]} loading />
            ))
          ) : taskSections.some((section) => section.items.length) ? (
            taskSections.map((section) => <TaskListCard key={section.title} title={section.title} description={section.description} items={section.items} />)
          ) : (
            <EmptyState title={t("tasks.emptyTitle")} description={t("tasks.emptyDescription")} />
          )}
        </div>
        <div className="grid content-start gap-5">
          <ApiHealthCard data={summary.data?.apiHealth} loading={summary.isLoading} />
          <RiskAlertCard data={summary.data?.riskAlert} loading={summary.isLoading} />
        </div>
      </div>
    </section>
  );
}

function DashboardError({ onRetry }: { onRetry: () => void }) {
  const t = useTranslations("dashboard.errors");

  return (
    <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <TriangleAlert className="mt-0.5 size-5 shrink-0" />
          <div>
            <div className="font-black">{t("loadTitle")}</div>
            <p className="mt-1 font-medium">{t("loadDescription")}</p>
          </div>
        </div>
        <Button type="button" variant="outline" size="sm" className="rounded-full bg-white" onClick={onRetry}>
          {t("retry")}
        </Button>
      </div>
    </div>
  );
}

function DashboardMetricSkeleton() {
  return <div className="h-[156px] animate-pulse rounded-xl border border-slate-200 bg-white shadow-[0_12px_32px_rgba(15,23,42,0.04)]" />;
}
