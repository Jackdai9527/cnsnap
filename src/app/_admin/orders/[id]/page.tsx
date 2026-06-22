import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Prisma } from "@prisma/client";
import { getLocale, getTranslations } from "next-intl/server";
import { Can } from "@/components/admin/Can";
import { AdminModal } from "@/components/admin/AdminModal";
import { OrderQcPhotoPanel, QcPhotoGrid } from "@/components/admin/OrderQcPhotoPanel";
import { OrderStatusBadge } from "@/components/admin/OrderStatusBadge";
import { AdminSaveForm } from "@/components/admin/AdminSaveForm";
import { WorkflowActionForm } from "@/components/admin/WorkflowActionForm";
import { AddressRegionFields } from "@/components/forms/AddressRegionFields";
import { countryName } from "@/lib/countries";
import {
  orderNoteTypeOptions,
  orderSourceOptions,
  orderStatusOptions,
  purchaseStatusOptions,
  refundStatusOptions,
  riskStatusOptions,
  shippingStatusOptions,
  statusLabel,
  warehouseStatusOptions
} from "@/lib/constants";
import { money } from "@/lib/currency";
import { adminRoleFilterValues } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db";
import { serializeMediaAsset } from "@/lib/media-assets";
import { addOrderNote, markOrderQcConfirmed, markOrderQcShared, updateOrderAddress, updateOrderItemDetails, updateOrderStatus, updateOrderWorkflow, updatePackageStatus } from "../../actions";

type AdminOrderDetailPageProps = {
  params: Promise<{ id: string }>;
};

const productPaymentStatusFormOptions = ["pending", "paid", "failed", "refund"] as const;
const shippingPaymentStatusFormOptions = ["pending", "paid", "failed", "refund"] as const;
const packageStatusFormOptions = ["none", "pending", "created", "shipped", "delivered", "abnormal"] as const;

