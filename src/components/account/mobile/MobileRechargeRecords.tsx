"use client";

import * as React from "react";
import { MobileAccountListToolbar } from "@/components/account/mobile/MobileAccountListToolbar";
import { AccountStatusBadge } from "@/components/account/AccountStatusBadge";

type RechargeRecord = {
  paymentNo: string;
  amount: number;
  currency: string;
  status: string;
  method: string;
  createdAt: string;
};

export function MobileRechargeRecords({
  title,
  empty,
  searchPlaceholder,
  filterLabel,
  records,
  allLabel
}: {
  title: string;
  empty: string;
  searchPlaceholder: string;
  filterLabel: string;
  records: RechargeRecord[];
  allLabel: string;
}) {
  const [query, setQuery] = React.useState("");
  const [status, setStatus] = React.useState("all");

  const filtered = React.useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return records.filter((record) => {
      const matchesStatus = status === "all" || record.status === status;
      const haystack = `${record.paymentNo} ${record.method} ${record.createdAt}`.toLowerCase();
      const matchesQuery = !keyword || haystack.includes(keyword);
      return matchesStatus && matchesQuery;
    });
  }, [query, records, status]);

  const filterOptions = React.useMemo(() => {
    const uniqueStatuses = Array.from(new Set(records.map((record) => record.status)));
    return [{ label: allLabel, value: "all" }, ...uniqueStatuses.map((value) => ({ label: value, value }))];
  }, [allLabel, records]);

  return (
    <>
      <MobileAccountListToolbar
        searchValue={query}
        searchPlaceholder={searchPlaceholder}
        onSearchChange={setQuery}
        filterValue={status}
        onFilterChange={setStatus}
        filterOptions={filterOptions}
        filterAriaLabel={filterLabel}
      />
      <div className="mb-3 mt-3 text-[11px] font-black uppercase tracking-[0.12em] text-slate-400">{title}</div>
      <div className="mobile-account-list">
        {filtered.length ? filtered.map((record) => (
          <div key={record.paymentNo} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-black text-slate-950">{record.paymentNo}</div>
              <AccountStatusBadge status={record.status} />
            </div>
            <div className="mt-2 text-sm font-black text-slate-950">${record.amount.toFixed(2)} {record.currency}</div>
            <div className="mt-1 text-xs font-semibold text-slate-500">{record.method}</div>
            <div className="mt-2 text-[11px] font-semibold text-slate-400">{record.createdAt}</div>
          </div>
        )) : (
          <div className="mobile-cart-empty">
            <h2>{title}</h2>
            <p>{empty}</p>
          </div>
        )}
      </div>
    </>
  );
}
