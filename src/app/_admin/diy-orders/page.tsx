import Link from "next/link";
import { getTranslations } from "next-intl/server";
import type { InputHTMLAttributes, SelectHTMLAttributes } from "react";
import { AdminModal } from "@/components/admin/AdminModal";
import { AdminSaveForm } from "@/components/admin/AdminSaveForm";
import { AdminDataPageTable, type AdminDataTableRow } from "@/components/admin/modules/AdminDataPageTable";
import { StatusPill } from "@/components/ui/StatusPill";
import { money } from "@/lib/currency";
import { prisma } from "@/lib/db";
import { convertDiyOrderToOrder, deleteDiyOrder, permanentlyDeleteDiyOrder, restoreDiyOrder, updateDiyOrder } from "../actions";

const diyStatuses = ["submitted", "reviewing", "quoted", "converted_to_order", "rejected", "cancelled"];
const diyPurchaseStatuses = ["not_purchased", "purchasing", "purchased"];
const diyWarehouseStatuses = ["not_arrived", "arrived"];

type AdminDiyOrdersPageProps = {
  searchParams?: Promise<{
    view?: string;
  }>;
};

type TranslatorWithHas = {
  (key: string, values?: Record<string, string | number | Date>): string;
  has: (key: string) => boolean;
};

export default async function AdminDiyOrdersPage({ searchParams }: AdminDiyOrdersPageProps) {
  const t = await getTranslations("orders.diyOrdersPage");
  const commonT = await getTranslations("common.statuses");
  const params = await searchParams;
  const view = params?.view === "trash" ? "trash" : "active";
  const orders = await prisma.diyOrder.findMany({
    where: view === "trash" ? { status: "trash" } : { status: { not: "trash" } },
    include: {
      user: {
        include: {
          addresses: {
            orderBy: [{ isDefault: "desc" }, { updatedAt: "desc" }]
          }
        }
      }
    },
    orderBy: { createdAt: "desc" }
  });
  const tableRows: AdminDataTableRow[] = orders.map((order) => ({
    id: String(order.id),
    actionHref: `#diy-${order.id}`,
    cells: {
      request: (
        <div>
          <div className="max-w-[360px] truncate font-bold text-slate-900">{order.purchaseItemName || order.productName || order.productUrl}</div>
          <div className="max-w-[360px] truncate text-xs text-slate-400">{order.purchaseLink || order.productUrl}</div>
        </div>
      ),
      customer: order.user?.email ?? order.contactEmail,
      orderStatus: <StatusPill status={order.status} />,
      quoteStatus: <StatusPill status={order.quoteProvided ? "quoted" : "pending"} />,
      purchase: <StatusPill status={order.purchaseStatus} />,
      warehouse: <StatusPill status={order.warehouseStatus} />,
      cost: order.productCostUsd ? money(Number(order.productCostUsd)) : order.quoteUsd ? money(Number(order.quoteUsd)) : "-",
      freightService: (
        <div className="text-xs font-semibold text-slate-500">
          <div>{t("table.ship")} {order.shippingFeeUsd ? money(Number(order.shippingFeeUsd)) : t("detail.values.empty")}</div>
          <div>{t("table.fee")} {order.serviceFeeUsd ? money(Number(order.serviceFeeUsd)) : t("detail.values.empty")}</div>
        </div>
      ),
      date: (
        <div className="text-xs font-semibold text-slate-500">
          <div>{(order.purchaseDate ?? order.createdAt).toLocaleDateString()}</div>
          <div>{order.convertedOrderId ? t("table.orderNo", { id: order.convertedOrderId }) : t("table.notConverted")}</div>
        </div>
      )
    },
    searchValues: {
      request: [order.purchaseItemName, order.productName, order.productUrl, order.purchaseLink].filter(Boolean).join(" "),
      customer: order.user?.email ?? order.contactEmail ?? "",
      orderStatus: order.status,
      quoteStatus: order.quoteProvided ? "quoted" : "pending",
      purchase: order.purchaseStatus,
      warehouse: order.warehouseStatus,
      cost: order.productCostUsd?.toString() ?? order.quoteUsd?.toString() ?? "",
      freightService: [order.shippingFeeUsd?.toString(), order.serviceFeeUsd?.toString()].filter(Boolean).join(" "),
      date: (order.purchaseDate ?? order.createdAt).toISOString()
    }
  }));

  return (
    <section>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="admin-kicker">{t("kicker")}</div>
          <h1 className="admin-page-title mt-1">{t("title")}</h1>
          <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-500">
            {t("description")}
          </p>
        </div>
        <div className="text-sm font-semibold text-slate-500">{t("records", { count: orders.length })}</div>
      </div>

      <div className="mb-4 flex gap-2">
        <Link href="/admin/diy-orders" className={`admin-action px-4 ${view === "active" ? "border-[#465fff] text-[#465fff]" : ""}`}>{t("tabs.active")}</Link>
        <Link href="/admin/diy-orders?view=trash" className={`admin-action px-4 ${view === "trash" ? "border-[#465fff] text-[#465fff]" : ""}`}>{t("tabs.trash")}</Link>
      </div>

      <AdminDataPageTable
        columns={[
          { key: "request", label: t("table.request"), className: "min-w-[300px]" },
          { key: "customer", label: t("table.customer") },
          { key: "orderStatus", label: t("table.orderStatus") },
          { key: "quoteStatus", label: t("table.quote") },
          { key: "purchase", label: t("table.purchase") },
          { key: "warehouse", label: t("table.warehouse") },
          { key: "cost", label: t("table.cost") },
          { key: "freightService", label: t("table.freightService") },
          { key: "date", label: t("table.date") }
        ]}
        rows={tableRows}
        searchPlaceholder={t("search")}
      />

      {orders.map((order) => (
        <AdminModal key={order.id} id={`diy-${order.id}`} title={order.productName ?? t("modal.fallbackTitle")} description={order.contactEmail}>
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_420px]">
            <div className="space-y-4">
              <div className="admin-card p-4">
                <h3 className="font-black text-slate-900">{t("detail.customerRequestTitle")}</h3>
                <dl className="mt-4 grid gap-3 text-sm">
                  <Detail label={t("detail.fields.createdAt")} value={order.createdAt.toLocaleString()} />
                  <Detail label={t("detail.fields.productUrl")} value={order.productUrl} link />
                  <Detail label={t("detail.fields.requestedItem")} value={order.productName || t("detail.values.empty")} />
                  <Detail label={t("detail.fields.specification")} value={order.specification || t("detail.values.empty")} />
                  <Detail label={t("detail.fields.quantity")} value={String(order.quantity)} />
                  <Detail label={t("detail.fields.budget")} value={order.budgetUsd ? money(Number(order.budgetUsd)) : t("detail.values.na")} />
                  <Detail label={t("detail.fields.quoteProvided")} value={order.quoteProvided ? t("detail.values.yes") : t("detail.values.no")} />
                  <Detail label={t("detail.fields.customerQuoteFeedback")} value={order.customerQuoteFeedback || t("detail.values.empty")} pre />
                  <Detail label={t("detail.fields.buyerNote")} value={order.note || t("detail.values.empty")} pre />
                  <Detail
                    label={t("detail.fields.convertedOrder")}
                    value={order.convertedOrderId ? `/admin/orders/${order.convertedOrderId}` : t("detail.values.empty")}
                    link={Boolean(order.convertedOrderId)}
                  />
                </dl>
              </div>

              <div className="admin-card p-4">
                <h3 className="font-black text-slate-900">{t("detail.purchasingSnapshotTitle")}</h3>
                <div className="mt-4 grid gap-3 text-sm md:grid-cols-2">
                  <Detail label={t("detail.fields.purchaseItem")} value={order.purchaseItemName || order.productName || t("detail.values.empty")} />
                  <Detail label={t("detail.fields.size")} value={order.purchaseSize || order.specification || t("detail.values.empty")} />
                  <Detail label={t("detail.fields.weight")} value={order.purchaseWeightKg ? t("detail.values.kg", { value: order.purchaseWeightKg.toString() }) : t("detail.values.empty")} />
                  <Detail label={t("detail.fields.productCost")} value={order.productCostUsd ? money(Number(order.productCostUsd)) : t("detail.values.empty")} />
                  <Detail label={t("detail.fields.purchaseStatus")} value={translateStatus(commonT, order.purchaseStatus)} />
                  <Detail label={t("detail.fields.warehouseStatus")} value={translateStatus(commonT, order.warehouseStatus)} />
                  <Detail label={t("detail.fields.purchaseLink")} value={order.purchaseLink || t("detail.values.empty")} link={Boolean(order.purchaseLink)} />
                  <Detail label={t("detail.fields.shippingService")} value={`${order.shippingFeeUsd ? money(Number(order.shippingFeeUsd)) : t("detail.values.empty")} / ${order.serviceFeeUsd ? money(Number(order.serviceFeeUsd)) : t("detail.values.empty")}`} />
                </div>
              </div>
            </div>

            <AdminSaveForm action={updateDiyOrder} className="admin-card grid h-fit gap-3 p-4" submitLabel={t("form.submit")}>
              <input type="hidden" name="id" value={order.id} />
              <div className="grid gap-3 md:grid-cols-2">
                <LabeledSelect name="status" label={t("form.status")} defaultValue={order.status} options={diyStatuses} translator={commonT} />
                <LabeledInput name="quoteUsd" label={t("form.quoteUsd")} type="number" step="0.01" defaultValue={order.quoteUsd?.toString() ?? ""} />
              </div>
              <label className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-3 text-sm font-semibold text-slate-600">
                <input type="checkbox" name="quoteProvided" defaultChecked={order.quoteProvided} />
                {t("form.quoteProvided")}
              </label>
              <label className="grid gap-1 text-sm font-semibold text-slate-600">
                {t("form.customerFeedback")}
                <textarea
                  name="customerQuoteFeedback"
                  defaultValue={order.customerQuoteFeedback ?? ""}
                  placeholder={t("form.customerFeedbackPlaceholder")}
                  className="admin-input min-h-24"
                />
              </label>

              <div className="mt-2 border-t border-slate-200 pt-4">
                <div className="text-xs font-black uppercase text-slate-500">{t("form.purchasingSection")}</div>
                <div className="mt-3 grid gap-3">
                  <LabeledInput name="purchaseDate" label={t("form.purchaseDate")} type="date" defaultValue={order.purchaseDate ? toDateInput(order.purchaseDate) : ""} />
                  <LabeledInput name="purchaseItemName" label={t("form.purchaseItemName")} defaultValue={order.purchaseItemName ?? order.productName ?? ""} />
                  <LabeledInput name="purchaseSize" label={t("form.purchaseSize")} defaultValue={order.purchaseSize ?? order.specification ?? ""} />
                  <div className="grid gap-3 md:grid-cols-2">
                    <LabeledInput name="purchaseWeightKg" label={t("form.purchaseWeightKg")} type="number" step="0.001" defaultValue={order.purchaseWeightKg?.toString() ?? ""} />
                    <LabeledInput name="productCostUsd" label={t("form.productCostUsd")} type="number" step="0.01" defaultValue={order.productCostUsd?.toString() ?? ""} />
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <LabeledSelect name="purchaseStatus" label={t("form.purchaseStatus")} defaultValue={order.purchaseStatus} options={diyPurchaseStatuses} translator={commonT} />
                    <LabeledSelect name="warehouseStatus" label={t("form.warehouseStatus")} defaultValue={order.warehouseStatus} options={diyWarehouseStatuses} translator={commonT} />
                  </div>
                  <LabeledInput name="purchaseLink" label={t("form.purchaseLink")} type="url" defaultValue={order.purchaseLink ?? ""} />
                  <div className="grid gap-3 md:grid-cols-2">
                    <LabeledInput name="shippingFeeUsd" label={t("form.shippingFeeUsd")} type="number" step="0.01" defaultValue={order.shippingFeeUsd?.toString() ?? ""} />
                    <LabeledInput name="serviceFeeUsd" label={t("form.serviceFeeUsd")} type="number" step="0.01" defaultValue={order.serviceFeeUsd?.toString() ?? ""} />
                  </div>
                </div>
              </div>

              <label className="grid gap-1 text-sm font-semibold text-slate-600">
                {t("form.adminNote")}
                <textarea name="adminNote" defaultValue={order.adminNote ?? ""} placeholder={t("form.adminNotePlaceholder")} className="admin-input min-h-28" />
              </label>
            </AdminSaveForm>

            <div className="admin-card grid h-fit gap-3 p-4">
              <div>
                <h3 className="font-black text-slate-900">{t("convert.title")}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {t("convert.description")}
                </p>
              </div>
              {order.convertedOrderId ? (
                <a href={`/admin/orders/${order.convertedOrderId}`} className="admin-primary text-center">
                  {t("convert.openConvertedOrder")}
                </a>
              ) : (
                <AdminSaveForm action={convertDiyOrderToOrder} className="grid gap-3" submitLabel={t("convert.submit")}>
                  <input type="hidden" name="id" value={order.id} />
                  <label className="grid gap-1 text-sm font-semibold text-slate-600">
                    {t("convert.addressLabel")}
                    <select name="addressId" className="admin-input" defaultValue={order.user?.addresses[0]?.id ?? ""}>
                      {order.user?.addresses.length ? (
                        order.user.addresses.map((address) => (
                          <option key={address.id} value={address.id}>
                            {address.contactName} · {address.country} · {address.city} · {address.line1}
                          </option>
                        ))
                      ) : (
                        <option value="">{t("convert.noSavedAddress")}</option>
                      )}
                    </select>
                  </label>
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-semibold leading-5 text-amber-900">
                    {t("convert.requirements")}
                  </div>
                </AdminSaveForm>
              )}
            </div>

            <div className="admin-card grid h-fit gap-3 p-4">
              <div>
                <h3 className="font-black text-slate-900">{order.status === "trash" ? t("trash.titleTrash") : t("trash.titleActive")}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {order.status === "trash" ? t("trash.descriptionTrash") : t("trash.descriptionActive")}
                </p>
              </div>
              {order.status === "trash" ? (
                <div className="grid gap-3">
                  <AdminSaveForm action={restoreDiyOrder} className="grid gap-3" submitLabel={t("trash.restoreSubmit")} confirmationText={t("trash.restoreConfirm")}>
                    <input type="hidden" name="id" value={order.id} />
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold leading-5 text-emerald-900">
                      {t("trash.restoreNotice")}
                    </div>
                  </AdminSaveForm>
                  <AdminSaveForm action={permanentlyDeleteDiyOrder} className="grid gap-3" submitLabel={t("trash.deleteForeverSubmit")} confirmationText={t("trash.deleteForeverConfirm")}>
                    <input type="hidden" name="id" value={order.id} />
                    <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold leading-5 text-rose-900">
                      {t("trash.deleteForeverNotice")}
                    </div>
                  </AdminSaveForm>
                </div>
              ) : (
                <AdminSaveForm action={deleteDiyOrder} className="grid gap-3" submitLabel={t("trash.moveToTrashSubmit")} confirmationText={t("trash.moveToTrashConfirm")}>
                  <input type="hidden" name="id" value={order.id} />
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-semibold leading-5 text-amber-900">
                    {t("trash.moveToTrashNotice")}
                  </div>
                </AdminSaveForm>
              )}
            </div>
          </div>
        </AdminModal>
      ))}
    </section>
  );
}

