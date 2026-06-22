import { Badge } from "@/components/ui/badge"
import { statusLabel } from "@/lib/constants"
import { cn } from "@/lib/utils"
import { useTranslations } from "next-intl"

type StatusKind = "order" | "payment" | "package" | "shipping" | "purchase" | "warehouse" | "risk" | "default"

type StatusBadgeProps = {
  status?: string | null
  kind?: StatusKind
  className?: string
}

const successStatuses = new Set([
  "paid",
  "purchased",
  "received",
  "warehouse_received",
  "shipping_paid",
  "shipped",
  "delivered",
  "completed",
  "active",
  "ready",
  "normal",
])

const warningStatuses = new Set([
  "pending",
  "pending_payment",
  "pending_review",
  "partial",
  "partial_purchased",
  "partial_received",
  "processing",
  "purchasing",
  "waiting_shipping_payment",
  "awaiting_transfer",
  "redirected",
  "reviewing",
  "submitted",
])

const dangerStatuses = new Set([
  "failed",
  "cancelled",
  "rejected",
  "restricted",
  "out_of_stock",
  "price_changed",
  "exception",
  "returned",
  "refunded",
  "trash",
  "inactive",
  "disabled",
])

function statusTone(status: string, kind: StatusKind) {
  if (successStatuses.has(status)) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700"
  }
  if (warningStatuses.has(status)) {
    return "border-amber-200 bg-amber-50 text-amber-700"
  }
  if (dangerStatuses.has(status)) {
    return "border-rose-200 bg-rose-50 text-rose-700"
  }
  if (kind === "payment") {
    return "border-sky-200 bg-sky-50 text-sky-700"
  }
  if (kind === "shipping" || kind === "package") {
    return "border-indigo-200 bg-indigo-50 text-indigo-700"
  }
  return "border-slate-200 bg-slate-50 text-slate-700"
}

export function StatusBadge({
  status,
  kind = "default",
  className,
}: StatusBadgeProps) {
  const t = useTranslations("common.statuses")
  const value = status || "none"

  return (
    <Badge
      variant="outline"
      className={cn(
        "h-6 rounded-full px-2.5 text-[11px] font-semibold capitalize",
        statusTone(value, kind),
        className
      )}
    >
      {t.has(value) ? t(value) : statusLabel[value] ?? value.replaceAll("_", " ")}
    </Badge>
  )
}
