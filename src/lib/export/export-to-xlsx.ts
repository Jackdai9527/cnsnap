import * as XLSX from "xlsx";
import type { ExportOptions } from "@/lib/export/types";

function normalizeFilename(filename: string) {
  return filename.toLowerCase().endsWith(".xlsx") ? filename : `${filename}.xlsx`;
}

export function exportToXlsx<TRow extends object>({ data, columns, filename }: ExportOptions<TRow>) {
  const rows = data.map((row) =>
    Object.fromEntries(
      columns.map((column) => {
        const value = (row as Record<string, unknown>)[column.key];
        return [column.header, column.formatter ? column.formatter(value, row) : value ?? ""];
      })
    )
  );
  const worksheet = XLSX.utils.json_to_sheet(rows, {
    header: columns.map((column) => column.header)
  });
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Export");
  XLSX.writeFile(workbook, normalizeFilename(filename), { compression: true });
}