export default async function AdminOrderDetailPage({ params }: AdminOrderDetailPageProps) {
  const locale = await getLocale();
  const pageT = await getTranslations("orders.ordersPage.detailPage");
  const ordersT = await getTranslations("orders.ordersPage");
  const commonT = await getTranslations("common.statuses");
  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id: Number(id) },
    include: {
      user: true,
      address: true,
      items: true,
      payments: { orderBy: { createdAt: "desc" } },
      packages: { include: { shippingChannel: true, items: true }, orderBy: { createdAt: "desc" } },
      mediaAssets: { where: { usage: "qc_photo" }, include: { uploader: { select: { id: true, email: true, name: true } } }, orderBy: { createdAt: "desc" } },
      notes: { include: { creator: true }, orderBy: { createdAt: "desc" } },
      logs: { include: { actor: true }, orderBy: { createdAt: "desc" }, take: 120 }
    }
  });
  if (!order) notFound();
  const admins = await prisma.user.findMany({
    where: { role: { in: adminRoleFilterValues } },
    select: { id: true, email: true, name: true },
    orderBy: { email: "asc" }
  });

  const address = addressSnapshot(order.shippingAddressSnapshot) ?? order.address;
  const latestPackage = order.packages[0];
  const detailState = deriveOrderDetailState(order);
  const workflow = buildOrderWorkflow(order, pageT);

  return (
    <section>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="admin-kicker">{pageT("kicker")}</div>
          <h1 className="admin-page-title mt-1">{order.orderNo}</h1>
          <p className="mt-2 text-sm font-semibold text-slate-500">{order.user.email} · {money(Number(order.totalUsd))}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/orders" className="admin-action px-4 py-2">{pageT("backToOrders")}</Link>
          <Link href={`/admin/users?user_id=${order.userId}`} className="admin-action px-4 py-2">{pageT("userProfile")}</Link>
          {latestPackage ? <Link href={`/admin/packages#package-${latestPackage.id}`} className="admin-action px-4 py-2">{pageT("package")}</Link> : null}
        </div>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4 2xl:grid-cols-8">
        <StatusCard label={pageT("statusOverall")} value={order.orderStatus} />
        <StatusCard label={pageT("statusPayment")} value={detailState.paymentStatus} />
        <StatusCard label={pageT("statusReview")} value={order.riskStatus} />
        <StatusCard label={pageT("statusPurchase")} value={order.purchaseStatus} />
        <StatusCard label={pageT("statusWarehouse")} value={order.warehouseStatus} />
        <StatusCard label={pageT("statusPackage")} value={detailState.packageStatus} />
        <StatusCard label={pageT("statusShipPay")} value={detailState.shippingPaymentStatus} />
        <StatusCard label={pageT("statusShipping")} value={order.shippingStatus} />
      </div>

      <Panel title={pageT("workflowTitle")} className="mb-5">
        <OrderWorkflowPanel workflow={workflow} />
      </Panel>

      <Panel title={pageT("shippingAddressTitle")} className="mb-5">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)] lg:items-start">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <AddressInfoCard label={pageT("addressRecipient")} value={address?.contactName ?? "-"} />
            <AddressInfoCard label={pageT("addressPhone")} value={address?.phone ?? "-"} />
            <AddressInfoCard label={pageT("addressCountry")} value={address?.country ? localizedCountryName(address.country, locale) : "-"} />
            <AddressInfoCard label={pageT("addressStateCity")} value={address ? `${address.state || "-"} / ${address.city}` : "-"} />
            <AddressInfoCard label={pageT("addressPostcode")} value={address?.postalCode ?? "-"} />
            <AddressInfoCard label={pageT("addressStreet")} value={address ? `${address.line1}${address.line2 ? `, ${address.line2}` : ""}` : "-"} fullWidth />
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
            <div className="text-[11px] font-black uppercase tracking-[0.1em] text-slate-400">{pageT("addressActions")}</div>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
              {pageT("addressActionsDescription")}
            </p>
            <div className="mt-4">
              <Link href="#order-shipping-address-edit" className="admin-action inline-flex px-4 py-2 text-sm font-bold">
                {pageT("editAddress")}
              </Link>
            </div>
          </div>
        </div>
      </Panel>

      <div className="admin-card mb-5 p-4">
        <h2 className="text-sm font-black text-slate-900">{pageT("dynamicActionsTitle")}</h2>
        <div className="mt-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold leading-5 text-slate-600">
          {pageT("freightReadinessPrefix")}
          {" "}
          <span className="font-black text-slate-900">
            {Number(order.actualShippingUsd) > 0 ? pageT("actualFreightSet", { amount: money(Number(order.actualShippingUsd)) }) : pageT("actualFreightMissing")}
          </span>
          {" "}
          {latestPackage ? `· ${pageT("packageFee", { amount: money(Number(latestPackage.shippingFeeUsd)) })}` : `· ${pageT("packageFeeMissing")}`}
          {" "}
          · {pageT("freightReadinessHint")}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <ActionButton id={order.id} action="mark_paid" label={ordersT("rowActions.markPaid")} show={detailState.paymentStatus !== "paid"} confirmText={pageT("confirm.workflowAction", { label: ordersT("rowActions.markPaid") })} />
          <ActionButton id={order.id} action="send_payment_reminder" label={ordersT("rowActions.reminder")} show={detailState.paymentStatus !== "paid"} confirmText={pageT("confirm.workflowAction", { label: ordersT("rowActions.reminder") })} />
          <ActionButton id={order.id} action="approve_review" label={ordersT("rowActions.reviewOk")} show={detailState.paymentStatus === "paid" && order.purchaseStatus === "pending"} confirmText={pageT("confirm.workflowAction", { label: ordersT("rowActions.reviewOk") })} />
          <ActionButton id={order.id} action="mark_risk" label={ordersT("rowActions.risk")} show={detailState.paymentStatus === "paid" && order.riskStatus === "normal" && order.purchaseStatus === "pending"} confirmText={pageT("confirm.workflowAction", { label: ordersT("rowActions.risk") })} />
          <ActionButton id={order.id} action="start_purchase" label={ordersT("rowActions.startPurchase")} show={detailState.paymentStatus === "paid" && order.purchaseStatus === "pending" && order.riskStatus === "normal"} confirmText={pageT("confirm.workflowAction", { label: ordersT("rowActions.startPurchase") })} />
          <ActionButton id={order.id} action="mark_purchased" label={ordersT("rowActions.purchased")} show={["purchasing", "partial_purchased"].includes(order.purchaseStatus)} confirmText={pageT("confirm.workflowAction", { label: ordersT("rowActions.purchased") })} />
          <ActionButton id={order.id} action="out_of_stock" label={ordersT("rowActions.outOfStock")} show={["pending", "purchasing"].includes(order.purchaseStatus)} confirmText={pageT("confirm.workflowAction", { label: ordersT("rowActions.outOfStock") })} />
          <ActionButton id={order.id} action="price_changed" label={ordersT("rowActions.priceChanged")} show={["pending", "purchasing"].includes(order.purchaseStatus)} confirmText={pageT("confirm.workflowAction", { label: ordersT("rowActions.priceChanged") })} />
          <ActionButton id={order.id} action="mark_received" label={ordersT("rowActions.received")} show={order.purchaseStatus === "purchased" && order.warehouseStatus !== "received"} confirmText={pageT("confirm.workflowAction", { label: ordersT("rowActions.received") })} />
          <ActionButton id={order.id} action="partial_received" label={ordersT("rowActions.partialReceived")} show={order.purchaseStatus === "purchased" && order.warehouseStatus !== "received"} confirmText={pageT("confirm.workflowAction", { label: ordersT("rowActions.partialReceived") })} />
          <ActionButton id={order.id} action="create_package" label={ordersT("rowActions.createPackage")} show={order.warehouseStatus === "received" && ["none", "pending"].includes(detailState.packageStatus)} confirmText={pageT("confirm.workflowAction", { label: ordersT("rowActions.createPackage") })} />
          <ActionButton id={order.id} action="request_shipping_payment" label={ordersT("rowActions.shipFee")} show={detailState.packageStatus === "created"} confirmText={pageT("confirm.workflowAction", { label: ordersT("rowActions.shipFee") })} />
          <ActionButton id={order.id} action="ready_to_ship" label={ordersT("rowActions.shipPaid")} show={detailState.shippingPaymentStatus === "pending" && order.qcCustomerConfirmed} confirmText={pageT("confirm.workflowAction", { label: ordersT("rowActions.shipPaid") })} />
          <ActionButton id={order.id} action="mark_shipped" label={ordersT("rowActions.shipped")} show={order.shippingStatus === "ready_to_ship"} confirmText={pageT("confirm.workflowAction", { label: ordersT("rowActions.shipped") })} />
          <ActionButton id={order.id} action="in_transit" label={ordersT("rowActions.inTransit")} show={order.shippingStatus === "shipped"} confirmText={pageT("confirm.workflowAction", { label: ordersT("rowActions.inTransit") })} />
          <ActionButton id={order.id} action="complete" label={ordersT("rowActions.complete")} show={["shipped", "in_transit", "delivery_attempted"].includes(order.shippingStatus)} confirmText={pageT("confirm.workflowAction", { label: ordersT("rowActions.complete") })} />
          <ActionButton id={order.id} action="mark_abnormal" label={ordersT("rowActions.abnormal")} show={!["completed", "cancel", "refund", "trash"].includes(order.orderStatus)} danger confirmText={pageT("confirm.workflowAction", { label: ordersT("rowActions.abnormal") })} />
          <ActionButton id={order.id} action="refund_pending" label={ordersT("rowActions.refundPending")} show={order.refundStatus === "none" && ["abnormal", "cancel", "order_after_sales"].includes(order.orderStatus)} confirmText={pageT("confirm.workflowAction", { label: ordersT("rowActions.refundPending") })} />
          <ActionButton id={order.id} action="mark_refunded" label={ordersT("rowActions.markRefunded")} show={["pending", "partial_refunded"].includes(order.refundStatus)} confirmText={pageT("confirm.workflowAction", { label: ordersT("rowActions.markRefunded") })} />
          <ActionButton id={order.id} action="cancel" label={ordersT("rowActions.cancel")} show={!["completed", "cancel", "refund", "trash"].includes(order.orderStatus)} danger confirmText={pageT("confirm.workflowAction", { label: ordersT("rowActions.cancel") })} />
        </div>
      </div>

      <Panel title={pageT("editStatusAmounts")} className="mb-5">
        <OrderStatusEditForm order={order} admins={admins} t={pageT} commonT={commonT} />
      </Panel>

      <Panel title={pageT("packageFreightEditor")} className="mb-5">
        <PackageFreightEditForm order={order} packageRecord={latestPackage} t={pageT} />
      </Panel>
      <AdminModal
        id="order-shipping-address-edit"
        title={pageT("editShippingAddressTitle")}
        description={pageT("editShippingAddressDescription")}
        widthClass="max-w-3xl"
      >
        <OrderAddressEditForm order={order} address={address} t={pageT} />
      </AdminModal>

      <Panel title={pageT("orderItemsTitle")} className="mb-4">
        <div className="overflow-x-auto">
          <table className="admin-table min-w-[1120px] shadow-none">
            <thead>
              <tr>
                <th className="min-w-[460px]">{pageT("orderItemsColumns.product")}</th>
                <th>{pageT("orderItemsColumns.source")}</th>
                <th>{pageT("orderItemsColumns.sku")}</th>
                <th>{pageT("orderItemsColumns.usdPrice")}</th>
                <th>{pageT("orderItemsColumns.cnyPrice")}</th>
                <th>{pageT("orderItemsColumns.qty")}</th>
                <th>{pageT("orderItemsColumns.purchase")}</th>
                <th className="w-[90px] text-right">{pageT("orderItemsColumns.action")}</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item) => (
                <tr key={item.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <span className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                        <Image src={item.image} alt="" fill sizes="48px" className="object-cover" />
                      </span>
                      <div className="min-w-0">
                        <div className="max-w-[640px] truncate font-bold text-slate-900">{item.title}</div>
                        <Link href={item.sourceUrl} target="_blank" className="block max-w-[640px] truncate text-xs font-bold text-[#465fff]">{item.sourceUrl}</Link>
                      </div>
                    </div>
                  </td>
                  <td>{item.platform}<br /><span className="text-xs text-slate-400">{item.sourceItemId}</span></td>
                  <td>{item.skuText || pageT("values.defaultSku")}<br /><span className="text-xs text-slate-400">{item.skuId || pageT("values.notSet")}</span></td>
                  <td>{money(Number(item.priceUsd))}</td>
                  <td>{pageT("values.cnPrice", { amount: Number(item.priceCny).toFixed(2) })}</td>
                  <td>{item.quantity}</td>
                  <td><OrderStatusBadge value={item.purchaseStatus} /></td>
                  <td className="text-right">
                    <Link href={`#order-item-${item.id}`} className="admin-action inline-flex px-3 py-1.5 text-xs font-bold">
                      {pageT("editItem")}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
      {order.items.map((item) => (
        <AdminModal
          key={item.id}
          id={`order-item-${item.id}`}
          title={`${pageT("editItem")} · ${item.title}`}
          description={pageT("modals.editItemDescription", { title: item.title })}
          widthClass="max-w-3xl"
        >
          <OrderItemEditForm orderId={order.id} item={item} t={pageT} commonT={commonT} />
        </AdminModal>
      ))}

      <div className="mb-4 grid gap-4 lg:grid-cols-2 2xl:grid-cols-4">
        <Panel title={pageT("customerTitle")}>
          <InfoGrid rows={[
            [pageT("customerFields.email"), order.user.email],
            [pageT("customerFields.name"), order.user.name ?? "-"],
            [pageT("customerFields.wallet"), money(Number(order.user.walletBalance))],
            [pageT("accountStatus"), <OrderStatusBadge key="status" value={order.user.status} />],
            [pageT("customerFields.destination"), localizedCountryName(order.destinationCountryCode ?? order.destinationCountry ?? address?.country, locale)]
          ]} />
        </Panel>

        <Panel title={pageT("financialSummaryTitle")}>
          <InfoGrid rows={[
            [pageT("subtotal"), `${money(Number(order.subtotalUsd))} / CN ￥${Number(order.subtotalCny).toFixed(2)}`],
            [pageT("serviceFee"), money(Number(order.serviceFeeUsd))],
            [pageT("valueAddedServices"), money(Number(order.valueAddedServicesUsd))],
            [pageT("actualFreight"), money(Number(order.actualShippingUsd))],
            [pageT("paidDue"), `${money(Number(order.paidUsd))} / ${money(Number(order.unpaidUsd))}`],
            [pageT("refund"), money(Number(order.refundUsd))]
          ]} />
        </Panel>

        <Panel title={pageT("packageTrackingTitle")}>
          <InfoGrid rows={[
            [pageT("packageNo"), latestPackage?.packageNo ?? "-"],
            [pageT("channel"), latestPackage?.shippingChannel?.name ?? "-"],
            [pageT("weight"), latestPackage ? `${latestPackage.weightKg.toString()} kg` : "-"],
            [pageT("dimensions"), latestPackage ? `${latestPackage.lengthCm?.toString() ?? "-"} x ${latestPackage.widthCm?.toString() ?? "-"} x ${latestPackage.heightCm?.toString() ?? "-"} cm` : "-"],
            [pageT("shippingFee"), latestPackage ? money(Number(latestPackage.shippingFeeUsd)) : "-"],
            [pageT("tracking"), latestPackage?.trackingNumber ?? "-"]
          ]} />
        </Panel>
      </div>

      <div className="mb-4 grid gap-4 xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
      <Panel title={pageT("qcPhotosTitle")}>
          <QcPhotoGrid assets={order.mediaAssets.map(serializeMediaAsset)} />
          <QcCustomerConfirmationPanel
            order={order}
            qcPhotoCount={order.mediaAssets.length}
            className="mt-4"
            t={{
              qcCheckpoint: pageT("qcCheckpoint"),
              qcCheckpointTitle: pageT("qcCheckpointTitle"),
              qcCheckpointDescription: pageT("qcCheckpointDescription"),
              qcSend: pageT("qcSend"),
              qcSent: pageT("qcSent"),
              qcConfirm: pageT("qcConfirm"),
              qcConfirmed: pageT("qcConfirmed"),
              stepLabel: (index: number) => pageT("step", { index }),
              qcSentTitle: pageT("qcSentTitle"),
              qcSentPending: pageT("qcSentPending"),
              qcSentBlocked: pageT("qcSentBlocked"),
              completed: pageT("completed"),
              qcConfirmedTitle: pageT("qcConfirmedTitle"),
              qcConfirmedPending: pageT("qcConfirmedPending"),
              qcConfirmedBlocked: pageT("qcConfirmedBlocked"),
              qcShipmentHold: pageT("qcShipmentHold")
            }}
          />
        </Panel>

        <Panel title={pageT("warehouseQcUploadTitle")}>
          <OrderQcPhotoPanel orderId={order.id} packageId={latestPackage?.id} initialAssets={order.mediaAssets.map(serializeMediaAsset)} compact />
        </Panel>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
        <Panel title={pageT("paymentRecordsTitle")}>
          <DataRows rows={order.payments.map((payment) => ({
            id: payment.paymentNo,
            title: `${payment.provider.toUpperCase()} · ${payment.currency} ${Number(payment.amount).toFixed(2)}`,
            meta: `${translatePaymentType(payment.type, pageT)} · ${translateStatusValue(payment.status, commonT)} · ${payment.paidAt ? formatAdminDateTime(payment.paidAt) : pageT("notPaid")}`
          }))} empty={pageT("paymentRecordsEmpty")} />
        </Panel>

        <Panel title={pageT("notesTitle")}>
          <AdminSaveForm action={addOrderNote} permission="orders.update" className="mb-4 grid gap-3" submitLabel={pageT("addNote")}>
            <input type="hidden" name="orderId" value={order.id} />
            <div className="grid gap-3 md:grid-cols-[220px_1fr]">
              <select name="type" defaultValue="admin" className="admin-input">
                {orderNoteTypeOptions.map((type) => <option key={type} value={type}>{commonT.has(type) ? commonT(type) : statusLabel[type] ?? type}</option>)}
              </select>
              <label className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-600">
                <input type="checkbox" name="visibleToUser" />
                {pageT("visibleToUser")}
              </label>
            </div>
            <textarea name="content" required className="admin-input min-h-28" placeholder={pageT("notePlaceholder")} />
          </AdminSaveForm>
          <DataRows rows={[
            order.userNote ? { id: "user-note", title: pageT("customerNote"), meta: order.userNote } : null,
            ...order.notes.map((note) => ({
              id: String(note.id),
              title: `${commonT.has(note.type) ? commonT(note.type) : statusLabel[note.type] ?? note.type} · ${note.creator?.email ?? pageT("systemActor")}`,
              meta: `${note.content} · ${note.createdAt.toLocaleString()}`
            }))
          ].filter(Boolean) as Array<{ id: string; title: string; meta: string }>} empty={pageT("notesEmpty")} />
        </Panel>

        <Panel title={pageT("statusTimelineTitle")} className="xl:col-span-2">
          <DataRows rows={order.logs.map((log) => ({
            id: String(log.id),
            title: `${translateOrderLogAction(log.action, pageT, ordersT)} · ${log.actor?.email ?? pageT("systemActor")}`,
            meta: `${translateOrderLogDetail(log.action, log.detail, pageT, ordersT, commonT)} · ${formatAdminDateTime(log.createdAt)}`
          }))} empty={pageT("statusTimelineEmpty")} />
        </Panel>
      </div>
    </section>
  );
}

function StatusCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="admin-card p-3">
      <div className="text-[11px] font-black uppercase tracking-[0.1em] text-slate-400">{label}</div>
      <div className="mt-2"><OrderStatusBadge value={value} /></div>
    </div>
  );
}

type WorkflowStepState = "done" | "current" | "pending" | "attention";

type WorkflowStep = {
  key: string;
  label: string;
  hint: string;
  state: WorkflowStepState;
};

type WorkflowSummary = {
  currentLabel: string;
  currentHint: string;
  actionTitle: string;
  actionDetail: string;
  steps: WorkflowStep[];
  panel: {
    currentStage: string;
    operatorNow: string;
    stepLabel: (index: number) => string;
    done: string;
    current: string;
    attention: string;
    pending: string;
  };
};

function OrderWorkflowPanel({ workflow }: { workflow: WorkflowSummary }) {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
          <div className="text-[11px] font-black uppercase tracking-[0.1em] text-slate-400">{workflow.panel.currentStage}</div>
          <div className="mt-2 text-lg font-black text-slate-950">{workflow.currentLabel}</div>
          <p className="mt-2 text-sm leading-6 text-slate-600">{workflow.currentHint}</p>
        </div>
        <div className="rounded-xl border border-[#dbeafe] bg-[#f8fbff] p-4">
          <div className="text-[11px] font-black uppercase tracking-[0.1em] text-[#2563eb]">{workflow.panel.operatorNow}</div>
          <div className="mt-2 text-lg font-black text-slate-950">{workflow.actionTitle}</div>
          <p className="mt-2 text-sm leading-6 text-slate-600">{workflow.actionDetail}</p>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-6">
        {workflow.steps.map((step, index) => (
          <div
            key={step.key}
            className={`rounded-xl border p-3 transition ${
              workflowStepTone(step.state)
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="text-[11px] font-black uppercase tracking-[0.08em] opacity-75">{workflow.panel.stepLabel(index + 1)}</div>
              <span className="text-[11px] font-black uppercase tracking-[0.08em]">{workflowStepStatusLabel(step.state, workflow.panel)}</span>
            </div>
            <div className="mt-2 text-sm font-black">{step.label}</div>
            <p className="mt-2 text-xs leading-5 opacity-80">{step.hint}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ActionButton({
  id,
  action,
  label,
  show,
  danger = false,
  confirmText
}: {
  id: number;
  action: string;
  label: string;
  show: boolean;
  danger?: boolean;
  confirmText: string;
}) {
  if (!show) return null;
  const permission = ["refund_pending", "mark_refunded"].includes(action) ? "orders.refund" : "orders.update";
  return (
    <Can permission={permission}>
      <WorkflowActionForm
        action={updateOrderWorkflow}
        orderId={id}
        workflowAction={action}
        label={label}
        className={danger ? "admin-danger" : "admin-action"}
        confirmationText={confirmText}
      />
    </Can>
  );
}

function PackageFreightEditForm({
  order,
  packageRecord,
  t
}: {
  order: { id: number; warehouseStatus: string; actualShippingUsd: { toString(): string } };
  packageRecord: {
    id: number;
    packageNo: string;
    status: string;
    weightKg: { toString(): string };
    lengthCm: { toString(): string } | null;
    widthCm: { toString(): string } | null;
    heightCm: { toString(): string } | null;
    shippingFeeUsd: { toString(): string };
  } | undefined;
  t: Awaited<ReturnType<typeof getTranslations<"orders.ordersPage.detailPage">>>;
}) {
  if (!packageRecord) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm font-semibold text-slate-500">
        {t("freightEditor.empty")}
      </div>
    );
  }

  return (
    <AdminSaveForm action={updatePackageStatus} className="grid gap-4" submitLabel={t("freightEditor.submit")}>
      <input type="hidden" name="id" value={packageRecord.id} />
      <input type="hidden" name="status" value={packageRecord.status} />
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <LabeledInput name="weightKg" label={t("freightEditor.weightKg")} type="number" step="0.01" defaultValue={packageRecord.weightKg.toString()} />
        <LabeledInput name="lengthCm" label={t("freightEditor.lengthCm")} type="number" step="0.1" defaultValue={packageRecord.lengthCm?.toString() ?? ""} />
        <LabeledInput name="widthCm" label={t("freightEditor.widthCm")} type="number" step="0.1" defaultValue={packageRecord.widthCm?.toString() ?? ""} />
        <LabeledInput name="heightCm" label={t("freightEditor.heightCm")} type="number" step="0.1" defaultValue={packageRecord.heightCm?.toString() ?? ""} />
        <LabeledInput name="shippingFeeUsd" label={t("freightEditor.shippingFeeUsd")} type="number" step="0.01" defaultValue={packageRecord.shippingFeeUsd.toString()} />
      </div>
      <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold leading-5 text-slate-600">
        {t("values.packageLabel")}
        {" "}
        <span className="font-black text-slate-900">{packageRecord.packageNo}</span>
        {" "}
        · {t("values.savedPackageFee")}
        {" "}
        <span className="font-black text-slate-900">{money(Number(packageRecord.shippingFeeUsd))}</span>
        {" "}
        · {t("values.orderActualFreight")}
        {" "}
        <span className="font-black text-slate-900">{money(Number(order.actualShippingUsd))}</span>
      </div>
    </AdminSaveForm>
  );
}

function QcCustomerConfirmationPanel({
  order,
  qcPhotoCount,
  className = "",
  t
}: {
  order: {
    id: number;
    qcSharedWithCustomer: boolean;
    qcSharedAt: Date | null;
    qcCustomerConfirmed: boolean;
    qcCustomerConfirmedAt: Date | null;
    shippingStatus: string;
  };
  qcPhotoCount: number;
  className?: string;
  t: {
    qcCheckpoint: string;
    qcCheckpointTitle: string;
    qcCheckpointDescription: string;
    qcSend: string;
    qcSent: string;
    qcConfirm: string;
    qcConfirmed: string;
    stepLabel: (index: number) => string;
    qcSentTitle: string;
    qcSentPending: string;
    qcSentBlocked: string;
    completed: string;
    qcConfirmedTitle: string;
    qcConfirmedPending: string;
    qcConfirmedBlocked: string;
    qcShipmentHold: string;
  };
}) {
  const canSendQc = qcPhotoCount > 0 && !order.qcSharedWithCustomer;
  const canConfirmQc = order.qcSharedWithCustomer && !order.qcCustomerConfirmed;
  const sendLabel = order.qcSharedWithCustomer ? t.qcSent : t.qcSend;
  const confirmLabel = order.qcCustomerConfirmed ? t.qcConfirmed : t.qcConfirm;

  return (
    <div className={`rounded-xl border border-slate-200 bg-slate-50/80 p-4 ${className}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-[11px] font-black uppercase tracking-[0.1em] text-slate-400">{t.qcCheckpoint}</div>
          <h3 className="mt-1 text-sm font-black text-slate-900">{t.qcCheckpointTitle}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {t.qcCheckpointDescription}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Can permission="orders.update">
            <form action={markOrderQcShared}>
              <input type="hidden" name="id" value={order.id} />
              <button
                type="submit"
                disabled={!canSendQc}
                className={`px-4 py-2 ${canSendQc ? "admin-primary" : "admin-action opacity-70"}`}
              >
                {sendLabel}
              </button>
            </form>
            <form action={markOrderQcConfirmed}>
              <input type="hidden" name="id" value={order.id} />
              <button
                type="submit"
                disabled={!canConfirmQc}
                className={`px-4 py-2 ${canConfirmQc ? "admin-primary" : "admin-action opacity-70"}`}
              >
                {confirmLabel}
              </button>
            </form>
          </Can>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className={`rounded-xl border p-3 ${order.qcSharedWithCustomer ? "border-emerald-200 bg-emerald-50/80" : "border-slate-200 bg-white"}`}>
          <div className="text-[11px] font-black uppercase tracking-[0.08em] text-slate-400">{t.stepLabel(1)}</div>
          <div className="mt-1 text-sm font-black text-slate-900">{t.qcSentTitle}</div>
          <div className="mt-2 text-sm text-slate-600">
            {order.qcSharedWithCustomer
              ? `${t.completed}${order.qcSharedAt ? ` · ${formatAdminDateTime(order.qcSharedAt)}` : ""}`
              : qcPhotoCount
                ? t.qcSentPending
                : t.qcSentBlocked}
          </div>
        </div>
        <div className={`rounded-xl border p-3 ${order.qcCustomerConfirmed ? "border-emerald-200 bg-emerald-50/80" : "border-slate-200 bg-white"}`}>
          <div className="text-[11px] font-black uppercase tracking-[0.08em] text-slate-400">{t.stepLabel(2)}</div>
          <div className="mt-1 text-sm font-black text-slate-900">{t.qcConfirmedTitle}</div>
          <div className="mt-2 text-sm text-slate-600">
            {order.qcCustomerConfirmed
              ? `${t.completed}${order.qcCustomerConfirmedAt ? ` · ${formatAdminDateTime(order.qcCustomerConfirmedAt)}` : ""}`
              : order.qcSharedWithCustomer
                ? t.qcConfirmedPending
                : t.qcConfirmedBlocked}
          </div>
        </div>
      </div>

      {!order.qcCustomerConfirmed && order.shippingStatus !== "none" ? (
        <p className="mt-3 text-xs font-bold uppercase tracking-[0.08em] text-amber-700">
          {t.qcShipmentHold}
        </p>
      ) : null}
    </div>
  );
}

function Panel({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`admin-card min-w-0 p-4 ${className}`}>
      <h2 className="mb-3 text-sm font-black text-slate-900">{title}</h2>
      {children}
    </section>
  );
}

function AddressInfoCard({
  label,
  value,
  fullWidth = false
}: {
  label: string;
  value: React.ReactNode;
  fullWidth?: boolean;
}) {
  return (
    <div className={`rounded-2xl border border-slate-200 bg-white px-4 py-3 ${fullWidth ? "sm:col-span-2 xl:col-span-3" : ""}`}>
      <div className="text-[11px] font-black uppercase tracking-[0.1em] text-slate-400">{label}</div>
      <div className="mt-2 break-words text-sm font-semibold leading-6 text-slate-800">{value || "-"}</div>
    </div>
  );
}

function FieldShell({
  label,
  control,
  hint,
  className = ""
}: {
  label: string;
  control: React.ReactNode;
  hint?: string;
  className?: string;
}) {
  return (
    <div className={`grid min-h-[126px] grid-rows-[auto_minmax(44px,auto)_1fr] gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 ${className}`}>
      <div className="text-[11px] font-black uppercase tracking-[0.1em] text-slate-400">{label}</div>
      <div className="flex items-stretch">{control}</div>
      <div className="text-[11px] font-semibold leading-5 text-slate-500">{hint ?? ""}</div>
    </div>
  );
}

type AdminOrderForForms = Prisma.OrderGetPayload<{ include: { address: true; items: true } }>;

function OrderStatusEditForm({
  order,
  admins,
  t,
  commonT
}: {
  order: AdminOrderForForms & {
    assigneeId: number | null;
  };
  admins: Array<{ id: number; email: string; name: string | null }>;
  t: Awaited<ReturnType<typeof getTranslations<"orders.ordersPage.detailPage">>>;
  commonT: Awaited<ReturnType<typeof getTranslations<"common.statuses">>>;
}) {
  return (
    <Can permission="orders.update">
      <AdminSaveForm
        key={buildOrderStatusFormKey(order)}
        action={updateOrderStatus}
        className="grid gap-3"
        submitLabel={t("statusForm.submit")}
      >
        <input type="hidden" name="id" value={order.id} />
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold leading-5 text-slate-600">
          {t("statusForm.readonlyNotice")}
        </div>
        <div className="space-y-4">
          <div>
            <div className="mb-2 text-[11px] font-black uppercase tracking-[0.1em] text-slate-400">{t("statusForm.workflowFields")}</div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <ReadonlyField
                label={t("statusForm.orderStatus")}
                value={commonT.has(order.orderStatus) ? commonT(order.orderStatus) : statusLabel[order.orderStatus] ?? order.orderStatus}
                hint={t("statusForm.orderStatusHint")}
              />
              <ReadonlyField
                label={t("statusForm.orderSource")}
                value={commonT.has(order.orderSource) ? commonT(order.orderSource) : statusLabel[order.orderSource] ?? order.orderSource}
                hint={t("statusForm.orderSourceHint")}
              />
              <SelectField
                name="paymentStatus"
                label={t("statusForm.productPaymentStatus")}
                value={normalizeProductPaymentStatusForForm(order.paymentStatus)}
                options={productPaymentStatusFormOptions}
                commonT={commonT}
              />
              <ReadonlyField
                label={t("statusForm.purchaseStatus")}
                value={commonT.has(order.purchaseStatus) ? commonT(order.purchaseStatus) : statusLabel[order.purchaseStatus] ?? order.purchaseStatus}
                hint={t("statusForm.purchaseStatusHint")}
              />
              <SelectField name="warehouseStatus" label={t("statusForm.warehouseStatus")} value={order.warehouseStatus} options={warehouseStatusOptions} commonT={commonT} />
              <ReadonlyField
                label={t("statusForm.packageStatus")}
                value={commonT.has(detailPackageStatusLabel(order.packageStatus)) ? commonT(detailPackageStatusLabel(order.packageStatus)) : statusLabel[detailPackageStatusLabel(order.packageStatus)] ?? detailPackageStatusLabel(order.packageStatus)}
                hint={t("statusForm.packageStatusHint")}
              />
              <ReadonlyField
                label={t("statusForm.shippingPaymentStatus")}
                value={commonT.has(normalizeShippingPaymentStatusForDisplay(order.shippingPaymentStatus)) ? commonT(normalizeShippingPaymentStatusForDisplay(order.shippingPaymentStatus)) : statusLabel[normalizeShippingPaymentStatusForDisplay(order.shippingPaymentStatus)] ?? normalizeShippingPaymentStatusForDisplay(order.shippingPaymentStatus)}
                hint={t("statusForm.shippingPaymentStatusHint")}
              />
              <ReadonlyField
                label={t("statusForm.shippingStatus")}
                value={commonT.has(order.shippingStatus) ? commonT(order.shippingStatus) : statusLabel[order.shippingStatus] ?? order.shippingStatus}
                hint={t("statusForm.shippingStatusHint")}
              />
              <SelectField name="riskStatus" label={t("statusForm.riskStatus")} value={order.riskStatus} options={riskStatusOptions} commonT={commonT} />
              <Can permission="orders.refund">
                <SelectField name="refundStatus" label={t("statusForm.refundStatus")} value={order.refundStatus} options={refundStatusOptions} commonT={commonT} />
              </Can>
              <FieldShell
                label={t("statusForm.assignee")}
                className="xl:col-span-2"
                control={
                  <select name="assigneeId" defaultValue={order.assigneeId ?? ""} className="admin-input w-full">
                    <option value="">{t("values.unassigned")}</option>
                    {admins.map((admin) => (
                      <option key={admin.id} value={admin.id}>
                        {admin.name ?? admin.email}
                      </option>
                    ))}
                  </select>
                }
                hint={t("statusForm.assigneeHint")}
              />
            </div>
          </div>

          <div>
            <div className="mb-2 text-[11px] font-black uppercase tracking-[0.1em] text-slate-400">{t("statusForm.amounts")}</div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <LabeledInput name="paidUsd" label={t("statusForm.paidUsd")} type="number" step="0.01" defaultValue={order.paidUsd.toString()} />
              <LabeledInput name="unpaidUsd" label={t("statusForm.unpaidUsd")} type="number" step="0.01" defaultValue={order.unpaidUsd.toString()} />
              <LabeledInput name="actualShippingUsd" label={t("statusForm.actualShippingUsd")} type="number" step="0.01" defaultValue={order.actualShippingUsd.toString()} />
              <LabeledInput name="domesticShippingUsd" label={t("statusForm.domesticShippingUsd")} type="number" step="0.01" defaultValue={order.domesticShippingUsd.toString()} />
              <LabeledInput name="valueAddedServicesUsd" label={t("statusForm.valueAddedServicesUsd")} type="number" step="0.01" defaultValue={order.valueAddedServicesUsd.toString()} />
              <LabeledInput name="discountUsd" label={t("statusForm.discountUsd")} type="number" step="0.01" defaultValue={order.discountUsd.toString()} />
              <Can permission="orders.refund">
                <LabeledInput name="refundUsd" label={t("statusForm.refundUsd")} type="number" step="0.01" defaultValue={order.refundUsd.toString()} />
              </Can>
            </div>
          </div>
        </div>
      </AdminSaveForm>
    </Can>
  );
}

function OrderAddressEditForm({
  order,
  address,
  t
}: {
  order: AdminOrderForForms;
  address: AddressSnapshot | null;
  t: Awaited<ReturnType<typeof getTranslations<"orders.ordersPage.detailPage">>>;
}) {
  const addressLabel = address?.label ?? t("values.shippingLabel");

  return (
    <AdminSaveForm
      key={buildOrderAddressFormKey(order, address)}
      action={updateOrderAddress}
      permission="orders.update"
      className="grid gap-3"
      submitLabel={t("addressForm.submit")}
    >
      <input type="hidden" name="orderId" value={order.id} />
      <input type="hidden" name="userId" value={order.userId} />
      <input type="hidden" name="addressId" value={order.addressId ?? ""} />
      <input type="hidden" name="label" value={addressLabel} />
      <div className="grid gap-3 md:grid-cols-2">
        <label className="grid gap-1 text-xs font-bold text-slate-600">
          {t("addressForm.addressLabel")}
          <div className="admin-input flex min-h-10 items-center bg-slate-50 text-slate-500">
            {addressLabel}
          </div>
        </label>
        <LabeledInput name="contactName" label={t("addressForm.fullName")} defaultValue={address?.contactName ?? ""} />
        <LabeledInput name="phone" label={t("addressForm.phoneNumber")} defaultValue={address?.phone ?? ""} />
        <AddressRegionFields
          defaultCountry={address?.country ?? "US"}
          defaultState={address?.state ?? ""}
          countryClassName="admin-input"
          stateClassName="admin-input"
          showLabels
        />
        <LabeledInput name="city" label={t("addressForm.city")} defaultValue={address?.city ?? ""} />
        <LabeledInput name="postalCode" label={t("addressForm.postcode")} defaultValue={address?.postalCode ?? ""} />
        <LabeledInput name="line1" label={t("addressForm.line1")} defaultValue={address?.line1 ?? ""} />
        <LabeledInput name="line2" label={t("addressForm.line2")} defaultValue={address?.line2 ?? ""} />
      </div>
    </AdminSaveForm>
  );
}

function OrderItemEditForm({
  orderId,
  item,
  t,
  commonT
}: {
  orderId: number;
  item: AdminOrderForForms["items"][number];
  t: Awaited<ReturnType<typeof getTranslations<"orders.ordersPage.detailPage">>>;
  commonT: Awaited<ReturnType<typeof getTranslations<"common.statuses">>>;
}) {
  return (
    <AdminSaveForm action={updateOrderItemDetails} permission="orders.update" className="rounded-xl border border-slate-200 bg-slate-50/70 p-3" submitLabel={t("itemForm.submit")}>
      <input type="hidden" name="orderId" value={orderId} />
      <input type="hidden" name="itemId" value={item.id} />
      <div className="grid gap-3 lg:grid-cols-[92px_minmax(0,1fr)]">
        <div className="relative size-20 overflow-hidden rounded-xl bg-white ring-1 ring-slate-200">
          <Image src={item.image} alt="" fill sizes="80px" className="object-cover" />
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <div className="md:col-span-2 xl:col-span-3">
            <LabeledInput name="title" label={t("itemForm.title")} defaultValue={item.title} />
          </div>
          <div className="md:col-span-2 xl:col-span-3">
            <LabeledInput name="sourceUrl" label={t("itemForm.sourceUrl")} defaultValue={item.sourceUrl} />
          </div>
          <LabeledInput name="platform" label={t("itemForm.platform")} defaultValue={item.platform} />
          <LabeledInput name="sourceItemId" label={t("itemForm.sourceItemId")} defaultValue={item.sourceItemId} />
          <LabeledInput name="image" label={t("itemForm.image")} defaultValue={item.image} />
          <LabeledInput name="skuId" label={t("itemForm.skuId")} defaultValue={item.skuId ?? ""} />
          <LabeledInput name="skuText" label={t("itemForm.skuText")} defaultValue={item.skuText ?? ""} />
          <label className="grid gap-1 text-xs font-bold text-slate-600">
            {t("itemForm.purchaseStatus")}
            <select name="purchaseStatus" defaultValue={item.purchaseStatus} className="admin-input">
              {purchaseStatusOptions.map((status) => (
                <option key={status} value={status}>
                  {commonT.has(status) ? commonT(status) : statusLabel[status] ?? status}
                </option>
              ))}
            </select>
          </label>
          <LabeledInput name="priceUsd" label={t("itemForm.priceUsd")} type="number" step="0.01" defaultValue={item.priceUsd.toString()} />
          <LabeledInput name="priceCny" label={t("itemForm.priceCny")} type="number" step="0.01" defaultValue={item.priceCny.toString()} />
          <LabeledInput name="quantity" label={t("itemForm.quantity")} type="number" step="1" defaultValue={String(item.quantity)} />
        </div>
      </div>
    </AdminSaveForm>
  );
}

function LabeledInput({
  name,
  label,
  defaultValue,
  type = "text",
  step
}: {
  name: string;
  label: string;
  defaultValue: string;
  type?: string;
  step?: string;
}) {
  return (
    <FieldShell
      label={label}
      control={<input name={name} type={type} step={step} defaultValue={defaultValue} className="admin-input w-full" />}
    />
  );
}

function SelectField<T extends readonly string[]>({
  name,
  label,
  value,
  options,
  commonT
}: {
  name: string;
  label: string;
  value: string;
  options: T;
  commonT: Awaited<ReturnType<typeof getTranslations<"common.statuses">>>;
}) {
  return (
    <FieldShell
      label={label}
      control={
        <select name={name} defaultValue={value} className="admin-input w-full">
          {options.map((option) => (
            <option key={option} value={option}>
              {commonT.has(option) ? commonT(option) : statusLabel[option] ?? option}
            </option>
          ))}
        </select>
      }
    />
  );
}

function ReadonlyField({ label, value, hint }: { label: string; value: React.ReactNode; hint?: string }) {
  return (
    <FieldShell
      label={label}
      hint={hint}
      control={
        <div className="flex min-h-11 w-full items-center rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700">
          {value || "-"}
        </div>
      }
    />
  );
}

function normalizeProductPaymentStatusForForm(value: string) {
  if (value === "paid" || value === "paid_product") return "paid";
  if (value === "failed") return "failed";
  if (value === "refund" || value === "refunded") return "refund";
  return "pending";
}

function normalizeShippingPaymentStatusForForm(value: string) {
  if (value === "paid" || value === "international_freight_paid") return "paid";
  if (value === "failed") return "failed";
  if (value === "refund" || value === "refunded") return "refund";
  return "pending";
}

function normalizeShippingPaymentStatusForDisplay(value: string) {
  if (value === "international_freight_paid") return "paid";
  if (value === "international_freight_pending") return "pending";
  return value;
}

function normalizePackageStatusForForm(value: string) {
  if (value === "waiting_shipping_payment") return "created";
  if (value === "shipping_paid") return "created";
  if (value === "none" || value === "pending" || value === "created" || value === "shipped" || value === "delivered" || value === "abnormal") {
    return value;
  }
  return "pending";
}

function detailPackageStatusLabel(value: string) {
  return normalizePackageStatusForForm(value);
}

function deriveOrderDetailState(order: {
  orderStatus: string;
  paymentStatus: string;
  purchaseStatus: string;
  warehouseStatus: string;
  packageStatus: string;
  shippingPaymentStatus: string;
  shippingStatus: string;
  riskStatus: string;
  refundStatus: string;
  qcSharedWithCustomer: boolean;
  qcCustomerConfirmed: boolean;
  packages?: Array<{ status: string }>;
}) {
  const latestPackageStatus = order.packages?.[0]?.status;
  const derivedPackageStatus = latestPackageStatus === "shipping_paid"
    ? "shipping_paid"
    : latestPackageStatus === "waiting_shipping_payment"
      ? "waiting_shipping_payment"
      : latestPackageStatus === "shipped"
        ? "shipped"
        : latestPackageStatus === "delivered"
          ? "delivered"
          : order.packageStatus;
  const derivedShippingPaymentStatus = latestPackageStatus === "shipping_paid" || latestPackageStatus === "shipped" || latestPackageStatus === "delivered"
    ? "international_freight_paid"
    : latestPackageStatus === "waiting_shipping_payment"
      ? "international_freight_pending"
      : order.shippingPaymentStatus;

  return {
    ...order,
    packageStatus: normalizePackageStatusForForm(derivedPackageStatus),
    shippingPaymentStatus: normalizeShippingPaymentStatusForForm(derivedShippingPaymentStatus),
    paymentStatus: normalizeProductPaymentStatusForForm(order.paymentStatus),
  };
}

function buildOrderStatusFormKey(order: {
  id: number;
  orderStatus: string;
  orderSource: string;
  paymentStatus: string;
  purchaseStatus: string;
  warehouseStatus: string;
  packageStatus: string;
  shippingPaymentStatus: string;
  shippingStatus: string;
  riskStatus: string;
  refundStatus: string;
  assigneeId: number | null;
  paidUsd: { toString(): string };
  unpaidUsd: { toString(): string };
  actualShippingUsd: { toString(): string };
  refundUsd: { toString(): string };
  domesticShippingUsd: { toString(): string };
  valueAddedServicesUsd: { toString(): string };
  discountUsd: { toString(): string };
}) {
  return JSON.stringify([
    order.id,
    order.orderStatus,
    order.orderSource,
    order.paymentStatus,
    order.purchaseStatus,
    order.warehouseStatus,
    order.packageStatus,
    order.shippingPaymentStatus,
    order.shippingStatus,
    order.riskStatus,
    order.refundStatus,
    order.assigneeId,
    order.paidUsd.toString(),
    order.unpaidUsd.toString(),
    order.actualShippingUsd.toString(),
    order.refundUsd.toString(),
    order.domesticShippingUsd.toString(),
    order.valueAddedServicesUsd.toString(),
    order.discountUsd.toString()
  ]);
}

function buildOrderAddressFormKey(
  order: { id: number; userId: number; addressId: number | null },
  address: AddressSnapshot | null
) {
  return JSON.stringify([
    order.id,
    order.userId,
    order.addressId,
    address?.label ?? "",
    address?.contactName ?? "",
    address?.phone ?? "",
    address?.country ?? "",
    address?.state ?? "",
    address?.city ?? "",
    address?.postalCode ?? "",
    address?.line1 ?? "",
    address?.line2 ?? ""
  ]);
}

function InfoGrid({ rows }: { rows: Array<[string, React.ReactNode]> }) {
  return (
    <dl className="grid gap-2 text-sm">
      {rows.map(([label, value]) => (
        <div key={label} className="grid grid-cols-[120px_1fr] gap-3 border-b border-slate-100 pb-2 last:border-0 last:pb-0">
          <dt className="text-xs font-bold text-slate-400">{label}</dt>
          <dd className="break-words font-semibold text-slate-700">{value || "-"}</dd>
        </div>
      ))}
    </dl>
  );
}

function DataRows({ rows, empty }: { rows: Array<{ id: string; title: string; meta: string }>; empty: string }) {
  if (!rows.length) return <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm font-semibold text-slate-500">{empty}</p>;
  return (
    <div className="space-y-2">
      {rows.map((row) => (
        <div key={row.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
          <div className="font-black text-slate-900">{row.title}</div>
          <div className="mt-1 break-words leading-6 text-slate-600">{row.meta}</div>
        </div>
      ))}
    </div>
  );
}

type AddressSnapshot = {
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

function addressSnapshot(value: unknown): AddressSnapshot | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as AddressSnapshot;
}

function formatAdminDateTime(value: Date) {
  return value.toLocaleString();
}

function localizedCountryName(countryCode: string | null | undefined, locale: string) {
  if (!countryCode) return "";
  try {
    return new Intl.DisplayNames([locale], { type: "region" }).of(countryCode.toUpperCase()) ?? countryName(countryCode);
  } catch {
    return countryName(countryCode);
  }
}

function translateStatusValue(
  value: string,
  commonT: Awaited<ReturnType<typeof getTranslations<"common.statuses">>>
) {
  return commonT.has(value) ? commonT(value) : statusLabel[value] ?? value;
}

function translatePaymentType(
  value: string,
  t: Awaited<ReturnType<typeof getTranslations<"orders.ordersPage.detailPage">>>
) {
  const paymentTypeMap: Record<string, string> = {
    product: t("paymentTypes.product"),
    shipping: t("paymentTypes.shipping"),
    pay_order: t("paymentTypes.payOrder"),
    pay_shipping: t("paymentTypes.payShipping"),
    wallet_recharge: t("paymentTypes.walletRecharge"),
    recharge: t("paymentTypes.walletRecharge"),
    refund: t("paymentTypes.refund")
  };
  return paymentTypeMap[value] ?? value;
}

function translateOrderLogAction(
  action: string,
  t: Awaited<ReturnType<typeof getTranslations<"orders.ordersPage.detailPage">>>,
  ordersT: Awaited<ReturnType<typeof getTranslations<"orders.ordersPage">>>
) {
  const actionMap: Record<string, string> = {
    order_created: t("logActions.orderCreated"),
    payment_paid: t("logActions.paymentPaid"),
    shipping_payment_paid: t("logActions.shippingPaymentPaid"),
    order_item_updated: t("logActions.orderItemUpdated"),
    order_workflow_action: t("logActions.orderWorkflowAction"),
    order_status_updated: t("logActions.orderStatusUpdated"),
    package_updated: t("logActions.packageUpdated"),
    order_qc_shared: t("logActions.orderQcShared"),
    order_qc_confirmed: t("logActions.orderQcConfirmed"),
    order_note_added: t("logActions.orderNoteAdded"),
    shipping_address_updated: t("logActions.shippingAddressUpdated"),
    refund_created: t("logActions.refundCreated"),
    order_moved_to_trash: t("logActions.orderMovedToTrash"),
    order_restored_from_trash: t("logActions.orderRestoredFromTrash"),
    bulk_order_update: t("logActions.bulkOrderUpdate"),
    payment_refunded: t("logActions.paymentRefunded")
  };

  if (actionMap[action]) return actionMap[action];
  if (commonActionLabel(action, ordersT)) return commonActionLabel(action, ordersT);
  return action;
}

function commonActionLabel(
  action: string,
  ordersT: Awaited<ReturnType<typeof getTranslations<"orders.ordersPage">>>
) {
  const rowActionMap: Record<string, string> = {
    mark_paid: ordersT("rowActions.markPaid"),
    send_payment_reminder: ordersT("rowActions.reminder"),
    approve_review: ordersT("rowActions.reviewOk"),
    mark_risk: ordersT("rowActions.risk"),
    start_purchase: ordersT("rowActions.startPurchase"),
    mark_purchased: ordersT("rowActions.purchased"),
    out_of_stock: ordersT("rowActions.outOfStock"),
    price_changed: ordersT("rowActions.priceChanged"),
    mark_received: ordersT("rowActions.received"),
    partial_received: ordersT("rowActions.partialReceived"),
    create_package: ordersT("rowActions.createPackage"),
    request_shipping_payment: ordersT("rowActions.shipFee"),
    ready_to_ship: ordersT("rowActions.shipPaid"),
    mark_shipped: ordersT("rowActions.shipped"),
    in_transit: ordersT("rowActions.inTransit"),
    complete: ordersT("rowActions.complete"),
    mark_abnormal: ordersT("rowActions.abnormal"),
    refund_pending: ordersT("rowActions.refundPending"),
    mark_refunded: ordersT("rowActions.markRefunded"),
    cancel: ordersT("rowActions.cancel")
  };

  return rowActionMap[action] ?? null;
}

function translateOrderLogDetail(
  action: string,
  detail: string | null,
  t: Awaited<ReturnType<typeof getTranslations<"orders.ordersPage.detailPage">>>,
  ordersT: Awaited<ReturnType<typeof getTranslations<"orders.ordersPage">>>,
  commonT: Awaited<ReturnType<typeof getTranslations<"common.statuses">>>
) {
  if (!detail) return "-";

  if (action === "order_status_updated" && detail.startsWith("Order workflow action: ")) {
    const workflowAction = detail.replace("Order workflow action: ", "");
    const actionLabel = commonActionLabel(workflowAction, ordersT);
    return actionLabel ? t("logDetails.orderWorkflowAction", { action: actionLabel }) : detail;
  }

  if (action === "order_workflow_action") {
    const workflowDetailMap: Record<string, string> = {
      "Marked product payment as paid": t("logDetails.markedProductPaymentPaid"),
      "Queued product payment reminder": t("logDetails.queuedProductPaymentReminder"),
      "Moved order into admin review": t("logDetails.movedOrderIntoAdminReview"),
      "Review approved, order ready for purchase": t("logDetails.reviewApprovedReadyForPurchase"),
      "Marked order for risk review": t("logDetails.markedOrderForRiskReview"),
      "Risk review rejected, refund pending": t("logDetails.riskReviewRejectedRefundPending"),
      "Started purchasing": t("logDetails.startedPurchasing"),
      "Marked purchased": t("logDetails.markedPurchased"),
      "Marked partially purchased": t("logDetails.markedPartiallyPurchased"),
      "Marked purchase failed": t("logDetails.markedPurchaseFailed"),
      "Marked out of stock": t("logDetails.markedOutOfStock"),
      "Marked price changed, difference pending": t("logDetails.markedPriceChangedDifferencePending"),
      "Marked warehouse received": t("logDetails.markedWarehouseReceived"),
      "Marked partially received": t("logDetails.markedPartiallyReceived"),
      "Marked warehouse abnormal": t("logDetails.markedWarehouseAbnormal"),
      "Requested international shipping payment": t("logDetails.requestedInternationalShippingPayment"),
      "Marked ready to ship": t("logDetails.markedReadyToShip"),
      "Marked shipped": t("logDetails.markedShipped"),
      "Marked package in transit": t("logDetails.markedPackageInTransit"),
      "Marked completed": t("logDetails.markedCompleted"),
      "Marked abnormal": t("logDetails.markedAbnormal"),
      "Marked refund pending": t("logDetails.markedRefundPending"),
      "Marked refunded": t("logDetails.markedRefunded"),
      "Cancelled order": t("logDetails.cancelledOrder")
    };

    if (workflowDetailMap[detail]) return workflowDetailMap[detail];
    if (detail.startsWith("Created package ")) {
      return t("logDetails.createdPackage", { packageNo: detail.replace("Created package ", "") });
    }
  }

  if (action === "payment_paid") {
    const matched = detail.match(/^(.+?) paid \$(\d+(?:\.\d+)?) \((.+)\)$/);
    if (matched) {
      const [, provider, amount, paymentNo] = matched;
      return t("logDetails.paymentPaid", { provider, amount, paymentNo });
    }
  }

  if (action === "order_created") {
    const matched = detail.match(/^Order (.+) created from checkout$/);
    if (matched) {
      const [, orderNo] = matched;
      return t("logDetails.orderCreatedFromCheckout", { orderNo });
    }
  }

  if (action === "shipping_payment_paid") {
    const matched = detail.match(/^(.+?) shipping paid \$(\d+(?:\.\d+)?) \((.+)\)$/);
    if (matched) {
      const [, provider, amount, paymentNo] = matched;
      return t("logDetails.shippingPaymentPaid", { provider, amount, paymentNo });
    }
  }

  if (action === "package_updated") {
    const matched = detail.match(/^Package (.+?) updated to ([a-z_]+)(?:, tracking (.+))?$/);
    if (matched) {
      const [, packageNo, status, trackingNumber] = matched;
      return trackingNumber
        ? t("logDetails.packageUpdatedWithTracking", {
            packageNo,
            status: translateStatusValue(status, commonT),
            trackingNumber
          })
        : t("logDetails.packageUpdated", {
            packageNo,
            status: translateStatusValue(status, commonT)
          });
    }
  }

  if (action === "order_qc_shared") {
    if (detail === "QC photos sent to customer by email") return t("logDetails.qcPhotosSentByEmail");
    if (detail === "QC photos sent to customer") return t("logDetails.qcPhotosSentToCustomer");
  }

  if (action === "order_qc_confirmed" && detail === "Customer confirmed QC photos") {
    return t("logDetails.customerConfirmedQcPhotos");
  }

  if (action === "order_item_updated" && detail.startsWith("Updated item #")) {
    const matched = detail.match(/^Updated item #(\d+): (.+)$/);
    if (matched) {
      const [, itemId, title] = matched;
      return t("logDetails.updatedItem", { itemId, title });
    }
  }

  if (action === "order_note_added") {
    const matched = detail.match(/^([a-z_]+): (.+)$/);
    if (matched) {
      const [, type, content] = matched;
      const noteType = commonT.has(type) ? commonT(type) : statusLabel[type] ?? type;
      return t("logDetails.orderNoteAdded", { type: noteType, content });
    }
  }

  if (action === "shipping_address_updated") {
    return t("logDetails.shippingAddressUpdated", { address: detail });
  }

  if (action === "order_moved_to_trash" && detail === "Order moved to trash") {
    return t("logDetails.orderMovedToTrash");
  }

  if (action === "order_restored_from_trash" && detail.startsWith("Order restored as ")) {
    const restoredStatus = detail.replace("Order restored as ", "");
    return t("logDetails.orderRestoredFromTrash", { status: translateStatusValue(restoredStatus, commonT) });
  }

  if (action === "payment_refunded") {
    const matched = detail.match(/^Admin refunded PayPal payment (\d+) \((.+)\)$/);
    if (matched) {
      const [, paymentId, amount] = matched;
      return t("logDetails.paymentRefunded", { paymentId, amount });
    }
  }

  return detail;
}

function buildOrderWorkflow(order: {
  orderStatus: string;
  paymentStatus: string;
  purchaseStatus: string;
  warehouseStatus: string;
  packageStatus: string;
  shippingPaymentStatus: string;
  shippingStatus: string;
  riskStatus: string;
  refundStatus: string;
  qcSharedWithCustomer: boolean;
  qcCustomerConfirmed: boolean;
}, t: Awaited<ReturnType<typeof getTranslations<"orders.ordersPage.detailPage">>>) {
  const detailState = deriveOrderDetailState(order);
  const normalStageKey = resolveNormalWorkflowStage(detailState);
  const afterSalesActive = isAfterSalesStage(detailState);
  const stageMeta = workflowStageMeta(t);
  const currentStage = stageMeta[normalStageKey];
  const action = resolveOperatorAction(detailState, currentStage.label, t);

  return {
    currentLabel: afterSalesActive ? t("workflowStages.after_sales.label") : currentStage.label,
    currentHint: afterSalesActive
      ? t("workflowActions.handleException.detail")
      : currentStage.hint,
    actionTitle: action.title,
    actionDetail: action.detail,
    steps: workflowStepOrder.map((key) => {
      const meta = stageMeta[key];
      if (key === "after_sales") {
        return {
          key,
          label: meta.label,
          hint: meta.hint,
          state: afterSalesActive ? "attention" : "pending"
        };
      }

      const stepIndex = workflowStepOrder.indexOf(key);
      const activeIndex = workflowStepOrder.indexOf(normalStageKey);

      return {
        key,
        label: meta.label,
        hint: meta.hint,
        state: stepIndex < activeIndex ? "done" : stepIndex === activeIndex ? "current" : "pending"
      };
    }),
    panel: {
      currentStage: t("workflowPanel.currentStage"),
      operatorNow: t("workflowPanel.operatorNow"),
      stepLabel: (index: number) => t("workflowPanel.step", { index }),
      done: t("workflowPanel.done"),
      current: t("workflowPanel.current"),
      attention: t("workflowPanel.attention"),
      pending: t("workflowPanel.pending")
    }
  } satisfies WorkflowSummary;
}

const workflowStepOrder = [
  "order_pending",
  "paid_product",
  "purchasing",
  "partial_purchased",
  "purchased",
  "warehouse_received",
  "freight_pending",
  "freight_paid",
  "customer_confirmed",
  "shipped",
  "completed",
  "after_sales"
] as const;

function workflowStageMeta(t: Awaited<ReturnType<typeof getTranslations<"orders.ordersPage.detailPage">>>): Record<(typeof workflowStepOrder)[number], { label: string; hint: string }> {
  return {
    order_pending: {
      label: t("workflowStages.order_pending.label"),
      hint: t("workflowStages.order_pending.hint")
    },
    paid_product: {
      label: t("workflowStages.paid_product.label"),
      hint: t("workflowStages.paid_product.hint")
    },
    purchasing: {
      label: t("workflowStages.purchasing.label"),
      hint: t("workflowStages.purchasing.hint")
    },
    partial_purchased: {
      label: t("workflowStages.partial_purchased.label"),
      hint: t("workflowStages.partial_purchased.hint")
    },
    purchased: {
      label: t("workflowStages.purchased.label"),
      hint: t("workflowStages.purchased.hint")
    },
    warehouse_received: {
      label: t("workflowStages.warehouse_received.label"),
      hint: t("workflowStages.warehouse_received.hint")
    },
    freight_pending: {
      label: t("workflowStages.freight_pending.label"),
      hint: t("workflowStages.freight_pending.hint")
    },
    freight_paid: {
      label: t("workflowStages.freight_paid.label"),
      hint: t("workflowStages.freight_paid.hint")
    },
    customer_confirmed: {
      label: t("workflowStages.customer_confirmed.label"),
      hint: t("workflowStages.customer_confirmed.hint")
    },
    shipped: {
      label: t("workflowStages.shipped.label"),
      hint: t("workflowStages.shipped.hint")
    },
    completed: {
      label: t("workflowStages.completed.label"),
      hint: t("workflowStages.completed.hint")
    },
    after_sales: {
      label: t("workflowStages.after_sales.label"),
      hint: t("workflowStages.after_sales.hint")
    }
  };
}

function resolveNormalWorkflowStage(order: {
  orderStatus: string;
  paymentStatus: string;
  purchaseStatus: string;
  warehouseStatus: string;
  packageStatus: string;
  shippingPaymentStatus: string;
  shippingStatus: string;
  qcCustomerConfirmed: boolean;
}) {
  if (order.orderStatus === "completed" || order.shippingStatus === "delivered") return "completed";
  if (["shipped", "in_transit", "customs_clearance", "delivery_attempted"].includes(order.shippingStatus)) return "shipped";
  if (order.qcCustomerConfirmed || order.shippingStatus === "ready_to_ship") return "customer_confirmed";
  if (order.paymentStatus !== "paid") return "order_pending";
  if (order.purchaseStatus === "pending") return "paid_product";
  if (order.purchaseStatus === "purchasing") return "purchasing";
  if (order.purchaseStatus === "partial_purchased") return "partial_purchased";
  if (order.purchaseStatus === "purchased" && order.warehouseStatus !== "received") return "purchased";
  if (order.warehouseStatus === "received") return "warehouse_received";
  if (order.shippingPaymentStatus === "pending" || order.packageStatus === "created" || order.orderStatus === "international_freight_pending") return "freight_pending";
  if (order.shippingPaymentStatus === "paid") return "freight_paid";
  return "paid_product";
}

function isAfterSalesStage(order: {
  orderStatus: string;
  paymentStatus: string;
  purchaseStatus: string;
  riskStatus: string;
  refundStatus: string;
}) {
  return (
    ["abnormal", "cancel", "refund", "order_after_sales", "cancelled", "refunded"].includes(order.orderStatus)
    || ["failed", "out_of_stock", "price_changed"].includes(order.purchaseStatus)
    || ["restricted", "rejected"].includes(order.riskStatus)
    || order.paymentStatus === "refund"
    || order.refundStatus !== "none"
  );
}

function resolveOperatorAction(
  order: {
    orderStatus: string;
    paymentStatus: string;
    purchaseStatus: string;
    warehouseStatus: string;
    packageStatus: string;
    shippingPaymentStatus: string;
    shippingStatus: string;
    riskStatus: string;
    refundStatus: string;
    qcSharedWithCustomer: boolean;
    qcCustomerConfirmed: boolean;
  },
  currentStageLabel: string,
  t: Awaited<ReturnType<typeof getTranslations<"orders.ordersPage.detailPage">>>
) {
  if (order.refundStatus === "pending") {
    return {
      title: t("workflowActions.refundPending.title"),
      detail: t("workflowActions.refundPending.detail")
    };
  }
  if (["partial_refunded", "refunded"].includes(order.refundStatus) || ["refund", "refunded"].includes(order.orderStatus)) {
    return {
      title: t("workflowActions.refundState.title"),
      detail: t("workflowActions.refundState.detail")
    };
  }
  if (["cancel", "cancelled"].includes(order.orderStatus)) {
    return {
      title: t("workflowActions.cancelFlow.title"),
      detail: t("workflowActions.cancelFlow.detail")
    };
  }
  if (order.riskStatus === "pending_review") {
    return {
      title: t("workflowActions.reviewBeforePurchase.title"),
      detail: t("workflowActions.reviewBeforePurchase.detail")
    };
  }
  if (["restricted", "rejected"].includes(order.riskStatus)) {
    return {
      title: t("workflowActions.riskException.title"),
      detail: t("workflowActions.riskException.detail")
    };
  }
  if (order.paymentStatus !== "paid") {
    return {
      title: t("workflowActions.collectProductPayment.title"),
      detail: t("workflowActions.collectProductPayment.detail")
    };
  }
  if (order.purchaseStatus === "pending") {
    return {
      title: t("workflowActions.startPurchasing.title"),
      detail: t("workflowActions.startPurchasing.detail")
    };
  }
  if (order.purchaseStatus === "purchasing") {
    return {
      title: t("workflowActions.continuePurchasing.title"),
      detail: t("workflowActions.continuePurchasing.detail")
    };
  }
  if (order.purchaseStatus === "partial_purchased") {
    return {
      title: t("workflowActions.finishRemainingSupplierItems.title"),
      detail: t("workflowActions.finishRemainingSupplierItems.detail")
    };
  }
  if (["failed", "out_of_stock", "price_changed"].includes(order.purchaseStatus) || ["abnormal", "order_after_sales"].includes(order.orderStatus)) {
    return {
      title: t("workflowActions.handleException.title"),
      detail: t("workflowActions.handleException.detail")
    };
  }
  if (order.purchaseStatus === "purchased" && order.warehouseStatus === "pending") {
    return {
      title: t("workflowActions.waitWarehouseInbound.title"),
      detail: t("workflowActions.waitWarehouseInbound.detail")
    };
  }
  if (order.warehouseStatus === "partial_received") {
    return {
      title: t("workflowActions.completeRemainingInbound.title"),
      detail: t("workflowActions.completeRemainingInbound.detail")
    };
  }
  if (order.warehouseStatus === "received" && ["none", "pending"].includes(order.packageStatus)) {
    return {
      title: t("workflowActions.createParcel.title"),
      detail: t("workflowActions.createParcel.detail")
    };
  }
  if (order.packageStatus === "created" && order.shippingPaymentStatus !== "pending") {
    return {
      title: t("workflowActions.uploadQcBeforeFreight.title"),
      detail: t("workflowActions.uploadQcBeforeFreight.detail")
    };
  }
  if (order.shippingPaymentStatus === "pending") {
    return {
      title: t("workflowActions.collectInternationalFreight.title"),
      detail: t("workflowActions.collectInternationalFreight.detail")
    };
  }
  if (!order.qcSharedWithCustomer) {
    return {
      title: t("workflowActions.sendQcPhotos.title"),
      detail: t("workflowActions.sendQcPhotos.detail")
    };
  }
  if (!order.qcCustomerConfirmed) {
    return {
      title: t("workflowActions.waitQcApproval.title"),
      detail: t("workflowActions.waitQcApproval.detail")
    };
  }
  if (order.shippingStatus === "ready_to_ship" || order.shippingPaymentStatus === "paid") {
    return {
      title: t("workflowActions.dispatchParcel.title"),
      detail: t("workflowActions.dispatchParcel.detail")
    };
  }
  if (order.shippingStatus === "shipped") {
    return {
      title: t("workflowActions.monitorLogistics.title"),
      detail: t("workflowActions.monitorLogistics.detail")
    };
  }
  if (["in_transit", "customs_clearance", "delivery_attempted"].includes(order.shippingStatus)) {
    return {
      title: t("workflowActions.watchDelivery.title"),
      detail: t("workflowActions.watchDelivery.detail")
    };
  }
  if (order.orderStatus === "completed" || order.shippingStatus === "delivered") {
    return {
      title: t("workflowActions.noImmediateAction.title"),
      detail: t("workflowActions.noImmediateAction.detail")
    };
  }

  return {
    title: t("workflowActions.reviewCurrentStage.title", { stage: currentStageLabel }),
    detail: t("workflowActions.reviewCurrentStage.detail")
  };
}

function workflowStepTone(state: WorkflowStepState) {
  if (state === "done") return "border-emerald-200 bg-emerald-50/80 text-emerald-800";
  if (state === "current") return "border-[#93c5fd] bg-[#eff6ff] text-[#1d4ed8] shadow-[0_0_0_1px_rgba(37,99,235,0.08)]";
  if (state === "attention") return "border-rose-200 bg-rose-50/80 text-rose-800";
  return "border-slate-200 bg-white text-slate-500";
}

function workflowStepStatusLabel(state: WorkflowStepState, panel: WorkflowSummary["panel"]) {
  if (state === "done") return panel.done;
  if (state === "current") return panel.current;
  if (state === "attention") return panel.attention;
  return panel.pending;
}
