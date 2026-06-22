import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { AlertTriangle, CircleDollarSign, ClipboardList, PackageOpen, PlugZap, ShoppingBag, Truck } from "lucide-react";
import { money } from "@/lib/currency";
import { prisma } from "@/lib/db";

export default async function AdminDashboardPage() {
  const t = await getTranslations("dashboard");
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    todayOrders,
    pendingPaymentOrders,
    pendingPurchaseOrders,
    purchasingOrders,
    warehousePendingOrders,
    waitingShippingPaymentPackages,
    readyToShipPackages,
    todayRecharge,
    todayRefund,
    apiCalls,
    apiFailures,
    riskOrders,
    recentOrders,
    diyOrders
  ] = await Promise.all([
    prisma.order.count({ where: { createdAt: { gte: today }, NOT: { OR: [{ orderNo: { startsWith: "PKPAY-" } }, { orderSource: "package_payment" }] } } }),
    prisma.order.count({ where: { paymentStatus: "pending", NOT: { OR: [{ orderNo: { startsWith: "PKPAY-" } }, { orderSource: "package_payment" }] } } }),
    prisma.order.count({ where: { purchaseStatus: "pending", paymentStatus: "paid", NOT: { OR: [{ orderNo: { startsWith: "PKPAY-" } }, { orderSource: "package_payment" }] } } }),
    prisma.order.count({ where: { purchaseStatus: "purchasing", NOT: { OR: [{ orderNo: { startsWith: "PKPAY-" } }, { orderSource: "package_payment" }] } } }),
    prisma.order.count({ where: { warehouseStatus: "pending", purchaseStatus: "purchased", NOT: { OR: [{ orderNo: { startsWith: "PKPAY-" } }, { orderSource: "package_payment" }] } } }),
    prisma.order.count({ where: { shippingPaymentStatus: "pending", NOT: { OR: [{ orderNo: { startsWith: "PKPAY-" } }, { orderSource: "package_payment" }] } } }),
    prisma.order.count({ where: { shippingStatus: "ready_to_ship", NOT: { OR: [{ orderNo: { startsWith: "PKPAY-" } }, { orderSource: "package_payment" }] } } }),
    prisma.walletTransaction.aggregate({ where: { createdAt: { gte: today }, type: "recharge" }, _sum: { amount: true } }),
    prisma.walletTransaction.aggregate({ where: { createdAt: { gte: today }, type: "refund" }, _sum: { amount: true } }),
    prisma.apiLog.count({ where: { createdAt: { gte: today } } }),
    prisma.apiLog.count({ where: { createdAt: { gte: today }, status: { contains: "fail" } } }),
    prisma.order.count({ where: { riskStatus: "pending_review", NOT: { OR: [{ orderNo: { startsWith: "PKPAY-" } }, { orderSource: "package_payment" }] } } }),
    prisma.order.findMany({ where: { NOT: { OR: [{ orderNo: { startsWith: "PKPAY-" } }, { orderSource: "package_payment" }] } }, include: { user: true }, orderBy: { updatedAt: "desc" }, take: 6 }),
    prisma.diyOrder.findMany({ orderBy: { updatedAt: "desc" }, take: 6 })
  ]);

  const metrics = [
    [t("metrics.todayOrders"), todayOrders, ClipboardList, "/admin/orders"],
    [t("metrics.pendingPayment"), pendingPaymentOrders, CircleDollarSign, "/admin/orders?payment_status=pending"],
    [t("metrics.pendingPurchase"), pendingPurchaseOrders, ShoppingBag, "/admin/orders?payment_status=paid&purchase_status=pending"],
    [t("metrics.purchasing"), purchasingOrders, ShoppingBag, "/admin/orders?purchase_status=purchasing"],
    [t("metrics.warehousePending"), warehousePendingOrders, PackageOpen, "/admin/orders?warehouse_status=pending&purchase_status=purchased"],
    [t("metrics.shippingPayment"), waitingShippingPaymentPackages, CircleDollarSign, "/admin/orders?tab=shipping_pending"],
    [t("metrics.readyToShip"), readyToShipPackages, Truck, "/admin/orders?shipping_status=ready_to_ship"],
    [t("metrics.todayRecharge"), money(Number(todayRecharge._sum.amount ?? 0)), CircleDollarSign, "/admin/finance/recharges"],
    [t("metrics.todayRefund"), money(Number(todayRefund._sum.amount ?? 0)), CircleDollarSign, "/admin/finance/refunds"],
    [t("metrics.apiCalls"), apiCalls, PlugZap, "/admin/products/api-logs"],
    [t("metrics.apiFailures"), apiFailures, AlertTriangle, "/admin/products/api-logs?status=fail"],
    [t("metrics.riskReview"), riskOrders, AlertTriangle, "/admin/orders?risk_status=pending_review"]
  ] as const;

  return (
    <section>
      <div className="mb-6">
        <div className="admin-kicker">{t("page.kicker")}</div>
        <h1 className="admin-page-title mt-1">{t("page.title")}</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map(([label, value, Icon, href]) => (
          <Link key={label} href={href} className="admin-card p-4 transition hover:border-[#2563eb] hover:shadow-[0_12px_28px_rgba(16,24,40,0.08)]">
            <div className="flex items-center justify-between gap-3">
              <div className="grid size-10 place-items-center rounded-lg bg-[#eff6ff] text-[#2563eb] ring-1 ring-[#dbeafe]"><Icon size={20} /></div>
              <span className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">{t("metrics.open")}</span>
            </div>
            <div className="mt-4 text-sm font-semibold text-slate-500">{label}</div>
            <div className="mt-1 text-3xl font-extrabold text-slate-950">{value}</div>
          </Link>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_1fr]">
        <Panel title={t("panels.recentOrders")} href="/admin/orders" rows={recentOrders.map((order) => `${order.orderNo} · ${order.user.email} · ${order.orderStatus}/${order.paymentStatus}`)} emptyLabel={t("panels.noRecords")} />
        <Panel title={t("panels.diyQueue")} href="/admin/diy-orders" rows={diyOrders.map((order) => `${order.productName ?? order.productUrl} · ${order.status}`)} emptyLabel={t("panels.noRecords")} />
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-3 xl:grid-cols-6">
        <Quick href="/admin/orders#manual-order" label={t("quickLinks.createManualOrder")} />
        <Quick href="/admin/orders?payment_status=paid&purchase_status=pending" label={t("quickLinks.pendingOrders")} />
        <Quick href="/admin/diy-orders" label={t("quickLinks.diyOrders")} />
        <Quick href="/admin/warehouse/inbound" label={t("quickLinks.warehouseInbound")} />
        <Quick href="/admin/packages?shipping_status=ready_to_ship" label={t("quickLinks.readyToShip")} />
        <Quick href="/admin/products/api-logs?status=fail" label={t("quickLinks.apiErrorLogs")} />
      </div>
    </section>
  );
}

function Panel({ title, href, rows, emptyLabel }: { title: string; href: string; rows: string[]; emptyLabel: string }) {
  return (
    <div className="admin-card p-5">
      <Link href={href} className="text-lg font-extrabold text-slate-950 hover:text-[#2563eb]">{title}</Link>
      <div className="mt-4 divide-y divide-slate-100">
        {rows.length ? rows.map((row, index) => (
          <div key={`${row}-${index}`} className="py-2.5 text-sm leading-6 text-slate-600">{row}</div>
        )) : <p className="text-sm text-slate-500">{emptyLabel}</p>}
      </div>
    </div>
  );
}

function Quick({ href, label }: { href: string; label: string }) {
  return <Link href={href} className="admin-action justify-start px-4 py-3">{label}</Link>;
}
