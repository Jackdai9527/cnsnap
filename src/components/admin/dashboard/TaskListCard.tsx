"use client";

import Link from "next/link";
import { ArrowRight, Clock3 } from "lucide-react";
import { useTranslations } from "next-intl";
import { MoneyDisplay } from "@/components/admin/MoneyDisplay";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { EmptyState } from "@/components/admin/EmptyState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { TaskItem } from "@/types/dashboard";

type TaskListCardProps = {
  title: string;
  description: string;
  items: TaskItem[];
  loading?: boolean;
  className?: string;
};

export function TaskListCard({ title, description, items, loading = false, className }: TaskListCardProps) {
  const t = useTranslations("dashboard.tasks");

  return (
    <Card className={cn("border-slate-200/80 bg-white shadow-[0_12px_32px_rgba(15,23,42,0.04)]", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base font-black text-slate-950">{title}</CardTitle>
            <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
          </div>
          <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-black tabular-nums text-slate-600">
            {loading ? "-" : items.length}
          </span>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {loading ? (
          <TaskSkeleton />
        ) : items.length ? (
          <div className="divide-y divide-slate-100">
            {items.map((item) => (
              <Link key={item.id} href={item.href} className="group grid gap-2 py-3 first:pt-0 last:pb-0">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex min-w-0 flex-wrap items-center gap-2">
                      <span className="truncate text-sm font-black text-slate-900">{item.primaryRef}</span>
                      {item.status ? <StatusBadge status={item.status} kind={statusKindForTask(item.type)} /> : null}
                    </div>
                    <p className="mt-1 line-clamp-1 text-xs font-semibold text-slate-500">{item.message ?? item.itemTitle ?? item.user ?? item.title}</p>
                  </div>
                  <ArrowRight className="mt-1 size-4 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-sky-500" />
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-bold text-slate-400">
                  {item.amountUsd !== undefined ? <MoneyDisplay amount={item.amountUsd} currency="USD" className="[&>span:first-child]:text-xs [&>span:first-child]:text-slate-700 [&>span:first-child]:font-black" /> : null}
                  {item.shippingFeeUsd !== undefined ? <MoneyDisplay amount={item.shippingFeeUsd} currency="USD" className="[&>span:first-child]:text-xs [&>span:first-child]:text-slate-700 [&>span:first-child]:font-black" /> : null}
                  {item.channel ? <span>{item.channel}</span> : null}
                  {item.trackingNumber ? <span className="font-mono">{item.trackingNumber}</span> : null}
                  {item.user ? <span className="max-w-[190px] truncate">{item.user}</span> : null}
                  <span className="inline-flex items-center gap-1">
                    <Clock3 className="size-3" />
                    {item.waitingFor}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState title={t("emptyQueueTitle")} description={t("emptyQueueDescription")} className="min-h-48 border-slate-100 bg-slate-50/60" />
        )}
      </CardContent>
    </Card>
  );
}

function TaskSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="space-y-2 border-b border-slate-100 pb-3 last:border-b-0 last:pb-0">
          <div className="h-4 w-36 animate-pulse rounded-full bg-slate-100" />
          <div className="h-3 w-full animate-pulse rounded-full bg-slate-100" />
          <div className="h-3 w-2/3 animate-pulse rounded-full bg-slate-100" />
        </div>
      ))}
    </div>
  );
}

function statusKindForTask(type: TaskItem["type"]) {
  if (type.includes("shipping")) return "shipping";
  if (type.includes("warehouse")) return "warehouse";
  if (type.includes("purchase")) return "purchase";
  if (type.includes("api")) return "risk";
  return "default";
}
