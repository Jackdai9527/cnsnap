"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { useTranslations } from "next-intl";
import { DataTable, DataTableColumnHeader } from "@/components/admin/data-table";
import { StatusPill } from "@/components/ui/StatusPill";
import type { SeoAuditIssue } from "@/modules/seo/types";

type SeoAuditIssuesTableProps = {
  issues: SeoAuditIssue[];
};

export function SeoAuditIssuesTable({ issues }: SeoAuditIssuesTableProps) {
  const t = useTranslations("seo.tables");
  const columns: ColumnDef<SeoAuditIssue>[] = [
    {
      accessorKey: "severity",
      header: ({ column }) => <DataTableColumnHeader column={column} title={t("columns.severity")} />,
      cell: ({ row }) => <StatusPill status={row.original.severity} />
    },
    {
      accessorKey: "area",
      header: ({ column }) => <DataTableColumnHeader column={column} title={t("columns.area")} />
    },
    {
      accessorKey: "entityLabel",
      header: ({ column }) => <DataTableColumnHeader column={column} title={t("columns.entity")} />,
      cell: ({ row }) => (
        <div>
          <div className="font-black text-slate-950">{row.original.entityLabel}</div>
          {row.original.path ? <div className="mt-1 text-xs font-semibold text-slate-500">{row.original.path}</div> : null}
        </div>
      )
    },
    {
      accessorKey: "rule",
      header: ({ column }) => <DataTableColumnHeader column={column} title={t("columns.rule")} />
    },
    {
      accessorKey: "message",
      header: ({ column }) => <DataTableColumnHeader column={column} title={t("columns.message")} />
    },
    {
      accessorKey: "recommendation",
      header: ({ column }) => <DataTableColumnHeader column={column} title={t("columns.recommendation")} />,
      cell: ({ row }) => row.original.recommendation || "-"
    }
  ];

  return (
    <DataTable
      columns={columns}
      data={issues}
      searchPlaceholder={t("filters.searchAuditIssues")}
      filterableColumns={[
        { id: "severity", title: t("filters.severity"), options: ["error", "warning", "notice"].map((value) => ({ label: value, value })) },
        { id: "area", title: t("filters.area"), options: ["page", "article", "landing_page", "redirect"].map((value) => ({ label: value, value })) },
        {
          id: "rule",
          title: t("filters.rule"),
          options: Array.from(new Set(issues.map((issue) => issue.rule))).map((value) => ({ label: value, value }))
        }
      ]}
      enableRowSelection={false}
      initialPageSize={12}
    />
  );
}
