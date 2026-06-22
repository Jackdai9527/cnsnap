import Image from "next/image";
import Link from "next/link";
import { Prisma } from "@prisma/client";
import { getTranslations } from "next-intl/server";
import { AdminInlineEditPanel } from "@/components/admin/AdminInlineEditPanel";
import { AdminModal } from "@/components/admin/AdminModal";
import { AdminSaveForm } from "@/components/admin/AdminSaveForm";
import { Can } from "@/components/admin/Can";
import { OrderQcPhotoPanel } from "@/components/admin/OrderQcPhotoPanel";
import { OrderStatusBadge } from "@/components/admin/OrderStatusBadge";
import { WorkflowConfirmButton } from "@/components/admin/WorkflowConfirmButton";
import { AddressRegionFields } from "@/components/forms/AddressRegionFields";
import { countryName } from "@/lib/countries";
import {
  orderPackageStatusOptions,
  orderSourceOptions,
  orderNoteTypeOptions,
  paymentStatusOptions,
  purchaseStatusOptions,
  refundStatusOptions,
  riskStatusOptions,
  shippingPaymentStatusOptions,
  shippingStatusOptions,
  statusLabel,
  warehouseStatusOptions
} from "@/lib/constants";
import { money } from "@/lib/currency";
import { adminRoleFilterValues } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db";
import { serializeMediaAsset } from "@/lib/media-assets";
import {
  addOrderNote,
  bulkUpdateOrders,
  moveOrderToTrash,
  permanentlyDeleteOrder,
  restoreOrderFromTrash,
  updateOrderAddress,
  updateOrderStatus,
  updateOrderWorkflow
} from "../actions";

type OrdersPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const pageSize = 20;
const bulkFormId = "admin-orders-bulk-form";

const workflowTabs = [
  { key: "all", label: "All" },
  { key: "pending_payment", label: "Pending Payment" },
  { key: "paid", label: "Paid" },
  { key: "reviewing", label: "Reviewing" },
  { key: "purchasing", label: "Purchasing" },
  { key: "purchased", label: "Purchased" },
  { key: "warehouse_pending", label: "Warehouse Pending" },
  { key: "warehouse_received", label: "Warehouse Received" },
  { key: "package_created", label: "Package Created" },
  { key: "shipping_pending", label: "Shipping Pending" },
  { key: "shipping_paid", label: "Shipping Paid" },
  { key: "shipped", label: "Shipped" },
  { key: "completed", label: "Completed" },
  { key: "abnormal", label: "Abnormal" },
  { key: "cancelled", label: "Cancelled" },
  { key: "refunded", label: "Refunded" }
] as const;

type WorkflowTabKey = (typeof workflowTabs)[number]["key"];

