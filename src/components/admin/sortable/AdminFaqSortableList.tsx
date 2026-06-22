"use client";

import { Loader2, Save } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { updateSortOrder } from "@/app/_admin/actions";
import { SortableList } from "@/components/admin/sortable/SortableList";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type AdminFaqSortableItem = {
  id: number;
  title: string;
  slug: string;
  category: string;
  locale: string;
  isPublished: boolean;
};

type AdminFaqSortableListProps = {
  items: AdminFaqSortableItem[];
};

export function AdminFaqSortableList({ items }: AdminFaqSortableListProps) {
  const [orderedItems, setOrderedItems] = useState(items);
  const [isPending, startTransition] = useTransition();

  function persistOrder(nextItems: AdminFaqSortableItem[]) {
    const previousItems = orderedItems;
    setOrderedItems(nextItems);

    const formData = new FormData();
    formData.set("entity", "help_articles");
    formData.set("ids", nextItems.map((item) => item.id).join(","));

    startTransition(async () => {
      try {
        await updateSortOrder(formData);
        toast.success("FAQ order saved.");
      } catch (error) {
        setOrderedItems(previousItems);
        toast.error(error instanceof Error ? error.message : "Could not save FAQ order.");
      }
    });
  }

  return (
    <Card className="mb-5 border-sky-100 bg-white shadow-[0_14px_40px_rgba(15,23,42,0.06)]">
      <CardHeader className="gap-1">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>FAQ Sort Order</CardTitle>
            <CardDescription>Drag FAQ entries into the order shown in content modules and help surfaces.</CardDescription>
          </div>
          <Button variant="outline" size="sm" disabled={isPending} className="gap-2">
            {isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            {isPending ? "Saving" : "Auto-saves"}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {orderedItems.length ? (
          <SortableList
            items={orderedItems}
            onReorder={persistOrder}
            renderItem={(item, meta) => (
              <SortableFaqCard item={item} index={meta.index} isDragging={meta.isDragging} />
            )}
          />
        ) : (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm font-semibold text-slate-500">
            No FAQ articles yet.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function SortableFaqCard({
  index,
  isDragging,
  item
}: {
  index: number;
  isDragging: boolean;
  item: AdminFaqSortableItem;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3",
        isDragging ? "border-sky-300 bg-sky-50" : "hover:border-sky-200"
      )}
    >
      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-black text-slate-600">
        {index + 1}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-black text-slate-900">{item.title}</div>
        <div className="mt-1 flex flex-wrap gap-2 text-xs font-semibold text-slate-500">
          <span>{item.category}</span>
          <span>/help/{item.slug}</span>
          <span>{item.locale}</span>
        </div>
      </div>
      <span className={cn("rounded-full px-2.5 py-1 text-xs font-black", item.isPublished ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500")}>
        {item.isPublished ? "Published" : "Draft"}
      </span>
    </div>
  );
}
