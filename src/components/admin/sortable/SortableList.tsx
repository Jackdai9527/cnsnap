"use client";

import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type UniqueIdentifier
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy
} from "@dnd-kit/sortable";
import { useMemo, type ReactNode } from "react";
import { SortableItem, type SortableItemRenderMeta } from "@/components/admin/sortable/SortableItem";
import { cn } from "@/lib/utils";

export type SortableListItem = {
  id: UniqueIdentifier;
};

type SortableListProps<TItem extends SortableListItem> = {
  items: TItem[];
  renderItem: (item: TItem, meta: SortableItemRenderMeta & { index: number }) => ReactNode;
  onReorder: (items: TItem[]) => void | Promise<void>;
  className?: string;
  itemClassName?: string;
};

export function SortableList<TItem extends SortableListItem>({
  items,
  renderItem,
  onReorder,
  className,
  itemClassName
}: SortableListProps<TItem>) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 6
      }
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  );
  const itemIds = useMemo(() => items.map((item) => item.id), [items]);

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = itemIds.indexOf(active.id);
    const newIndex = itemIds.indexOf(over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    await onReorder(arrayMove(items, oldIndex, newIndex));
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
        <div className={cn("grid gap-3", className)}>
          {items.map((item, index) => (
            <SortableItem key={String(item.id)} id={item.id} className={itemClassName}>
              {(meta) => renderItem(item, { ...meta, index })}
            </SortableItem>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
