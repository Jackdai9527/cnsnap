"use client";

import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { useTranslations } from "next-intl";
import { getEnabledSeoLocales } from "../../../../config/i18n";
import { DataTable, DataTableColumnHeader } from "@/components/admin/data-table";
import { StatusPill } from "@/components/ui/StatusPill";
import { getSeoArticlePath } from "@/modules/seo/lib/locale-routing";
import type { SeoArticleCategory, SeoArticleRecord } from "@/modules/seo/types";

type SeoArticlesTableProps = {
  articles: SeoArticleRecord[];
  categories: SeoArticleCategory[];
  onArchive: (formData: FormData) => Promise<void>;
  onDelete: (formData: FormData) => Promise<void>;
};

type SeoArticleRow = SeoArticleRecord & {
  categoryName: string;
  author: string;
};

export function SeoArticlesTable({ articles, categories, onArchive, onDelete }: SeoArticlesTableProps) {
  const t = useTranslations("seo.tables");
  const rows: SeoArticleRow[] = articles.map((article) => ({
    ...article,
    categoryName: article.category?.name || t("states.uncategorized"),
    author: article.authorName
  }));

  const columns: ColumnDef<SeoArticleRow>[] = [
    {
      accessorKey: "title",
      header: ({ column }) => <DataTableColumnHeader column={column} title={t("columns.title")} />,
      cell: ({ row }) => (
        <div className="min-w-0">
          <div className="font-black text-slate-950">{row.original.title}</div>
          <div className="mt-1 text-xs font-semibold text-slate-500">/{row.original.slug}</div>
        </div>
      )
    },
    {
      accessorKey: "categoryName",
      header: ({ column }) => <DataTableColumnHeader column={column} title={t("columns.category")} />
    },
    {
      accessorKey: "status",
      header: ({ column }) => <DataTableColumnHeader column={column} title={t("columns.status")} />,
      cell: ({ row }) => <StatusPill status={row.original.status} />
    },
    {
      accessorKey: "language",
      header: ({ column }) => <DataTableColumnHeader column={column} title={t("columns.language")} />
    },
    {
      accessorKey: "robots",
      header: ({ column }) => <DataTableColumnHeader column={column} title={t("columns.robots")} />
    },
    {
      accessorKey: "publishedAt",
      header: ({ column }) => <DataTableColumnHeader column={column} title={t("columns.publishedAt")} />,
      cell: ({ row }) => row.original.publishedAt ? new Date(row.original.publishedAt).toLocaleDateString("en-US") : "-"
    },
    {
      accessorKey: "updatedAt",
      header: ({ column }) => <DataTableColumnHeader column={column} title={t("columns.updatedAt")} />,
      cell: ({ row }) => new Date(row.original.updatedAt).toLocaleDateString("en-US")
    },
    {
      accessorKey: "author",
      header: ({ column }) => <DataTableColumnHeader column={column} title={t("columns.author")} />
    },
    {
      id: "actions",
      header: t("columns.actions"),
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-2">
          <Link href={`/admin/seo/articles/${row.original.id}/edit`} className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-black text-slate-700 hover:border-slate-300 hover:text-slate-950">
            {t("actions.edit")}
          </Link>
          <Link href={getSeoArticlePath(row.original, row.original.language as never)} target="_blank" className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-black text-slate-700 hover:border-slate-300 hover:text-slate-950">
            {t("actions.preview")}
          </Link>
          <form action={onArchive}>
            <input type="hidden" name="id" value={row.original.id} />
            <button className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-black text-amber-700">{t("actions.archive")}</button>
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
      data={rows}
      searchPlaceholder={t("filters.searchArticles")}
      filterableColumns={[
        { id: "status", title: t("filters.status"), options: ["draft", "published", "scheduled", "archived"].map((value) => ({ label: value, value })) },
        { id: "categoryName", title: t("filters.category"), options: categories.map((category) => ({ label: category.name, value: category.name })) },
        { id: "language", title: t("filters.language"), options: getEnabledSeoLocales().map((value) => ({ label: value, value })) },
        { id: "robots", title: t("filters.robots"), options: ["index,follow", "noindex,follow", "noindex,nofollow"].map((value) => ({ label: value, value })) }
      ]}
      enableRowSelection={false}
      initialPageSize={12}
    />
  );
}
