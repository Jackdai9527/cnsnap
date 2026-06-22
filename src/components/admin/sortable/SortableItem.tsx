"use client";

import type { DraggableAttributes, DraggableSyntheticListeners, UniqueIdentifier } from "@dnd-kit/core";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type SortableItemRenderMeta = {
  isDragging: boolean;
};

type SortableItemProps = {
  id: UniqueIdentifier;
  className?: string;
  children: (meta: SortableItemRenderMeta) => ReactNode;
};

export function SortableItem({ id, className, children }: SortableItemProps) {
  const {
    attributes,
    isDragging,
    listeners,
    setNodeRef,
    transform,
    transition
  } = useSortable({ id });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "rounded-xl transition-shadow",
        isDragging ? "relative z-20 scale-[1.01] opacity-90 shadow-2xl ring-2 ring-sky-300" : "shadow-sm",
        className
      )}
      style={{
        transform: CSS.Transform.toString(transform),
        transition
      }}
    >
      <div className="flex items-stretch gap-3">
        <SortableDragHandle attributes={attributes} listeners={listeners} />
        <div className="min-w-0 flex-1">{children({ isDragging })}</div>
      </div>
    </div>
  );
}

function SortableDragHandle({
  attributes,
  listeners
}: {
  attributes: DraggableAttributes;
  listeners: DraggableSyntheticListeners;
}) {
  return (
    <button
      type="button"
      className="flex w-9 shrink-0 cursor-grab items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-400 transition hover:border-sky-200 hover:bg-sky-50 hover:text-sky-600 active:cursor-grabbing"
      aria-label="Drag to reorder"
      {...attributes}
      {...listeners}
    >
      <GripVertical className="size-4" />
    </button>
  );
}
