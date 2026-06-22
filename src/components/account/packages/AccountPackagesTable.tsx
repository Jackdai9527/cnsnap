"use client";

import * as React from "react";
import Link from "next/link";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
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
import { MobileAccountListToolbar } from "@/components/account/mobile/MobileAccountListToolbar";
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
import type { AccountPackage } from "@/lib/account/mock-data";
import type { RealAccountPackage } from "@/lib/account/packages";
type PackageFilter = "all" | AccountPackage["packageStatus"];

export function AccountPackagesTable({
  data,
  title,
  description
}: {
  data: RealAccountPackage[] | AccountPackage[];
  title: string;
  description: string;
}) {
  const t = useTranslations("account.packages.table");
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [status, setStatus] = React.useState<PackageFilter>("all");
  const [globalFilter, setGlobalFilter] = React.useState("");
  const statusTabs: Array<{ label: string; value: PackageFilter }> = [
    { label: t("tabs.all"), value: "all" },
    { label: t("tabs.waitingShippingPayment"), value: "waiting_shipping_payment" },
    { label: t("tabs.shippingPaid"), value: "shipping_paid" },
    { label: t("tabs.shipped"), value: "shipped" },
    { label: t("tabs.delivered"), value: "delivered" },
    { label: t("tabs.exception"), value: "exception" }
  ];
  const columns: ColumnDef<AccountPackage>[] = [
    {
      accessorKey: "packageNo",
      header: t("columns.package"),
      cell: ({ row }) => (
        <Link href={`/account/orders/${(row.original as RealAccountPackage).orderId ?? row.original.orderNo}`} className="font-black text-sky-700 hover:underline">
          {row.original.packageNo}
        </Link>
      )
    },
    {
      accessorKey: "orderNo",
      header: t("columns.order"),
      cell: ({ row }) => {
        const pkg = row.original as RealAccountPackage;
        return pkg.orderId ? (
          <Link href={`/account/orders/${pkg.orderId}`} className="font-black text-sky-700 hover:underline">
            {pkg.orderNo}
          </Link>
        ) : (
          pkg.orderNo
        );
      }
    },
    { accessorKey: "createdAt", header: t("columns.created") },
    { accessorKey: "packageStatus", header: t("columns.packageStatus"), cell: ({ row }) => <AccountStatusBadge status={row.original.packageStatus} /> },
    { accessorKey: "itemCount", header: t("columns.items") },
    { accessorKey: "shippingFeeUsd", header: t("columns.shippingFee"), cell: ({ row }) => <span className="font-black text-slate-950">${row.original.shippingFeeUsd.toFixed(2)}</span> },
    { accessorKey: "shippingPaymentStatus", header: t("columns.payment"), cell: ({ row }) => <AccountStatusBadge status={row.original.shippingPaymentStatus} /> },
    { accessorKey: "trackingNumber", header: t("columns.tracking"), cell: ({ row }) => row.original.trackingNumber ? <span className="font-mono text-xs">{row.original.trackingNumber}</span> : "-" },
    { accessorKey: "shippedAt", header: t("columns.shipped"), cell: ({ row }) => row.original.shippedAt ?? "-" },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const pkg = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger render={<button type="button" />} className="inline-flex size-8 items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0" aria-label={t("actions.openActions", { packageNo: pkg.packageNo })}>
              <MoreHorizontal />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem render={<Link href={`/account/packages/${pkg.id}`} />}>{t("actions.viewDetails")}</DropdownMenuItem>
              {pkg.shippingPaymentStatus === "pending" ? <DropdownMenuItem render={<Link href={`/account/packages/${pkg.id}/pay`} />}>{t("actions.payShippingFee")}</DropdownMenuItem> : null}
              {pkg.trackingNumber ? <DropdownMenuItem render={<a href={`https://www.17track.net/en/track?nums=${pkg.trackingNumber}`} target="_blank" rel="noreferrer" />}>{t("actions.trackPackage")}</DropdownMenuItem> : null}
              <DropdownMenuSeparator />
              <DropdownMenuItem render={<Link href={`/account/tickets/new?packageId=${encodeURIComponent(pkg.id)}`} />}>{t("actions.contactSupport")}</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
      enableSorting: false
    }
  ];

  const filteredData = React.useMemo(() => {
    return status === "all" ? data : data.filter((pkg) => pkg.packageStatus === status);
  }, [data, status]);

  // eslint-disable-next-line react-hooks/incompatible-library -- TanStack Table exposes imperative table helpers by design.
  const table = useReactTable({
    data: filteredData,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel()
  });

  return (
    <>
      <MobileSectionShell
        title={title}
        description={description}
        kicker={t("columns.package")}
        className="mobile-packages-list-page md:hidden"
        compactHeader
        showBackButton
      >
        {filteredData.some((pkg) => pkg.shippingPaymentStatus === "pending") ? (
          <section className="card-stack-section">
            <div className="mobile-order-card mobile-packages-alert-card p-4">
              <div className="mobile-packages-alert-eyebrow text-[11px] font-black uppercase tracking-[0.12em] text-amber-700">{t("alert.eyebrow")}</div>
              <div className="mobile-packages-alert-title mt-2 text-base font-black text-slate-950">{t("alert.title")}</div>
              <p className="mobile-packages-alert-copy mt-2 text-sm font-semibold leading-6 text-slate-600">{t("alert.description")}</p>
            </div>
          </section>
        ) : null}

        <section className="card-stack-section">
          <MobileAccountListToolbar
            searchValue={globalFilter}
            searchPlaceholder={t("search")}
            onSearchChange={setGlobalFilter}
            filterValue={status}
            onFilterChange={(value) => setStatus(value as PackageFilter)}
            filterOptions={statusTabs}
            filterAriaLabel={t("columns.package")}
          />
        </section>

        <section className="card-stack-section">
          {filteredData.length ? (
            <div className="mobile-orders-list">
              {filteredData.map((pkg) => (
                <Link key={pkg.id} href={`/account/packages/${pkg.id}`} className="mobile-order-list-row">
                  <div className="mobile-order-list-row-top">
                    <div className="min-w-0">
                      <div className="mobile-order-list-no">{pkg.packageNo}</div>
                      <div className="mobile-order-list-date">{pkg.createdAt}</div>
                    </div>
                    <AccountStatusBadge status={pkg.packageStatus} className="shrink-0" />
                  </div>
                  <div className="mobile-order-list-main">
                    <div className="mobile-order-list-media">
                      <span className="grid size-9 place-items-center rounded-xl border border-white bg-slate-100 text-[10px] font-black uppercase tracking-[0.08em] text-slate-500 shadow-sm">
                        PKG
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="mobile-order-list-title">{pkg.orderNo}</div>
                      <div className="mobile-order-list-meta">
                        <span>{t("columns.items")}: {pkg.itemCount}</span>
                        {pkg.trackingNumber ? <span>{t("columns.tracking")}: {pkg.trackingNumber}</span> : null}
                      </div>
                      <div className="mt-2">
                        <AccountStatusBadge status={pkg.shippingPaymentStatus} />
                      </div>
                    </div>
                    <div className="mobile-order-list-money">
                      <div className="mobile-order-list-total">${pkg.shippingFeeUsd.toFixed(2)}</div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="mobile-cart-empty">
              <h2>{t("empty")}</h2>
              <p>{t("search")}</p>
            </div>
          )}
        </section>
      </MobileSectionShell>

      <div className="hidden space-y-4 md:block">
      {filteredData.some((pkg) => pkg.shippingPaymentStatus === "pending") ? (
        <div className="account-packages-alert rounded-3xl border border-amber-300 bg-[linear-gradient(135deg,#fff7ed_0%,#fef3c7_100%)] px-5 py-4 shadow-[0_18px_40px_rgba(245,158,11,0.18)]">
          <div className="account-packages-alert-eyebrow text-xs font-black uppercase tracking-[0.14em] text-amber-700">{t("alert.eyebrow")}</div>
          <div className="account-packages-alert-title mt-2 text-lg font-black text-slate-950">{t("alert.title")}</div>
          <p className="account-packages-alert-copy mt-2 text-sm font-semibold leading-6 text-amber-900">
            {t("alert.description")}
          </p>
        </div>
      ) : null}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {statusTabs.map((tab) => (
          <Button
            key={tab.value}
            variant={status === tab.value ? "default" : "outline"}
            size="sm"
            className="account-packages-filter-button shrink-0"
            onClick={() => setStatus(tab.value)}
          >
            {tab.label}
          </Button>
        ))}
      </div>
      <div className="account-packages-table-shell rounded-3xl border border-slate-200 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.05)]">
        <div className="border-b border-slate-100 p-4">
          <div className="relative max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder={t("search")}
              value={globalFilter}
              onChange={(event) => setGlobalFilter(event.target.value)}
              className="account-packages-search pl-9"
            />
          </div>
        </div>
        <Table className="min-w-[980px]">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="bg-slate-50/70">
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="account-packages-table-head px-4 py-3 text-xs font-black uppercase tracking-[0.08em] text-slate-500">
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
                  <TableCell key={cell.id} className="account-packages-table-cell px-4 py-3 text-sm font-medium text-slate-600">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            )) : (
              <TableRow><TableCell colSpan={columns.length} className="account-packages-empty h-28 text-center text-sm font-semibold text-slate-500">{t("empty")}</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      </div>
    </>
  );
}
