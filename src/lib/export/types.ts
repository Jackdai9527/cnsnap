export type ExportColumn<TRow extends object = Record<string, unknown>> = {
  key: string;
  header: string;
  formatter?: (value: unknown, row: TRow) => string;
};

export type ExportOptions<TRow extends object = Record<string, unknown>> = {
  data: TRow[];
  columns: ExportColumn<TRow>[];
  filename: string;
};
