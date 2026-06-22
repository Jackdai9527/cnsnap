import Papa from "papaparse";
import type { ExportOptions } from "@/lib/export/types";

function normalizeFilename(filename: string) {
  return filename.toLowerCase().endsWith(".csv") ? filename : `${filename}.csv`;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function exportToCsv<TRow extends object>({ data, columns, filename }: ExportOptions<TRow>) {
  const rows = data.map((row) =>
    Object.fromEntries(
      columns.map((column) => {
        const value = (row as Record<string, unknown>)[column.key];
        return [column.header, column.formatter ? column.formatter(value, row) : value ?? ""];
      })
    )
  );
  const csv = Papa.unparse(rows, {
    columns: columns.map((column) => column.header)
  });
  downloadBlob(new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" }), normalizeFilename(filename));
}
