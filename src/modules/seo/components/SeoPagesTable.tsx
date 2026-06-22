"use client";

import { flexRender, getCoreRowModel, useReactTable, type ColumnDef } from "@tanstack/react-table";
import { useTranslations } from "next-intl";
import { SeoPageEditorDialog } from "@/modules/seo/components/SeoPageEditorDialog";
import type { SeoPageRecord } from "@/modules/seo/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type SeoPagesTableProps = {
  pages: SeoPageRecord[];
  onSave: (formData: FormData) => Promise<void>;
};

export function SeoPagesTable({ pages, onSave }: SeoPagesTableProps) {
  const t = useTranslations("seo.tables");
  const columns: ColumnDef<SeoPageRecord>[] = [
    {
      accessorKey: "path",
      header: t("columns.path"),
      cell: ({ row }) => <span className="font-black text-slate-950">{row.original.path}</span>
    },
    {
      accessorKey: "pageType",
      header: t("columns.pageType"),
      cell: ({ row }) => <span className="text-sm font-bold uppercase tracking-[0.12em] text-slate-500">{row.original.pageType}</span>
    },
    {
      accessorKey: "title",
      header: t("columns.title"),
      cell: ({ row }) => <div className="line-clamp-2 max-w-[220px] font-bold text-slate-900">{row.original.title}</div>
    },
    {
      accessorKey: "description",
      header: t("columns.description"),
      cell: ({ row }) => <div className="line-clamp-2 max-w-[320px] text-sm font-semibold text-slate-500">{row.original.description}</div>
    },
    {
      accessorKey: "robots",
      header: t("columns.robots"),
      cell: ({ row }) => <span className="text-sm font-bold text-slate-700">{row.original.robots || row.original.indexPolicy.robots}</span>
    },
    {
      id: "indexPolicy",
      header: t("columns.indexPolicy"),
      cell: ({ row }) => (
        <div>
          <div className="text-sm font-bold text-slate-900">{row.original.indexPolicy.robots}</div>
          {row.original.indexPolicy.reason ? <div className="mt-1 max-w-[220px] text-xs font-semibold leading-5 text-slate-500">{row.original.indexPolicy.reason}</div> : null}
        </div>
      )
    },
    {
      id: "includeInSitemap",
      header: t("columns.sitemap"),
      cell: ({ row }) => <span className="text-sm font-bold text-slate-700">{row.original.includeInSitemap ? t("states.yes") : t("states.no")}</span>
    },
    {
      accessorKey: "enabled",
      header: t("columns.enabled"),
      cell: ({ row }) => <span className="text-sm font-bold text-slate-700">{row.original.enabled ? t("states.enabled") : t("states.disabled")}</span>
    },
    {
      accessorKey: "updatedAt",
      header: t("columns.updated"),
      cell: ({ row }) => <span className="text-sm font-semibold text-slate-500">{new Date(row.original.updatedAt).toLocaleDateString("en-US")}</span>
    },
    {
      id: "actions",
      header: () => <div className="text-right">{t("columns.actions")}</div>,
      cell: ({ row }) => (
        <div className="text-right">
          <SeoPageEditorDialog page={row.original} action={onSave} />
        </div>
      )
    }
  ];

  const table = useReactTable({
    data: pages,
    columns,
    getCoreRowModel: getCoreRowModel()
  });

  return (
    <Table className="min-w-[1120px]">
      <TableHeader>
        {table.getHeaderGroups().map((headerGroup) => (
          <TableRow key={headerGroup.id} className="bg-slate-50">
            {headerGroup.headers.map((header) => (
              <TableHead key={header.id} className="px-4 py-3 font-black text-slate-600">
                {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
              </TableHead>
            ))}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody>
        {table.getRowModel().rows.map((row) => (
          <TableRow key={row.id}>
            {row.getVisibleCells().map((cell) => (
              <TableCell key={cell.id} className="px-4 py-4 align-top">
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
