"use client";

import * as React from "react";
import Link from "next/link";
import { MobileAccountListToolbar } from "@/components/account/mobile/MobileAccountListToolbar";
import { AccountStatusBadge } from "@/components/account/AccountStatusBadge";

type DiyOrderRow = {
  id: string;
  diyNo: string;
  productName: string;
  productUrl: string;
  quantity: number;
  budgetUsd?: number;
  quoteUsd?: number;
  status: string;
  createdAt: string;
};

export function MobileDiyOrdersList({
  title,
  searchPlaceholder,
  rows,
  allLabel,
  detailLabel,
  quantityLabel,
  budgetLabel,
  quoteLabel
}: {
  title: string;
  searchPlaceholder: string;
  rows: DiyOrderRow[];
  allLabel: string;
  detailLabel: string;
  quantityLabel: string;
  budgetLabel: string;
  quoteLabel: string;
}) {
  const [query, setQuery] = React.useState("");
  const [status, setStatus] = React.useState("all");

  const filtered = React.useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return rows.filter((row) => {
      const matchesStatus = status === "all" || row.status === status;
      const haystack = `${row.diyNo} ${row.productName} ${row.productUrl}`.toLowerCase();
      const matchesQuery = !keyword || haystack.includes(keyword);
      return matchesStatus && matchesQuery;
    });
  }, [query, rows, status]);

  const filterOptions = React.useMemo(() => {
    const uniqueStatuses = Array.from(new Set(rows.map((row) => row.status)));
    return [{ label: allLabel, value: "all" }, ...uniqueStatuses.map((value) => ({ label: value, value }))];
  }, [allLabel, rows]);

  return (
    <>
      <MobileAccountListToolbar
        searchValue={query}
        searchPlaceholder={searchPlaceholder}
        onSearchChange={setQuery}
        filterValue={status}
        onFilterChange={setStatus}
        filterOptions={filterOptions}
        filterAriaLabel={title}
      />
      <div className="mt-3 mobile-orders-list">
        {filtered.map((order) => (
          <article key={order.id} className="mobile-order-card p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-base font-black text-slate-950">{order.diyNo}</div>
                <div className="mt-1 text-xs font-semibold text-slate-500">{order.createdAt}</div>
              </div>
              <AccountStatusBadge status={order.status} />
            </div>
            <div className="mt-3 text-sm font-black text-slate-900">{order.productName}</div>
            <div className="mt-2 grid grid-cols-3 gap-3 rounded-2xl bg-slate-50 p-3">
              <div>
                <div className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">{quantityLabel}</div>
                <div className="mt-1 text-sm font-black text-slate-950">{order.quantity}</div>
              </div>
              <div>
                <div className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">{budgetLabel}</div>
                <div className="mt-1 text-sm font-black text-slate-950">{order.budgetUsd ? `$${order.budgetUsd.toFixed(2)}` : "-"}</div>
              </div>
              <div>
                <div className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">{quoteLabel}</div>
                <div className="mt-1 text-sm font-black text-slate-950">{order.quoteUsd ? `$${order.quoteUsd.toFixed(2)}` : "-"}</div>
              </div>
            </div>
            <a href={order.productUrl} target="_blank" rel="noreferrer" className="mt-3 block break-all text-xs font-semibold text-sky-600">{order.productUrl}</a>
            <Link href={`/account/diy-orders/${order.id}`} className="mobile-orders-action mt-3">
              {detailLabel}
            </Link>
          </article>
        ))}
      </div>
    </>
  );
}
