"use client";

import { useTranslations } from "next-intl";
import { statusLabel } from "@/lib/constants";

const styles: Record<string, string> = {
  paid: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  paid_product: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  completed: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  purchased: "bg-sky-50 text-sky-700 ring-sky-100",
  partial_purchased: "bg-sky-50 text-sky-700 ring-sky-100",
  received: "bg-sky-50 text-sky-700 ring-sky-100",
  shipped: "bg-indigo-50 text-indigo-700 ring-indigo-100",
  delivered: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  international_freight_pending: "bg-amber-50 text-amber-700 ring-amber-100",
  international_freight_paid: "bg-indigo-50 text-indigo-700 ring-indigo-100",
  customer_confirmed: "bg-indigo-50 text-indigo-700 ring-indigo-100",
  order_pending: "bg-amber-50 text-amber-700 ring-amber-100",
  order_after_sales: "bg-rose-50 text-rose-700 ring-rose-100",
  refund: "bg-slate-100 text-slate-600 ring-slate-200",
  cancel: "bg-slate-100 text-slate-600 ring-slate-200",
  pending_review: "bg-amber-50 text-amber-700 ring-amber-100",
  restricted: "bg-red-50 text-red-700 ring-red-100",
  rejected: "bg-red-50 text-red-700 ring-red-100",
  cancelled: "bg-slate-100 text-slate-600 ring-slate-200",
  refunded: "bg-slate-100 text-slate-600 ring-slate-200",
  failed: "bg-red-50 text-red-700 ring-red-100",
  out_of_stock: "bg-red-50 text-red-700 ring-red-100",
  price_changed: "bg-amber-50 text-amber-700 ring-amber-100",
  normal: "bg-slate-50 text-slate-600 ring-slate-100",
  none: "bg-slate-50 text-slate-500 ring-slate-100",
  pending: "bg-amber-50 text-amber-700 ring-amber-100"
};

export function OrderStatusBadge({ value }: { value?: string | null }) {
  const commonT = useTranslations("common.statuses");
  const status = value || "none";
  return (
    <span className={`inline-flex whitespace-nowrap rounded-full px-2 py-1 text-[11px] font-black ring-1 ${styles[status] ?? "bg-slate-50 text-slate-600 ring-slate-100"}`}>
      {commonT.has(status) ? commonT(status) : statusLabel[status] ?? status}
    </span>
  );
}
