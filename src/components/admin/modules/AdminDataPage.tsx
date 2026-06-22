 "use client";

import { useTranslations } from "next-intl";
import { AdminModal } from "@/components/admin/AdminModal";
import { AdminDataPageTable, type AdminDataTableRow } from "@/components/admin/modules/AdminDataPageTable";

export type AdminDataRow = {
  id: string;
  cells: Record<string, React.ReactNode>;
  detail?: Array<[string, React.ReactNode]>;
};

export type AdminDataPageProps = {
  kicker: string;
  title: string;
  description?: string;
  countLabel?: string;
  columns: Array<{ key: string; label: string; className?: string }>;
  rows: AdminDataRow[];
  filters?: Array<{ label: string; value: string }>;
  actions?: React.ReactNode;
  emptyText?: string;
};

export function AdminDataPage({
  kicker,
  title,
  description,
  countLabel,
  columns,
  rows,
  filters,
  actions,
  emptyText
}: AdminDataPageProps) {
  const t = useTranslations("common.adminDataPage");
  const tableRows: AdminDataTableRow[] = rows.map((row) => ({
    id: row.id,
    cells: row.cells,
    searchValues: Object.fromEntries(columns.map((column) => [column.key, cellText(row.cells[column.key])])),
    actionHref: `#${modalId(title, row.id)}`,
    actionLabel: t("edit")
  }));

  return (
    <section>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="admin-kicker">{kicker}</div>
          <h1 className="admin-page-title mt-1">{title}</h1>
          {description ? <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">{description}</p> : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {countLabel ? <span className="text-sm font-semibold text-slate-500">{countLabel}</span> : null}
          {actions}
        </div>
      </div>

      {filters?.length ? (
        <div className="admin-card mb-4 flex flex-wrap gap-2 p-3">
          {filters.map((filter) => (
            <span key={`${filter.label}-${filter.value}`} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-600">
              {filter.label}: {filter.value}
            </span>
          ))}
        </div>
      ) : null}

      <AdminDataPageTable
        columns={columns}
        rows={tableRows}
        searchPlaceholder={t("searchTitle", { title: title.toLowerCase() })}
        emptyText={emptyText || t("noRecordsYet")}
      />

      {rows.map((row) => (
        <AdminModal key={`modal-${row.id}`} id={modalId(title, row.id)} title={t("detailTitle", { title })} description={t("recordLabel", { id: row.id })}>
          <div className="grid gap-3 md:grid-cols-2">
            {(row.detail ?? Object.entries(row.cells)).map(([label, value]) => (
              <div key={`${row.id}-${label}`} className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
                <div className="text-xs font-black uppercase tracking-[0.12em] text-slate-400">{label}</div>
                <div className="mt-1 break-words font-semibold text-slate-800">{value || "-"}</div>
              </div>
            ))}
          </div>
        </AdminModal>
      ))}
    </section>
  );
}

function modalId(title: string, rowId: string) {
  return `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${rowId}`;
}

function cellText(value: React.ReactNode): string {
  if (value == null || typeof value === "boolean") return "";
  if (typeof value === "string" || typeof value === "number" || typeof value === "bigint") return String(value);
  if (Array.isArray(value)) return value.map(cellText).filter(Boolean).join(" ");
  if (typeof value === "object" && "props" in value) {
    const props = (value as { props?: { children?: React.ReactNode; status?: string | null; href?: string } }).props;
    return [props?.children ? cellText(props.children) : "", props?.status ?? "", props?.href ?? ""].filter(Boolean).join(" ");
  }
  return "";
}
