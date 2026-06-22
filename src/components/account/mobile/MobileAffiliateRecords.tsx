"use client";

import * as React from "react";
import { MobileAccountListToolbar } from "@/components/account/mobile/MobileAccountListToolbar";
import { AccountStatusBadge } from "@/components/account/AccountStatusBadge";

type AffiliateRecord = {
  commissionNo: string;
  referredUserEmail: string;
  orderAmount: number;
  commissionRate: number;
  commissionAmount: number;
  status: string;
  createdAt: string;
};

export function MobileAffiliateRecords({
  title,
  records,
  orderAmountLabel,
  rateLabel,
  commissionAmountLabel,
  allLabel,
  pendingLabel,
  approvedLabel,
  paidLabel
}: {
  title: string;
  records: AffiliateRecord[];
  orderAmountLabel: string;
  rateLabel: string;
  commissionAmountLabel: string;
  allLabel: string;
  pendingLabel: string;
  approvedLabel: string;
  paidLabel: string;
}) {
  const [query, setQuery] = React.useState("");
  const [status, setStatus] = React.useState("all");

  const filtered = React.useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return records.filter((record) => {
      const matchesStatus = status === "all" || record.status === status;
      const haystack = `${record.commissionNo} ${record.referredUserEmail}`.toLowerCase();
      return matchesStatus && (!keyword || haystack.includes(keyword));
    });
  }, [query, records, status]);

  return (
    <>
      <MobileAccountListToolbar
        searchValue={query}
        searchPlaceholder={title}
        onSearchChange={setQuery}
        filterValue={status}
        onFilterChange={setStatus}
        filterOptions={[
          { label: allLabel, value: "all" },
          { label: pendingLabel, value: "pending" },
          { label: approvedLabel, value: "approved" },
          { label: paidLabel, value: "paid" }
        ]}
        filterAriaLabel={title}
      />
      <div className="mt-3 mobile-orders-list">
        {filtered.map((record) => (
          <article key={record.commissionNo} className="mobile-order-card p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-base font-black text-slate-950">{record.commissionNo}</div>
                <div className="mt-1 text-xs font-semibold text-slate-500">{record.createdAt}</div>
              </div>
              <AccountStatusBadge status={record.status} />
            </div>
            <div className="mt-3 text-sm font-black text-slate-900">{record.referredUserEmail}</div>
            <div className="mt-4 grid grid-cols-3 gap-3 rounded-2xl bg-slate-50 p-3">
              <div>
                <div className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">{orderAmountLabel}</div>
                <div className="mt-1 text-sm font-black text-slate-950">${record.orderAmount.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">{rateLabel}</div>
                <div className="mt-1 text-sm font-black text-slate-950">{Math.round(record.commissionRate * 100)}%</div>
              </div>
              <div>
                <div className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">{commissionAmountLabel}</div>
                <div className="mt-1 text-sm font-black text-emerald-700">${record.commissionAmount.toFixed(2)}</div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
