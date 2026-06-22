"use client";

import type { ReactNode } from "react";
import { Activity, TimerReset, TriangleAlert } from "lucide-react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ApiHealth } from "@/types/dashboard";

type ApiHealthCardProps = {
  data?: ApiHealth;
  loading?: boolean;
};

export function ApiHealthCard({ data, loading = false }: ApiHealthCardProps) {
  const t = useTranslations("dashboard.apiHealth");
  const apiTypeLabels: Record<ApiHealth["typeDistribution"][number]["type"], string> = {
    detail: t("apiTypes.detail"),
    search: t("apiTypes.search"),
    image: t("apiTypes.image"),
    shop: t("apiTypes.shop"),
    price_refresh: t("apiTypes.priceRefresh")
  };
  const errorReasonLabels: Record<string, string> = {
    "seller throttled item detail": t("errorReasons.sellerThrottledItemDetail"),
    "variant image missing": t("errorReasons.variantImageMissing"),
    "search timeout": t("errorReasons.searchTimeout"),
    "price refresh mismatch": t("errorReasons.priceRefreshMismatch"),
    "shop page unavailable": t("errorReasons.shopPageUnavailable")
  };

  return (
    <Card className="border-slate-200/80 bg-white shadow-[0_12px_32px_rgba(15,23,42,0.04)]">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-black text-slate-950">{t("title")}</CardTitle>
        <p className="text-sm leading-6 text-slate-500">{t("description")}</p>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        {loading || !data ? (
          <HealthSkeleton />
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2">
              <HealthStat icon={<Activity className="size-4" />} label={t("stats.callsToday")} value={data.totalCallsToday.toLocaleString()} />
              <HealthStat icon={<TriangleAlert className="size-4" />} label={t("stats.failed")} value={data.failedCallsToday.toLocaleString()} tone="danger" />
              <HealthStat icon={<Activity className="size-4" />} label={t("stats.successRate")} value={`${data.successRate.toFixed(2)}%`} tone="success" />
              <HealthStat icon={<TimerReset className="size-4" />} label={t("stats.avgResponse")} value={`${data.averageResponseMs}ms`} />
            </div>
            <div>
              <div className="text-xs font-black uppercase text-slate-400">{t("topErrorReasons")}</div>
              <div className="mt-2 space-y-2">
                {data.topErrorReasons.map((item) => (
                  <div key={item.reason} className="flex items-center justify-between gap-3 rounded-xl bg-rose-50/70 px-3 py-2 text-xs">
                    <span className="truncate font-bold text-rose-700">{errorReasonLabels[item.reason] ?? item.reason}</span>
                    <span className="font-black tabular-nums text-rose-800">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="text-xs font-black uppercase text-slate-400">{t("typeDistribution")}</div>
              <div className="mt-2 grid gap-2">
                {data.typeDistribution.map((item) => (
                  <div key={item.type} className="grid grid-cols-[96px_minmax(0,1fr)_42px] items-center gap-2 text-xs font-bold text-slate-600">
                    <span>{apiTypeLabels[item.type]}</span>
                    <span className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <span className="block h-full rounded-full bg-sky-500" style={{ width: `${Math.min(100, (item.count / data.totalCallsToday) * 100)}%` }} />
                    </span>
                    <span className="text-right tabular-nums text-slate-950">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function HealthStat({ icon, label, value, tone = "default" }: { icon: ReactNode; label: string; value: string; tone?: "default" | "success" | "danger" }) {
  const toneClass = tone === "success" ? "text-emerald-700 bg-emerald-50 border-emerald-100" : tone === "danger" ? "text-rose-700 bg-rose-50 border-rose-100" : "text-slate-700 bg-slate-50 border-slate-100";

  return (
    <div className={`rounded-xl border p-3 ${toneClass}`}>
      <div className="flex items-center gap-2 text-xs font-black uppercase opacity-80">
        {icon}
        {label}
      </div>
      <div className="mt-2 text-xl font-black tabular-nums">{value}</div>
    </div>
  );
}

function HealthSkeleton() {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-20 animate-pulse rounded-xl bg-slate-100" />
        ))}
      </div>
      <div className="h-32 animate-pulse rounded-xl bg-slate-100" />
      <div className="h-28 animate-pulse rounded-xl bg-slate-100" />
    </div>
  );
}
