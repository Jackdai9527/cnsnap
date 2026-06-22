"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import type { ColumnDef, ColumnFiltersState, SortingState } from "@tanstack/react-table";
import { useTranslations } from "next-intl";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable
} from "@tanstack/react-table";
import { MoreHorizontal, Search } from "lucide-react";
import { AccountStatusBadge } from "@/components/account/AccountStatusBadge";
import { MobileSectionShell } from "@/components/mobile/layout/MobileSectionShell";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { AccountOrder, AccountOrderStatus } from "@/lib/account/mock-data";

function ItemsPreview({ order, piecesLabel }: { order: AccountOrder; piecesLabel: string }) {
  return (
    <div className="flex min-w-[190px] items-center gap-3">
      <div className="flex -space-x-2">
        {order.items.slice(0, 3).map((item) => (
          <span key={item.id} className="relative block size-9 overflow-hidden rounded-xl border-2 border-white bg-slate-100 shadow-sm">
            <Image src={item.image} alt={item.title} fill sizes="36px" className="object-cover" />
          </span>
        ))}
      </div>
      <div className="min-w-0">
        <div className="max-w-[150px] truncate text-xs font-bold text-slate-700">{order.items[0]?.title}</div>
        <div className="text-xs font-medium text-slate-400">{piecesLabel}</div>
      </div>
    </div>
  );
}

