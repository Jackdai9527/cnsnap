"use client";

import { useTranslations } from "next-intl";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { DashboardDateRange } from "@/types/dashboard";

type DashboardDateRangeSelectProps = {
  value: DashboardDateRange;
  onValueChange: (value: DashboardDateRange) => void;
};

export function DashboardDateRangeSelect({ value, onValueChange }: DashboardDateRangeSelectProps) {
  const t = useTranslations("dashboard.actions");
  const options: Array<{ value: DashboardDateRange; label: string }> = [
    { value: "today", label: t("today") },
    { value: "7d", label: t("last7d") },
    { value: "30d", label: t("last30d") },
    { value: "90d", label: t("last90d") }
  ];

  return (
    <div className="flex items-center gap-2">
      <span className="hidden text-xs font-black uppercase text-slate-400 sm:inline">{t("range")}</span>
      <Select value={value} onValueChange={(nextValue) => onValueChange((nextValue ?? "30d") as DashboardDateRange)}>
        <SelectTrigger className="h-9 min-w-[116px] rounded-full border-slate-200 bg-white px-3 font-bold text-slate-700">
          <SelectValue />
        </SelectTrigger>
        <SelectContent align="end">
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
