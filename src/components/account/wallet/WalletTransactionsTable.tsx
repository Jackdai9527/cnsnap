"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { useTranslations } from "next-intl";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable
} from "@tanstack/react-table";
import { AccountStatusBadge } from "@/components/account/AccountStatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { WalletTransaction } from "@/lib/account/mock-data";

export function WalletTransactionsTable({ data }: { data: WalletTransaction[] }) {
  const t = useTranslations("account.wallet.table");
  const [type, setType] = React.useState("all");
  const [from, setFrom] = React.useState("");
  const [to, setTo] = React.useState("");
  const columns: ColumnDef<WalletTransaction>[] = [
    { accessorKey: "transactionNo", header: t("columns.transaction") },
    { accessorKey: "type", header: t("columns.type"), cell: ({ row }) => <AccountStatusBadge status={row.original.type} /> },
    {
      accessorKey: "amount",
      header: t("columns.amount"),
      cell: ({ row }) => (
        <span className={row.original.amount >= 0 ? "font-black text-emerald-700" : "font-black text-rose-700"}>
          {row.original.amount >= 0 ? "+" : "-"}${Math.abs(row.original.amount).toFixed(2)}
        </span>
      )
    },
    { accessorKey: "currency", header: t("columns.currency") },
    { accessorKey: "balanceAfter", header: t("columns.balanceAfter"), cell: ({ row }) => <span className="font-bold">${row.original.balanceAfter.toFixed(2)}</span> },
    { accessorKey: "relatedOrderNo", header: t("columns.order"), cell: ({ row }) => row.original.relatedOrderNo ?? "-" },
    { accessorKey: "relatedPackageNo", header: t("columns.package"), cell: ({ row }) => row.original.relatedPackageNo ?? "-" },
    { accessorKey: "note", header: t("columns.note") },
    { accessorKey: "createdAt", header: t("columns.created") }
  ];

  const filteredData = React.useMemo(() => {
    return data.filter((item) => {
      const day = item.createdAt.slice(0, 10);
      if (type !== "all" && item.type !== type) return false;
      if (from && day < from) return false;
      if (to && day > to) return false;
      return true;
    });
  }, [data, from, to, type]);

  // eslint-disable-next-line react-hooks/incompatible-library -- TanStack Table exposes imperative table helpers by design.
  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel()
  });

  return (
    <div className="rounded-3xl border border-slate-200 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.05)]">
      <div className="grid gap-3 border-b border-slate-100 p-4 md:grid-cols-[220px_1fr_1fr_auto]">
        <Select value={type} onValueChange={(value) => setType(value ?? "all")}>
          <SelectTrigger className="h-9 w-full bg-white"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("filters.allTypes")}</SelectItem>
            <SelectItem value="recharge">{t("filters.recharge")}</SelectItem>
            <SelectItem value="pay_order">{t("filters.payOrder")}</SelectItem>
            <SelectItem value="pay_shipping">{t("filters.payShipping")}</SelectItem>
            <SelectItem value="refund">{t("filters.refund")}</SelectItem>
            <SelectItem value="adjustment">{t("filters.adjustment")}</SelectItem>
            <SelectItem value="commission">{t("filters.commission")}</SelectItem>
          </SelectContent>
        </Select>
        <Input type="date" value={from} onChange={(event) => setFrom(event.target.value)} />
        <Input type="date" value={to} onChange={(event) => setTo(event.target.value)} />
        <Button variant="outline" onClick={() => { setType("all"); setFrom(""); setTo(""); }}>{t("filters.reset")}</Button>
      </div>
      <Table className="min-w-[980px]">
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="bg-slate-50/70">
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id} className="px-4 py-3 text-xs font-black uppercase tracking-[0.08em] text-slate-500">
                  {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.length ? table.getRowModel().rows.map((row) => (
            <TableRow key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id} className="px-4 py-3 text-sm font-medium text-slate-600">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          )) : (
            <TableRow><TableCell colSpan={columns.length} className="h-28 text-center text-sm font-semibold text-slate-500">{t("empty")}</TableCell></TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
