"use client";

import type { ComponentType } from "react";
import {
  BadgeHelp,
  ClipboardList,
  CreditCard,
  MessageSquareText,
  Package,
  PenTool,
  RefreshCcw,
  Settings,
  Share2,
  ShieldAlert,
  ShoppingBag,
  Truck
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { HelpCategory } from "@/types/help";

type HelpCategoryCardProps = {
  category: HelpCategory;
  active?: boolean;
  onSelect: (category: HelpCategory) => void;
};

const iconMap: Record<string, ComponentType<{ className?: string }>> = {
  BadgeHelp,
  ClipboardList,
  CreditCard,
  MessageSquareText,
  Package,
  PenTool,
  RefreshCcw,
  Settings,
  Share2,
  ShieldAlert,
  ShoppingBag,
  Truck
};

export function HelpCategoryCard({ category, active, onSelect }: HelpCategoryCardProps) {
  const t = useTranslations("HelpCenter.categoriesSection");
  const Icon = iconMap[category.icon] ?? BadgeHelp;

  return (
    <button type="button" className="group block h-full text-left" onClick={() => onSelect(category)}>
      <Card
        className={cn(
          "h-full border-slate-200 bg-white/90 shadow-[0_18px_45px_rgba(15,23,42,0.05)] transition duration-200 group-hover:-translate-y-0.5 group-hover:border-sky-200 group-hover:bg-white",
          active && "border-pink-200 bg-gradient-to-br from-pink-50 to-sky-50 ring-1 ring-pink-100"
        )}
      >
        <CardContent className="flex h-full gap-4 p-4">
          <div
            className={cn(
              "grid size-11 shrink-0 place-items-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-500",
              active && "border-pink-200 bg-white text-pink-500"
            )}
          >
            <Icon className="size-5" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-black text-slate-950">{category.title}</h3>
              <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-bold text-slate-500">
                {t("articleCount", { count: category.articleCount })}
              </span>
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-500">{category.description}</p>
          </div>
        </CardContent>
      </Card>
    </button>
  );
}