export function AccountOrdersTable({ data }: { data: AccountOrder[] }) {
  const t = useTranslations("account.orders.table");
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [status, setStatus] = React.useState<"all" | AccountOrderStatus>("all");
  const statusTabs: Array<{ label: string; value: "all" | AccountOrderStatus }> = [
    { label: t("tabs.all"), value: "all" },
    { label: t("tabs.pendingPayment"), value: "pending_payment" },
    { label: t("tabs.purchasing"), value: "purchasing" },
    { label: t("tabs.warehousePending"), value: "warehouse_pending" },
    { label: t("tabs.waitingShippingPayment"), value: "waiting_shipping_payment" },
    { label: t("tabs.shipped"), value: "shipped" },
    { label: t("tabs.completed"), value: "completed" },
    { label: t("tabs.cancelled"), value: "cancelled" }
  ];
  const columns: ColumnDef<AccountOrder>[] = [
    {
      accessorKey: "orderNo",
      header: t("columns.order"),
      cell: ({ row }) => (
        <Link href={`/account/orders/${row.original.id}`} className="font-black text-slate-950 hover:text-sky-600">
          {row.original.orderNo}
        </Link>
      )
    },
    { accessorKey: "createdAt", header: t("columns.created") },
    {
      id: "itemsPreview",
      header: t("columns.items"),
      cell: ({ row }) => <ItemsPreview order={row.original} piecesLabel={t("pieces", { count: row.original.items.reduce((sum, item) => sum + item.quantity, 0) })} />,
      enableSorting: false
    },
    { accessorKey: "totalUsd", header: t("columns.total"), cell: ({ row }) => <Money value={row.original.totalUsd} /> },
    { accessorKey: "paymentStatus", header: t("columns.payment"), cell: ({ row }) => <AccountStatusBadge status={row.original.paymentStatus} /> },
    { accessorKey: "purchaseStatus", header: t("columns.purchase"), cell: ({ row }) => <AccountStatusBadge status={row.original.purchaseStatus} /> },
    { accessorKey: "warehouseStatus", header: t("columns.warehouse"), cell: ({ row }) => <AccountStatusBadge status={row.original.warehouseStatus} /> },
    { accessorKey: "packageStatus", header: t("columns.package"), cell: ({ row }) => <AccountStatusBadge status={row.original.packageStatus} /> },
    { accessorKey: "shippingStatus", header: t("columns.shipping"), cell: ({ row }) => <AccountStatusBadge status={row.original.shippingStatus} /> },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const order = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger render={<button type="button" />} className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-accent hover:text-accent-foreground size-8" aria-label={t("actions.openActions", { orderNo: order.orderNo })}>
              <MoreHorizontal />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem render={<Link href={`/account/orders/${order.id}`} />}>{t("actions.viewDetails")}</DropdownMenuItem>
              {order.unpaidUsd > 0 ? <DropdownMenuItem render={<Link href={`/account/orders/${order.id}`} />}>{t("actions.payNow")}</DropdownMenuItem> : null}
              {order.status === "pending_payment" ? <DropdownMenuItem>{t("actions.cancelOrder")}</DropdownMenuItem> : null}
              <DropdownMenuSeparator />
              <DropdownMenuItem render={<Link href={`/account/tickets/new?orderId=${encodeURIComponent(order.id)}`} />}>{t("actions.contactSupport")}</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
      enableSorting: false
    }
  ];

  const filteredData = React.useMemo(() => {
    return status === "all" ? data : data.filter((order) => order.status === status);
  }, [data, status]);

  // eslint-disable-next-line react-hooks/incompatible-library -- TanStack Table exposes imperative table helpers by design.
  const table = useReactTable({
    data: filteredData,
    columns,
    state: { sorting, columnFilters },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel()
  });

  return (
    <>
      <MobileSectionShell title={t("tabs.all")} description={t("count", { count: table.getFilteredRowModel().rows.length })} kicker={t("columns.order")} className="mobile-orders-page md:hidden" minimalHeader hideHeader showBackButton>
        <section className="card-stack-section">
          <div className="mobile-order-toolbar">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder={t("search")}
                value={(table.getColumn("orderNo")?.getFilterValue() as string) ?? ""}
                onChange={(event) => table.getColumn("orderNo")?.setFilterValue(event.target.value)}
                className="mobile-orders-search-input pl-9"
              />
            </div>
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value as "all" | AccountOrderStatus)}
              className="mobile-orders-filter-select"
              aria-label={t("tabs.all")}
            >
              {statusTabs.map((tab) => (
                <option key={tab.value} value={tab.value}>
                  {tab.label}
                </option>
              ))}
            </select>
          </div>
        </section>

        <section className="card-stack-section">
          {table.getRowModel().rows.length ? (
            <div className="mobile-orders-list">
              {table.getRowModel().rows.map((row) => {
                const order = row.original;
                const pieces = order.items.reduce((sum, item) => sum + item.quantity, 0);
                return (
                  <Link key={order.id} href={`/account/orders/${order.id}`} className="mobile-order-list-row">
                    <div className="mobile-order-list-row-top">
                      <div className="min-w-0">
                        <div className="mobile-order-list-no">{order.orderNo}</div>
                        <div className="mobile-order-list-date">{order.createdAt}</div>
                      </div>
                      <AccountStatusBadge status={order.status} className="shrink-0" />
                    </div>
                    <div className="mobile-order-list-main">
                      <div className="mobile-order-list-media">
                        {order.items.slice(0, 2).map((item) => (
                          <span key={item.id} className="relative block size-9 overflow-hidden rounded-xl border border-white bg-slate-100 shadow-sm">
                            <Image src={item.image} alt={item.title} fill sizes="36px" className="object-cover" />
                          </span>
                        ))}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="mobile-order-list-title">{order.items[0]?.title}</div>
                        <div className="mobile-order-list-meta">
                          <span>{t("pieces", { count: pieces })}</span>
                        </div>
                      </div>
                      <div className="mobile-order-list-money">
                        <div className="mobile-order-list-total">${order.totalUsd.toFixed(2)}</div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="mobile-cart-empty">
              <h2>{t("empty")}</h2>
              <p>{t("count", { count: 0 })}</p>
            </div>
          )}
        </section>
      </MobileSectionShell>

      <div className="hidden space-y-4 md:block">
        <div className="flex gap-2 overflow-x-auto pb-1">
        {statusTabs.map((tab) => (
          <Button
            key={tab.value}
            type="button"
            variant={status === tab.value ? "default" : "outline"}
            size="sm"
            className="shrink-0"
            onClick={() => setStatus(tab.value)}
          >
            {tab.label}
          </Button>
        ))}
      </div>
      <div className="rounded-3xl border border-slate-200 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.05)]">
        <div className="border-b border-slate-100 p-4">
          <div className="relative max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder={t("search")}
              value={(table.getColumn("orderNo")?.getFilterValue() as string) ?? ""}
              onChange={(event) => table.getColumn("orderNo")?.setFilterValue(event.target.value)}
              className="pl-9"
            />
          </div>
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
              <TableRow>
                <TableCell colSpan={columns.length} className="h-28 text-center text-sm font-semibold text-slate-500">{t("empty")}</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <div className="flex flex-col gap-3 border-t border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm font-medium text-slate-500">{t("count", { count: table.getFilteredRowModel().rows.length })}</div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>{t("previous")}</Button>
            <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>{t("next")}</Button>
          </div>
        </div>
      </div>
      </div>
    </>
  );
}

function Money({ value, positive, warning }: { value: number; positive?: boolean; warning?: boolean }) {
  return (
    <span className={positive ? "font-black text-emerald-700" : warning ? "font-black text-amber-700" : "font-black text-slate-950"}>
      ${value.toFixed(2)}
    </span>
  );
}
