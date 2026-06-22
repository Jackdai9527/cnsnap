"use client";

import * as React from "react";
import {
  type ColumnDef,
  type ColumnFiltersState,
  type PaginationState,
  type Row,
  type RowSelectionState,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable
} from "@tanstack/react-table";
import { useTranslations } from "next-intl";
import { MoreHorizontal, Search, X } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { DataTablePagination } from "@/components/admin/data-table/DataTablePagination";
import { DataTableViewOptions } from "@/components/admin/data-table/DataTableViewOptions";
import { cn } from "@/lib/utils";

export type DataTableFilterOption = {
  label: string;
  value: string;
};

export type DataTableFilterableColumn = {
  id: string;
  title: string;
  options: DataTableFilterOption[];
};

export type DataTableRowAction<TData> = {
  label: string;
  onClick?: (row: Row<TData>) => void;
  href?: (row: Row<TData>) => string;
  destructive?: boolean;
};

export type DataTableProps<TData, TValue> = {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchPlaceholder?: string;
  filterableColumns?: DataTableFilterableColumn[];
  rowActions?: DataTableRowAction<TData>[];
  enableRowSelection?: boolean;
  initialPageSize?: number;
  emptyText?: string;
  className?: string;
  manualPagination?: boolean;
  manualSorting?: boolean;
  manualFiltering?: boolean;
  pageCount?: number;
  totalRows?: number;
  pagination?: PaginationState;
  onPaginationChange?: React.Dispatch<React.SetStateAction<PaginationState>>;
  sorting?: SortingState;
  onSortingChange?: React.Dispatch<React.SetStateAction<SortingState>>;
  globalFilter?: string;
  onGlobalFilterChange?: (value: string) => void;
  columnFilters?: ColumnFiltersState;
  onColumnFiltersChange?: React.Dispatch<React.SetStateAction<ColumnFiltersState>>;
  isLoading?: boolean;
  getRowId?: (originalRow: TData, index: number) => string;
  rowSelection?: RowSelectionState;
  onRowSelectionChange?: React.Dispatch<React.SetStateAction<RowSelectionState>>;
};

function selectionColumn<TData>(labels: { selectAllRows: string; selectRow: string }): ColumnDef<TData> {
  return {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        indeterminate={table.getIsSomePageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(Boolean(value))}
        aria-label={labels.selectAllRows}
        className="translate-y-[1px]"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(Boolean(value))}
        aria-label={labels.selectRow}
        className="translate-y-[1px]"
      />
    ),
    enableSorting: false,
    enableHiding: false,
    size: 44
  };
}