function LabeledInput({ label, ...props }: InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="grid gap-1 text-sm font-semibold text-slate-600">
      {label}
      <input {...props} className="admin-input" />
    </label>
  );
}

function LabeledSelect({
  label,
  options,
  translator,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  options: string[];
  translator?: TranslatorWithHas;
}) {
  return (
    <label className="grid gap-1 text-sm font-semibold text-slate-600">
      {label}
      <select {...props} className="admin-input">
        {options.map((status) => <option key={status} value={status}>{translator ? translateStatus(translator, status) : status.replaceAll("_", " ")}</option>)}
      </select>
    </label>
  );
}

function Detail({ label, value, link = false, pre = false }: { label: string; value: string; link?: boolean; pre?: boolean }) {
  return (
    <div>
      <dt className="font-bold text-slate-500">{label}</dt>
      <dd className={`mt-1 break-words text-slate-900 ${pre ? "whitespace-pre-wrap" : ""}`}>
        {link && value !== "-" ? <a href={value} target="_blank" rel="noreferrer" className="text-[#2563eb] hover:underline">{value}</a> : value}
      </dd>
    </div>
  );
}

function toDateInput(date: Date) {
  return date.toISOString().slice(0, 10);
}

function translateStatus(t: TranslatorWithHas, status?: string | null) {
  const value = status || "none";
  return t.has(value) ? t(value) : value.replaceAll("_", " ");
}
