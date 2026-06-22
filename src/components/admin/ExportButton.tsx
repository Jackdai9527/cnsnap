"use client";

import { Download } from "lucide-react";
import { toast } from "sonner";
import { exportToCsv } from "@/lib/export/export-to-csv";
import { exportToXlsx } from "@/lib/export/export-to-xlsx";
import type { ExportColumn } from "@/lib/export/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

type ExportButtonProps<TRow extends object> = {
  data: TRow[];
  columns: ExportColumn<TRow>[];
  filename: string;
  label?: string;
  disabled?: boolean;
  onExportCsv?: () => void;
  onExportXlsx?: () => void;
};

export function ExportButton<TRow extends object>({
  data,
  columns,
  filename,
  label = "Export",
  disabled = false,
  onExportCsv,
  onExportXlsx
}: ExportButtonProps<TRow>) {
  function runExport(format: "csv" | "xlsx") {
    if (format === "csv" && onExportCsv) {
      onExportCsv();
      return;
    }

    if (format === "xlsx" && onExportXlsx) {
      onExportXlsx();
      return;
    }

    if (!data.length) {
      toast.info("No rows to export.");
      return;
    }

    if (format === "csv") {
      exportToCsv({ data, columns, filename });
    } else {
      exportToXlsx({ data, columns, filename });
    }
    toast.success(`Exported ${data.length} rows.`);
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<button type="button" disabled={disabled} />} className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full border border-input bg-background px-3 py-2 text-xs font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0">
        <Download className="size-4" />
        {label}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem onClick={() => runExport("xlsx")}>Export Excel</DropdownMenuItem>
        <DropdownMenuItem onClick={() => runExport("csv")}>Export CSV</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
