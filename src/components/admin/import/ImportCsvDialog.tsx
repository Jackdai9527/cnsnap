"use client";

import Papa from "papaparse";
import { Download, FileUp, Loader2, TriangleAlert } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

export type CsvImportField = {
  key: string;
  header: string;
  required?: boolean;
  validateAs?: "positiveNumber" | "nonNegativeNumber" | "channelCode" | "countryCode" | "status";
};

type ParsedPreviewRow = {
  id: string;
  rowNumber: number;
  values: Record<string, string>;
  errors: string[];
};

type ImportCsvDialogProps = {
  title: string;
  description?: string;
  fields: CsvImportField[];
  templateFilename: string;
  action: (formData: FormData) => Promise<void>;
  triggerLabel?: string;
};

export function ImportCsvDialog({
  action,
  description,
  fields,
  templateFilename,
  title,
  triggerLabel = "Import CSV"
}: ImportCsvDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [rows, setRows] = useState<ParsedPreviewRow[]>([]);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [parseError, setParseError] = useState("");
  const [filename, setFilename] = useState("");
  const [isPending, startTransition] = useTransition();
  const requiredFields = useMemo(() => fields.filter((field) => field.required !== false).map((field) => field.key), [fields]);
  const errorCount = rows.reduce((sum, row) => sum + row.errors.length, 0) + missingFields.length + (parseError ? 1 : 0);

  function resetPreview() {
    setRows([]);
    setMissingFields([]);
    setParseError("");
    setFilename("");
  }

  function parseFile(file: File) {
    resetPreview();
    setFilename(file.name);
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim(),
      complete: (result) => {
        const headers = result.meta.fields ?? [];
        const missing = requiredFields.filter((field) => !headers.includes(field));
        setMissingFields(missing);
        setParseError(result.errors[0]?.message ?? "");
        setRows(
          result.data.map((row, index) => {
            const normalizedRow = normalizeRow(row);
            return {
              id: `${index + 2}-${normalizedRow.ruleName ?? normalizedRow.channelCode ?? "row"}`,
              rowNumber: index + 2,
              values: normalizedRow,
              errors: validatePreviewRow(normalizedRow, fields)
            };
          })
        );
      },
      error: (error) => {
        setParseError(error.message);
      }
    });
  }

  function downloadTemplate() {
    const example = Object.fromEntries(fields.map((field) => [field.key, exampleValue(field.key)]));
    const csv = Papa.unparse([example], { columns: fields.map((field) => field.key) });
    const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = templateFilename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function submitImport() {
    const formData = new FormData();
    formData.set("rows", JSON.stringify(rows.map((row) => row.values)));
    startTransition(async () => {
      try {
        await action(formData);
        toast.success(`Imported ${rows.length} shipping rate rules.`);
        setIsOpen(false);
        resetPreview();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Import failed.");
      }
    });
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger render={<button type="button" />} className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full border border-input bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0">
        <FileUp className="size-4" />
        {triggerLabel}
      </DialogTrigger>
      <DialogContent className="max-h-[88vh] max-w-5xl overflow-hidden p-0">
        <DialogHeader className="border-b border-slate-200 p-5">
          <DialogTitle>{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>
        <div className="grid gap-4 overflow-y-auto px-5 py-4">
          <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-sm font-black text-slate-900">CSV file</div>
              <div className="mt-1 text-xs font-semibold text-slate-500">{filename || "Upload a UTF-8 CSV file with the required column headers."}</div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" onClick={downloadTemplate}>
                <Download className="size-4" />
                Download template
              </Button>
              <label className="inline-flex h-8 cursor-pointer items-center justify-center gap-2 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground transition hover:bg-primary/90">
                <FileUp className="size-4" />
                Upload CSV
                <input
                  type="file"
                  accept=".csv,text/csv"
                  className="sr-only"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) parseFile(file);
                    event.currentTarget.value = "";
                  }}
                />
              </label>
            </div>
          </div>

          {errorCount ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              <div className="flex items-start gap-2 font-black">
                <TriangleAlert className="mt-0.5 size-4 shrink-0" />
                Import needs attention
              </div>
              {parseError ? <p className="mt-2 font-semibold">{parseError}</p> : null}
              {missingFields.length ? (
                <p className="mt-2 font-semibold">Missing fields: {missingFields.join(", ")}</p>
              ) : null}
              {rows.some((row) => row.errors.length) ? <p className="mt-2 font-semibold">Rows with errors are marked below.</p> : null}
            </div>
          ) : null}

          {rows.length ? (
            <div className="rounded-xl border border-slate-200">
              <Table className="min-w-[1180px]">
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead>Row</TableHead>
                    {fields.map((field) => (
                      <TableHead key={field.key}>{field.header}</TableHead>
                    ))}
                    <TableHead>Validation</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.slice(0, 50).map((row) => (
                    <TableRow key={row.id} className={cn(row.errors.length ? "bg-red-50/80 hover:bg-red-50" : "hover:bg-slate-50")}>
                      <TableCell className="font-black">{row.rowNumber}</TableCell>
                      {fields.map((field) => (
                        <TableCell key={field.key} className="max-w-[180px] truncate">
                          {row.values[field.key] || "-"}
                        </TableCell>
                      ))}
                      <TableCell className={cn("min-w-[220px] font-semibold", row.errors.length ? "text-red-700" : "text-emerald-700")}>
                        {row.errors.length ? row.errors.join("; ") : "OK"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {rows.length > 50 ? <div className="border-t border-slate-200 px-4 py-3 text-xs font-semibold text-slate-500">Showing first 50 rows of {rows.length}.</div> : null}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm font-semibold text-slate-500">
              Upload a CSV to preview rows before importing.
            </div>
          )}
        </div>
        <DialogFooter className="items-center">
          <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
          <Button type="button" disabled={!rows.length || errorCount > 0 || isPending} onClick={submitImport}>
            {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
            {isPending ? "Importing..." : "Confirm import"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function normalizeRow(row: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(row).map(([key, value]) => [key.trim(), String(value ?? "").trim()]));
}

function validatePreviewRow(row: Record<string, string>, fields: CsvImportField[]) {
  return fields.flatMap((field) => {
    const value = row[field.key] ?? "";
    if (field.required !== false && !value) return [`${field.key} is required`];
    const error = validateFieldValue(value, field.validateAs);
    return error ? [error] : [];
  });
}

function validateFieldValue(value: string, validateAs?: CsvImportField["validateAs"]) {
  if (!validateAs || !value) return null;
  if (validateAs === "positiveNumber") {
    const numberValue = Number(value);
    return Number.isFinite(numberValue) && numberValue > 0 ? null : "must be greater than 0";
  }
  if (validateAs === "nonNegativeNumber") {
    const numberValue = Number(value);
    return Number.isFinite(numberValue) && numberValue >= 0 ? null : "must be 0 or greater";
  }
  if (validateAs === "channelCode") {
    return /^[A-Za-z0-9_-]{2,32}$/.test(value) ? null : "must be 2-32 letters, numbers, _ or -";
  }
  if (validateAs === "countryCode") {
    return /^[A-Za-z]{2}$/.test(value) ? null : "must be ISO2, for example US";
  }
  if (validateAs === "status") {
    return ["active", "inactive"].includes(value.toLowerCase()) ? null : "must be active or inactive";
  }
  return null;
}

function exampleValue(key: string) {
  const values: Record<string, string> = {
    ruleName: "DGEUB-US",
    channelCode: "DGEUB",
    countryCode: "US",
    firstWeightKg: "0.001",
    firstWeightFee: "0",
    additionalWeightKg: "1",
    additionalWeightFee: "68",
    minChargeWeight: "0.001",
    volumeDivisor: "5000",
    markup: "0",
    status: "active"
  };
  return values[key] ?? "";
}
