"use client";

import Link from "next/link";
import { ArrowUpRight, CircleDollarSign, Clock3, PackageCheck, ShieldAlert, ShoppingBag } from "lucide-react";
import { useTranslations } from "next-intl";
import { MoneyDisplay } from "@/components/admin/MoneyDisplay";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { DashboardMetric } from "@/types/dashboard";

type DashboardMetricCardProps = {
  metric: DashboardMetric;
  loading?: boolean;
};

const toneClasses: Record<NonNullable<DashboardMetric["tone"]>, string> = {
  default: "border-slate-200 bg-slate-50 text-slate-700",
  info: "border-sky-200 bg-sky-50 text-sky-700",
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  warning: "border-amber-200 bg-amber-50 text-amber-700",
  danger: "border-rose-200 bg-rose-50 text-rose-700"
};

export function DashboardMetricCard({ metric, loading = false }: DashboardMetricCardProps) {
  const tone = metric.tone ?? "default";
  const t = useTranslations("dashboard.metricsCatalog");
  const labelMap: Record<string, string> = {
    "today-orders": t("todayOrders.label"),
    "today-paid-orders": t("todayPaidOrders.label"),
    "today-paid-amount": t("todayPaidAmount.label"),
    "pending-purchase": t("pendingPurchase.label"),
    purchasing: t("purchasing.label"),
    "warehouse-pending": t("warehousePending.label"),
    "pending-weight": t("pendingWeight.label"),
    "waiting-shipping-payment": t("waitingShippingPayment.label"),
    "ready-to-ship": t("readyToShip.label"),
    "risk-orders": t("riskOrders.label"),
    "refund-pending": t("refundPending.label"),
    "api-errors-today": t("apiErrorsToday.label")
  };
  const descriptionMap: Record<string, string> = {
    "today-orders": t("todayOrders.description"),
    "today-paid-orders": t("todayPaidOrders.description"),
    "today-paid-amount": t("todayPaidAmount.description"),
    "pending-purchase": t("pendingPurchase.description"),
    purchasing: t("purchasing.description"),
    "warehouse-pending": t("warehousePending.description"),
    "pending-weight": t("pendingWeight.description"),
    "waiting-shipping-payment": t("waitingShippingPayment.description"),
    "ready-to-ship": t("readyToShip.description"),
    "risk-orders": t("riskOrders.description"),
    "refund-pending": t("refundPending.description"),
    "api-errors-today": t("apiErrorsToday.description")
  };
  const localizedLabel = labelMap[metric.id] ?? metric.label;
  const localizedDescription = descriptionMap[metric.id] ?? metric.description;
  const localizedSecondaryLabel = metric.secondaryLabel === "CNY estimate" ? t("common.cnyEstimate") : metric.secondaryLabel;

  return (
    <Card className="group border-slate-200/80 bg-white shadow-[0_12px_32px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-[0_18px_44px_rgba(15,23,42,0.07)]">
      <Link href={metric.href} className="block h-full">
        <CardContent className="flex h-full flex-col gap-3 p-4">
          {loading ? (
            <MetricSkeleton />
          ) : (
            <>
              <div className="flex items-start justify-between gap-3">
                <div className={cn("grid size-10 place-items-center rounded-xl border", toneClasses[tone])}>
                  <MetricIcon id={metric.id} />
                </div>
                <ArrowUpRight className="size-4 text-slate-300 transition group-hover:text-sky-500" />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-black uppercase text-slate-400">{localizedLabel}</div>
                <div className="mt-1 text-2xl font-black tabular-nums text-slate-950">
                  <MetricValue metric={metric} />
                </div>
                {metric.secondaryValue !== undefined && metric.format !== "money" ? (
                  <div className="mt-1 text-xs font-bold text-slate-400">
                    {localizedSecondaryLabel}: {metric.secondaryValue.toLocaleString()}
                  </div>
                ) : null}
                <p className="mt-2 line-clamp-2 text-xs font-semibold leading-5 text-slate-500">{localizedDescription}</p>
              </div>
            </>
          )}
        </CardContent>
      </Link>
    </Card>
  );
}

function MetricValue({ metric }: { metric: DashboardMetric }) {
  if (metric.format === "money") {
    return (
      <MoneyDisplay
        amount={metric.value}
        currency={metric.currency ?? "USD"}
        secondaryAmount={metric.secondaryValue}
        secondaryCurrency="CNY"
        className="[&>span:first-child]:text-2xl [&>span:first-child]:font-black"
      />
    );
  }

  if (metric.format === "percent") {
    return <>{metric.value.toFixed(1)}%</>;
  }

  if (metric.format === "milliseconds") {
    return <>{metric.value.toLocaleString()}ms</>;
  }

  return <>{metric.value.toLocaleString()}</>;
}

function MetricSkeleton() {
  return (
    <>
      <div className="flex items-center justify-between">
        <div className="size-10 animate-pulse rounded-xl bg-slate-100" />
        <div className="size-4 animate-pulse rounded-full bg-slate-100" />
      </div>
      <div className="space-y-2">
        <div className="h-3 w-24 animate-pulse rounded-full bg-slate-100" />
        <div className="h-7 w-28 animate-pulse rounded-full bg-slate-100" />
        <div className="h-3 w-full animate-pulse rounded-full bg-slate-100" />
      </div>
    </>
  );
}

function MetricIcon({ id }: { id: string }) {
  if (id.includes("paid") || id.includes("refund")) return <CircleDollarSign className="size-4" />;
  if (id.includes("warehouse") || id.includes("weight") || id.includes("ship")) return <PackageCheck className="size-4" />;
  if (id.includes("risk") || id.includes("api")) return <ShieldAlert className="size-4" />;
  if (id.includes("purchase")) return <Clock3 className="size-4" />;
  return <ShoppingBag className="size-4" />;
}
