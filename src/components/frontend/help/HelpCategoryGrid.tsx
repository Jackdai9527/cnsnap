"use client";

import type { ComponentType } from "react";
import {
  BadgeHelp,
  Calculator,
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
  Warehouse
} from "lucide-react";
import { useTranslations } from "next-intl";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { HelpCategory } from "@/types/help";

type HelpCategoryGridProps = {
  categories: HelpCategory[];
  selectedCategory: HelpCategory | null;
  onSelectCategory: (category: HelpCategory | null) => void;
};

const iconMap: Record<string, ComponentType<{ className?: string }>> = {
  BadgeHelp,
  Calculator,
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
  Warehouse
};

export function HelpCategoryGrid({ categories, selectedCategory, onSelectCategory }: HelpCategoryGridProps) {
  const t = useTranslations("HelpCenter.categoriesSection");

  return (
    <section className="site-container py-10">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="label">{t("eyebrow")}</div>
          <h2 className="mt-2 text-3xl font-black text-[#101828]">{t("title")}</h2>
          <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-[#667085]">{t("description")}</p>
        </div>
        {selectedCategory ? (
          <button
            type="button"
            className="h-10 rounded-full border border-[#dfe7f1] bg-white px-4 text-sm font-black text-[#344054] transition hover:border-[#0a83ff] hover:text-[#0a83ff]"
            onClick={() => onSelectCategory(null)}
          >
            {t("showAll")}
          </button>
        ) : null}
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {categories.map((category) => {
          const Icon = iconMap[category.icon] ?? BadgeHelp;
          const active = selectedCategory?.id === category.id;

          return (
            <button key={category.id} type="button" className="group h-full text-left" onClick={() => onSelectCategory(category)}>
              <Card
                className={cn(
                  "h-full border-[#dfe7f1] bg-white shadow-[0_18px_45px_rgba(15,23,42,0.05)] transition duration-200 group-hover:-translate-y-0.5 group-hover:border-[#0a83ff]",
                  active && "border-[#0a83ff] bg-[#f7fbff] ring-2 ring-[#d9e7ff]"
                )}
              >
                <CardContent className="flex h-full gap-4 p-5">
                  <span
                    className={cn(
                      "grid size-11 shrink-0 place-items-center rounded-2xl border border-[#dfe7f1] bg-[#f8fafc] text-[#667085]",
                      active && "border-[#0a83ff] bg-white text-[#0a83ff]"
                    )}
                  >
                    <Icon className="size-5" />
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-black text-[#101828]">{category.title}</h3>
                      <span className="rounded-full border border-[#dfe7f1] bg-white px-2 py-0.5 text-[11px] font-bold text-[#667085]">
                        {t("articleCount", { count: category.articleCount })}
                      </span>
                    </div>
                    <p className="mt-2 text-sm font-semibold leading-6 text-[#667085]">{category.description}</p>
                  </div>
                </CardContent>
              </Card>
            </button>
          );
        })}
      </div>
    </section>
  );
}
