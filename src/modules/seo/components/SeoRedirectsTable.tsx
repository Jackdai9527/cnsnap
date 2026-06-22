"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { useTranslations } from "next-intl";
import { DataTable, DataTableColumnHeader } from "@/components/admin/data-table";
import { StatusPill } from "@/components/ui/StatusPill";
import type { SeoRedirect } from "@/modules/seo/types";

type SeoRedirectsTableProps = {
  redirects: SeoRedirect[];
  onToggle: (formData: FormData) => Promise<void>;
  onDelete: (formData: FormData) => Promise<void>;
};

export function SeoRedirectsTable({ redirects, onToggle, onDelete }: SeoRedirectsTableProps) {
  const t = useTranslations("seo.tables");
  const columns: ColumnDef<SeoRedirect>[] = [
    {
      accessorKey: "fromPath",
      header: ({ column }) => <DataTableColumnHeader column={column} title={t("columns.fromPath")} />
    },
    {
      accessorKey: "toPath",
      header: ({ column }) => <DataTableColumnHeader column={column} title={t("columns.toPath")} />
    },
    {
      accessorKey: "statusCode",
      header: ({ column }) => <DataTableColumnHeader column={column} title={t("columns.statusCode")} />
    },
    {
      accessorKey: "enabled",
      header: ({ column }) => <DataTableColumnHeader column={column} title={t("columns.enabled")} />,
      cell: ({ row }) => <StatusPill status={row.original.enabled ? "enabled" : "disabled"} />
    },
    {
      accessorKey: "hitCount",
      header: ({ column }) => <DataTableColumnHeader column={column} title={t("columns.hits")} />
    },
    {
      accessorKey: "lastHitAt",
      header: ({ column }) => <DataTableColumnHeader column={column} title={t("columns.lastHitAt")} />,
      cell: ({ row }) => row.original.lastHitAt ? new Date(row.original.lastHitAt).toLocaleDateString("en-US") : "-"
    },
    {
      id: "actions",
      header: t("columns.actions"),
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-2">
          <form action={onToggle}>
            <input type="hidden" name="id" value={row.original.id} />
            <button className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-black text-slate-700">
              {row.original.enabled ? t("actions.disable") : t("actions.enable")}
            </button>
          </form>
          <form action={onDelete}>
            <input type="hidden" name="id" value={row.original.id} />
            <button className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-black text-rose-700">{t("actions.delete")}</button>
          </form>
        </div>
      )
    }
  ];

  return (
    <DataTable
      columns={columns}
      data={redirects}
      searchPlaceholder={t("filters.searchRedirects")}
      filterableColumns={[
        { id: "statusCode", title: t("filters.statusCode"), options: [301, 302].map((value) => ({ label: String(value), value: String(value) })) },
        { id: "enabled", title: t("filters.enabled"), options: [{ label: t("states.enabled"), value: "true" }, { label: t("states.disabled"), value: "false" }] }
      ]}
      enableRowSelection={false}
      initialPageSize={12}
    />
  );
}
