"use client";

import * as React from "react";
import Link from "next/link";
import { MobileAccountListToolbar } from "@/components/account/mobile/MobileAccountListToolbar";
import { AccountStatusBadge } from "@/components/account/AccountStatusBadge";

type PendingItem = {
  id: string;
  orderNo?: string;
  packageNo?: string;
  amountUsd: number;
  href: string;
  status: string;
  kind: "order" | "shipping";
};

export function MobileBillingWorkspace({
  title,
  description,
  pendingOrderPayments,
  pendingShippingPayments,
  allLabel,
  orderPaymentsLabel,
  shippingPaymentsLabel,
  orderPaymentDueLabel,
  shippingPaymentDueLabel
}: {
  title: string;
  description: string;
  pendingOrderPayments: PendingItem[];
  pendingShippingPayments: PendingItem[];
  allLabel: string;
  orderPaymentsLabel: string;
  shippingPaymentsLabel: string;
  orderPaymentDueLabel: string;
  shippingPaymentDueLabel: string;
}) {
  const [query, setQuery] = React.useState("");
  const [type, setType] = React.useState("all");
  const rows = React.useMemo(() => [...pendingOrderPayments, ...pendingShippingPayments], [pendingOrderPayments, pendingShippingPayments]);

  const filtered = React.useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return rows.filter((row) => {
      const matchesType = type === "all" || row.kind === type;
      const haystack = `${row.orderNo ?? ""} ${row.packageNo ?? ""} ${row.amountUsd}`.toLowerCase();
      return matchesType && (!keyword || haystack.includes(keyword));
    });
  }, [query, rows, type]);

  return (
    <>
      <MobileAccountListToolbar
        searchValue={query}
        searchPlaceholder={title}
        onSearchChange={setQuery}
        filterValue={type}
        onFilterChange={setType}
        filterOptions={[
          { label: allLabel, value: "all" },
          { label: orderPaymentsLabel, value: "order" },
          { label: shippingPaymentsLabel, value: "shipping" }
        ]}
        filterAriaLabel={title}
      />
      <div className="mt-3 mobile-account-list">
        {filtered.length ? filtered.map((item) => (
          <Link key={`${item.kind}-${item.id}`} href={item.href} className="mobile-account-card p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-400">{item.kind === "order" ? orderPaymentDueLabel : shippingPaymentDueLabel}</div>
                <div className="mt-2 text-base font-black text-slate-950">{item.orderNo ?? item.packageNo}</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-black text-slate-950">${item.amountUsd.toFixed(2)}</div>
                <div className="mt-1"><AccountStatusBadge status={item.status} /></div>
              </div>
            </div>
          </Link>
        )) : (
          <div className="mobile-cart-empty">
            <h2>{title}</h2>
            <p>{description}</p>
          </div>
        )}
      </div>
    </>
  );
}
