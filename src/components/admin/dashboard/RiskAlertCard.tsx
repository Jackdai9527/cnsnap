"use client";

import Link from "next/link";
import { AlertTriangle, ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { RiskAlert } from "@/types/dashboard";

type RiskAlertCardProps = {
  data?: RiskAlert;
  loading?: boolean;
};

const riskRows: Array<{ key: keyof RiskAlert; href: string; tone: string }> = [
  { key: "riskOrders", href: "/admin/orders?riskStatus=pending_review", tone: "bg-amber-50 text-amber-700" },
  { key: "sensitiveGoodsOrders", href: "/admin/orders?riskStatus=sensitive", tone: "bg-orange-50 text-orange-700" },
  { key: "forbiddenGoodsOrders", href: "/admin/orders?riskStatus=restricted", tone: "bg-rose-50 text-rose-700" },
  { key: "highValueGoodsOrders", href: "/admin/orders?riskStatus=high_value", tone: "bg-sky-50 text-sky-700" },
  { key: "paymentAbnormalOrders", href: "/admin/finance/payments?status=abnormal", tone: "bg-red-50 text-red-700" },
  { key: "riskUsers", href: "/admin/users?riskStatus=pending_review", tone: "bg-slate-100 text-slate-700" }
];

export function RiskAlertCard({ data, loading = false }: RiskAlertCardProps) {
  const t = useTranslations("dashboard.riskAlerts");

  return (
    <Card className="border-slate-200/80 bg-white shadow-[0_12px_32px_rgba(15,23,42,0.04)]">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="grid size-9 place-items-center rounded-xl border border-rose-100 bg-rose-50 text-rose-600">
            <AlertTriangle className="size-4" />
          </div>
          <div>
            <CardTitle className="text-base font-black text-slate-950">{t("title")}</CardTitle>
            <p className="text-sm leading-6 text-slate-500">{t("description")}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {loading || !data ? (
          <div className="grid gap-2">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-12 animate-pulse rounded-xl bg-slate-100" />
            ))}
          </div>
        ) : (
          <div className="grid gap-2">
            {riskRows.map((row) => (
              <Link key={row.key} href={row.href} className="group flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-2.5 transition hover:border-rose-100 hover:bg-white">
                <span className="text-sm font-bold text-slate-700">{t(`rows.${row.key}`)}</span>
                <span className="flex items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-black tabular-nums ${row.tone}`}>{data[row.key]}</span>
                  <ArrowRight className="size-4 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-rose-500" />
                </span>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
