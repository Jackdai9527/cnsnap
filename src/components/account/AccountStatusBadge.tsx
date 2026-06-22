import { Badge } from "@/components/ui/badge";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

type AccountStatusBadgeProps = {
  status?: string | null;
  className?: string;
};

const labels: Record<string, string> = {
  pending_payment: "Pending Payment",
  order_pending: "Order Pending",
  paid: "Paid",
  paid_product: "Paid Product",
  partial: "Partially Paid",
  purchasing: "Purchasing",
  partial_purchased: "Partial Purchased",
  purchased: "Purchased",
  warehouse_pending: "Warehouse Pending",
  partial_received: "Partially Received",
  received: "Received",
  waiting_shipping_payment: "Waiting Shipping Payment",
  international_freight_pending: "International Freight Pending",
  shipping_paid: "Shipping Paid",
  international_freight_paid: "International Freight Paid",
  customer_confirmed: "Customer Confirmed",
  shipped: "Shipped",
  in_transit: "In Transit",
  delivered: "Delivered",
  completed: "Completed",
  order_after_sales: "Order After Sales",
  refund: "Refund",
  cancel: "Cancel",
  cancelled: "Cancelled",
  exception: "Exception",
  pending: "Pending",
  submitted: "Submitted",
  reviewing: "Reviewing",
  quoted: "Quoted",
  converted_to_order: "Converted",
  rejected: "Rejected",
  recharge: "Recharge",
  pay_order: "Order Payment",
  pay_shipping: "Shipping Payment",
  adjustment: "Adjustment",
  commission: "Commission",
  approved: "Approved"
};

const positive = new Set(["paid", "paid_product", "purchased", "received", "shipping_paid", "international_freight_paid", "customer_confirmed", "shipped", "delivered", "completed", "approved", "converted_to_order"]);
const warning = new Set(["pending", "order_pending", "pending_payment", "partial", "purchasing", "partial_purchased", "warehouse_pending", "waiting_shipping_payment", "international_freight_pending", "submitted", "reviewing", "quoted", "in_transit"]);
const danger = new Set(["cancelled", "cancel", "refund", "order_after_sales", "rejected", "failed", "exception"]);

export function AccountStatusBadge({ status, className }: AccountStatusBadgeProps) {
  const t = useTranslations("account.statuses");
  const value = status || "none";
  const tone = positive.has(value)
    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
    : warning.has(value)
      ? "border-amber-200 bg-amber-50 text-amber-700"
      : danger.has(value)
        ? "border-rose-200 bg-rose-50 text-rose-700"
        : "border-slate-200 bg-slate-50 text-slate-600";

  return (
    <Badge variant="outline" className={cn("h-6 rounded-full px-2.5 text-[11px] font-semibold", tone, className)}>
      {t.has(value) ? t(value) : labels[value] ?? value.replaceAll("_", " ")}
    </Badge>
  );
}