export default async function AdminOrdersPage({ searchParams }: OrdersPageProps) {
  const t = await getTranslations("orders.ordersPage");
  const params = await searchParams;
  const page = Math.max(1, Number(readParam(params, "page") || 1));
  const sort = readParam(params, "sort") || "updatedAt";
  const dir = readParam(params, "dir") === "asc" ? "asc" : "desc";
  const where = buildOrderWhere(params);
  const orderBy = buildOrderBy(sort, dir);
  const activeTab = readParam(params, "tab") || "all";

  const activeWhere = buildOrderWhere(params, { ignoreTab: true });
  const [orders, total, admins, tabCounts, nodeCounts] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        user: true,
        items: true,
        address: true,
        payments: { orderBy: { createdAt: "desc" } },
        packages: { include: { shippingChannel: true, items: true }, orderBy: { createdAt: "desc" } },
        mediaAssets: { where: { usage: "qc_photo" }, include: { uploader: { select: { id: true, email: true, name: true } } }, orderBy: { createdAt: "desc" } },
        notes: { include: { creator: true }, orderBy: { createdAt: "desc" } },
        logs: { include: { actor: true }, orderBy: { createdAt: "desc" }, take: 80 }
      },
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize
    }),
    prisma.order.count({ where }),
    prisma.user.findMany({ where: { role: { in: adminRoleFilterValues } }, orderBy: { email: "asc" } }),
    getTabCounts(activeWhere),
    getNodeCounts()
  ]);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <section>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="admin-kicker">{t("kicker")}</div>
          <h1 className="admin-page-title mt-1">{t("title")}</h1>
        </div>
        <div className="text-sm font-semibold text-slate-500">{t("records", { count: total })}</div>
      </div>

      <OrderNodeSummary counts={nodeCounts} t={t} />

      <OrderWorkflowTabs params={params} activeTab={activeTab} counts={tabCounts} t={t} />

      <OrderFilters params={params} t={t} />

      <div className="mt-4">
        <Can permission="orders.update">
        <form id={bulkFormId} action={bulkUpdateOrders} className="mb-3 flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
          <span className="text-xs font-black uppercase tracking-[0.12em] text-slate-400">{t("bulk.label")}</span>
          <select name="paymentStatus" className="admin-input h-9 py-1">
            <option value="">{t("bulk.paymentStatus")}</option>
            {paymentStatusOptions.map((status) => <option key={status} value={status}>{statusLabel[status]}</option>)}
          </select>
          <select name="purchaseStatus" className="admin-input h-9 py-1">
            <option value="">{t("bulk.purchaseStatus")}</option>
            {purchaseStatusOptions.map((status) => <option key={status} value={status}>{statusLabel[status]}</option>)}
          </select>
          <select name="warehouseStatus" className="admin-input h-9 py-1">
            <option value="">{t("bulk.warehouseStatus")}</option>
            {warehouseStatusOptions.map((status) => <option key={status} value={status}>{statusLabel[status]}</option>)}
          </select>
          <select name="riskStatus" className="admin-input h-9 py-1">
            <option value="">{t("bulk.riskStatus")}</option>
            {riskStatusOptions.map((status) => <option key={status} value={status}>{statusLabel[status]}</option>)}
          </select>
          <select name="shippingPaymentStatus" className="admin-input h-9 py-1">
            <option value="">{t("bulk.shippingPayment")}</option>
            {shippingPaymentStatusOptions.map((status) => <option key={status} value={status}>{statusLabel[status]}</option>)}
          </select>
          <select name="bulkAction" className="admin-input h-9 py-1">
            <option value="">{t("bulk.workflowAction")}</option>
            <option value="mark_paid">{t("bulk.actions.markPaid")}</option>
            <option value="send_payment_reminder">{t("bulk.actions.sendPaymentReminder")}</option>
            <option value="approve_review">{t("bulk.actions.approveReview")}</option>
            <option value="mark_risk">{t("bulk.actions.markRisk")}</option>
            <option value="start_purchase">{t("bulk.actions.startPurchase")}</option>
            <option value="mark_purchased">{t("bulk.actions.markPurchased")}</option>
            <option value="partial_purchased">{t("bulk.actions.partialPurchased")}</option>
            <option value="out_of_stock">{t("bulk.actions.outOfStock")}</option>
            <option value="price_changed">{t("bulk.actions.priceChanged")}</option>
            <option value="mark_received">{t("bulk.actions.markReceived")}</option>
            <option value="partial_received">{t("bulk.actions.partialReceived")}</option>
            <option value="create_package">{t("bulk.actions.createPackage")}</option>
            <option value="request_shipping_payment">{t("bulk.actions.requestShippingPayment")}</option>
            <option value="ready_to_ship">{t("bulk.actions.readyToShip")}</option>
            <option value="mark_shipped">{t("bulk.actions.markShipped")}</option>
            <option value="in_transit">{t("bulk.actions.inTransit")}</option>
            <option value="complete">{t("bulk.actions.complete")}</option>
            <option value="mark_abnormal">{t("bulk.actions.markAbnormal")}</option>
            <option value="refund_pending">{t("bulk.actions.refundPending")}</option>
            <option value="mark_refunded">{t("bulk.actions.markRefunded")}</option>
            <option value="cancel">{t("bulk.actions.cancel")}</option>
          </select>
          <select name="assigneeId" className="admin-input h-9 py-1">
            <option value="">{t("bulk.assignee")}</option>
            {admins.map((admin) => <option key={admin.id} value={admin.id}>{admin.name ?? admin.email}</option>)}
          </select>
          <input name="adminNote" placeholder={t("bulk.bulkNote")} className="admin-input h-9 py-1" />
          <button className="admin-primary h-9">{t("bulk.apply")}</button>
        </form>
        </Can>

        <div className="admin-table-wrap overflow-x-auto">
          <table className="admin-table min-w-[1460px]">
            <thead>
              <tr>
                <th><input type="checkbox" aria-label={t("table.selectAllVisibleOrders")} /></th>
                <th>{t("table.order")}</th>
                <th>{t("table.user")}</th>
                <th>{t("table.items")}</th>
                <th>{t("table.amount")}</th>
                <th>{t("table.paidDue")}</th>
                <th>{t("table.payment")}</th>
                <th>{t("table.purchase")}</th>
                <th>{t("table.warehouse")}</th>
                <th>{t("table.package")}</th>
                <th>{t("table.shipPay")}</th>
                <th>{t("table.shipping")}</th>
                <th>{t("table.risk")}</th>
                <th>{t("table.refund")}</th>
                <th>{t("table.country")}</th>
                <th>{t("table.assignee")}</th>
                <th>{t("table.updated")}</th>
                <th className="w-[260px]">{t("table.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                const firstImages = order.items.slice(0, 3);
                const country = order.destinationCountryCode ?? order.address?.country ?? "";
                return (
                  <tr key={order.id}>
                    <td><input form={bulkFormId} type="checkbox" name="orderIds" value={order.id} aria-label={t("table.selectOrder", { orderNo: order.orderNo })} /></td>
                    <td>
                      <div className="font-bold text-slate-900">{order.orderNo}</div>
                      <div className="text-xs text-slate-400">{statusLabel[order.orderSource] ?? order.orderSource} · {order.createdAt.toLocaleDateString()}</div>
                    </td>
                    <td>
                      <div className="font-semibold text-slate-900">{order.user.email}</div>
                      <div className="text-xs text-slate-400">{t("table.userId", { id: order.userId })}</div>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="flex -space-x-2">
                          {firstImages.map((item) => (
                            <span key={item.id} className="relative inline-block size-8 overflow-hidden rounded-full border-2 border-white bg-slate-100">
                              <Image src={item.image} alt="" fill sizes="32px" className="object-cover" />
                            </span>
                          ))}
                        </div>
                        <div className="text-xs text-slate-500">{t("table.types", { count: order.itemCount || order.items.length })}<br />{t("table.pcs", { count: order.totalQuantity || order.items.reduce((sum, item) => sum + item.quantity, 0) })}</div>
                      </div>
                    </td>
                    <td>
                      <div className="font-bold text-slate-900">{money(Number(order.totalUsd))}</div>
                      <div className="text-xs text-slate-400">CN ￥{Number(order.subtotalCny).toFixed(2)}</div>
                    </td>
                    <td>
                      <div className="text-xs font-bold text-emerald-700">{money(Number(order.paidUsd))}</div>
                      <div className="text-xs font-bold text-amber-700">{money(Number(order.unpaidUsd))}</div>
                    </td>
                    <td><OrderStatusBadge value={order.paymentStatus} /></td>
                    <td><OrderStatusBadge value={order.purchaseStatus} /></td>
                    <td><OrderStatusBadge value={order.warehouseStatus} /></td>
                    <td><OrderStatusBadge value={order.packageStatus} /></td>
                    <td><OrderStatusBadge value={order.shippingPaymentStatus} /></td>
                    <td><OrderStatusBadge value={order.shippingStatus} /></td>
                    <td><OrderStatusBadge value={order.riskStatus} /></td>
                    <td><OrderStatusBadge value={order.refundStatus} /></td>
                    <td>{country ? countryName(country) : "-"}</td>
                    <td>{order.assigneeId ? admins.find((admin) => admin.id === order.assigneeId)?.name ?? `#${order.assigneeId}` : t("table.unassigned")}</td>
                    <td>{order.updatedAt.toLocaleDateString()}</td>
                    <td>
                      <div className="flex flex-wrap gap-1.5">
                        <Link href={`/admin/orders/${order.id}`} className="admin-primary">{t("rowActions.open")}</Link>
                        <Link href={`#order-${order.id}`} className="admin-action">{t("rowActions.quickView")}</Link>
                        {order.status === "trash" || order.orderStatus === "trash" ? (
                          <>
                            <Can permission="orders.manage">
                              <form action={restoreOrderFromTrash}>
                                <input type="hidden" name="id" value={order.id} />
                                <button className="admin-action">{t("rowActions.restore")}</button>
                              </form>
                              <form action={permanentlyDeleteOrder}>
                                <input type="hidden" name="id" value={order.id} />
                                <button className="admin-danger">{t("rowActions.deleteForever")}</button>
                              </form>
                            </Can>
                          </>
                        ) : (
                          <Can permission="orders.manage">
                            <form action={moveOrderToTrash}>
                              <input type="hidden" name="id" value={order.id} />
                              <button className="admin-danger">{t("rowActions.trash")}</button>
                            </form>
                          </Can>
                        )}
                        <WorkflowButton id={order.id} action="send_payment_reminder" show={order.paymentStatus !== "paid" && order.status !== "trash"} label={t("rowActions.reminder")} confirmText={t("confirm.orderAction", { label: t("rowActions.reminder") })} />
                        <WorkflowButton id={order.id} action="mark_paid" show={order.paymentStatus !== "paid" && order.status !== "trash"} label={t("rowActions.markPaid")} confirmText={t("confirm.orderAction", { label: t("rowActions.markPaid") })} />
                        <WorkflowButton id={order.id} action="approve_review" show={["paid", "paid_product"].includes(order.paymentStatus) && order.riskStatus === "pending_review"} label={t("rowActions.reviewOk")} confirmText={t("confirm.orderAction", { label: t("rowActions.reviewOk") })} />
                        <WorkflowButton id={order.id} action="mark_risk" show={["paid", "paid_product"].includes(order.paymentStatus) && order.riskStatus === "normal" && order.purchaseStatus === "pending"} label={t("rowActions.risk")} confirmText={t("confirm.orderAction", { label: t("rowActions.risk") })} />
                        <WorkflowButton id={order.id} action="start_purchase" show={["paid", "paid_product"].includes(order.paymentStatus) && order.purchaseStatus === "pending" && order.riskStatus === "normal"} label={t("rowActions.startPurchase")} confirmText={t("confirm.orderAction", { label: t("rowActions.startPurchase") })} />
                        <WorkflowButton id={order.id} action="mark_purchased" show={order.purchaseStatus === "purchasing"} label={t("rowActions.purchased")} confirmText={t("confirm.orderAction", { label: t("rowActions.purchased") })} />
                        <WorkflowButton id={order.id} action="mark_received" show={order.purchaseStatus === "purchased" && order.warehouseStatus !== "received"} label={t("rowActions.received")} confirmText={t("confirm.orderAction", { label: t("rowActions.received") })} />
                        <WorkflowButton id={order.id} action="create_package" show={order.warehouseStatus === "received" && ["none", "pending"].includes(order.packageStatus)} label={t("rowActions.createPackage")} confirmText={t("confirm.orderAction", { label: t("rowActions.createPackage") })} />
                        <WorkflowButton id={order.id} action="request_shipping_payment" show={["created", "waiting_shipping_payment"].includes(order.packageStatus) && order.shippingPaymentStatus !== "paid"} label={t("rowActions.shipFee")} confirmText={t("confirm.orderAction", { label: t("rowActions.shipFee") })} />
                        <WorkflowButton id={order.id} action="ready_to_ship" show={["pending", "international_freight_pending"].includes(order.shippingPaymentStatus) && order.qcCustomerConfirmed} label={t("rowActions.shipPaid")} confirmText={t("confirm.orderAction", { label: t("rowActions.shipPaid") })} />
                        <WorkflowButton id={order.id} action="mark_shipped" show={order.shippingStatus === "ready_to_ship"} label={t("rowActions.shipped")} confirmText={t("confirm.orderAction", { label: t("rowActions.shipped") })} />
                        <WorkflowButton id={order.id} action="complete" show={["shipped", "in_transit"].includes(order.shippingStatus)} label={t("rowActions.complete")} confirmText={t("confirm.orderAction", { label: t("rowActions.complete") })} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination page={page} totalPages={totalPages} params={params} />

      {orders.map((order) => (
        <AdminModal key={order.id} id={`order-${order.id}`} title={order.orderNo} description={`${order.user.email} · ${money(Number(order.totalUsd))}`}>
          <OrderDetailSnapshot order={order} admins={admins} t={t} />
        </AdminModal>
      ))}
    </section>
  );
}

function readParam(params: Record<string, string | string[] | undefined>, key: string) {
  const value = params[key];
  return Array.isArray(value) ? value[0] : value;
}

function buildOrderWhere(params: Record<string, string | string[] | undefined>, options: { ignoreTab?: boolean } = {}): Prisma.OrderWhereInput {
  const query = readParam(params, "q")?.trim();
  const view = readParam(params, "view");
  const where: Prisma.OrderWhereInput = view === "trash"
    ? {
        AND: [
          { status: "trash" },
          {
            NOT: {
              OR: [
                { orderNo: { startsWith: "PKPAY-" } },
                { orderSource: "package_payment" }
              ]
            }
          }
        ]
      }
    : {
        AND: [
          { NOT: { status: "trash" } },
          {
            NOT: {
              OR: [
                { orderNo: { startsWith: "PKPAY-" } },
                { orderSource: "package_payment" }
              ]
            }
          }
        ]
      };
  if (query) {
    where.OR = [
      { orderNo: { contains: query } },
      { user: { email: { contains: query } } },
      { items: { some: { sourceUrl: { contains: query } } } },
      { items: { some: { title: { contains: query } } } },
      { packages: { some: { packageNo: { contains: query } } } },
      { packages: { some: { trackingNumber: { contains: query } } } },
      { payments: { some: { paymentNo: { contains: query } } } },
      { payments: { some: { providerOrderNo: { contains: query } } } },
      { payments: { some: { gatewayOrderNo: { contains: query } } } }
    ];
  }
  const map: Array<[string, keyof Prisma.OrderWhereInput]> = [
    ["order_source", "orderSource"],
    ["order_status", "orderStatus"],
    ["payment_status", "paymentStatus"],
    ["purchase_status", "purchaseStatus"],
    ["warehouse_status", "warehouseStatus"],
    ["package_status", "packageStatus"],
    ["shipping_payment_status", "shippingPaymentStatus"],
    ["shipping_status", "shippingStatus"],
    ["risk_status", "riskStatus"],
    ["refund_status", "refundStatus"],
    ["destination_country", "destinationCountryCode"]
  ];
  for (const [param, field] of map) {
    const value = readParam(params, param);
    if (value) where[field] = value as never;
  }
  const platform = readParam(params, "platform");
  if (platform) where.items = { some: { platform } };
  const userId = readParam(params, "user_id");
  if (userId) where.userId = Number(userId);
  const assigneeId = readParam(params, "assignee_id");
  if (assigneeId) where.assigneeId = Number(assigneeId);
  const createdFrom = readParam(params, "created_from");
  const createdTo = readParam(params, "created_to");
  if (createdFrom || createdTo) {
    where.createdAt = {
      gte: createdFrom ? new Date(createdFrom) : undefined,
      lte: createdTo ? new Date(`${createdTo}T23:59:59`) : undefined
    };
  }
  const tab = readParam(params, "tab");
  if (!options.ignoreTab && tab && tab !== "all") {
    return { AND: [where, workflowTabWhere(tab as WorkflowTabKey)] };
  }
  return where;
}

function workflowTabWhere(tab: WorkflowTabKey): Prisma.OrderWhereInput {
  if (tab === "pending_payment") return { paymentStatus: { in: ["pending", "partial", "difference_pending"] }, orderStatus: { notIn: ["cancel", "refund", "trash"] } };
  if (tab === "paid") return { paymentStatus: { in: ["paid", "paid_product"] }, purchaseStatus: "pending", riskStatus: "normal", orderStatus: { in: ["paid_product", "order_pending"] } };
  if (tab === "reviewing") return { riskStatus: "pending_review" };
  if (tab === "purchasing") return { OR: [{ orderStatus: "purchasing" }, { purchaseStatus: { in: ["purchasing", "partial_purchased"] } }] };
  if (tab === "purchased") return { purchaseStatus: "purchased", warehouseStatus: "pending" };
  if (tab === "warehouse_pending") return { purchaseStatus: "purchased", warehouseStatus: { in: ["pending", "partial_received"] } };
  if (tab === "warehouse_received") return { warehouseStatus: "received", packageStatus: { in: ["none", "pending", "created"] } };
  if (tab === "package_created") return { packageStatus: { in: ["created", "waiting_shipping_payment"] }, shippingPaymentStatus: { in: ["none", "pending"] } };
  if (tab === "shipping_pending") return { OR: [{ orderStatus: "international_freight_pending" }, { shippingPaymentStatus: { in: ["pending", "international_freight_pending"] } }, { packageStatus: "waiting_shipping_payment" }] };
  if (tab === "shipping_paid") return { OR: [{ orderStatus: "international_freight_paid" }, { shippingPaymentStatus: { in: ["paid", "international_freight_paid"] }, shippingStatus: "ready_to_ship" }] };
  if (tab === "shipped") return { shippingStatus: { in: ["shipped", "in_transit", "customs_clearance", "delivery_attempted"] } };
  if (tab === "completed") return { orderStatus: "completed" };
  if (tab === "abnormal") return { OR: [{ orderStatus: { in: ["abnormal", "order_after_sales"] } }, { riskStatus: { in: ["restricted", "rejected"] } }, { warehouseStatus: "abnormal" }, { packageStatus: "abnormal" }, { shippingStatus: { in: ["exception", "returned", "lost"] } }] };
  if (tab === "cancelled") return { orderStatus: { in: ["cancel", "cancelled"] } };
  if (tab === "refunded") return { OR: [{ orderStatus: { in: ["refund", "refunded"] } }, { refundStatus: { in: ["partial_refunded", "refunded"] } }, { paymentStatus: { in: ["refunded", "refund"] } }] };
  return {};
}

async function getTabCounts(baseWhere: Prisma.OrderWhereInput) {
  const pairs = await Promise.all(
    workflowTabs.map(async (tab) => [
      tab.key,
      tab.key === "all"
        ? await prisma.order.count({ where: baseWhere })
        : await prisma.order.count({ where: { AND: [baseWhere, workflowTabWhere(tab.key)] } })
    ] as const)
  );
  return Object.fromEntries(pairs) as Record<WorkflowTabKey, number>;
}

async function getNodeCounts() {
  const [pendingPayment, paidReview, purchasing, warehouse, shippingPayment, readyToShip, abnormal] = await Promise.all([
    prisma.order.count({ where: { paymentStatus: { in: ["pending", "partial", "difference_pending"] }, NOT: { status: "trash" } } }),
    prisma.order.count({ where: { paymentStatus: { in: ["paid", "paid_product"] }, purchaseStatus: "pending", NOT: { status: "trash" } } }),
    prisma.order.count({ where: { purchaseStatus: { in: ["purchasing", "partial_purchased"] }, NOT: { status: "trash" } } }),
    prisma.order.count({ where: { purchaseStatus: "purchased", warehouseStatus: { in: ["pending", "partial_received"] }, NOT: { status: "trash" } } }),
    prisma.order.count({ where: { shippingPaymentStatus: { in: ["pending", "international_freight_pending"] }, NOT: { status: "trash" } } }),
    prisma.order.count({ where: { shippingStatus: "ready_to_ship", NOT: { status: "trash" } } }),
    prisma.order.count({ where: { OR: [{ orderStatus: { in: ["abnormal", "order_after_sales"] } }, { riskStatus: { not: "normal" } }, { shippingStatus: { in: ["exception", "returned", "lost"] } }], NOT: { status: "trash" } } })
  ]);
  return { pendingPayment, paidReview, purchasing, warehouse, shippingPayment, readyToShip, abnormal };
}

function buildOrderBy(sort: string, dir: "asc" | "desc"): Prisma.OrderOrderByWithRelationInput {
  if (sort === "createdAt") return { createdAt: dir };
  if (sort === "total_amount") return { totalUsd: dir };
  if (sort === "unpaid_amount") return { unpaidUsd: dir };
  if (sort === "risk_status") return { riskStatus: dir };
  if (sort === "purchase_status") return { purchaseStatus: dir };
  if (sort === "warehouse_status") return { warehouseStatus: dir };
  return { updatedAt: dir };
}

function optionList<T extends readonly string[]>(options: T) {
  return options.map((value) => <option key={value} value={value}>{statusLabel[value] ?? value}</option>);
}

function OrderNodeSummary({ counts, t }: { counts: Awaited<ReturnType<typeof getNodeCounts>>; t: Awaited<ReturnType<typeof getTranslations<"orders.ordersPage">>> }) {
  const nodes = [
    { label: t("nodes.needPayment"), value: counts.pendingPayment, href: "/admin/orders?tab=pending_payment" },
    { label: t("nodes.paidReview"), value: counts.paidReview, href: "/admin/orders?tab=paid" },
    { label: t("nodes.purchasing"), value: counts.purchasing, href: "/admin/orders?tab=purchasing" },
    { label: t("nodes.inbound"), value: counts.warehouse, href: "/admin/orders?tab=warehouse_pending" },
    { label: t("nodes.shipFeeDue"), value: counts.shippingPayment, href: "/admin/orders?tab=shipping_pending" },
    { label: t("nodes.readyToShip"), value: counts.readyToShip, href: "/admin/orders?tab=shipping_paid" },
    { label: t("nodes.exceptions"), value: counts.abnormal, href: "/admin/orders?tab=abnormal" }
  ];
  return (
    <div className="mb-4 grid gap-3 md:grid-cols-3 xl:grid-cols-7">
      {nodes.map((node) => (
        <Link key={node.label} href={node.href} className="admin-card p-3 transition hover:border-[#2563eb] hover:bg-[#f8fbff]">
          <div className="text-[11px] font-black uppercase tracking-[0.1em] text-slate-400">{node.label}</div>
          <div className="mt-1 text-2xl font-black text-slate-950">{node.value}</div>
        </Link>
      ))}
    </div>
  );
}

function OrderWorkflowTabs({ params, activeTab, counts, t }: { params: Record<string, string | string[] | undefined>; activeTab: string; counts: Record<WorkflowTabKey, number>; t: Awaited<ReturnType<typeof getTranslations<"orders.ordersPage">>> }) {
  const translatedTabs = workflowTabs.map((tab) => ({
    ...tab,
    label:
      tab.key === "all" ? t("tabs.all") :
      tab.key === "pending_payment" ? t("tabs.pendingPayment") :
      tab.key === "paid" ? t("tabs.paid") :
      tab.key === "reviewing" ? t("tabs.reviewing") :
      tab.key === "purchasing" ? t("tabs.purchasing") :
      tab.key === "purchased" ? t("tabs.purchased") :
      tab.key === "warehouse_pending" ? t("tabs.warehousePending") :
      tab.key === "warehouse_received" ? t("tabs.warehouseReceived") :
      tab.key === "package_created" ? t("tabs.packageCreated") :
      tab.key === "shipping_pending" ? t("tabs.shippingPending") :
      tab.key === "shipping_paid" ? t("tabs.shippingPaid") :
      tab.key === "shipped" ? t("tabs.shipped") :
      tab.key === "completed" ? t("tabs.completed") :
      tab.key === "abnormal" ? t("tabs.abnormal") :
      tab.key === "cancelled" ? t("tabs.cancelled") :
      t("tabs.refunded")
  }));
  return (
    <div className="admin-card mb-4 overflow-x-auto p-2">
      <div className="flex min-w-max gap-1.5">
        {translatedTabs.map((tab) => (
          <Link
            key={tab.key}
            href={tabHref(params, tab.key)}
            className={`rounded-lg px-3 py-2 text-xs font-black transition ${
              activeTab === tab.key || (!activeTab && tab.key === "all")
                ? "bg-[#2563eb] text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
            }`}
          >
            {tab.label} <span className="ml-1 opacity-75">{counts[tab.key] ?? 0}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

function tabHref(params: Record<string, string | string[] | undefined>, tab: string) {
  const next = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (!value || key === "page" || key === "tab") return;
    next.set(key, Array.isArray(value) ? value[0] : value);
  });
  if (tab !== "all") next.set("tab", tab);
  const query = next.toString();
  return `/admin/orders${query ? `?${query}` : ""}`;
}

function OrderFilters({ params, t }: { params: Record<string, string | string[] | undefined>; t: Awaited<ReturnType<typeof getTranslations<"orders.ordersPage">>> }) {
  return (
    <form className="admin-card grid gap-3 p-4 xl:grid-cols-[1.5fr_repeat(5,1fr)_auto]" action="/admin/orders">
      <input type="hidden" name="view" value={readParam(params, "view") ?? ""} />
      <input type="hidden" name="tab" value={readParam(params, "tab") ?? ""} />
      <input name="q" defaultValue={readParam(params, "q") ?? ""} placeholder={t("filters.searchPlaceholder")} className="admin-input" />
      <select name="payment_status" defaultValue={readParam(params, "payment_status") ?? ""} className="admin-input"><option value="">{t("filters.payment")}</option>{optionList(paymentStatusOptions)}</select>
      <select name="purchase_status" defaultValue={readParam(params, "purchase_status") ?? ""} className="admin-input"><option value="">{t("filters.purchase")}</option>{optionList(purchaseStatusOptions)}</select>
      <select name="package_status" defaultValue={readParam(params, "package_status") ?? ""} className="admin-input"><option value="">{t("filters.package")}</option>{optionList(orderPackageStatusOptions)}</select>
      <select name="shipping_payment_status" defaultValue={readParam(params, "shipping_payment_status") ?? ""} className="admin-input"><option value="">{t("filters.shipPayment")}</option>{optionList(shippingPaymentStatusOptions)}</select>
      <select name="risk_status" defaultValue={readParam(params, "risk_status") ?? ""} className="admin-input"><option value="">{t("filters.risk")}</option>{optionList(riskStatusOptions)}</select>
      <button className="admin-primary px-5">{t("bulk.apply")}</button>
      <select name="warehouse_status" defaultValue={readParam(params, "warehouse_status") ?? ""} className="admin-input"><option value="">{t("filters.warehouse")}</option>{optionList(warehouseStatusOptions)}</select>
      <select name="shipping_status" defaultValue={readParam(params, "shipping_status") ?? ""} className="admin-input"><option value="">{t("filters.shipping")}</option>{optionList(shippingStatusOptions)}</select>
      <select name="refund_status" defaultValue={readParam(params, "refund_status") ?? ""} className="admin-input"><option value="">{t("filters.refund")}</option>{optionList(refundStatusOptions)}</select>
      <select name="order_source" defaultValue={readParam(params, "order_source") ?? ""} className="admin-input"><option value="">{t("filters.source")}</option>{optionList(orderSourceOptions)}</select>
      <input name="destination_country" defaultValue={readParam(params, "destination_country") ?? ""} placeholder={t("filters.countryIso2")} className="admin-input" />
      <input name="created_from" defaultValue={readParam(params, "created_from") ?? ""} type="date" className="admin-input" />
      <input name="created_to" defaultValue={readParam(params, "created_to") ?? ""} type="date" className="admin-input" />
      <select name="sort" defaultValue={readParam(params, "sort") ?? "updatedAt"} className="admin-input">
        <option value="updatedAt">{t("filters.updated")}</option>
        <option value="createdAt">{t("filters.created")}</option>
        <option value="total_amount">{t("filters.totalAmount")}</option>
        <option value="unpaid_amount">{t("filters.unpaidAmount")}</option>
        <option value="risk_status">{t("filters.riskStatus")}</option>
        <option value="purchase_status">{t("filters.purchaseStatusSort")}</option>
        <option value="warehouse_status">{t("filters.warehouseStatusSort")}</option>
      </select>
      <div className="flex gap-2">
        <Link href="/admin/orders" className={`admin-action px-4 ${readParam(params, "view") ? "" : "border-[#465fff] text-[#465fff]"}`}>{t("filters.active")}</Link>
        <Link href="/admin/orders?view=trash" className={`admin-action px-4 ${readParam(params, "view") === "trash" ? "border-[#465fff] text-[#465fff]" : ""}`}>{t("filters.trash")}</Link>
      </div>
    </form>
  );
}

function WorkflowButton({ id, action, label, show, confirmText }: { id: number; action: string; label: string; show: boolean; confirmText: string }) {
  if (!show) return null;
  const permission = isRefundWorkflowAction(action) ? "orders.refund" : "orders.update";
  return (
    <Can permission={permission}>
      <form action={updateOrderWorkflow}>
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="workflowAction" value={action} />
        <WorkflowConfirmButton label={label} className="admin-action" confirmationText={confirmText} />
      </form>
    </Can>
  );
}

function isRefundWorkflowAction(action: string) {
  return ["refund_pending", "mark_refunded"].includes(action);
}

type OrderModalRow = Prisma.OrderGetPayload<{
  include: {
    user: true;
    items: true;
    address: true;
    payments: true;
    packages: { include: { shippingChannel: true; items: true } };
    mediaAssets: { include: { uploader: { select: { id: true; email: true; name: true } } } };
    notes: { include: { creator: true } };
    logs: { include: { actor: true } };
  };
}>;

function OrderDetailSnapshot({
  order,
  admins,
  t
}: {
  order: OrderModalRow;
  admins: Array<{ id: number; name: string | null; email: string }>;
  t: Awaited<ReturnType<typeof getTranslations<"orders.ordersPage">>>;
}) {
  const snapshotT = {
    feesTitle: t("snapshot.feesTitle"),
    feesSubtitle: t("snapshot.feesSubtitle"),
    subtotal: t("snapshot.subtotal"),
    exchangeRate: t("snapshot.exchangeRate"),
    serviceFee: t("snapshot.serviceFee"),
    domesticShipping: t("snapshot.domesticShipping"),
    valueAddedServices: t("snapshot.valueAddedServices"),
    estimatedShipping: t("snapshot.estimatedShipping"),
    actualShipping: t("snapshot.actualShipping"),
    discountCoupon: t("snapshot.discountCoupon"),
    refund: t("snapshot.refund"),
    finalTotal: t("snapshot.finalTotal"),
    lifecycleTitle: t("snapshot.lifecycleTitle"),
    lifecycleSubtitle: t("snapshot.lifecycleSubtitle"),
    lifecycleNotice: t("snapshot.lifecycleNotice"),
    dateCreated: t("snapshot.dateCreated"),
    datePaid: t("snapshot.datePaid"),
    dateCompleted: t("snapshot.dateCompleted"),
    dateModified: t("snapshot.dateModified"),
    purchasedAt: t("snapshot.purchasedAt"),
    warehouseReceivedAt: t("snapshot.warehouseReceivedAt"),
    shippedAt: t("snapshot.shippedAt"),
    cancelledAt: t("snapshot.cancelledAt"),
    workflowTitle: t("snapshot.workflowTitle"),
    workflowSubtitle: t("snapshot.workflowSubtitle"),
    overall: t("snapshot.overall"),
    payment: t("snapshot.payment"),
    purchase: t("snapshot.purchase"),
    warehouse: t("snapshot.warehouse"),
    package: t("snapshot.package"),
    shipPay: t("snapshot.shipPay"),
    shipping: t("snapshot.shipping"),
    risk: t("snapshot.risk"),
    refundStatus: t("snapshot.refundStatus"),
    assignee: t("snapshot.assignee"),
    addNote: t("snapshot.addNote"),
    customerTitle: t("snapshot.customerTitle"),
    customerSubtitle: t("snapshot.customerSubtitle"),
    customerHint: t("snapshot.customerHint"),
    addressName: t("snapshot.addressName"),
    addressEmail: t("snapshot.addressEmail"),
    addressPhone: t("snapshot.addressPhone"),
    addressCountry: t("snapshot.addressCountry"),
    addressStateCity: t("snapshot.addressStateCity"),
    addressStreet: t("snapshot.addressStreet"),
    addressPostcode: t("snapshot.addressPostcode"),
    userId: t("snapshot.userId"),
    name: t("snapshot.name"),
    email: t("snapshot.email"),
    userStatus: t("snapshot.userStatus"),
    wallet: t("snapshot.wallet"),
    destination: t("snapshot.destination"),
    packageShippingTitle: t("snapshot.packageShippingTitle"),
    packageShippingSubtitle: t("snapshot.packageShippingSubtitle"),
    packageShippingHint: t("snapshot.packageShippingHint"),
    shippingFeePaid: t("snapshot.shippingFeePaid"),
    shippedBoolean: t("snapshot.shippedBoolean"),
    logistics: t("snapshot.logistics"),
    weight: t("snapshot.weight"),
    dimensions: t("snapshot.dimensions"),
    shipFeeAmount: t("snapshot.shipFeeAmount"),
    tracking: t("snapshot.tracking"),
    paymentMethod: t("snapshot.paymentMethod"),
    transactionId: t("snapshot.transactionId"),
    yes: t("snapshot.yes"),
    no: t("snapshot.no"),
    noChannel: t("snapshot.noChannel"),
    noPayment: t("snapshot.noPayment"),
    paymentRecordsTitle: t("snapshot.paymentRecordsTitle"),
    paymentRecordsSubtitle: t("snapshot.paymentRecordsSubtitle"),
    paymentRecordsHint: t("snapshot.paymentRecordsHint"),
    paymentRecordsEmpty: t("snapshot.paymentRecordsEmpty"),
    notesTitle: t("snapshot.notesTitle"),
    orderActionsTitle: t("snapshot.orderActionsTitle"),
    orderActionsSubtitleActive: t("snapshot.orderActionsSubtitleActive"),
    orderActionsSubtitleTrash: t("snapshot.orderActionsSubtitleTrash"),
    orderActionsBodyActive: t("snapshot.orderActionsBodyActive"),
    orderActionsBodyTrash: t("snapshot.orderActionsBodyTrash"),
    dynamicActionsTitle: t("snapshot.dynamicActionsTitle"),
    dynamicActionsDescription: t("snapshot.dynamicActionsDescription"),
    auditLog: t("snapshot.auditLog"),
    notePlaceholder: t("snapshot.notePlaceholder"),
    visibleToUser: t("snapshot.visibleToUser"),
    customerNote: t("snapshot.customerNote"),
    latestAdminNote: t("snapshot.latestAdminNote"),
    adminActor: t("snapshot.adminActor"),
    userVisible: t("snapshot.userVisible"),
    snapshot: t("snapshot.snapshot"),
    notesEmpty: t("snapshot.notesEmpty"),
    timelineLogsTitle: t("snapshot.timelineLogsTitle"),
    timelineLogsSubtitle: t("snapshot.timelineLogsSubtitle"),
    timelineLogsHint: t("snapshot.timelineLogsHint"),
    timelineCreated: t("snapshot.timelineCreated"),
    timelinePaid: t("snapshot.timelinePaid"),
    timelinePurchased: t("snapshot.timelinePurchased"),
    timelineWarehouse: t("snapshot.timelineWarehouse"),
    timelinePackage: t("snapshot.timelinePackage"),
    timelineShipped: t("snapshot.timelineShipped"),
    timelineCompleted: t("snapshot.timelineCompleted"),
    timelineCancelled: t("snapshot.timelineCancelled"),
    timelineDeliveredCompleted: t("snapshot.timelineDeliveredCompleted"),
    timelineLogsEmpty: t("snapshot.timelineLogsEmpty"),
    systemActor: t("snapshot.systemActor")
  };
  const subtotalUsd = Number(order.subtotalUsd);
  const serviceFeeUsd = Number(order.serviceFeeUsd);
  const domesticShippingUsd = Number(order.domesticShippingUsd);
  const valueAddedServicesUsd = Number(order.valueAddedServicesUsd);
  const estimatedShippingUsd = Number(order.estimatedShippingUsd);
  const actualShippingUsd = Number(order.actualShippingUsd);
  const discountUsd = Number(order.discountUsd);
  const refundUsd = Number(order.refundUsd);
  const totalUsd = Number(order.totalUsd);
  const latestPayment = order.payments[0];
  const latestPackage = order.packages[0];
  const qcPhotos = order.mediaAssets;
  const shippingFeePaid = order.shippingPaymentStatus === "paid" || order.packages.some((pkg) => ["shipping_paid", "shipped", "delivered"].includes(pkg.status));
  const shipped = order.shippingStatus === "shipped" || order.shippingStatus === "delivered" || order.packages.some((pkg) => Boolean(pkg.shippedAt || pkg.trackingNumber));
  const assignee = order.assigneeId ? admins.find((admin) => admin.id === order.assigneeId) : undefined;
  const isTrash = order.status === "trash" || order.orderStatus === "trash";
  const shippingAddress = orderAddressSnapshot(order);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-4 xl:grid-cols-8">
        <InfoCard label="Order" value={`#${order.id}`} sub={order.orderNo} badge={order.orderStatus} />
        <InfoCard label="Payment" value={statusLabel[order.paymentStatus] ?? order.paymentStatus} badge={order.paymentStatus} />
        <InfoCard label="Review" value={statusLabel[order.riskStatus] ?? order.riskStatus} badge={order.riskStatus} />
        <InfoCard label="Purchase" value={statusLabel[order.purchaseStatus] ?? order.purchaseStatus} badge={order.purchaseStatus} />
        <InfoCard label="Warehouse" value={statusLabel[order.warehouseStatus] ?? order.warehouseStatus} badge={order.warehouseStatus} />
        <InfoCard label="Package" value={statusLabel[order.packageStatus] ?? order.packageStatus} badge={order.packageStatus} />
        <InfoCard label="Ship Pay" value={statusLabel[order.shippingPaymentStatus] ?? order.shippingPaymentStatus} badge={order.shippingPaymentStatus} />
        <InfoCard label="Shipping" value={statusLabel[order.shippingStatus] ?? order.shippingStatus} badge={order.shippingStatus} />
      </div>

      <QuickWorkflowPanel order={order} t={snapshotT} />

      <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0 space-y-4 xl:col-span-2">
          <EditablePanel title="Order Items" subtitle={`${order.items.length} line items`} editContent={<EditNotice href={`/admin/orders#order-${order.id}`} text="Line item editing is reserved for the next order item editor." />}>
            <div className="max-w-full overflow-x-auto">
              <table className="admin-table min-w-[1080px] shadow-none">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Source</th>
                    <th>Item / SKU</th>
                    <th>Price</th>
                    <th>Qty</th>
                    <th>Total</th>
                    <th>Purchase</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <div className="flex items-center gap-2">
                          <span className="relative size-9 overflow-hidden rounded-md bg-slate-100">
                            <Image src={item.image} alt="" fill sizes="36px" className="object-cover" />
                          </span>
                          <div>
                            <div className="max-w-[360px] truncate font-bold text-slate-900">{item.title}</div>
                            <Link href={item.sourceUrl} target="_blank" className="block max-w-[360px] truncate text-xs text-[#465fff]">{item.sourceUrl}</Link>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="font-black uppercase text-[#465fff]">{item.platform}</div>
                        <div className="text-xs text-slate-400">Cache #{item.productCacheId ?? "-"}</div>
                      </td>
                      <td>
                        <div>{item.sourceItemId}</div>
                        <div className="text-xs text-slate-400">{item.skuId || "-"} · {item.skuText || "Default"}</div>
                      </td>
                      <td>{money(Number(item.priceUsd))}<br /><span className="text-xs text-slate-400">CN ￥{Number(item.priceCny).toFixed(2)}</span></td>
                      <td>{item.quantity}</td>
                      <td className="font-bold text-slate-900">{money(Number(item.priceUsd) * item.quantity)}</td>
                      <td><OrderStatusBadge value={item.purchaseStatus} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </EditablePanel>
        </div>

        <div className="min-w-0 space-y-4">
          <div className="grid min-w-0 gap-4">
            <EditablePanel title="Shipping Address" subtitle="Parcel delivery contact" editContent={<AddressEditForm order={order} title="Edit shipping address" />}>
              <AddressPanel address={shippingAddress} email={order.user.email} t={snapshotT} />
            </EditablePanel>
          </div>

          <EditablePanel title={snapshotT.feesTitle} subtitle={snapshotT.feesSubtitle} editContent={<OrderManagementForm order={order} admins={admins} mode="amounts" />}>
            <CompactGrid>
              <CompactItem label={snapshotT.subtotal} value={`${money(subtotalUsd)} / CN ￥${Number(order.subtotalCny).toFixed(2)}`} />
              <CompactItem label={snapshotT.exchangeRate} value={`1 USD = CN ￥${Number(order.exchangeRate).toFixed(4)}`} />
              <CompactItem label={snapshotT.serviceFee} value={money(serviceFeeUsd)} />
              <CompactItem label={snapshotT.domesticShipping} value={money(domesticShippingUsd)} />
              <CompactItem label={snapshotT.valueAddedServices} value={money(valueAddedServicesUsd)} />
              <CompactItem label={snapshotT.estimatedShipping} value={money(estimatedShippingUsd)} />
              <CompactItem label={snapshotT.actualShipping} value={money(actualShippingUsd)} />
              <CompactItem label={snapshotT.discountCoupon} value={money(discountUsd)} />
              <CompactItem label={snapshotT.refund} value={money(refundUsd)} />
              <CompactItem label={snapshotT.finalTotal} value={money(totalUsd)} strong />
            </CompactGrid>
          </EditablePanel>

          <EditablePanel title={snapshotT.lifecycleTitle} subtitle={snapshotT.lifecycleSubtitle} editContent={<EditNotice text={snapshotT.lifecycleNotice} />}>
            <CompactGrid>
              <CompactItem label={snapshotT.dateCreated} value={formatDateTime(order.createdAt)} />
              <CompactItem label={snapshotT.datePaid} value={order.paidAt ? formatDateTime(order.paidAt) : "-"} />
              <CompactItem label={snapshotT.dateCompleted} value={order.completedAt ? formatDateTime(order.completedAt) : "-"} />
              <CompactItem label={snapshotT.dateModified} value={formatDateTime(order.updatedAt)} />
              <CompactItem label={snapshotT.purchasedAt} value={order.purchasedAt ? formatDateTime(order.purchasedAt) : "-"} />
              <CompactItem label={snapshotT.warehouseReceivedAt} value={order.warehouseReceivedAt ? formatDateTime(order.warehouseReceivedAt) : "-"} />
              <CompactItem label={snapshotT.shippedAt} value={order.shippedAt ? formatDateTime(order.shippedAt) : latestPackage?.shippedAt ? formatDateTime(latestPackage.shippedAt) : "-"} />
              <CompactItem label={snapshotT.cancelledAt} value={order.cancelledAt ? formatDateTime(order.cancelledAt) : "-"} />
            </CompactGrid>
          </EditablePanel>
        </div>

        <div className="min-w-0 space-y-4">
          <EditablePanel title={snapshotT.workflowTitle} subtitle={snapshotT.workflowSubtitle} editContent={<OrderManagementForm order={order} admins={admins} mode="status" />}>
            <CompactList>
              <CompactLine label={snapshotT.overall} value={<OrderStatusBadge value={order.orderStatus} />} />
              <CompactLine label={snapshotT.payment} value={<OrderStatusBadge value={order.paymentStatus} />} />
              <CompactLine label={snapshotT.purchase} value={<OrderStatusBadge value={order.purchaseStatus} />} />
              <CompactLine label={snapshotT.warehouse} value={<OrderStatusBadge value={order.warehouseStatus} />} />
              <CompactLine label={snapshotT.package} value={<OrderStatusBadge value={order.packageStatus} />} />
              <CompactLine label={snapshotT.shipPay} value={<OrderStatusBadge value={order.shippingPaymentStatus} />} />
              <CompactLine label={snapshotT.shipping} value={<OrderStatusBadge value={order.shippingStatus} />} />
              <CompactLine label={snapshotT.risk} value={<OrderStatusBadge value={order.riskStatus} />} />
              <CompactLine label={snapshotT.refundStatus} value={<OrderStatusBadge value={order.refundStatus} />} />
              <CompactLine label={snapshotT.assignee} value={assignee?.name ?? assignee?.email ?? t("table.unassigned")} />
            </CompactList>
          </EditablePanel>

          <EditablePanel title={snapshotT.customerTitle} subtitle={snapshotT.customerSubtitle} editContent={<EditNotice href={`/admin/users#user-${order.userId}`} text={snapshotT.customerHint} />}>
            <CompactList>
              <CompactLine label={snapshotT.userId} value={order.userId} />
              <CompactLine label={snapshotT.name} value={order.user.name ?? "-"} />
              <CompactLine label={snapshotT.email} value={order.user.email} />
              <CompactLine label={snapshotT.userStatus} value={order.user.status} />
              <CompactLine label={snapshotT.wallet} value={money(Number(order.user.walletBalance))} />
              <CompactLine label={snapshotT.destination} value={countryName(order.destinationCountryCode ?? order.destinationCountry ?? order.address?.country)} />
            </CompactList>
          </EditablePanel>

          <EditablePanel title={snapshotT.packageShippingTitle} subtitle={snapshotT.packageShippingSubtitle} editContent={<EditNotice href="/admin/packages" text={snapshotT.packageShippingHint} />}>
            <CompactList>
              <CompactLine label={snapshotT.shippingFeePaid} value={shippingFeePaid ? snapshotT.yes : snapshotT.no} />
              <CompactLine label={snapshotT.shippedBoolean} value={shipped ? snapshotT.yes : snapshotT.no} />
              <CompactLine label={snapshotT.logistics} value={latestPackage?.shippingChannel?.name ?? snapshotT.noChannel} />
              <CompactLine label={snapshotT.package} value={latestPackage?.packageNo ?? "-"} />
              <CompactLine label={snapshotT.weight} value={latestPackage ? `${latestPackage.weightKg.toString()} kg` : "-"} />
              <CompactLine label={snapshotT.dimensions} value={latestPackage ? `${latestPackage.lengthCm?.toString() ?? "-"} x ${latestPackage.widthCm?.toString() ?? "-"} x ${latestPackage.heightCm?.toString() ?? "-"} cm` : "-"} />
              <CompactLine label={snapshotT.shipFeeAmount} value={latestPackage ? money(Number(latestPackage.shippingFeeUsd)) : money(actualShippingUsd)} />
              <CompactLine label={snapshotT.tracking} value={latestPackage?.trackingNumber ?? "-"} />
              <CompactLine label={snapshotT.paymentMethod} value={latestPayment?.provider ? latestPayment.provider.toUpperCase() : snapshotT.noPayment} />
              <CompactLine label={snapshotT.transactionId} value={latestPayment?.gatewayOrderNo ?? latestPayment?.providerOrderNo ?? "-"} />
            </CompactList>
          </EditablePanel>

          <EditablePanel title={snapshotT.orderActionsTitle} subtitle={isTrash ? snapshotT.orderActionsSubtitleTrash : snapshotT.orderActionsSubtitleActive} editContent={<OrderDeleteControls order={order} isTrash={isTrash} />}>
            <p className="text-sm leading-6 text-slate-600">
              {isTrash ? snapshotT.orderActionsBodyTrash : snapshotT.orderActionsBodyActive}
            </p>
          </EditablePanel>
        </div>

        <div className="min-w-0 space-y-4 xl:col-span-2">
          <EditablePanel title={snapshotT.paymentRecordsTitle} subtitle={snapshotT.paymentRecordsSubtitle.replace("{count}", String(order.payments.length))} editContent={<EditNotice href="/admin/finance/payments" text={snapshotT.paymentRecordsHint} />}>
            <PaymentRecords payments={order.payments} t={snapshotT} />
          </EditablePanel>

          <EditablePanel title="Purchase Information" subtitle="Source platform purchase state and operational cost notes" editContent={<OrderNoteForm orderId={order.id} defaultType="purchase" t={snapshotT} />}>
            <CompactGrid>
              <CompactItem label="Purchase status" value={<OrderStatusBadge value={order.purchaseStatus} />} />
              <CompactItem label="Purchased at" value={order.purchasedAt ? formatDateTime(order.purchasedAt) : "-"} />
              <CompactItem label="Platforms" value={Array.from(new Set(order.items.map((item) => item.platform))).join(", ")} />
              <CompactItem label="Source orders" value="Use purchase notes for supplier order numbers" />
            </CompactGrid>
          </EditablePanel>

          <EditablePanel
            title="Warehouse Inbound"
            subtitle="Receiving, quantity check, weight, QC photos and exception notes"
            editContent={
              <div className="grid gap-4">
                <OrderNoteForm orderId={order.id} defaultType="warehouse" t={snapshotT} />
                <section className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <h4 className="mb-2 font-black text-slate-900">QC inspection photos</h4>
                  <OrderQcPhotoPanel orderId={order.id} packageId={latestPackage?.id} initialAssets={qcPhotos.map(serializeMediaAsset)} compact />
                </section>
              </div>
            }
          >
            <CompactGrid>
              <CompactItem label="Inbound status" value={<OrderStatusBadge value={order.warehouseStatus} />} />
              <CompactItem label="Expected quantity" value={`${order.totalQuantity || order.items.reduce((sum, item) => sum + item.quantity, 0)} pcs`} />
              <CompactItem label="Received at" value={order.warehouseReceivedAt ? formatDateTime(order.warehouseReceivedAt) : "-"} />
              <CompactItem label="QC photos" value={`${qcPhotos.length} image${qcPhotos.length === 1 ? "" : "s"}`} />
              <CompactItem label="Warehouse note" value={latestNote(order.notes, "warehouse")?.content ?? "-"} />
            </CompactGrid>
            <PhotoThumbStrip assets={qcPhotos} />
          </EditablePanel>

          <EditablePanel title="Risk Review" subtitle="Sensitive goods, restrictions, carrier eligibility and review notes" editContent={<OrderNoteForm orderId={order.id} defaultType="risk" t={snapshotT} />}>
            <CompactGrid>
              <CompactItem label="Risk status" value={<OrderStatusBadge value={order.riskStatus} />} />
              <CompactItem label="Product type" value={order.riskStatus === "normal" ? "Normal / no risk flag" : statusLabel[order.riskStatus] ?? order.riskStatus} />
              <CompactItem label="Destination" value={countryName(order.destinationCountryCode ?? order.destinationCountry ?? order.address?.country)} />
              <CompactItem label="Risk note" value={latestNote(order.notes, "risk")?.content ?? "-"} />
            </CompactGrid>
          </EditablePanel>

          <EditablePanel title={snapshotT.notesTitle} subtitle="Append-only user, admin, purchase, warehouse, finance and support notes" editContent={<OrderNoteForm orderId={order.id} t={snapshotT} />}>
            <OrderNotes notes={order.notes} userNote={order.userNote} adminNote={order.adminNote} t={snapshotT} />
          </EditablePanel>

          <EditablePanel title={snapshotT.timelineLogsTitle} subtitle={snapshotT.timelineLogsSubtitle.replace("{count}", String(order.logs.length))} editContent={<EditNotice href="/admin/order-logs" text={snapshotT.timelineLogsHint} />}>
            <OrderTimeline order={order} t={snapshotT} />
          </EditablePanel>
        </div>
      </div>
    </div>
  );
}

function EditablePanel({ title, subtitle, children, editContent }: { title: string; subtitle?: string; children: React.ReactNode; editContent: React.ReactNode }) {
  return (
    <AdminInlineEditPanel title={title} subtitle={subtitle} editContent={editContent}>
      {children}
    </AdminInlineEditPanel>
  );
}

function QuickWorkflowPanel({
  order,
  t
}: {
  order: OrderModalRow;
  t: {
    dynamicActionsTitle: string;
    dynamicActionsDescription: string;
    auditLog: string;
  };
}) {
  const actions = [
    { action: "mark_paid", label: "Mark product paid", show: order.paymentStatus !== "paid" },
    { action: "send_payment_reminder", label: "Payment reminder", show: order.paymentStatus !== "paid" },
    { action: "approve_review", label: "Review passed", show: order.paymentStatus === "paid" && order.purchaseStatus === "pending" },
    { action: "mark_risk", label: "Risk review", show: order.paymentStatus === "paid" && order.riskStatus === "normal" && order.purchaseStatus === "pending" },
    { action: "start_purchase", label: "Start purchase", show: order.paymentStatus === "paid" && order.purchaseStatus === "pending" && order.riskStatus === "normal" },
    { action: "mark_purchased", label: "Mark purchased", show: order.purchaseStatus === "purchasing" || order.purchaseStatus === "partial_purchased" },
    { action: "out_of_stock", label: "Out of stock", show: ["pending", "purchasing"].includes(order.purchaseStatus) },
    { action: "price_changed", label: "Price changed", show: ["pending", "purchasing"].includes(order.purchaseStatus) },
    { action: "mark_received", label: "Mark received", show: order.purchaseStatus === "purchased" && order.warehouseStatus !== "received" },
    { action: "partial_received", label: "Partial inbound", show: order.purchaseStatus === "purchased" && order.warehouseStatus !== "received" },
    { action: "create_package", label: "Create package", show: order.warehouseStatus === "received" && ["none", "pending"].includes(order.packageStatus) },
    { action: "request_shipping_payment", label: "Request ship fee", show: ["created", "waiting_shipping_payment"].includes(order.packageStatus) && order.shippingPaymentStatus !== "paid" },
    { action: "ready_to_ship", label: "Ship fee paid", show: order.shippingPaymentStatus === "pending" || order.packageStatus === "waiting_shipping_payment" },
    { action: "mark_shipped", label: "Mark shipped", show: order.shippingStatus === "ready_to_ship" },
    { action: "in_transit", label: "In transit", show: order.shippingStatus === "shipped" },
    { action: "complete", label: "Complete", show: ["shipped", "in_transit", "delivery_attempted"].includes(order.shippingStatus) },
    { action: "mark_abnormal", label: "Abnormal", show: !["completed", "cancelled", "refunded", "trash"].includes(order.orderStatus) },
    { action: "refund_pending", label: "Refund pending", show: order.refundStatus === "none" && ["abnormal", "cancelled"].includes(order.orderStatus) },
    { action: "mark_refunded", label: "Refunded", show: order.refundStatus === "pending" || order.refundStatus === "partial_refunded" },
    { action: "cancel", label: "Cancel", show: !["completed", "cancelled", "refunded", "trash"].includes(order.orderStatus) }
  ];
  return (
    <div className="admin-card p-3">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-black text-slate-900">{t.dynamicActionsTitle}</h3>
          <p className="mt-0.5 text-xs font-semibold text-slate-400">{t.dynamicActionsDescription}</p>
        </div>
        <Link href="/admin/order-logs" className="admin-action">{t.auditLog}</Link>
      </div>
      <div className="flex flex-wrap gap-2">
        {actions.filter((item) => item.show).map((item) => (
          <WorkflowButton key={item.action} id={order.id} action={item.action} show label={item.label} confirmText={`Confirm order action: ${item.label}?`} />
        ))}
      </div>
    </div>
  );
}

function CompactGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-x-4 gap-y-2 md:grid-cols-2 xl:grid-cols-4">{children}</div>;
}

function PhotoThumbStrip({ assets }: { assets: OrderModalRow["mediaAssets"] }) {
  if (!assets.length) return null;
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {assets.slice(0, 8).map((asset) => (
        <a key={asset.id} href={asset.url} target="_blank" className="block size-16 overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={asset.url} alt={asset.altText || asset.originalName} className="h-full w-full object-cover" />
        </a>
      ))}
    </div>
  );
}

function CompactItem({ label, value, strong = false }: { label: string; value: React.ReactNode; strong?: boolean }) {
  return (
    <div className="border-b border-slate-100 pb-2">
      <div className="text-[11px] font-black uppercase tracking-[0.1em] text-slate-400">{label}</div>
      <div className={`mt-0.5 break-words text-sm ${strong ? "font-black text-slate-950" : "font-semibold text-slate-700"}`}>{value || "-"}</div>
    </div>
  );
}

function InfoCard({ label, value, sub, badge }: { label: string; value: React.ReactNode; sub?: React.ReactNode; badge?: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-400">{label}</div>
        {badge ? <OrderStatusBadge value={badge} /> : null}
      </div>
      <div className="mt-1 break-words text-base font-black text-slate-900">{value || "-"}</div>
      {sub ? <div className="mt-1 break-words text-xs font-semibold text-slate-500">{sub}</div> : null}
    </div>
  );
}

function CompactList({ children }: { children: React.ReactNode }) {
  return <dl className="grid gap-1.5 text-sm">{children}</dl>;
}

function CompactLine({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[118px_1fr] gap-3 border-b border-slate-100 pb-1.5 last:border-0 last:pb-0">
      <dt className="text-xs font-bold text-slate-400">{label}</dt>
      <dd className="break-words font-semibold text-slate-700">{value || "-"}</dd>
    </div>
  );
}

type AddressLike = {
  label?: string | null;
  contactName?: string | null;
  phone?: string | null;
  country?: string | null;
  state?: string | null;
  city?: string | null;
  postalCode?: string | null;
  line1?: string | null;
  line2?: string | null;
};

function AddressPanel({
  address,
  email,
  t
}: {
  address: AddressLike | null;
  email: string;
  t: Record<string, string> & {
    addressName: string;
    addressEmail: string;
    addressPhone: string;
    addressCountry: string;
    addressStateCity: string;
    addressStreet: string;
    addressPostcode: string;
  };
}) {
  return (
    <CompactList>
      <CompactLine label={t.addressName} value={address?.contactName ?? "-"} />
      <CompactLine label={t.addressEmail} value={email} />
      <CompactLine label={t.addressPhone} value={address?.phone ?? "-"} />
      <CompactLine label={t.addressCountry} value={address ? countryName(address.country) : "-"} />
      <CompactLine label={t.addressStateCity} value={address ? `${address.state || "-"} / ${address.city}` : "-"} />
      <CompactLine label={t.addressStreet} value={address ? `${address.line1}${address.line2 ? `, ${address.line2}` : ""}` : "-"} />
      <CompactLine label={t.addressPostcode} value={address?.postalCode ?? "-"} />
    </CompactList>
  );
}

function PaymentRecords({
  payments,
  t
}: {
  payments: OrderModalRow["payments"];
  t: {
    paymentRecordsEmpty: string;
  };
}) {
  if (!payments.length) return <EmptyBlock text={t.paymentRecordsEmpty} />;
  return (
    <div className="max-w-full overflow-x-auto">
      <table className="admin-table min-w-[860px] shadow-none">
        <thead>
          <tr>
            <th>Payment</th>
            <th>Type</th>
            <th>Provider</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Transaction</th>
            <th>Paid at</th>
          </tr>
        </thead>
        <tbody>
          {payments.map((payment) => (
            <tr key={payment.id}>
              <td>
                <div className="font-bold text-slate-900">{payment.paymentNo}</div>
                <div className="text-xs text-slate-400">#{payment.id}</div>
              </td>
              <td>{payment.type}</td>
              <td className="font-black uppercase text-[#465fff]">{payment.provider}</td>
              <td>{payment.currency} {Number(payment.amount).toFixed(2)}</td>
              <td><OrderStatusBadge value={payment.status} /></td>
              <td className="max-w-[220px] truncate">{payment.gatewayOrderNo ?? payment.providerOrderNo ?? "-"}</td>
              <td>{payment.paidAt ? formatDateTime(payment.paidAt) : "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function OrderNotes({
  notes,
  userNote,
  adminNote,
  t
}: {
  notes: OrderModalRow["notes"];
  userNote?: string | null;
  adminNote?: string | null;
  t: {
    customerNote: string;
    latestAdminNote: string;
    adminActor: string;
    notesEmpty: string;
    userVisible: string;
    snapshot: string;
  };
}) {
  const combined = [
    userNote ? { id: "user-note", type: "user", content: userNote, createdAt: null as Date | null, actor: t.customerNote, visibleToUser: true } : null,
    adminNote ? { id: "legacy-admin-note", type: "admin", content: adminNote, createdAt: null as Date | null, actor: t.latestAdminNote, visibleToUser: false } : null,
    ...notes.map((note) => ({
      id: String(note.id),
      type: note.type,
      content: note.content,
      createdAt: note.createdAt,
      actor: note.creator?.email ?? t.adminActor,
      visibleToUser: note.visibleToUser
    }))
  ].filter(Boolean) as Array<{ id: string; type: string; content: string; createdAt: Date | null; actor: string; visibleToUser: boolean }>;
  if (!combined.length) return <EmptyBlock text={t.notesEmpty} />;
  return (
    <div className="space-y-2">
      {combined.map((note) => (
        <div key={note.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <OrderStatusBadge value={note.type} />
              <span className="font-bold text-slate-700">{note.actor}</span>
              {note.visibleToUser ? <span className="rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-black text-emerald-700">{t.userVisible}</span> : null}
            </div>
            <span className="text-xs font-semibold text-slate-400">{note.createdAt ? formatDateTime(note.createdAt) : t.snapshot}</span>
          </div>
          <p className="mt-2 whitespace-pre-wrap leading-6 text-slate-700">{note.content}</p>
        </div>
      ))}
    </div>
  );
}

function OrderTimeline({
  order,
  t
}: {
  order: OrderModalRow;
  t: {
    timelineCreated: string;
    timelinePaid: string;
    timelinePurchased: string;
    timelineWarehouse: string;
    timelinePackage: string;
    timelineShipped: string;
    timelineCompleted: string;
    timelineCancelled: string;
    timelineDeliveredCompleted: string;
    timelineLogsEmpty: string;
    systemActor: string;
  };
}) {
  const events = [
    { key: "created", label: t.timelineCreated, date: order.createdAt, detail: order.orderNo },
    order.paidAt ? { key: "paid", label: t.timelinePaid, date: order.paidAt, detail: statusLabel[order.paymentStatus] ?? order.paymentStatus } : null,
    order.purchasedAt ? { key: "purchased", label: t.timelinePurchased, date: order.purchasedAt, detail: statusLabel[order.purchaseStatus] ?? order.purchaseStatus } : null,
    order.warehouseReceivedAt ? { key: "warehouse", label: t.timelineWarehouse, date: order.warehouseReceivedAt, detail: statusLabel[order.warehouseStatus] ?? order.warehouseStatus } : null,
    ...order.packages.map((pkg) => ({ key: `pkg-${pkg.id}`, label: t.timelinePackage.replace("{packageNo}", pkg.packageNo), date: pkg.createdAt, detail: statusLabel[pkg.status] ?? pkg.status })),
    order.shippedAt ? { key: "shipped", label: t.timelineShipped, date: order.shippedAt, detail: order.packages[0]?.trackingNumber ?? "-" } : null,
    order.completedAt ? { key: "completed", label: t.timelineCompleted, date: order.completedAt, detail: t.timelineDeliveredCompleted } : null,
    order.cancelledAt ? { key: "cancelled", label: t.timelineCancelled, date: order.cancelledAt, detail: statusLabel.cancelled ?? "Cancelled" } : null
  ].filter(Boolean) as Array<{ key: string; label: string; date: Date; detail: React.ReactNode }>;
  const logs = order.logs.slice(0, 12);
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="space-y-2">
        {events.map((event) => (
          <div key={event.key} className="rounded-xl border border-slate-200 bg-white p-3 text-sm">
            <div className="font-black text-slate-900">{event.label}</div>
            <div className="mt-1 text-xs font-semibold text-slate-400">{formatDateTime(event.date)}</div>
            <div className="mt-1 text-sm font-semibold text-slate-600">{event.detail}</div>
          </div>
        ))}
      </div>
      <div className="space-y-2">
        {logs.length ? logs.map((log) => (
          <div key={log.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <OrderStatusBadge value={log.action} />
              <span className="text-xs font-semibold text-slate-400">{formatDateTime(log.createdAt)}</span>
            </div>
            <p className="mt-2 leading-6 text-slate-700">{log.detail ?? "-"}</p>
            <div className="mt-1 text-xs font-semibold text-slate-400">{log.actor?.email ?? t.systemActor}</div>
          </div>
        )) : <EmptyBlock text={t.timelineLogsEmpty} />}
      </div>
    </div>
  );
}

function EmptyBlock({ text }: { text: string }) {
  return <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm font-semibold text-slate-500">{text}</div>;
}

function latestNote(notes: OrderModalRow["notes"], type: string) {
  return notes.find((note) => note.type === type);
}

function orderAddressSnapshot(order: OrderModalRow): AddressLike | null {
  const snapshot = order.shippingAddressSnapshot;
  if (snapshot && typeof snapshot === "object" && !Array.isArray(snapshot)) {
    return snapshot as AddressLike;
  }
  return order.address;
}

function OrderManagementForm({ order, admins, mode }: { order: OrderModalRow; admins: Array<{ id: number; name: string | null; email: string }>; mode: "status" | "amounts" }) {
  return (
    <Can permission={mode === "amounts" ? "orders.refund" : "orders.update"}>
      <AdminSaveForm action={updateOrderStatus} className="grid gap-3" submitLabel="Save changes">
        <input type="hidden" name="id" value={order.id} />
        <div>
          <h4 className="font-black text-slate-900">{mode === "status" ? "Edit order status" : "Edit order amounts"}</h4>
          <p className="mt-1 text-xs leading-5 text-slate-500">All fields are labelled and preserve the current order values when saved.</p>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {mode === "status" ? (
            <>
              <SelectField name="orderSource" label="Order source" value={order.orderSource} options={orderSourceOptions} />
              <SelectField name="paymentStatus" label="Payment status" value={order.paymentStatus} options={paymentStatusOptions} />
              <SelectField name="purchaseStatus" label="Purchase status" value={order.purchaseStatus} options={purchaseStatusOptions} />
              <SelectField name="warehouseStatus" label="Warehouse status" value={order.warehouseStatus} options={warehouseStatusOptions} />
              <SelectField name="packageStatus" label="Package status" value={order.packageStatus} options={orderPackageStatusOptions} />
              <SelectField name="shippingPaymentStatus" label="Shipping payment" value={order.shippingPaymentStatus} options={shippingPaymentStatusOptions} />
              <SelectField name="shippingStatus" label="Shipping status" value={order.shippingStatus} options={shippingStatusOptions} />
              <SelectField name="riskStatus" label="Risk status" value={order.riskStatus} options={riskStatusOptions} />
              <SelectField name="refundStatus" label="Refund status" value={order.refundStatus} options={refundStatusOptions} />
              <label className="grid gap-1 text-xs font-bold text-slate-600">
                Assignee
                <select name="assigneeId" defaultValue={order.assigneeId ?? ""} className="admin-input">
                  <option value="">Unassigned</option>
                  {admins.map((admin) => <option key={admin.id} value={admin.id}>{admin.name ?? admin.email}</option>)}
                </select>
              </label>
            </>
          ) : (
            <>
              <LabeledInput name="paidUsd" label="Paid amount USD" type="number" step="0.01" defaultValue={order.paidUsd.toString()} />
              <LabeledInput name="unpaidUsd" label="Unpaid amount USD" type="number" step="0.01" defaultValue={order.unpaidUsd.toString()} />
              <LabeledInput name="actualShippingUsd" label="Actual shipping USD" type="number" step="0.01" defaultValue={order.actualShippingUsd.toString()} />
              <LabeledInput name="refundUsd" label="Refund amount USD" type="number" step="0.01" defaultValue={order.refundUsd.toString()} />
              <LabeledInput name="domesticShippingUsd" label="Chinese shipping USD" type="number" step="0.01" defaultValue={order.domesticShippingUsd.toString()} />
              <LabeledInput name="valueAddedServicesUsd" label="Value-added services USD" type="number" step="0.01" defaultValue={order.valueAddedServicesUsd.toString()} />
              <LabeledInput name="discountUsd" label="Discount / coupon USD" type="number" step="0.01" defaultValue={order.discountUsd.toString()} />
              <div className="md:col-span-2">
                <LabeledInput name="adjustReason" label="Adjustment reason (logged separately in notes)" defaultValue="" />
              </div>
            </>
          )}
        </div>
      </AdminSaveForm>
    </Can>
  );
}

function OrderNoteForm({
  orderId,
  defaultType = "admin",
  t
}: {
  orderId: number;
  defaultType?: string;
  t: {
    addNote: string;
    visibleToUser: string;
    notePlaceholder: string;
  };
}) {
  return (
    <AdminSaveForm action={addOrderNote} permission="orders.update" className="grid gap-3" submitLabel={t.addNote}>
      <input type="hidden" name="orderId" value={orderId} />
      <div className="grid gap-3 md:grid-cols-[220px_1fr]">
        <label className="grid gap-1 text-xs font-bold text-slate-600">
          Note type
          <select name="type" defaultValue={defaultType} className="admin-input">
            {orderNoteTypeOptions.map((type) => <option key={type} value={type}>{statusLabel[type] ?? type}</option>)}
          </select>
        </label>
        <label className="grid gap-1 text-xs font-bold text-slate-600">
          Visibility
          <span className="flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-600">
            <input type="checkbox" name="visibleToUser" />
            {t.visibleToUser}
          </span>
        </label>
      </div>
      <label className="grid gap-1 text-xs font-bold text-slate-600">
        Note
        <textarea name="content" className="admin-input min-h-32" placeholder={t.notePlaceholder} required />
      </label>
    </AdminSaveForm>
  );
}

function AddressEditForm({ order, title }: { order: OrderModalRow; title: string }) {
  return (
    <AdminSaveForm action={updateOrderAddress} permission="orders.update" className="grid gap-3" submitLabel="Save address">
      <input type="hidden" name="orderId" value={order.id} />
      <input type="hidden" name="userId" value={order.userId} />
      <input type="hidden" name="addressId" value={order.address?.id ?? ""} />
      <h4 className="font-black text-slate-900">{title}</h4>
      <div className="grid gap-3 md:grid-cols-2">
        <LabeledInput name="label" label="Address label" defaultValue={order.address?.label ?? "Shipping"} />
        <LabeledInput name="contactName" label="Full name" defaultValue={order.address?.contactName ?? ""} />
        <LabeledInput name="phone" label="Phone number" defaultValue={order.address?.phone ?? ""} />
        <AddressRegionFields
          defaultCountry={order.address?.country ?? "US"}
          defaultState={order.address?.state ?? ""}
          countryClassName="admin-input"
          stateClassName="admin-input"
          showLabels
        />
        <LabeledInput name="city" label="City" defaultValue={order.address?.city ?? ""} />
        <LabeledInput name="postalCode" label="Postcode / ZIP" defaultValue={order.address?.postalCode ?? ""} />
        <LabeledInput name="line1" label="Street address line 1" defaultValue={order.address?.line1 ?? ""} />
        <LabeledInput name="line2" label="Street address line 2" defaultValue={order.address?.line2 ?? ""} />
      </div>
    </AdminSaveForm>
  );
}

function OrderDeleteControls({ order, isTrash }: { order: OrderModalRow; isTrash: boolean }) {
  return (
    <Can permission="orders.manage">
      <div className="grid gap-3">
        {isTrash ? (
          <>
            <form action={restoreOrderFromTrash}>
              <input type="hidden" name="id" value={order.id} />
              <button className="admin-primary px-5 py-2.5">Restore order</button>
            </form>
            <form action={permanentlyDeleteOrder}>
              <input type="hidden" name="id" value={order.id} />
              <button className="admin-danger px-5 py-2.5">Permanently delete</button>
            </form>
          </>
        ) : (
          <form action={moveOrderToTrash}>
            <input type="hidden" name="id" value={order.id} />
            <button className="admin-danger px-5 py-2.5">Move to trash</button>
          </form>
        )}
      </div>
    </Can>
  );
}

function LabeledInput({ name, label, defaultValue, type = "text", step, disabled = false }: { name: string; label: string; defaultValue: string; type?: string; step?: string; disabled?: boolean }) {
  return (
    <label className="grid gap-1 text-xs font-bold text-slate-600">
      {label}
      <input name={name} type={type} step={step} defaultValue={defaultValue} disabled={disabled} className="admin-input disabled:bg-slate-100 disabled:text-slate-400" />
    </label>
  );
}

function EditNotice({ text, href }: { text: string; href?: string }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3 text-sm leading-6 text-slate-600">
      {text}
      {href ? <Link href={href} className="mt-2 block font-bold text-[#465fff]">Open related editor</Link> : null}
    </div>
  );
}

function SelectField<T extends readonly string[]>({ name, label, value, options }: { name: string; label: string; value: string; options: T }) {
  return (
    <label className="grid gap-1 text-sm font-semibold text-slate-600">
      {label}
      <select name={name} defaultValue={value} className="admin-input">
        {optionList(options)}
      </select>
    </label>
  );
}

function Pagination({ page, totalPages, params }: { page: number; totalPages: number; params: Record<string, string | string[] | undefined> }) {
  const makeHref = (target: number) => {
    const next = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (!value || key === "page") return;
      next.set(key, Array.isArray(value) ? value[0] : value);
    });
    next.set("page", String(target));
    return `/admin/orders?${next.toString()}`;
  };
  return (
    <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
      <span>Page {page} of {totalPages}</span>
      <div className="flex gap-2">
        <Link href={makeHref(Math.max(1, page - 1))} className="admin-action">Prev</Link>
        <Link href={makeHref(Math.min(totalPages, page + 1))} className="admin-action">Next</Link>
      </div>
    </div>
  );
}

function formatDateTime(date: Date) {
  return date.toISOString().slice(0, 16).replace("T", " ");
}
