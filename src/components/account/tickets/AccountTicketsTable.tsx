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
import { MobileAccountListToolbar } from "@/components/account/mobile/MobileAccountListToolbar";
import { MobileSectionShell } from "@/components/mobile/layout/MobileSectionShell";
import { TicketPriorityBadge } from "@/components/account/tickets/TicketPriorityBadge";
import { TicketStatusBadge } from "@/components/account/tickets/TicketStatusBadge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { TicketCategory, TicketListItem, TicketPriority, TicketStatus } from "@/types/ticket";
import { ticketCategories, ticketCategoryLabel, ticketPriorities, ticketStatuses } from "@/types/ticket";

type StatusFilter = "all" | TicketStatus;
type CategoryFilter = "all" | TicketCategory;
type PriorityFilter = "all" | TicketPriority;

export function AccountTicketsTable({ data }: { data: TicketListItem[] }) {
  const t = useTranslations("account.tickets.table");
  const statusTabs: Array<{ label: string; value: StatusFilter }> = [
    { label: t("tabs.all"), value: "all" },
    { label: t("tabs.open"), value: "open" },
    { label: t("tabs.pending"), value: "pending" },
    { label: t("tabs.replied"), value: "replied" },
    { label: t("tabs.resolved"), value: "resolved" },
    { label: t("tabs.closed"), value: "closed" }
  ];
  const columns: ColumnDef<TicketListItem>[] = [
    {
      accessorKey: "ticketNo",
      header: t("columns.ticket"),
      cell: ({ row }) => (
        <Link href={`/account/tickets/${row.original.id}`} className="font-black text-slate-950 hover:text-sky-600">
          {row.original.ticketNo}
        </Link>
      )
    },
    {
      accessorKey: "subject",
      header: t("columns.subject"),
      cell: ({ row }) => (
        <div className="min-w-[240px]">
          <Link href={`/account/tickets/${row.original.id}`} className="line-clamp-1 font-bold text-slate-800 hover:text-sky-600">
            {row.original.subject}
          </Link>
          <div className="mt-1 text-xs font-semibold text-slate-400">{ticketCategoryLabel(row.original.category)}</div>
        </div>
      )
    },
    { accessorKey: "category", header: t("columns.category"), cell: ({ row }) => ticketCategoryLabel(row.original.category) },
    { accessorKey: "relatedOrderNo", header: t("columns.order"), cell: ({ row }) => row.original.relatedOrderNo ?? "-" },
    { accessorKey: "relatedPackageNo", header: t("columns.package"), cell: ({ row }) => row.original.relatedPackageNo ?? "-" },
    { accessorKey: "priority", header: t("columns.priority"), cell: ({ row }) => <TicketPriorityBadge priority={row.original.priority} /> },
    { accessorKey: "status", header: t("columns.status"), cell: ({ row }) => <TicketStatusBadge status={row.original.status} /> },
    { accessorKey: "lastReplyAt", header: t("columns.lastReply"), cell: ({ row }) => row.original.lastReplyAt ?? "-" },
    { accessorKey: "createdAt", header: t("columns.created") },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const ticket = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger render={<button type="button" />} className="inline-flex size-8 items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0" aria-label={t("actions.openActions", { ticketNo: ticket.ticketNo })}>
              <MoreHorizontal />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem render={<Link href={`/account/tickets/${ticket.id}`} />}>{t("actions.viewDetails")}</DropdownMenuItem>
              {ticket.status !== "closed" ? <DropdownMenuItem>{t("actions.closeTicket")}</DropdownMenuItem> : null}
              <DropdownMenuSeparator />
              <DropdownMenuItem render={<Link href="/account/tickets/new" />}>{t("actions.newTicket")}</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
      enableSorting: false
    }
  ];
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [status, setStatus] = React.useState<StatusFilter>("all");
  const [category, setCategory] = React.useState<CategoryFilter>("all");
  const [priority, setPriority] = React.useState<PriorityFilter>("all");
  const [from, setFrom] = React.useState("");
  const [to, setTo] = React.useState("");
  const [globalFilter, setGlobalFilter] = React.useState("");

  const filteredData = React.useMemo(() => {
    const query = globalFilter.trim().toLowerCase();
    return data.filter((ticket) => {
      const day = ticket.createdAt.slice(0, 10);
      const searchable = [ticket.ticketNo, ticket.subject, ticket.relatedOrderNo, ticket.relatedPackageNo].filter(Boolean).join(" ").toLowerCase();
      if (status !== "all" && ticket.status !== status) return false;
      if (category !== "all" && ticket.category !== category) return false;
      if (priority !== "all" && ticket.priority !== priority) return false;
      if (from && day < from) return false;
      if (to && day > to) return false;
      if (query && !searchable.includes(query)) return false;
      return true;
    });
  }, [category, data, from, globalFilter, priority, status, to]);

  // eslint-disable-next-line react-hooks/incompatible-library -- TanStack Table exposes imperative table helpers by design.
  const table = useReactTable({
    data: filteredData,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel()
  });

  return (
    <>
      <MobileSectionShell title={t("tabs.all")} description={t("count", { count: table.getFilteredRowModel().rows.length })} kicker={t("columns.ticket")} className="mobile-tickets-list-page md:hidden" minimalHeader showBackButton>
        <section className="card-stack-section">
          <MobileAccountListToolbar
            searchValue={globalFilter}
            searchPlaceholder={t("search")}
            onSearchChange={setGlobalFilter}
            filterValue={status}
            onFilterChange={(value) => setStatus(value as StatusFilter)}
            filterOptions={statusTabs}
            filterAriaLabel={t("columns.ticket")}
          />
        </section>

        <section className="card-stack-section">
          {filteredData.length ? (
            <div className="mobile-orders-list">
              {filteredData.map((ticket) => (
                <article key={ticket.id} className="mobile-order-card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link href={`/account/tickets/${ticket.id}`} className="block text-base font-black text-slate-950">
                        {ticket.ticketNo}
                      </Link>
                      <div className="mt-1 text-xs font-semibold text-slate-500">{ticket.createdAt}</div>
                    </div>
                    <TicketStatusBadge status={ticket.status} />
                  </div>
                  <div className="mt-3 text-sm font-black text-slate-900">{ticket.subject}</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <TicketPriorityBadge priority={ticket.priority} />
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3 rounded-2xl bg-slate-50 p-3">
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">{t("columns.category")}</div>
                      <div className="mt-1 text-sm font-black text-slate-950">{ticketCategoryLabel(ticket.category)}</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">{t("columns.lastReply")}</div>
                      <div className="mt-1 text-sm font-black text-slate-950">{ticket.lastReplyAt ?? "-"}</div>
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Link href={`/account/tickets/${ticket.id}`} className="mobile-orders-action is-primary">
                      {t("actions.viewDetails")}
                    </Link>
                    <Link href="/account/tickets/new" className="mobile-orders-action">
                      {t("actions.newTicket")}
                    </Link>
                  </div>
                </article>
              ))}
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
          <Button key={tab.value} type="button" variant={status === tab.value ? "default" : "outline"} size="sm" className="shrink-0" onClick={() => setStatus(tab.value)}>
            {tab.label}
          </Button>
        ))}
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.05)]">
        <div className="grid gap-3 border-b border-slate-100 p-4 lg:grid-cols-[minmax(220px,1fr)_170px_150px_150px_150px_150px_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input placeholder={t("search")} value={globalFilter} onChange={(event) => setGlobalFilter(event.target.value)} className="pl-9" />
          </div>
          <Select value={category} onValueChange={(value) => setCategory((value ?? "all") as CategoryFilter)}>
            <SelectTrigger className="h-9 w-full bg-white"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("allCategories")}</SelectItem>
              {ticketCategories.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={priority} onValueChange={(value) => setPriority((value ?? "all") as PriorityFilter)}>
            <SelectTrigger className="h-9 w-full bg-white"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("allPriorities")}</SelectItem>
              {ticketPriorities.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={(value) => setStatus((value ?? "all") as StatusFilter)}>
            <SelectTrigger className="h-9 w-full bg-white"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("allStatuses")}</SelectItem>
              {ticketStatuses.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Input type="date" value={from} onChange={(event) => setFrom(event.target.value)} />
          <Input type="date" value={to} onChange={(event) => setTo(event.target.value)} />
          <Button variant="outline" onClick={() => { setStatus("all"); setCategory("all"); setPriority("all"); setFrom(""); setTo(""); setGlobalFilter(""); }}>{t("reset")}</Button>
        </div>

        <div className="overflow-x-auto">
          <Table className="min-w-[1180px]">
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
        </div>

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
