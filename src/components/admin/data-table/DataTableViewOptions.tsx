"use client";

import type { Table } from "@tanstack/react-table";
import { useTranslations } from "next-intl";
import { Settings2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

type DataTableViewOptionsProps<TData> = {
  table: Table<TData>;
};

function columnLabel(id: string) {
  return id
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function DataTableViewOptions<TData>({ table }: DataTableViewOptionsProps<TData>) {
  const t = useTranslations("common.dataTable");
  const columns = table.getAllColumns().filter((column) => typeof column.accessorFn !== "undefined" && column.getCanHide());

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<button type="button" />} className="ml-auto inline-flex h-9 items-center justify-center gap-2 whitespace-nowrap rounded-md border border-input bg-background px-3 text-xs font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0">
        <Settings2 className="mr-2 size-4" />
        {t("view")}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel>{t("toggleColumns")}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {columns.map((column) => (
          <DropdownMenuCheckboxItem
            key={column.id}
            checked={column.getIsVisible()}
            onCheckedChange={(value) => column.toggleVisibility(Boolean(value))}
            closeOnClick={false}
            className="capitalize"
          >
            {column.columnDef.meta?.label ?? columnLabel(column.id)}
          </DropdownMenuCheckboxItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => table.resetColumnVisibility()}>
          {t("resetView")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
