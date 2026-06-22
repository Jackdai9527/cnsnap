"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { useTranslations } from "next-intl";
import { DataTable, DataTableColumnHeader, type DataTableRowAction } from "@/components/admin/data-table";
import { cn } from "@/lib/utils";

export type AdminDataTableColumn = {
  key: string;
  label: string;
  className?: string;
};

export type AdminDataTableRow = {
  id: string;
  cells: Record<string, React.ReactNode>;
  searchValues: Record<string, string>;
  actionHref?: string;
  actionLabel?: string;
};

type AdminDataPageTableProps = {
  columns: AdminDataTableColumn[];
  rows: AdminDataTableRow[];
  searchPlaceholder?: string;
  rowActionLabel?: string;
  showRowActions?: boolean;
  enableRowSelection?: boolean;
  initialPageSize?: number;
  emptyText?: string;
  className?: string;
};

export function AdminDataPageTable({
  columns,
  rows,
  searchPlaceholder,
  rowActionLabel,
  showRowActions = true,
  enableRowSelection = true,
  initialPageSize = 10,
  emptyText,
  className
}: AdminDataPageTableProps) {
  const t = useTranslations("common.adminDataPage");
  const tableColumns = React.useMemo<ColumnDef<AdminDataTableRow>[]>(() => {
    return columns.map((item) => ({
      id: item.key,
      accessorFn: (row) => row.searchValues[item.key] ?? "",
      header: ({ column }) => <DataTableColumnHeader column={column} title={item.label} />,
      cell: ({ row }) => (
        <div className={cn("min-w-0", item.className)}>
          {row.original.cells[item.key] ?? "-"}
        </div>
      ),
      meta: { label: item.label }
    }));
  }, [columns]);

  const rowActions = React.useMemo<DataTableRowAction<AdminDataTableRow>[]>(() => {
    if (!showRowActions) return [];
    return [
      {
        label: rowActionLabel || t("edit"),
        href: (row) => row.original.actionHref ?? "#"
      }
    ];
  }, [rowActionLabel, showRowActions, t]);

  return (
    <DataTable
      columns={tableColumns}
      data={rows}
      searchPlaceholder={searchPlaceholder || t("searchRecords")}
      rowActions={rowActions}
      enableRowSelection={enableRowSelection}
      initialPageSize={initialPageSize}
      emptyText={emptyText}
      className={className}
    />
  );
}