function actionsColumn<TData>(
  actions: DataTableRowAction<TData>[],
  labels: { actionsSrOnly: string; openRowActions: string }
): ColumnDef<TData> {
  return {
    id: "actions",
    header: () => <span className="sr-only">{labels.actionsSrOnly}</span>,
    cell: ({ row }) => (
      <DropdownMenu>
        <DropdownMenuTrigger render={<button type="button" />} className="inline-flex size-8 items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0" aria-label={labels.openRowActions}>
          <MoreHorizontal />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          {actions.map((action) => {
            const content = action.href ? (
              <a href={action.href(row)} className="block w-full">
                {action.label}
              </a>
            ) : (
              action.label
            );

            return (
              <DropdownMenuItem
                key={action.label}
                onClick={() => action.onClick?.(row)}
                className={action.destructive ? "text-red-600 focus:text-red-600" : undefined}
              >
                {content}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    ),
    enableSorting: false,
    enableHiding: false,
    size: 64
  };
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchPlaceholder = "Search all columns...",
  filterableColumns = [],
  rowActions = [],
  enableRowSelection = true,
  initialPageSize = 10,
  emptyText = "No results.",
  className,
  manualPagination = false,
  manualSorting = false,
  manualFiltering = false,
  pageCount,
  totalRows,
  pagination: controlledPagination,
  onPaginationChange,
  sorting: controlledSorting,
  onSortingChange,
  globalFilter: controlledGlobalFilter,
  onGlobalFilterChange,
  columnFilters: controlledColumnFilters,
  onColumnFiltersChange,
  isLoading = false,
  getRowId,
  rowSelection: controlledRowSelection,
  onRowSelectionChange: controlledOnRowSelectionChange
}: DataTableProps<TData, TValue>) {
  const t = useTranslations("common.dataTable");
  const [internalSorting, setInternalSorting] = React.useState<SortingState>([]);
  const [internalColumnFilters, setInternalColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [internalGlobalFilter, setInternalGlobalFilter] = React.useState("");
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [internalRowSelection, setInternalRowSelection] = React.useState<RowSelectionState>({});
  const [internalPagination, setInternalPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: initialPageSize
  });
  const sorting = controlledSorting ?? internalSorting;
  const setSorting = onSortingChange ?? setInternalSorting;
  const columnFilters = controlledColumnFilters ?? internalColumnFilters;
  const setColumnFilters = onColumnFiltersChange ?? setInternalColumnFilters;
  const globalFilter = controlledGlobalFilter ?? internalGlobalFilter;
  const setGlobalFilter = onGlobalFilterChange ?? setInternalGlobalFilter;
  const rowSelection = controlledRowSelection ?? internalRowSelection;
  const setRowSelection = controlledOnRowSelectionChange ?? setInternalRowSelection;
  const pagination = controlledPagination ?? internalPagination;
  const setPagination = onPaginationChange ?? setInternalPagination;

  const tableColumns = React.useMemo<ColumnDef<TData, TValue | unknown>[]>(() => {
    const next: ColumnDef<TData, TValue | unknown>[] = [];
    if (enableRowSelection) {
      next.push(selectionColumn<TData>({
        selectAllRows: t("selectAllRows"),
        selectRow: t("selectRow")
      }) as ColumnDef<TData, TValue | unknown>);
    }
    next.push(...(columns as ColumnDef<TData, TValue | unknown>[]));
    if (rowActions.length) {
      next.push(actionsColumn(rowActions, {
        actionsSrOnly: t("actionsSrOnly"),
        openRowActions: t("openRowActions")
      }) as ColumnDef<TData, TValue | unknown>);
    }
    return next;
  }, [columns, enableRowSelection, rowActions, t]);

  // eslint-disable-next-line react-hooks/incompatible-library -- TanStack Table exposes imperative table helpers by design.
  const table = useReactTable({
    data,
    columns: tableColumns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
      columnVisibility,
      rowSelection,
      pagination
    },
    enableRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: setPagination,
    manualPagination,
    manualSorting,
    manualFiltering,
    pageCount,
    getRowId,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: manualFiltering ? undefined : getFilteredRowModel(),
    getSortedRowModel: manualSorting ? undefined : getSortedRowModel(),
    getPaginationRowModel: manualPagination ? undefined : getPaginationRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues()
  });

  const isFiltered = globalFilter.length > 0 || table.getState().columnFilters.length > 0;

  return (
    <div className={cn("rounded-2xl border border-slate-200 bg-white shadow-[0_14px_36px_rgba(15,23,42,0.04)]", className)}>
      <div className="flex flex-col gap-3 border-b border-slate-100 p-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-1 flex-col gap-3 md:flex-row md:items-center">
          <div className="relative w-full md:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={globalFilter ?? ""}
              onChange={(event) => {
                setGlobalFilter(event.target.value);
                setPagination((current) => ({ ...current, pageIndex: 0 }));
              }}
              placeholder={searchPlaceholder || t("searchAllColumns")}
              className="h-10 pl-9"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {filterableColumns.map((filter) => {
              const column = table.getColumn(filter.id);
              if (!column) return null;
              const value = (column.getFilterValue() as string | undefined) ?? "";

              return (
                <Select
                  key={filter.id}
                  value={value || "all"}
                  onValueChange={(nextValue) => {
                    column.setFilterValue(nextValue === "all" ? undefined : nextValue);
                    setPagination((current) => ({ ...current, pageIndex: 0 }));
                  }}
                >
                  <SelectTrigger className="h-10 min-w-[170px] bg-white">
                    <SelectValue>{filter.title}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All {filter.title}</SelectItem>
                    {filter.options.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              );
            })}
            {isFiltered ? (
              <Button
                variant="ghost"
                size="sm"
                className="h-10 px-3"
                onClick={() => {
                  table.resetColumnFilters();
                  setGlobalFilter("");
                  setPagination((current) => ({ ...current, pageIndex: 0 }));
                }}
              >
                {t("clearFilters")}
                <X className="ml-1 size-4" />
              </Button>
            ) : null}
          </div>
        </div>
        <DataTableViewOptions table={table} />
      </div>

      <Table className="min-w-max">
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="bg-slate-50/80 hover:bg-slate-50/80">
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id} className="px-4 py-3">
                  {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id} data-state={row.getIsSelected() && "selected"} className="h-14">
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id} className="px-4 py-3">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={tableColumns.length} className="h-32 text-center text-sm font-semibold text-slate-500">
                {isLoading ? t("loading") : emptyText || t("noResults")}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <DataTablePagination table={table} totalRows={totalRows} />
    </div>
  );
}
