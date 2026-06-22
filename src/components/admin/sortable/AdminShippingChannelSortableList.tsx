"use client";

import { Loader2, Save } from "lucide-react";
import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { updateSortOrder } from "@/app/_admin/actions";
import { SortableList } from "@/components/admin/sortable/SortableList";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type AdminShippingChannelSortableItem = {
  id: number;
  name: string;
  code: string;
  isActive: boolean;
  countryCount: number;
  rateCount: number;
  deliveryTime: string;
};

type AdminShippingChannelSortableListProps = {
  items: AdminShippingChannelSortableItem[];
};

export function AdminShippingChannelSortableList({ items }: AdminShippingChannelSortableListProps) {
  const t = useTranslations("shipping.page.sortable");
  const [orderedItems, setOrderedItems] = useState(items);
  const [isPending, startTransition] = useTransition();

  function persistOrder(nextItems: AdminShippingChannelSortableItem[]) {
    const previousItems = orderedItems;
    setOrderedItems(nextItems);

    const formData = new FormData();
    formData.set("entity", "shipping_channels");
    formData.set("ids", nextItems.map((item) => item.id).join(","));

    startTransition(async () => {
      try {
        await updateSortOrder(formData);
        toast.success(t("saved"));
      } catch (error) {
        setOrderedItems(previousItems);
        toast.error(error instanceof Error ? error.message : t("saveFailed"));
      }
    });
  }

  return (
    <Card className="mb-5 border-sky-100 bg-white shadow-[0_14px_40px_rgba(15,23,42,0.06)]">
      <CardHeader className="gap-1">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>{t("title")}</CardTitle>
            <CardDescription>{t("description")}</CardDescription>
          </div>
          <Button variant="outline" size="sm" disabled={isPending} className="gap-2">
            {isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            {isPending ? t("saving") : t("autoSaves")}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {orderedItems.length ? (
          <SortableList
            items={orderedItems}
            onReorder={persistOrder}
            renderItem={(item, meta) => (
              <SortableShippingChannelCard
                item={item}
                index={meta.index}
                isDragging={meta.isDragging}
              />
            )}
          />
        ) : (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm font-semibold text-slate-500">
            {t("empty")}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function SortableShippingChannelCard({
  index,
  isDragging,
  item
}: {
  index: number;
  isDragging: boolean;
  item: AdminShippingChannelSortableItem;
}) {
  const t = useTranslations("shipping.page.sortable");
  return (
    <div
      className={cn(
        "grid gap-3 rounded-xl border border-slate-200 bg-white p-3 md:grid-cols-[auto_auto_minmax(0,1fr)_auto]",
        isDragging ? "border-sky-300 bg-sky-50" : "hover:border-sky-200"
      )}
    >
      <div className="flex items-center gap-3">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-black text-slate-600">
          {index + 1}
        </div>
      </div>
      <span className={cn("w-fit self-center rounded-full px-2.5 py-1 text-xs font-black", item.isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500")}>
        {item.isActive ? t("active") : t("inactive")}
      </span>
      <div className="min-w-0">
        <div className="truncate text-sm font-black text-slate-900">{item.name}</div>
        <div className="mt-1 text-xs font-semibold text-slate-500">{item.code}</div>
      </div>
      <div className="grid grid-cols-3 gap-2 text-right text-xs font-bold text-slate-500 md:min-w-[260px]">
        <span>{t("countryCount", { count: item.countryCount })}</span>
        <span>{t("rateCount", { count: item.rateCount })}</span>
        <span>{item.deliveryTime}</span>
      </div>
    </div>
  );
}
