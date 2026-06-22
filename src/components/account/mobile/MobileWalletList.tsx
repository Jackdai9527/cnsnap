"use client";

import * as React from "react";
import { MobileAccountListToolbar } from "@/components/account/mobile/MobileAccountListToolbar";

type WalletRow = {
  transactionNo: string;
  type: "recharge" | "pay_order" | "pay_shipping" | "refund" | "adjustment" | "commission";
  amount: number;
  currency: "USD";
  balanceAfter: number;
  relatedOrderNo?: string;
  relatedPackageNo?: string;
  note: string;
  createdAt: string;
};

export function MobileWalletList({
  tableData,
  title,
  description,
  searchPlaceholder,
  filterAriaLabel,
  filterOptions,
  emptyTitle
}: {
  tableData: WalletRow[];
  title: string;
  description: string;
  searchPlaceholder: string;
  filterAriaLabel: string;
  filterOptions: Array<{ label: string; value: string }>;
  emptyTitle: string;
}) {
  const [query, setQuery] = React.useState("");
  const [type, setType] = React.useState("all");

  const filtered = React.useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return tableData.filter((item) => {
      const matchesType = type === "all" || item.type === type;
      const haystack = [item.transactionNo, item.note, item.relatedOrderNo, item.relatedPackageNo]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const matchesQuery = !keyword || haystack.includes(keyword);
      return matchesType && matchesQuery;
    });
  }, [query, tableData, type]);

  return (
    <>
      <MobileAccountListToolbar
        searchValue={query}
        searchPlaceholder={searchPlaceholder}
        onSearchChange={setQuery}
        filterValue={type}
        onFilterChange={setType}
        filterOptions={filterOptions}
        filterAriaLabel={filterAriaLabel}
      />
      <div className="mb-3 mt-3 text-[11px] font-black uppercase tracking-[0.12em] text-slate-400">{title}</div>
      <div className="mobile-account-list">
        {filtered.length ? filtered.slice(0, 20).map((item) => (
          <div key={item.transactionNo} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-black text-slate-950">{item.transactionNo}</div>
              <div className="text-sm font-black text-slate-950">${item.amount.toFixed(2)}</div>
            </div>
            <div className="mt-2 text-xs font-semibold text-slate-500">{item.note || item.type}</div>
            <div className="mt-2 text-[11px] font-semibold text-slate-400">{item.createdAt}</div>
          </div>
        )) : (
          <div className="mobile-cart-empty">
            <h2>{emptyTitle}</h2>
            <p>{description}</p>
          </div>
        )}
      </div>
    </>
  );
}
