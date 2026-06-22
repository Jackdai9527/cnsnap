"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { getTranslations } from "next-intl/server";
import Papa from "papaparse";
import { prisma } from "@/lib/db";
import {
  orderPackageStatusOptions,
  orderStatusOptions,
  orderSourceOptions,
  packageStatuses,
  paymentStatusOptions,
  purchaseStatusOptions,
  refundStatusOptions,
  riskStatusOptions,
  shippingPaymentStatusOptions,
  shippingStatusOptions,
  warehouseStatusOptions
} from "@/lib/constants";
import { requirePermission } from "@/lib/admin-session";
import { getCurrentUser } from "@/lib/session";
import { isAdminRole } from "@/lib/auth/permissions";
import { adjustWallet } from "@/modules/wallet/service";
import { dgeubNotesHtml, dgeubRates, dgeubSupportedCountries } from "@/lib/dgeub-rates";
import { refreshExchangeRates } from "@/lib/exchange-rates";
import { normalizeSensitiveKeywords } from "@/lib/risk-control";
import { getPricingSettings, money, roundMoney } from "@/lib/currency";
import { countryName } from "@/lib/countries";
import { detectPlatformFromUrl, extractSourceItemId } from "@/lib/source-url";
import { upsertProductCacheFromNormalizedProduct } from "@/lib/storefront-products";
import { auditSnapshot, createAuditLog } from "@/lib/audit-log";
import { sendOrderPaidEmail, sendOrderQcEmail, sendShippingPaymentRequestEmail } from "@/lib/order-email";
import {
  applyManualOrderStatusDerivations,
  normalizeEditablePackageStatus,
  normalizeEditableProductPaymentStatus,
  normalizeEditableShippingPaymentStatus,
  packageStatusToOrderData,
  syncOrderDataForProductPayment,
  syncOrderDataForShippingPayment,
  syncOrderDataFromManualInputs,
  syncOrderFromPackage
} from "@/lib/order-status-sync";
import { refundPayPalPayment } from "@/modules/payment/paypal";
import { generateReferralCode } from "@/lib/referral";
import { oneBoundClient } from "@/integrations/onebound/client";
import { saveFooterContentBlocksFromFormData } from "@/lib/frontend-content-blocks";
import { ensureHelpArticleDescriptions, ensurePageDescriptions } from "@/lib/content-localization";
import { getEnabledFrontendLocaleConfigsRuntime } from "@/lib/i18n/locale-config-store";

function readEnumValue<T extends readonly string[]>(formData: FormData, key: string, options: T, fallback: T[number]) {
  const value = String(formData.get(key) || fallback);
  if (!options.includes(value)) throw new Error(`Invalid ${key}`);
  return value as T[number];
}

function readProductPaymentStatusValue(formData: FormData, key: string) {
  const value = String(formData.get(key) || "pending");
  if (value === "pending" || value === "paid" || value === "failed" || value === "refund") return value;
  if (paymentStatusOptions.includes(value as (typeof paymentStatusOptions)[number])) {
    return value as (typeof paymentStatusOptions)[number];
  }
  throw new Error(`Invalid ${key}`);
}

function readShippingPaymentStatusValue(formData: FormData, key: string) {
  const value = String(formData.get(key) || "pending");
  if (value === "pending" || value === "paid" || value === "failed" || value === "refund") return value;
  if (shippingPaymentStatusOptions.includes(value as (typeof shippingPaymentStatusOptions)[number])) {
    return value as (typeof shippingPaymentStatusOptions)[number];
  }
  throw new Error(`Invalid ${key}`);
}

function revalidateOrderAdminPaths() {
  revalidatePath("/admin/orders");
  revalidatePath("/admin/order-logs");
  revalidatePath("/admin/warehouse/inbound");
  revalidatePath("/admin/packages");
  revalidatePath("/admin/packages/shipping-records");
  revalidatePath("/admin");
}

function revalidateOrderDetailPaths(orderId: number) {
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath(`/account/orders/${orderId}`);
}

function revalidateFinanceAdminPaths() {
  revalidatePath("/admin/wallet");
  revalidatePath("/admin/finance/payments");
  revalidatePath("/admin/finance/wallet-transactions");
  revalidatePath("/admin/finance/recharges");
  revalidatePath("/admin/finance/refunds");
  revalidatePath("/admin");
}

function revalidateSettingAdminPaths() {
  [
    "/admin/settings",
    "/admin/settings/general",
    "/admin/settings/api",
    "/admin/settings/smtp",
    "/admin/settings/currencies",
    "/admin/finance/payments",
    "/admin/finance/exchange-rate",
    "/admin/finance/service-fees",
    "/admin/marketing/affiliate-settings",
    "/admin/auth",
    "/admin/footer"
  ].forEach((path) => revalidatePath(path));
  revalidatePath("/", "layout");
}

async function getLogRetentionDays(key: "operation_log_retention_days" | "api_log_retention_days") {
  const setting = await prisma.setting.findUnique({ where: { key } }).catch(() => null);
  const days = Number(setting?.value || 7);
  return Number.isFinite(days) && days > 0 ? days : 7;
}

export async function clearOperationLogs() {
  await requirePermission("settings.manage");
  await prisma.operationLog.deleteMany({});
  revalidatePath("/admin/order-logs");
  revalidatePath("/admin/settings/operation-logs");
  return { message: "Operation logs cleared." };
}

export async function clearApiLogs() {
  await requirePermission("settings.manage");
  await prisma.apiLog.deleteMany({});
  revalidatePath("/admin/products/api-logs");
  return { message: "API logs cleared." };
}

export async function updateOperationLogRetention(formData: FormData) {
  await requirePermission("settings.manage");
  const days = Math.max(1, Number(formData.get("days") || 7));
  await prisma.setting.upsert({
    where: { key: "operation_log_retention_days" },
    update: { value: String(days), label: "Operation Log Retention Days" },
    create: { key: "operation_log_retention_days", value: String(days), label: "Operation Log Retention Days" }
  });
  revalidatePath("/admin/order-logs");
  revalidatePath("/admin/settings/operation-logs");
  return { message: `Operation logs retention set to ${days} day${days > 1 ? "s" : ""}.` };
}

export async function updateApiLogRetention(formData: FormData) {
  await requirePermission("settings.manage");
  const days = Math.max(1, Number(formData.get("days") || 7));
  await prisma.setting.upsert({
    where: { key: "api_log_retention_days" },
    update: { value: String(days), label: "API Log Retention Days" },
    create: { key: "api_log_retention_days", value: String(days), label: "API Log Retention Days" }
  });
  revalidatePath("/admin/products/api-logs");
  return { message: `API logs retention set to ${days} day${days > 1 ? "s" : ""}.` };
}

function includesRefundMutation(formData: FormData) {
  return formData.has("refundStatus") || formData.has("refundUsd");
}

function isRefundWorkflowActionValue(action: string) {
  return ["refund_pending", "mark_refunded"].includes(action);
}

async function requireSettingsBatchPermission(formData: FormData) {
  const keys = formData.getAll("settingKey").map((value) => String(value));
  if (keys.some((key) => key.startsWith("onlypay_") || key.startsWith("paypal_") || key.startsWith("sepa_"))) {
    return requirePermission("payments.update");
  }
  if (keys.some((key) => key.startsWith("footer_"))) {
    return requirePermission("footer.manage");
  }
  if (keys.some((key) => key.startsWith("affiliate_"))) {
    return requirePermission("affiliate.manage");
  }
  return requirePermission("settings.manage");
}

function containsFooterContentBlockPayload(formData: FormData) {
  return formData.getAll("settingKey").some((value) => String(value) === "__footer_content_blocks__");
}

function revalidateShippingAdminPaths() {
  revalidatePath("/admin/shipping");
  revalidatePath("/admin/shipping/channels");
  revalidatePath("/admin/shipping/countries");
  revalidatePath("/admin/shipping/rate-rules");
  revalidatePath("/admin/shipping/restrictions");
  revalidatePath("/admin/shipping/calculator");
  revalidatePath("/shipping-calculator");
}

function revalidateValueAddedServicePaths() {
  revalidatePath("/admin/products/value-added-services");
  revalidatePath("/cart");
  revalidatePath("/checkout");
}

function revalidateStorefrontProductPaths() {
  revalidatePath("/admin/products/library");
  revalidatePath("/admin/products/import");
  revalidatePath("/admin/products/cache");
  revalidatePath("/");
  revalidatePath("/search");
}

function deriveOrderPurchaseStatusFromItems(
  itemStatuses: string[]
): {
  purchaseStatus: string;
  orderStatus?: string;
  status?: string;
  purchasedAt?: Date;
} {
  if (!itemStatuses.length) {
    return { purchaseStatus: "pending" };
  }

  const normalized = itemStatuses.map((status) => String(status || "pending"));
  const unique = new Set(normalized);

  if (unique.has("failed")) {
    return { purchaseStatus: "failed", orderStatus: "abnormal", status: "abnormal" };
  }
  if (unique.has("out_of_stock")) {
    return { purchaseStatus: "out_of_stock", orderStatus: "abnormal", status: "abnormal" };
  }
  if (unique.has("price_changed")) {
    return { purchaseStatus: "price_changed", orderStatus: "abnormal", status: "abnormal" };
  }

  const allPurchased = normalized.every((status) => status === "purchased");
  if (allPurchased) {
    return { purchaseStatus: "purchased", orderStatus: "purchased", status: "purchased", purchasedAt: new Date() };
  }

  const allPending = normalized.every((status) => status === "pending");
  if (allPending) {
    return { purchaseStatus: "pending", orderStatus: "paid_product", status: "paid" };
  }

  const hasPurchased = normalized.some((status) => status === "purchased");
  const hasPurchasing = normalized.some((status) => status === "purchasing");

  if (hasPurchasing && !hasPurchased) {
    return { purchaseStatus: "purchasing", orderStatus: "purchasing", status: "purchasing" };
  }

  if (hasPurchased) {
    return { purchaseStatus: "partial_purchased", orderStatus: "partial_purchased", status: "purchasing" };
  }

  return { purchaseStatus: "pending" };
}

const workflowActions = [
  "mark_paid",
  "send_payment_reminder",
  "start_review",
  "approve_review",
  "mark_risk",
  "reject_risk",
  "start_purchase",
  "mark_purchased",
  "partial_purchased",
  "purchase_failed",
  "out_of_stock",
  "price_changed",
  "mark_received",
  "partial_received",
  "warehouse_abnormal",
  "create_package",
  "request_shipping_payment",
  "ready_to_ship",
  "mark_shipped",
  "in_transit",
  "complete",
  "mark_abnormal",
  "refund_pending",
  "mark_refunded",
  "cancel"
] as const;

type WorkflowAction = (typeof workflowActions)[number];
type WorkflowData = Record<string, string | number | Date | null | undefined>;
const orderStatusLogFields = [
  "status",
  "orderStatus",
  "paymentStatus",
  "purchaseStatus",
  "warehouseStatus",
  "packageStatus",
  "shippingPaymentStatus",
  "shippingStatus",
  "riskStatus",
  "refundStatus",
  "qcSharedWithCustomer",
  "qcCustomerConfirmed"
] as const;
const orderAmountLogFields = [
  "paidUsd",
  "unpaidUsd",
  "refundUsd",
  "actualShippingUsd",
  "discountUsd",
  "domesticShippingUsd",
  "valueAddedServicesUsd"
] as const;

type OrderStatusLogField = (typeof orderStatusLogFields)[number];
type OrderAmountLogField = (typeof orderAmountLogFields)[number];

function isWorkflowAction(value: string): value is WorkflowAction {
  return workflowActions.includes(value as WorkflowAction);
}

function pickStatusChanges(data: WorkflowData) {
  return Object.fromEntries(
    orderStatusLogFields
      .filter((field) => data[field] !== undefined)
      .map((field) => [field, data[field]])
  ) as Partial<Record<OrderStatusLogField, string | number | Date | null>>;
}

function pickAmountChanges(data: WorkflowData) {
  return Object.fromEntries(
    orderAmountLogFields
      .filter((field) => data[field] !== undefined)
      .map((field) => [field, data[field]])
  ) as Partial<Record<OrderAmountLogField, string | number | Date | null>>;
}

function settingsAuditAction(keys: string[]) {
  if (keys.some((key) => key.startsWith("smtp_"))) return "smtp_settings_updated";
  if (keys.some((key) => key.startsWith("onebound_") || key.includes("api"))) return "api_settings_updated";
  return "settings_updated";
}

function packageNoForOrder(orderId: number, now: Date) {
  const date = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  return `PK${date}${String(orderId).padStart(6, "0")}${String(now.getTime()).slice(-4)}`;
}

function orderNoForAdmin(now: Date) {
  const date = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  return `HT${date}${String(now.getTime()).slice(-5)}`;
}

function paymentNoForAdmin(now: Date) {
  return `PAY${now.getTime()}${Math.floor(Math.random() * 9000 + 1000)}`;
}

function deriveConvertedDiyOrderStatus(diyOrder: {
  purchaseStatus: string;
  warehouseStatus: string;
}) {
  if (diyOrder.warehouseStatus === "arrived") return "warehouse_received";
  if (diyOrder.purchaseStatus === "purchased") return "purchased";
  if (diyOrder.purchaseStatus === "purchasing") return "purchasing";
  return "paid_product";
}

async function ensurePackageForOrder(orderId: number, now: Date) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true, packages: { orderBy: { createdAt: "asc" } } }
  });
  if (!order) throw new Error("Order not found");

  const existing = order.packages[0];
  if (existing) {
    return prisma.package.update({
      where: { id: existing.id },
      data: { status: "created" }
    });
  }

  return prisma.package.create({
    data: {
      packageNo: packageNoForOrder(order.id, now),
      userId: order.userId,
      orderId: order.id,
      status: "created",
      weightKg: 0.5,
      shippingFeeUsd: 0,
      items: {
        create: order.items.map((item) => ({
          orderItemId: item.id,
          quantity: item.quantity
        }))
      }
    }
  });
}

async function applyOrderWorkflowAction(id: number, action: WorkflowAction, actorId?: number, now = new Date()) {
  const data: WorkflowData = {};
  let detail: string = action;
  let shouldSendOrderPaidEmail = false;
  let shouldSyncFromPackage = false;
  let shouldDeriveFromIntent = false;

  if (action === "mark_paid") {
    const order = await prisma.order.findUnique({ where: { id } });
    const nextPayment = syncOrderDataForProductPayment({
      amountPaidUsd: Number(order?.totalUsd ?? 0),
      totalUsd: Number(order?.totalUsd ?? 0),
      previousPaidUsd: 0
    });
    data.paymentStatus = nextPayment.paymentStatus;
    data.orderStatus = "paid_product";
    data.status = "paid";
    data.paidUsd = nextPayment.paidUsd;
    data.unpaidUsd = nextPayment.unpaidUsd;
    data.paidAt = now;
    detail = "Marked product payment as paid";
    shouldSendOrderPaidEmail = order?.paymentStatus !== "paid";
  }
  if (action === "send_payment_reminder") {
    const order = await prisma.order.findUnique({ where: { id }, include: { user: true } });
    if (order) {
      await prisma.emailLog.create({
        data: {
          to: order.user.email,
          subject: `Payment reminder for ${order.orderNo}`,
          template: "order_payment_reminder",
          status: "queued"
        }
      });
    }
    detail = "Queued product payment reminder";
  }
  if (action === "start_review") {
    data.riskStatus = "pending_review";
    shouldDeriveFromIntent = true;
    detail = "Moved order into admin review";
  }
  if (action === "approve_review") {
    data.riskStatus = "normal";
    data.purchaseStatus = "pending";
    shouldDeriveFromIntent = true;
    detail = "Review approved, order ready for purchase";
  }
  if (action === "mark_risk") {
    data.riskStatus = "pending_review";
    shouldDeriveFromIntent = true;
    detail = "Marked order for risk review";
  }
  if (action === "reject_risk") {
    data.riskStatus = "rejected";
    data.refundStatus = "pending";
    data.cancelledAt = now;
    shouldDeriveFromIntent = true;
    detail = "Risk review rejected, refund pending";
  }
  if (action === "start_purchase") {
    data.purchaseStatus = "purchasing";
    shouldDeriveFromIntent = true;
    detail = "Started purchasing";
  }
  if (action === "mark_purchased") {
    data.purchaseStatus = "purchased";
    data.warehouseStatus = "pending";
    data.purchasedAt = now;
    shouldDeriveFromIntent = true;
    detail = "Marked purchased";
  }
  if (action === "partial_purchased") {
    data.purchaseStatus = "partial_purchased";
    shouldDeriveFromIntent = true;
    detail = "Marked partially purchased";
  }
  if (action === "purchase_failed") {
    data.purchaseStatus = "failed";
    shouldDeriveFromIntent = true;
    detail = "Marked purchase failed";
  }
  if (action === "out_of_stock") {
    data.purchaseStatus = "out_of_stock";
    shouldDeriveFromIntent = true;
    detail = "Marked out of stock";
  }
  if (action === "price_changed") {
    data.purchaseStatus = "price_changed";
    data.paymentStatus = "difference_pending";
    shouldDeriveFromIntent = true;
    detail = "Marked price changed, difference pending";
  }
  if (action === "mark_received") {
    data.warehouseStatus = "received";
    data.warehouseReceivedAt = now;
    shouldDeriveFromIntent = true;
    detail = "Marked warehouse received";
  }
  if (action === "partial_received") {
    data.warehouseStatus = "partial_received";
    shouldDeriveFromIntent = true;
    detail = "Marked partially received";
  }
  if (action === "warehouse_abnormal") {
    data.warehouseStatus = "abnormal";
    shouldDeriveFromIntent = true;
    detail = "Marked warehouse abnormal";
  }
  if (action === "create_package") {
    const packageRecord = await ensurePackageForOrder(id, now);
    Object.assign(data, packageStatusToOrderData(packageRecord.status));
    detail = `Created package ${packageRecord.packageNo}`;
  }
  if (action === "request_shipping_payment") {
    const order = await prisma.order.findUnique({
      where: { id },
      select: {
        actualShippingUsd: true
      }
    });
    if (!order || Number(order.actualShippingUsd) <= 0) {
      throw new Error("Set the international freight amount before requesting shipping payment.");
    }
    await prisma.package.updateMany({ where: { orderId: id }, data: { status: "waiting_shipping_payment" } });
    shouldSyncFromPackage = true;
    detail = "Requested international shipping payment";
  }
  if (action === "ready_to_ship") {
    await prisma.package.updateMany({ where: { orderId: id }, data: { status: "shipping_paid" } });
    shouldSyncFromPackage = true;
    detail = "Marked ready to ship";
  }
  if (action === "mark_shipped") {
    const order = await prisma.order.findUnique({
      where: { id },
      select: { qcCustomerConfirmed: true }
    });
    if (!order?.qcCustomerConfirmed) {
      throw new Error("Customer must confirm the QC photos before the order can be marked as shipped.");
    }
    await prisma.package.updateMany({ where: { orderId: id }, data: { status: "shipped", shippedAt: now } });
    data.shippedAt = now;
    shouldSyncFromPackage = true;
    detail = "Marked shipped";
  }
  if (action === "in_transit") {
    data.orderStatus = "shipped";
    data.packageStatus = "shipped";
    data.shippingStatus = "in_transit";
    data.status = "shipped";
    detail = "Marked package in transit";
  }
  if (action === "complete") {
    await prisma.package.updateMany({ where: { orderId: id }, data: { status: "delivered", deliveredAt: now } });
    data.completedAt = now;
    shouldSyncFromPackage = true;
    detail = "Marked completed";
  }
  if (action === "mark_abnormal") {
    data.warehouseStatus = "abnormal";
    shouldDeriveFromIntent = true;
    detail = "Marked abnormal";
  }
  if (action === "refund_pending") {
    data.refundStatus = "pending";
    shouldDeriveFromIntent = true;
    detail = "Marked refund pending";
  }
  if (action === "mark_refunded") {
    data.paymentStatus = "refunded";
    data.refundStatus = "refunded";
    shouldDeriveFromIntent = true;
    detail = "Marked refunded";
  }
  if (action === "cancel") {
    data.riskStatus = "rejected";
    data.cancelledAt = now;
    shouldDeriveFromIntent = true;
    detail = "Cancelled order";
  }

  if (shouldDeriveFromIntent) {
    const previousOrder = await prisma.order.findUnique({
      where: { id },
      select: {
        totalUsd: true,
        paidUsd: true,
        unpaidUsd: true,
        paymentStatus: true,
        purchaseStatus: true,
        warehouseStatus: true,
        packageStatus: true,
        shippingPaymentStatus: true,
        shippingStatus: true,
        riskStatus: true,
        refundStatus: true,
        paidAt: true,
        purchasedAt: true,
        warehouseReceivedAt: true,
        shippedAt: true,
        completedAt: true,
        cancelledAt: true
      }
    });
    if (!previousOrder) throw new Error("Order not found");
    syncOrderDataFromManualInputs({
      previousOrder,
      data,
      now
    });
  }

  await prisma.order.update({
    where: { id },
    data: {
      ...data,
      logs: { create: { actorId, action: "order_workflow_action", detail } }
    }
  });

  if (shouldSyncFromPackage) {
    const latestPackage = await prisma.package.findFirst({
      where: { orderId: id },
      orderBy: { createdAt: "asc" },
      select: { id: true }
    });
    if (latestPackage) {
      await syncOrderFromPackage(latestPackage.id, actorId);
    }
  }

  if (shouldSendOrderPaidEmail) {
    void sendOrderPaidEmail(id).catch(() => undefined);
  }
}

export async function updateOrderStatus(formData: FormData) {
  const admin = await requirePermission(includesRefundMutation(formData) ? "orders.refund" : "orders.update");
  const id = Number(formData.get("id"));
  const data: WorkflowData = {};

  if (formData.has("orderStatus")) data.orderStatus = readEnumValue(formData, "orderStatus", orderStatusOptions, "order_pending");
  if (formData.has("paymentStatus")) data.paymentStatus = readProductPaymentStatusValue(formData, "paymentStatus");
  if (formData.has("purchaseStatus")) data.purchaseStatus = readEnumValue(formData, "purchaseStatus", purchaseStatusOptions, "pending");
  if (formData.has("warehouseStatus")) data.warehouseStatus = readEnumValue(formData, "warehouseStatus", warehouseStatusOptions, "pending");
  if (formData.has("packageStatus")) data.packageStatus = readEnumValue(formData, "packageStatus", orderPackageStatusOptions, "none");
  if (formData.has("shippingPaymentStatus")) data.shippingPaymentStatus = readShippingPaymentStatusValue(formData, "shippingPaymentStatus");
  if (formData.has("shippingStatus")) data.shippingStatus = readEnumValue(formData, "shippingStatus", shippingStatusOptions, "none");
  if (formData.has("riskStatus")) data.riskStatus = readEnumValue(formData, "riskStatus", riskStatusOptions, "normal");
  if (formData.has("refundStatus")) data.refundStatus = readEnumValue(formData, "refundStatus", refundStatusOptions, "none");
  if (formData.has("orderSource")) data.orderSource = readEnumValue(formData, "orderSource", orderSourceOptions, "url");
  if (formData.has("paidUsd")) data.paidUsd = Number(formData.get("paidUsd") || 0);
  if (formData.has("unpaidUsd")) data.unpaidUsd = Number(formData.get("unpaidUsd") || 0);
  if (formData.has("refundUsd")) data.refundUsd = Number(formData.get("refundUsd") || 0);
  if (formData.has("actualShippingUsd")) data.actualShippingUsd = Number(formData.get("actualShippingUsd") || 0);
  if (formData.has("discountUsd")) data.discountUsd = Number(formData.get("discountUsd") || 0);
  if (formData.has("domesticShippingUsd")) data.domesticShippingUsd = Number(formData.get("domesticShippingUsd") || 0);
  if (formData.has("valueAddedServicesUsd")) data.valueAddedServicesUsd = Number(formData.get("valueAddedServicesUsd") || 0);
  if (formData.has("assigneeId")) data.assigneeId = formData.get("assigneeId") ? Number(formData.get("assigneeId")) : null;

  const previousOrder = await prisma.order.findUnique({
    where: { id },
    select: {
      orderNo: true,
      totalUsd: true,
      status: true,
      orderStatus: true,
      paymentStatus: true,
      purchaseStatus: true,
      warehouseStatus: true,
      packageStatus: true,
      shippingPaymentStatus: true,
      shippingStatus: true,
      riskStatus: true,
      refundStatus: true,
      paidUsd: true,
      unpaidUsd: true,
      refundUsd: true,
      actualShippingUsd: true,
      discountUsd: true,
      domesticShippingUsd: true,
      valueAddedServicesUsd: true,
      paidAt: true,
      purchasedAt: true,
      warehouseReceivedAt: true,
      shippedAt: true,
      completedAt: true,
      cancelledAt: true,
      qcSharedWithCustomer: true,
      qcCustomerConfirmed: true
    }
  });
  if (!previousOrder) throw new Error("Order not found.");

  syncOrderDataFromManualInputs({
    previousOrder,
    data
  });
  const shouldSendOrderPaidEmail = data.paymentStatus === "paid" && previousOrder.paymentStatus !== "paid";

  await prisma.order.update({
    where: { id },
    data: {
      ...data,
      logs: { create: { actorId: admin?.id, action: "admin_status_updated", detail: "Order detail updated by admin" } }
    }
  });

  const newStatus = pickStatusChanges(data);
  if (Object.keys(newStatus).length > 0) {
    const oldStatus = Object.fromEntries(
      Object.keys(newStatus).map((field) => [field, previousOrder[field as OrderStatusLogField]])
    );
    await createAuditLog({
      actorId: admin?.id,
      actorEmail: admin?.email,
      action: "order_status_updated",
      targetType: "order",
      targetId: id,
      targetLabel: previousOrder.orderNo,
      orderId: id,
      oldValue: auditSnapshot(oldStatus),
      newValue: auditSnapshot(newStatus),
      message: "Order status updated"
    });
  }

  const newAmount = pickAmountChanges(data);
  if (Object.keys(newAmount).length > 0) {
    const oldAmount = Object.fromEntries(
      Object.keys(newAmount).map((field) => [field, Number(previousOrder[field as OrderAmountLogField])])
    );
    await createAuditLog({
      actorId: admin?.id,
      actorEmail: admin?.email,
      action: "order_amount_updated",
      targetType: "order",
      targetId: id,
      targetLabel: previousOrder.orderNo,
      orderId: id,
      oldValue: auditSnapshot(oldAmount),
      newValue: auditSnapshot(newAmount),
      message: "Order amount fields updated"
    });
  }

  if (formData.has("refundStatus") || formData.has("refundUsd")) {
    await createAuditLog({
      actorId: admin?.id,
      actorEmail: admin?.email,
      action: "refund_created",
      targetType: "order",
      targetId: id,
      targetLabel: previousOrder.orderNo,
      orderId: id,
      oldValue: auditSnapshot({
        refundStatus: previousOrder.refundStatus,
        refundUsd: Number(previousOrder.refundUsd)
      }),
      newValue: auditSnapshot({
        refundStatus: data.refundStatus,
        refundUsd: data.refundUsd
      }),
      message: "Refund information updated"
    });
  }

  if (shouldSendOrderPaidEmail) {
    void sendOrderPaidEmail(id).catch(() => undefined);
  }

  revalidateOrderAdminPaths();
  revalidateOrderDetailPaths(id);
}

export async function markOrderQcShared(formData: FormData) {
  const admin = await requirePermission("orders.update");
  const id = Number(formData.get("id"));
  const order = await prisma.order.findUnique({
    where: { id },
    select: {
      id: true,
      orderNo: true,
      qcSharedWithCustomer: true,
      qcSharedAt: true,
      qcSharedBy: true,
      qcCustomerConfirmed: true,
      qcCustomerConfirmedAt: true,
      qcCustomerConfirmedBy: true,
      actualShippingUsd: true,
      packages: { select: { id: true } },
      mediaAssets: { where: { usage: "qc_photo" }, select: { id: true } }
    }
  });
  if (!order) throw new Error("Order not found.");
  if (!order.mediaAssets.length) throw new Error("Upload QC photos before sending them to the customer.");
  if (!order.packages.length) throw new Error("Create the package before sending QC photos and shipping payment to the customer.");
  if (Number(order.actualShippingUsd) <= 0) throw new Error("Set the international freight amount before sending QC photos and shipping payment to the customer.");

  const emailResult = await sendOrderQcEmail(id);
  if ("skipped" in emailResult && emailResult.reason === "smtp_not_configured") {
    throw new Error("SMTP is not configured. Please complete SMTP settings before sending QC emails.");
  }
  if ("skipped" in emailResult && emailResult.reason === "no_qc_photos") {
    throw new Error("Upload QC photos before sending them to the customer.");
  }

  await prisma.package.updateMany({
    where: { orderId: id },
    data: { status: "waiting_shipping_payment" }
  });

  const updated = await prisma.order.update({
    where: { id },
    data: {
      qcSharedWithCustomer: true,
      qcSharedAt: new Date(),
      qcSharedBy: admin?.id ?? null,
      orderStatus: "international_freight_pending",
      packageStatus: "waiting_shipping_payment",
      shippingPaymentStatus: "international_freight_pending",
      shippingStatus: "pending",
      status: "shipping_pending",
      logs: {
        create: {
          actorId: admin?.id,
          action: "order_qc_shared",
          detail: "QC photos sent to customer by email"
        }
      }
    },
    select: {
      qcSharedWithCustomer: true,
      qcSharedAt: true,
      qcSharedBy: true,
      qcCustomerConfirmed: true,
      qcCustomerConfirmedAt: true,
      qcCustomerConfirmedBy: true
    }
  });

  await createAuditLog({
    actorId: admin?.id,
    actorEmail: admin?.email,
    action: "order_qc_shared",
    targetType: "order",
    targetId: String(id),
    targetLabel: order.orderNo,
    orderId: id,
    oldValue: auditSnapshot({
      qcSharedWithCustomer: order.qcSharedWithCustomer,
      qcSharedAt: order.qcSharedAt,
      qcSharedBy: order.qcSharedBy,
      qcCustomerConfirmed: order.qcCustomerConfirmed,
      qcCustomerConfirmedAt: order.qcCustomerConfirmedAt,
      qcCustomerConfirmedBy: order.qcCustomerConfirmedBy
    }),
    newValue: auditSnapshot(updated),
    message: "QC photos sent to customer"
  });

  revalidateOrderAdminPaths();
  revalidateOrderDetailPaths(id);
}

export async function markOrderQcConfirmed(formData: FormData) {
  const admin = await requirePermission("orders.update");
  const id = Number(formData.get("id"));
  const order = await prisma.order.findUnique({
    where: { id },
    select: {
      id: true,
      orderNo: true,
      qcSharedWithCustomer: true,
      qcSharedAt: true,
      qcSharedBy: true,
      qcCustomerConfirmed: true,
      qcCustomerConfirmedAt: true,
      qcCustomerConfirmedBy: true
    }
  });
  if (!order) throw new Error("Order not found.");
  if (!order.qcSharedWithCustomer) {
    throw new Error("Send the QC photos to the customer before marking them confirmed.");
  }

  const updated = await prisma.order.update({
    where: { id },
    data: {
      qcCustomerConfirmed: true,
      qcCustomerConfirmedAt: new Date(),
      qcCustomerConfirmedBy: admin?.id ?? null,
      orderStatus: "customer_confirmed",
      logs: {
        create: {
          actorId: admin?.id,
          action: "order_qc_confirmed",
          detail: "Customer confirmed QC photos"
        }
      }
    },
    select: {
      qcSharedWithCustomer: true,
      qcSharedAt: true,
      qcSharedBy: true,
      qcCustomerConfirmed: true,
      qcCustomerConfirmedAt: true,
      qcCustomerConfirmedBy: true
    }
  });

  await createAuditLog({
    actorId: admin?.id,
    actorEmail: admin?.email,
    action: "order_qc_confirmed",
    targetType: "order",
    targetId: String(id),
    targetLabel: order.orderNo,
    orderId: id,
    oldValue: auditSnapshot({
      qcSharedWithCustomer: order.qcSharedWithCustomer,
      qcSharedAt: order.qcSharedAt,
      qcSharedBy: order.qcSharedBy,
      qcCustomerConfirmed: order.qcCustomerConfirmed,
      qcCustomerConfirmedAt: order.qcCustomerConfirmedAt,
      qcCustomerConfirmedBy: order.qcCustomerConfirmedBy
    }),
    newValue: auditSnapshot(updated),
    message: "Customer confirmed QC photos"
  });

  revalidateOrderAdminPaths();
  revalidateOrderDetailPaths(id);
}

export async function updateOrderItemDetails(formData: FormData) {
  const admin = await requirePermission("orders.update");
  const orderId = Number(formData.get("orderId"));
  const itemId = Number(formData.get("itemId"));
  if (!orderId || !itemId) throw new Error("Missing order item.");

  await prisma.orderItem.update({
    where: { id: itemId },
    data: {
      platform: String(formData.get("platform") || "taobao"),
      sourceItemId: String(formData.get("sourceItemId") || ""),
      sourceUrl: String(formData.get("sourceUrl") || ""),
      title: String(formData.get("title") || ""),
      image: String(formData.get("image") || ""),
      skuId: String(formData.get("skuId") || "") || null,
      skuText: String(formData.get("skuText") || "") || null,
      priceCny: Number(formData.get("priceCny") || 0),
      priceUsd: Number(formData.get("priceUsd") || 0),
      quantity: Math.max(1, Number(formData.get("quantity") || 1)),
      purchaseStatus: String(formData.get("purchaseStatus") || "pending")
    }
  });

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true }
  });
  if (!order) throw new Error("Order not found.");

  const subtotalCny = order.items.reduce((sum, item) => sum + Number(item.priceCny) * item.quantity, 0);
  const subtotalUsd = order.items.reduce((sum, item) => sum + Number(item.priceUsd) * item.quantity, 0);
  const totalQuantity = order.items.reduce((sum, item) => sum + item.quantity, 0);
  const derivedPurchase = deriveOrderPurchaseStatusFromItems(order.items.map((item) => item.purchaseStatus));
  const totalUsd =
    subtotalUsd +
    Number(order.serviceFeeUsd) +
    Number(order.domesticShippingUsd) +
    Number(order.valueAddedServicesUsd) +
    Number(order.actualShippingUsd) -
    Number(order.discountUsd);
  const unpaidUsd = Math.max(0, totalUsd - Number(order.paidUsd) - Number(order.refundUsd));

  await prisma.order.update({
    where: { id: orderId },
    data: {
      itemCount: order.items.length,
      totalQuantity,
      subtotalCny,
      subtotalUsd,
      totalUsd,
      unpaidUsd,
      purchaseStatus: derivedPurchase.purchaseStatus,
      orderStatus: derivedPurchase.orderStatus,
      status: derivedPurchase.status,
      purchasedAt: derivedPurchase.purchaseStatus === "purchased" ? (order.purchasedAt ?? derivedPurchase.purchasedAt) : order.purchasedAt,
      logs: {
        create: {
          actorId: admin?.id,
          action: "order_item_updated",
          detail: `Updated item #${itemId}: ${String(formData.get("title") || "").slice(0, 160)}`
        }
      }
    }
  });

  revalidateOrderAdminPaths();
  revalidateOrderDetailPaths(orderId);
}

export async function addOrderNote(formData: FormData) {
  const admin = await requirePermission("orders.update");
  const orderId = Number(formData.get("orderId"));
  const type = String(formData.get("type") || "admin");
  const content = String(formData.get("content") || "").trim();
  if (!orderId || !content) return;

  await prisma.order.update({
    where: { id: orderId },
    data: {
      adminNote: type === "admin" ? content : undefined,
      notes: {
        create: {
          type,
          content,
          visibleToUser: formData.get("visibleToUser") === "on",
          createdBy: admin?.id
        }
      },
      logs: {
        create: {
          actorId: admin?.id,
          action: "order_note_added",
          detail: `${type}: ${content.slice(0, 180)}`
        }
      }
    }
  });
  revalidateOrderAdminPaths();
  revalidateOrderDetailPaths(orderId);
}

export async function updateOrderWorkflow(formData: FormData) {
  const action = String(formData.get("workflowAction"));
  const admin = await requirePermission(isRefundWorkflowActionValue(action) ? "orders.refund" : "orders.update");
  const id = Number(formData.get("id"));
  if (!isWorkflowAction(action)) throw new Error("Invalid workflow action");
  if (action === "request_shipping_payment") {
    const emailResult = await sendShippingPaymentRequestEmail(id, { forceResend: true });
    if ("skipped" in emailResult) {
      if (emailResult.reason === "shipping_fee_not_set") {
        throw new Error("Set the international freight amount before requesting shipping payment.");
      } else if (emailResult.reason === "smtp_not_configured") {
        throw new Error("SMTP is not configured. Configure email before requesting shipping payment.");
      } else {
        throw new Error("Shipping payment email could not be prepared.");
      }
    } else if ("sent" in emailResult && emailResult.sent === false) {
      throw new Error(emailResult.error || "Unable to send the shipping payment email.");
    }
  }

  const previousOrder = await prisma.order.findUnique({
    where: { id },
    select: {
      orderNo: true,
      status: true,
      orderStatus: true,
      paymentStatus: true,
      purchaseStatus: true,
      warehouseStatus: true,
      packageStatus: true,
      shippingPaymentStatus: true,
      shippingStatus: true,
      riskStatus: true,
      refundStatus: true,
      qcSharedWithCustomer: true,
      qcCustomerConfirmed: true
    }
  });
  if (!previousOrder) throw new Error("Order not found.");
  await applyOrderWorkflowAction(id, action, admin?.id);
  const updatedOrder = await prisma.order.findUnique({
    where: { id },
    select: {
      status: true,
      orderStatus: true,
      paymentStatus: true,
      purchaseStatus: true,
      warehouseStatus: true,
      packageStatus: true,
      shippingPaymentStatus: true,
      shippingStatus: true,
      riskStatus: true,
      refundStatus: true,
      qcSharedWithCustomer: true,
      qcCustomerConfirmed: true
    }
  });
  if (updatedOrder) {
    await createAuditLog({
      actorId: admin?.id,
      actorEmail: admin?.email,
      action: action === "mark_paid" ? "order_marked_paid" : isRefundWorkflowActionValue(action) ? "refund_created" : "order_status_updated",
      targetType: "order",
      targetId: id,
      targetLabel: previousOrder.orderNo,
      orderId: id,
      oldValue: auditSnapshot(Object.fromEntries(orderStatusLogFields.map((field) => [field, previousOrder[field]]))),
      newValue: auditSnapshot(Object.fromEntries(orderStatusLogFields.map((field) => [field, updatedOrder[field]]))),
      message: `Order workflow action: ${action}`
    });
  }
  revalidateOrderAdminPaths();
  revalidateOrderDetailPaths(id);
}

export async function moveOrderToTrash(formData: FormData) {
  const admin = await requirePermission("orders.manage");
  const id = Number(formData.get("id"));
  await prisma.order.update({
    where: { id },
    data: {
      status: "trash",
      orderStatus: "trash",
      logs: { create: { actorId: admin?.id, action: "order_moved_to_trash", detail: "Order moved to trash" } }
    }
  });
  revalidateOrderAdminPaths();
}

export async function restoreOrderFromTrash(formData: FormData) {
  const admin = await requirePermission("orders.manage");
  const id = Number(formData.get("id"));
  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) throw new Error("Order not found");
  const restoredStatus = order.paymentStatus === "paid" ? "paid" : "pending_payment";
  await prisma.order.update({
    where: { id },
    data: {
      status: restoredStatus,
      orderStatus: restoredStatus,
      logs: { create: { actorId: admin?.id, action: "order_restored_from_trash", detail: `Order restored as ${restoredStatus}` } }
    }
  });
  revalidateOrderAdminPaths();
}

export async function permanentlyDeleteOrder(formData: FormData) {
  await requirePermission("orders.manage");
  const id = Number(formData.get("id"));
  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true, packages: true }
  });
  if (!order) throw new Error("Order not found");
  if (order.status !== "trash" && order.orderStatus !== "trash") {
    throw new Error("Move the order to trash before permanently deleting it.");
  }

  const packageIds = order.packages.map((pkg) => pkg.id);
  const itemIds = order.items.map((item) => item.id);
  const packageItemWhere =
    packageIds.length && itemIds.length
      ? { OR: [{ packageId: { in: packageIds } }, { orderItemId: { in: itemIds } }] }
      : packageIds.length
        ? { packageId: { in: packageIds } }
        : itemIds.length
          ? { orderItemId: { in: itemIds } }
          : { id: -1 };
  const paymentWhere =
    packageIds.length
      ? { OR: [{ orderId: id }, { packageId: { in: packageIds } }] }
      : { orderId: id };

  await prisma.$transaction([
    prisma.packageItem.deleteMany({ where: packageItemWhere }),
    prisma.payment.deleteMany({ where: paymentWhere }),
    prisma.walletTransaction.updateMany({ where: { relatedOrderId: id }, data: { relatedOrderId: null } }),
    packageIds.length
      ? prisma.walletTransaction.updateMany({ where: { relatedPackageId: { in: packageIds } }, data: { relatedPackageId: null } })
      : prisma.walletTransaction.updateMany({ where: { id: -1 }, data: { relatedPackageId: null } }),
    prisma.operationLog.deleteMany({ where: { orderId: id } }),
    prisma.orderNote.deleteMany({ where: { orderId: id } }),
    prisma.package.deleteMany({ where: { orderId: id } }),
    prisma.orderItem.deleteMany({ where: { orderId: id } }),
    prisma.order.delete({ where: { id } })
  ]);
  revalidateOrderAdminPaths();
}

export async function bulkUpdateOrders(formData: FormData) {
  const bulkAction = String(formData.get("bulkAction") || "");
  const admin = await requirePermission(isRefundWorkflowActionValue(bulkAction) || includesRefundMutation(formData) ? "orders.refund" : "orders.update");
  const ids = formData.getAll("orderIds").map(Number).filter(Boolean);
  if (!ids.length) return;
  if (bulkAction) {
    if (!isWorkflowAction(bulkAction)) throw new Error("Invalid bulk action");
    for (const id of ids) {
      await applyOrderWorkflowAction(id, bulkAction, admin?.id);
    }
    revalidateOrderAdminPaths();
    return;
  }
  const data: Record<string, string | number | null> = {};
  const fields = [
    "orderStatus",
    "paymentStatus",
    "purchaseStatus",
    "warehouseStatus",
    "packageStatus",
    "shippingPaymentStatus",
    "shippingStatus",
    "riskStatus",
    "refundStatus"
  ];
  for (const field of fields) {
    const value = String(formData.get(field) || "");
    if (value) data[field] = value;
  }
  if (formData.get("assigneeId")) data.assigneeId = Number(formData.get("assigneeId"));
  const adminNote = String(formData.get("adminNote") || "");
  if (adminNote) data.adminNote = adminNote;
  if (!Object.keys(data).length) return;

  await prisma.order.updateMany({ where: { id: { in: ids } }, data });
  await prisma.operationLog.createMany({
    data: ids.map((orderId) => ({
      actorId: admin?.id,
      actorEmail: admin?.email,
      orderId,
      action: "bulk_order_update",
      targetType: "order",
      targetId: String(orderId),
      newValue: data,
      message: "Bulk order update",
      detail: JSON.stringify(data)
    }))
  });
  revalidateOrderAdminPaths();
}

export async function updatePackageStatus(formData: FormData) {
  const admin = await requirePermission("packages.update");
  const t = await getTranslations("packages");
  const id = Number(formData.get("id"));
  const status = String(formData.get("status"));
  if (!packageStatuses.includes(status)) throw new Error(t("errors.invalidStatus"));
  const currentPackage = await prisma.package.findUnique({ where: { id } });
  if (!currentPackage) throw new Error(t("errors.packageNotFound"));
  const shippingChannelId = formData.get("shippingChannelId") ? Number(formData.get("shippingChannelId")) : null;
  if (shippingChannelId) {
    const channel = await prisma.shippingChannel.findUnique({ where: { id: shippingChannelId } });
    if (!channel) throw new Error(t("errors.shippingChannelNotFound"));
  }
  const nextTrackingNumber = formData.has("trackingNumber") ? String(formData.get("trackingNumber") ?? "").trim() : (currentPackage.trackingNumber ?? "");
  if ((status === "shipping_paid" || status === "shipped" || status === "delivered") && !(shippingChannelId ?? currentPackage.shippingChannelId)) {
    throw new Error(t("errors.assignChannelBeforeDispatch"));
  }
  if ((status === "shipped" || status === "delivered") && !nextTrackingNumber) {
    throw new Error(t("errors.trackingRequiredBeforeShipment"));
  }
  const now = new Date();
  await prisma.package.update({
    where: { id },
    data: {
      status,
      shippingChannelId,
      weightKg: Number(formData.get("weightKg") ?? 0.5),
      lengthCm: formData.get("lengthCm") ? Number(formData.get("lengthCm")) : null,
      widthCm: formData.get("widthCm") ? Number(formData.get("widthCm")) : null,
      heightCm: formData.get("heightCm") ? Number(formData.get("heightCm")) : null,
      shippingFeeUsd: Number(formData.get("shippingFeeUsd") ?? 0),
      trackingNumber: nextTrackingNumber,
      shippedAt: status === "shipped" || status === "delivered" ? (currentPackage.shippedAt ?? now) : null,
      deliveredAt: status === "delivered" ? (currentPackage.deliveredAt ?? now) : null
    }
  });
  await syncOrderFromPackage(id, admin?.id);
  revalidateOrderAdminPaths();
}

export async function updateOrderAddress(formData: FormData) {
  const admin = await requirePermission("orders.update");
  const orderId = Number(formData.get("orderId"));
  const addressId = formData.get("addressId") ? Number(formData.get("addressId")) : undefined;
  const userId = Number(formData.get("userId"));
  const payload = {
    label: String(formData.get("label") || "Shipping"),
    contactName: String(formData.get("contactName") || ""),
    phone: String(formData.get("phone") || ""),
    country: String(formData.get("country") || "US"),
    state: String(formData.get("state") || ""),
    city: String(formData.get("city") || ""),
    postalCode: String(formData.get("postalCode") || ""),
    line1: String(formData.get("line1") || ""),
    line2: String(formData.get("line2") || ""),
    isDefault: formData.get("isDefault") === "on"
  };

  const address = addressId
    ? await prisma.address.update({ where: { id: addressId }, data: payload })
    : await prisma.address.create({ data: { ...payload, userId } });

  await prisma.order.update({
    where: { id: orderId },
    data: {
      addressId: address.id,
      destinationCountry: address.country,
      destinationCountryCode: address.country,
      shippingAddressSnapshot: {
        label: address.label,
        contactName: address.contactName,
        phone: address.phone,
        country: address.country,
        state: address.state,
        city: address.city,
        postalCode: address.postalCode,
        line1: address.line1,
        line2: address.line2
      },
      logs: {
        create: {
          actorId: admin?.id,
          action: "shipping_address_updated",
          detail: `${address.contactName}, ${address.line1}, ${address.city}, ${address.country}`
        }
      }
    }
  });
  revalidateOrderAdminPaths();
  revalidatePath("/admin/users/addresses");
  revalidateOrderDetailPaths(orderId);
}

export async function upsertAddress(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Please sign in before saving an address.");
  const requestedUserId = Number(formData.get("userId") || user.id);
  const userId = isAdminRole(user.role) ? requestedUserId : user.id;
  const id = formData.get("id") ? Number(formData.get("id")) : undefined;
  const payload = {
    label: String(formData.get("label") || "Default"),
    contactName: String(formData.get("contactName") || ""),
    phone: String(formData.get("phone") || ""),
    country: String(formData.get("country") || "US"),
    state: String(formData.get("state") || ""),
    city: String(formData.get("city") || ""),
    postalCode: String(formData.get("postalCode") || ""),
    line1: String(formData.get("line1") || ""),
    line2: String(formData.get("line2") || ""),
    isDefault: formData.get("isDefault") === "on"
  };
  if (!id) {
    const count = await prisma.address.count({ where: { userId } });
    if (count >= 3) {
      throw new Error("You can save up to 3 delivery addresses. Please delete another address first.");
    }
  } else {
    const address = await prisma.address.findUnique({ where: { id }, select: { userId: true } });
    if (!address || (!isAdminRole(user.role) && address.userId !== user.id)) {
      throw new Error("Address not found.");
    }
  }
  await prisma.address.upsert({
    where: { id: id ?? 0 },
    update: payload,
    create: { ...payload, userId }
  });
  revalidatePath("/account/addresses");
  revalidatePath("/admin/users/addresses");
}

export async function updateDiyOrder(formData: FormData) {
  await requirePermission("diy_orders.view");
  const purchaseDateValue = String(formData.get("purchaseDate") || "");
  await prisma.diyOrder.update({
    where: { id: Number(formData.get("id")) },
    data: {
      status: String(formData.get("status")),
      quoteProvided: formData.get("quoteProvided") === "on",
      quoteUsd: formData.get("quoteUsd") ? Number(formData.get("quoteUsd")) : undefined,
      customerQuoteFeedback: String(formData.get("customerQuoteFeedback") ?? ""),
      adminNote: String(formData.get("adminNote") ?? ""),
      purchaseItemName: String(formData.get("purchaseItemName") || ""),
      purchaseDate: purchaseDateValue ? new Date(purchaseDateValue) : null,
      purchaseSize: String(formData.get("purchaseSize") || ""),
      purchaseWeightKg: formData.get("purchaseWeightKg") ? Number(formData.get("purchaseWeightKg")) : null,
      productCostUsd: formData.get("productCostUsd") ? Number(formData.get("productCostUsd")) : null,
      purchaseStatus: String(formData.get("purchaseStatus") || "not_purchased"),
      warehouseStatus: String(formData.get("warehouseStatus") || "not_arrived"),
      purchaseLink: String(formData.get("purchaseLink") || ""),
      shippingFeeUsd: formData.get("shippingFeeUsd") ? Number(formData.get("shippingFeeUsd")) : null,
      serviceFeeUsd: formData.get("serviceFeeUsd") ? Number(formData.get("serviceFeeUsd")) : null
    }
  });
  revalidatePath("/admin/diy-orders");
  revalidatePath("/admin");
  revalidatePath("/account/diy-orders");
  revalidatePath("/account/tickets");
}

export async function deleteDiyOrder(formData: FormData) {
  await requirePermission("diy_orders.view");
  const id = Number(formData.get("id"));
  if (!id) throw new Error("DIY order not found.");

  await prisma.diyOrder.update({
    where: { id },
    data: {
      status: "trash"
    }
  });

  revalidatePath("/admin/diy-orders");
  revalidatePath("/admin");
  revalidatePath("/account/diy-orders");
  revalidatePath("/account/tickets");
  return { message: "DIY order moved to trash." };
}

export async function restoreDiyOrder(formData: FormData) {
  await requirePermission("diy_orders.view");
  const id = Number(formData.get("id"));
  if (!id) throw new Error("DIY order not found.");

  await prisma.diyOrder.update({
    where: { id },
    data: {
      status: "submitted"
    }
  });

  revalidatePath("/admin/diy-orders");
  revalidatePath("/admin");
  revalidatePath("/account/diy-orders");
  revalidatePath("/account/tickets");
  return { message: "DIY order restored." };
}

export async function permanentlyDeleteDiyOrder(formData: FormData) {
  await requirePermission("diy_orders.view");
  const id = Number(formData.get("id"));
  if (!id) throw new Error("DIY order not found.");

  const order = await prisma.diyOrder.findUnique({
    where: { id },
    select: { status: true }
  });
  if (!order) throw new Error("DIY order not found.");
  if (order.status !== "trash") throw new Error("Move the DIY order to trash before permanently deleting it.");

  await prisma.diyOrder.delete({
    where: { id }
  });

  revalidatePath("/admin/diy-orders");
  revalidatePath("/admin");
  revalidatePath("/account/diy-orders");
  revalidatePath("/account/tickets");
  return { message: "DIY order permanently deleted." };
}

export async function convertDiyOrderToOrder(formData: FormData) {
  const admin = await requirePermission("diy_orders.view");
  const diyOrderId = Number(formData.get("id"));
  if (!diyOrderId) throw new Error("DIY order not found.");

  const diyOrder = await prisma.diyOrder.findUnique({
    where: { id: diyOrderId },
    include: { user: { include: { addresses: { orderBy: [{ isDefault: "desc" }, { updatedAt: "desc" }] } } } }
  });
  if (!diyOrder) throw new Error("DIY order not found.");
  if (!diyOrder.userId || !diyOrder.user) {
    throw new Error("This DIY order is not linked to a registered user, so it cannot be converted into a normal order.");
  }
  if (diyOrder.convertedOrderId) {
    throw new Error("This DIY order has already been converted.");
  }

  const addressId = Number(formData.get("addressId") || diyOrder.user.addresses[0]?.id || 0);
  if (!addressId) {
    throw new Error("Please create or select a delivery address for this user before converting the DIY order.");
  }
  const address = diyOrder.user.addresses.find((item) => item.id === addressId);
  if (!address) {
    throw new Error("Selected delivery address does not belong to this DIY order user.");
  }

  const settings = await getPricingSettings();
  const subtotalUsd = roundMoney(Number(diyOrder.productCostUsd ?? diyOrder.quoteUsd ?? diyOrder.budgetUsd ?? 0));
  if (subtotalUsd <= 0) {
    throw new Error("Please fill in Product cost USD or Quote USD before converting this DIY order.");
  }

  const serviceFeeUsd = roundMoney(Number(diyOrder.serviceFeeUsd ?? 0));
  const estimatedShippingUsd = roundMoney(Number(diyOrder.shippingFeeUsd ?? 0));
  const totalUsd = roundMoney(subtotalUsd + serviceFeeUsd);
  const unpaidUsd = 0;
  const now = new Date();
  const image = diyOrder.productImage || "/brand/cnsnap-logo.svg";
  const sourceUrl = diyOrder.purchaseLink || diyOrder.productUrl;
  const sourcePlatform = sourceUrl.includes("taobao")
    ? "taobao"
    : sourceUrl.includes("tmall")
      ? "tmall"
      : sourceUrl.includes("1688")
        ? "1688"
        : sourceUrl.includes("weidian")
          ? "weidian"
          : "diy";
  const orderNo = orderNoForAdmin(now);

  const derivedOrderStatus = deriveConvertedDiyOrderStatus(diyOrder);
  const derivedPurchaseStatus = diyOrder.purchaseStatus === "purchased" ? "purchased" : diyOrder.purchaseStatus === "purchasing" ? "purchasing" : "pending";
  const derivedWarehouseStatus = diyOrder.warehouseStatus === "arrived" ? "received" : "pending";

  const order = await prisma.order.create({
    data: {
      orderNo,
      userId: diyOrder.userId,
      addressId: address.id,
      orderSource: "diy",
      orderStatus: derivedOrderStatus,
      paymentStatus: "paid_product",
      purchaseStatus: derivedPurchaseStatus,
      warehouseStatus: derivedWarehouseStatus,
      destinationCountry: address.country,
      destinationCountryCode: address.country,
      shippingAddressSnapshot: {
        label: address.label,
        contactName: address.contactName,
        phone: address.phone,
        country: address.country,
        state: address.state,
        city: address.city,
        postalCode: address.postalCode,
        line1: address.line1,
        line2: address.line2
      },
      subtotalUsd,
      subtotalCny: roundMoney(subtotalUsd * settings.exchangeRate),
      exchangeRate: settings.exchangeRate,
      serviceFeeUsd,
      estimatedShippingUsd,
      totalUsd,
      paidUsd: roundMoney(totalUsd),
      unpaidUsd,
      itemCount: 1,
      totalQuantity: Math.max(1, diyOrder.quantity),
      paidAt: now,
      purchasedAt: diyOrder.purchaseStatus === "purchased" ? (diyOrder.purchaseDate ?? now) : undefined,
      warehouseReceivedAt: diyOrder.warehouseStatus === "arrived" ? now : undefined,
      userNote: diyOrder.note,
      adminNote: `Converted from DIY order #${diyOrder.id}${diyOrder.adminNote ? `\n\nDIY admin note:\n${diyOrder.adminNote}` : ""}`,
      items: {
        create: {
          platform: sourcePlatform,
          sourceItemId: `DIY-${diyOrder.id}`,
          sourceUrl,
          title: diyOrder.purchaseItemName || diyOrder.productName || `DIY Order ${diyOrder.id}`,
          image,
          skuText: diyOrder.purchaseSize || diyOrder.specification,
          priceCny: roundMoney(subtotalUsd * settings.exchangeRate),
          priceUsd: subtotalUsd,
          quantity: Math.max(1, diyOrder.quantity),
          purchaseStatus: derivedPurchaseStatus
        }
      },
      payments: {
        create: {
          paymentNo: paymentNoForAdmin(now),
          provider: "manual",
          type: "product",
          userId: diyOrder.userId,
          amount: totalUsd,
          currency: "USD",
          status: "paid",
          paymentMethod: "manual_invoice",
          paidAt: now
        }
      },
      notes: {
        create: [
          {
            type: "admin",
            content: `Converted from DIY order #${diyOrder.id}. Customer quote feedback: ${diyOrder.customerQuoteFeedback || "-"}`,
            visibleToUser: false,
            createdBy: admin?.id
          }
        ]
      },
      logs: {
        create: {
          actorId: admin?.id,
          action: "diy_order_converted",
          detail: `Converted DIY order #${diyOrder.id} into normal order ${orderNo}`
        }
      }
    }
  });

  await prisma.diyOrder.update({
    where: { id: diyOrderId },
    data: {
      status: "converted_to_order",
      convertedOrderId: order.id,
      adminNote: `${diyOrder.adminNote ? `${diyOrder.adminNote}\n\n` : ""}Converted to normal order ${order.orderNo} on ${now.toLocaleString()}.`
    }
  });

  revalidateOrderAdminPaths();
  revalidatePath("/admin/diy-orders");
  revalidatePath(`/admin/orders/${order.id}`);
  revalidatePath("/account/diy-orders");
}

export async function updateSupportTicket(formData: FormData) {
  await requirePermission("tickets.manage");
  const id = Number(formData.get("id"));
  const status = String(formData.get("status") || "open");
  const adminReply = String(formData.get("adminReply") || "").trim();
  const now = new Date();

  await prisma.supportTicket.update({
    where: { id },
    data: {
      status,
      adminReply,
      repliedAt: adminReply ? now : null,
      closedAt: status === "closed" || status === "resolved" ? now : null
    }
  });

  revalidatePath("/admin/tickets");
  revalidatePath("/account/tickets");
}

export async function updateUserAdmin(formData: FormData) {
  const admin = await requirePermission("admins.manage");
  const id = Number(formData.get("id"));
  const previousUser = await prisma.user.findUnique({
    where: { id },
    select: { id: true, email: true, name: true, role: true, status: true, locale: true, currency: true }
  });
  if (!previousUser) throw new Error("User not found.");
  const data = {
    name: String(formData.get("name") || ""),
    role: String(formData.get("role") || "user"),
    status: String(formData.get("status") || "active"),
    locale: String(formData.get("locale") || "en"),
    currency: String(formData.get("currency") || "USD")
  };
  if (!["active", "disabled", "blocked"].includes(data.status)) {
    throw new Error("Invalid user status.");
  }
  await prisma.user.update({
    where: { id },
    data
  });
  if (previousUser.status !== data.status && ["disabled", "blocked"].includes(data.status)) {
    await createAuditLog({
      actorId: admin?.id,
      actorEmail: admin?.email,
      action: data.status === "blocked" ? "user_blocked" : "user_disabled",
      targetType: "user",
      targetId: id,
      targetLabel: previousUser.email,
      oldValue: auditSnapshot({ status: previousUser.status }),
      newValue: auditSnapshot({ status: data.status }),
      message: data.status === "blocked" ? "User blocked" : "User disabled"
    });
  }
  if (previousUser.status !== data.status && data.status === "active") {
    await createAuditLog({
      actorId: admin?.id,
      actorEmail: admin?.email,
      action: "user_reactivated",
      targetType: "user",
      targetId: id,
      targetLabel: previousUser.email,
      oldValue: auditSnapshot({ status: previousUser.status }),
      newValue: auditSnapshot({ status: data.status }),
      message: "User reactivated"
    });
  }
  if (previousUser.role !== data.role) {
    await createAuditLog({
      actorId: admin?.id,
      actorEmail: admin?.email,
      action: "admin_permission_updated",
      targetType: "user",
      targetId: id,
      targetLabel: previousUser.email,
      oldValue: auditSnapshot({ role: previousUser.role }),
      newValue: auditSnapshot({ role: data.role }),
      message: "User role changed"
    });
  }
  revalidatePath("/admin/users");
  revalidatePath("/admin/settings/admin-users");
  revalidatePath("/admin/users/risk");
}

export async function createUserAdmin(formData: FormData) {
  const admin = await requirePermission("admins.manage");
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const role = String(formData.get("role") || "user");
  const status = String(formData.get("status") || "active");
  const locale = String(formData.get("locale") || "en").trim() || "en";
  const currency = String(formData.get("currency") || "USD").trim() || "USD";

  if (!name || name.length < 2) throw new Error("Name must be at least 2 characters.");
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Please enter a valid email.");
  if (password.length < 8) throw new Error("Password must be at least 8 characters.");
  if (!["active", "disabled", "blocked"].includes(status)) throw new Error("Invalid user status.");

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) throw new Error("This email is already registered.");

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role,
      status,
      locale,
      currency,
      referralCode: generateReferralCode(email)
    }
  });

  await createAuditLog({
    actorId: admin?.id,
    actorEmail: admin?.email,
    action: "user_created",
    targetType: "user",
    targetId: user.id,
    targetLabel: user.email,
    newValue: auditSnapshot({ role: user.role, status: user.status }),
    message: "User created from admin user page"
  });

  revalidatePath("/admin/users");
  revalidatePath("/admin/users/risk");
}

export async function deleteUserAdmin(formData: FormData) {
  const admin = await requirePermission("admins.manage");
  const id = Number(formData.get("id"));
  const confirmation = String(formData.get("confirmation") || "").trim();
  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      orders: { select: { id: true } },
      packages: { select: { id: true } },
      payments: { select: { id: true } },
      walletTransactions: { select: { id: true } },
      addresses: { select: { id: true } },
      tickets: { select: { id: true } },
      authAccounts: { select: { id: true } }
    }
  });

  if (!user) throw new Error("User not found.");
  if (confirmation !== user.email) throw new Error("Please type the exact user email to confirm deletion.");
  if (user.role !== "user") throw new Error("Admin accounts cannot be deleted from this page.");

  const hasRelatedRecords =
    user.orders.length ||
    user.packages.length ||
    user.payments.length ||
    user.walletTransactions.length ||
    user.addresses.length ||
    user.tickets.length ||
    user.authAccounts.length;
  if (hasRelatedRecords) {
    throw new Error("This user has related business records. Block the account instead of deleting it.");
  }

  await prisma.user.delete({ where: { id: user.id } });

  await createAuditLog({
    actorId: admin?.id,
    actorEmail: admin?.email,
    action: "user_deleted",
    targetType: "user",
    targetId: user.id,
    targetLabel: user.email,
    oldValue: auditSnapshot({ role: user.role, status: user.status }),
    message: "User deleted from admin user page"
  });

  revalidatePath("/admin/users");
  revalidatePath("/admin/users/risk");
}

export async function updateSetting(formData: FormData) {
  const admin = await requirePermission("settings.manage");
  const key = String(formData.get("key") || "").trim();
  if (!key) throw new Error("Missing setting key.");
  const previousSetting = await prisma.setting.findUnique({ where: { key } });
  const value = String(formData.get("value"));

  await prisma.setting.upsert({
    where: { key },
    update: { value },
    create: {
      key,
      value,
      label: key
    }
  });
  await createAuditLog({
    actorId: admin?.id,
    actorEmail: admin?.email,
    action: settingsAuditAction([key]),
    targetType: "setting",
    targetId: key,
    targetLabel: key,
    oldValue: auditSnapshot({ [key]: previousSetting?.value ?? null }),
    newValue: auditSnapshot({ [key]: value }),
    message: `Updated setting ${key}`
  });
  revalidateSettingAdminPaths();
}

export async function updateSettingsBatch(formData: FormData) {
  const admin = await requireSettingsBatchPermission(formData);
  const keys = Array.from(new Set(formData.getAll("settingKey").map((value) => String(value).trim()).filter(Boolean)));
  if (!keys.length) throw new Error("No settings were submitted.");
  if (containsFooterContentBlockPayload(formData)) {
    await saveFooterContentBlocksFromFormData(formData);
    await createAuditLog({
      actorId: admin?.id,
      actorEmail: admin?.email,
      action: "footer.content_blocks.update",
      targetType: "frontend_content_block",
      targetId: "footer",
      targetLabel: "Footer content blocks",
      message: "Updated footer content blocks across frontend languages."
    });
    revalidateSettingAdminPaths();
    return;
  }

  const previousSettings = await prisma.setting.findMany({ where: { key: { in: keys } } });
  const previousMap = new Map(previousSettings.map((setting) => [setting.key, setting.value]));
  const newValues = Object.fromEntries(keys.map((key) => [key, String(formData.get(`value:${key}`) ?? "")]));

  await prisma.$transaction(
    keys.map((key) => {
      const descriptionValue = formData.get(`description:${key}`);
      const description = descriptionValue === null ? undefined : String(descriptionValue);
      const label = String(formData.get(`label:${key}`) || key);
      const value = String(formData.get(`value:${key}`) ?? "");

      return prisma.setting.upsert({
        where: { key },
        update: { value, label, description },
        create: { key, value, label, description }
      });
    })
  );

  await createAuditLog({
    actorId: admin?.id,
    actorEmail: admin?.email,
    action: settingsAuditAction(keys),
    targetType: "setting",
    targetId: keys.join(","),
    targetLabel: `${keys.length} settings`,
    oldValue: auditSnapshot(Object.fromEntries(keys.map((key) => [key, previousMap.get(key) ?? null]))),
    newValue: auditSnapshot(newValues),
    message: `Updated ${keys.length} setting${keys.length === 1 ? "" : "s"}`
  });
  revalidateSettingAdminPaths();
}

export async function refreshExchangeRatesAction() {
  await requirePermission("settings.manage");
  await refreshExchangeRates();
  revalidatePath("/admin/settings/currencies");
  revalidatePath("/", "layout");
}

export async function importSensitiveKeywordsAction(formData: FormData) {
  await requirePermission("settings.manage");
  const text = String(formData.get("keywords") || "");
  const file = formData.get("file");
  const fileText = file instanceof File && file.size ? await file.text() : "";
  const keywords = normalizeSensitiveKeywords(`${text}\n${fileText}`);

  if (keywords.length) {
    await prisma.$transaction(
      keywords.map((term) =>
        prisma.sensitiveKeyword.upsert({
          where: { term },
          update: { term },
          create: { term }
        })
      )
    );
  }

  revalidatePath("/admin/settings/sensitive-keywords");
}

export async function deleteSensitiveKeywordAction(formData: FormData) {
  await requirePermission("settings.manage");
  const id = Number(formData.get("id"));
  if (id) {
    await prisma.sensitiveKeyword.delete({ where: { id } }).catch(() => null);
  }
  revalidatePath("/admin/settings/sensitive-keywords");
}

export async function importStorefrontProductAction(formData: FormData) {
  await requirePermission("products.view");
  const sourceInput = String(formData.get("sourceInput") || "").trim();
  const featureOnHomepage = String(formData.get("featureOnHomepage") || "") === "on";
  const storefrontRank = Number(formData.get("storefrontRank") || 0) || 0;
  const importAllPages = String(formData.get("importAllPages") || "") === "on";

  if (!sourceInput) {
    throw new Error("Please provide a product URL or Weidian shop URL.");
  }

  if (/weidian\.com/i.test(sourceInput) && /userid=|shop\//i.test(sourceInput)) {
    let rank = storefrontRank;
    let page = 1;
    let imported = 0;

    while (true) {
      const result = await oneBoundClient.getWeidianShopItems(sourceInput, page, 40);
      if (!result.products.length) {
        if (!imported) {
          throw new Error("No Weidian products were found for this shop.");
        }
        break;
      }

      for (const product of result.products) {
        await upsertProductCacheFromNormalizedProduct(product, {
          isStorefrontActive: true,
          isHomepageFeatured: featureOnHomepage,
          storefrontRank: rank,
          importSource: "weidian_shop",
          sourceShopId: result.shopId,
          sourceShopName: product.shopName ?? result.shopId,
          sourceShopUrl: result.shopUrl
        });
        rank += 1;
        imported += 1;
      }

      if (!importAllPages || !result.hasNextPage) break;
      page += 1;
    }

    revalidateStorefrontProductPaths();
    return;
  }

  if (!/^https?:\/\//i.test(sourceInput)) {
    throw new Error("Please enter a valid product URL or Weidian shop URL.");
  }

  const platform = detectPlatformFromUrl(sourceInput);
  const sourceItemId = extractSourceItemId(sourceInput);
  if (!sourceItemId) {
    throw new Error("Could not detect the product ID from this URL.");
  }

  const product = await oneBoundClient.getItemDetail(platform, sourceInput, { refresh: true });
  await upsertProductCacheFromNormalizedProduct(product, {
    isStorefrontActive: true,
    isHomepageFeatured: featureOnHomepage,
    storefrontRank,
    importSource: "manual_url"
  });

  revalidateStorefrontProductPaths();
}

export async function importStorefrontProductsCsvAction(formData: FormData) {
  await requirePermission("products.view");
  const csvText = String(formData.get("csvText") || "").trim();
  const featureOnHomepage = String(formData.get("featureOnHomepage") || "") === "on";
  const storefrontRankStart = Number(formData.get("storefrontRankStart") || 0) || 0;

  if (!csvText) {
    throw new Error("Please provide CSV content.");
  }

  const parsed = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim()
  });

  if (parsed.errors.length) {
    throw new Error(parsed.errors[0]?.message || "CSV parse failed.");
  }

  const rows = parsed.data
    .map((row) => ({
      sourceUrl: String(row.sourceUrl || row.url || row.productUrl || "").trim(),
      feature: String(row.featureOnHomepage || "").trim().toLowerCase(),
      rank: String(row.storefrontRank || "").trim()
    }))
    .filter((row) => row.sourceUrl);

  if (!rows.length) {
    throw new Error("CSV does not contain any valid sourceUrl rows.");
  }

  let rank = storefrontRankStart;
  for (const row of rows) {
    const platform = detectPlatformFromUrl(row.sourceUrl);
    const product = await oneBoundClient.getItemDetail(platform, row.sourceUrl, { refresh: true });
    const rowFeature = row.feature ? ["1", "true", "yes", "y"].includes(row.feature) : featureOnHomepage;
    const rowRank = row.rank ? Number(row.rank) || rank : rank;

    await upsertProductCacheFromNormalizedProduct(product, {
      isStorefrontActive: true,
      isHomepageFeatured: rowFeature,
      storefrontRank: rowRank,
      importSource: "csv_url"
    });

    rank = rowRank + 1;
  }

  revalidateStorefrontProductPaths();
}

export async function updateStorefrontProductAction(formData: FormData) {
  await requirePermission("products.view");
  const productId = Number(formData.get("productId") || 0);
  if (!productId) throw new Error("Invalid product.");

  const storefrontRank = Number(formData.get("storefrontRank") || 0) || 0;
  const isStorefrontActive = String(formData.get("isStorefrontActive") || "") === "on";
  const isHomepageFeatured = String(formData.get("isHomepageFeatured") || "") === "on";

  await prisma.productCache.update({
    where: { id: productId },
    data: {
      isStorefrontActive,
      isHomepageFeatured,
      storefrontRank
    }
  });

  revalidateStorefrontProductPaths();
}

export async function updateShippingChannelCountries(formData: FormData) {
  await requirePermission("shipping_countries.manage");
  const id = Number(formData.get("id"));
  await prisma.shippingChannel.update({
    where: { id },
    data: {
      supportedCountries: formData.getAll("supportedCountries").map(String),
      isActive: formData.get("isActive") === "on"
    }
  });
  revalidateShippingAdminPaths();
}

export async function upsertShippingChannel(formData: FormData) {
  const admin = await requirePermission("shipping_channels.manage");
  const id = formData.get("id") ? Number(formData.get("id")) : undefined;
  const supportedCountries = formData.getAll("supportedCountries").map(String);
  const data = {
    name: String(formData.get("name") || ""),
    code: String(formData.get("code") || "").trim().toUpperCase(),
    supportedCountries,
    supportedCategories: String(formData.get("supportedCategories") || "general,fashion,electronics")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
    forbiddenCategories: String(formData.get("forbiddenCategories") || "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
    calculationRule: String(
      formData.get("calculationRule") ||
        "chargeable_weight * freight_rmb_per_kg + handling_fee_rmb"
    ),
    notesHtml: String(formData.get("notesHtml") || ""),
    trackingUrl: String(formData.get("trackingUrl") || ""),
    firstWeightKg: Number(formData.get("firstWeightKg") || 0.001),
    firstWeightFeeUsd: Number(formData.get("firstWeightFeeUsd") || 0),
    additionalWeightKg: Number(formData.get("additionalWeightKg") || 1),
    additionalWeightFeeUsd: Number(formData.get("additionalWeightFeeUsd") || 0),
    volumeDivisor: Number(formData.get("volumeDivisor") || 5000),
    minWeightKg: Number(formData.get("minWeightKg") || 0.001),
    deliveryTimeMin: Number(formData.get("deliveryTimeMin") || 7),
    deliveryTimeMax: Number(formData.get("deliveryTimeMax") || 18),
    isActive: formData.get("isActive") === "on"
  };
  const previousChannel = id
    ? await prisma.shippingChannel.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          code: true,
          supportedCountries: true,
          supportedCategories: true,
          forbiddenCategories: true,
          calculationRule: true,
          trackingUrl: true,
          firstWeightKg: true,
          firstWeightFeeUsd: true,
          additionalWeightKg: true,
          additionalWeightFeeUsd: true,
          volumeDivisor: true,
          minWeightKg: true,
          deliveryTimeMin: true,
          deliveryTimeMax: true,
          isActive: true
        }
      })
    : null;
  let channelId = id;

  if (id) {
    await prisma.shippingChannel.update({
      where: { id },
      data
    });
  } else {
    const channel = await prisma.shippingChannel.upsert({
      where: { code: data.code },
      update: data,
      create: data
    });
    channelId = channel.id;
  }
  await createAuditLog({
    actorId: admin?.id,
    actorEmail: admin?.email,
    action: "shipping_channel_updated",
    targetType: "shipping_channel",
    targetId: channelId,
    targetLabel: `${data.name} (${data.code})`,
    oldValue: previousChannel
      ? auditSnapshot({
          name: previousChannel.name,
          code: previousChannel.code,
          supportedCountries: previousChannel.supportedCountries,
          supportedCategories: previousChannel.supportedCategories,
          forbiddenCategories: previousChannel.forbiddenCategories,
          calculationRule: previousChannel.calculationRule,
          trackingUrl: previousChannel.trackingUrl,
          firstWeightKg: Number(previousChannel.firstWeightKg),
          firstWeightFeeUsd: Number(previousChannel.firstWeightFeeUsd),
          additionalWeightKg: Number(previousChannel.additionalWeightKg),
          additionalWeightFeeUsd: Number(previousChannel.additionalWeightFeeUsd),
          volumeDivisor: previousChannel.volumeDivisor,
          minWeightKg: Number(previousChannel.minWeightKg),
          deliveryTimeMin: previousChannel.deliveryTimeMin,
          deliveryTimeMax: previousChannel.deliveryTimeMax,
          isActive: previousChannel.isActive
        })
      : null,
    newValue: auditSnapshot(data),
    message: id ? "Shipping channel updated" : "Shipping channel created"
  });
  revalidateShippingAdminPaths();
}

export async function updateSortOrder(formData: FormData) {
  const entity = String(formData.get("entity") || "");
  const ids = String(formData.get("ids") || "")
    .split(",")
    .map((id) => Number(id))
    .filter((id) => Number.isInteger(id) && id > 0);

  if (!ids.length) throw new Error("No records were provided for sorting.");

  if (entity === "help_articles") {
    await requirePermission("help_articles.manage");
    await prisma.$transaction(
      ids.map((id, index) =>
        prisma.helpArticle.update({
          where: { id },
          data: { sortOrder: index + 1 }
        })
      )
    );
    revalidatePath("/admin/help");
    revalidatePath("/admin/content/help-articles");
    revalidatePath("/admin/content/faq");
    revalidatePath("/help");
    revalidatePath("/");
    return;
  }

  if (entity === "shipping_channels") {
    const admin = await requirePermission("shipping_channels.manage");
    const previous = await prisma.shippingChannel.findMany({
      where: { id: { in: ids } },
      select: { id: true, code: true, sortOrder: true },
      orderBy: [{ sortOrder: "asc" }, { code: "asc" }]
    });
    await prisma.$transaction(
      ids.map((id, index) =>
        prisma.shippingChannel.update({
          where: { id },
          data: { sortOrder: index + 1 }
        })
      )
    );
    await createAuditLog({
      actorId: admin?.id,
      actorEmail: admin?.email,
      action: "shipping_channel_sort_updated",
      targetType: "shipping_channel",
      targetId: "bulk",
      targetLabel: "Shipping channel order",
      oldValue: auditSnapshot({ order: previous.map((item) => ({ id: item.id, code: item.code, sortOrder: item.sortOrder })) }),
      newValue: auditSnapshot({ order: ids.map((id, index) => ({ id, sortOrder: index + 1 })) }),
      message: "Shipping channel sort order updated"
    });
    revalidateShippingAdminPaths();
    return;
  }

  if (entity === "value_added_services") {
    const admin = await requirePermission("value_added_services.manage");
    const previous = await prisma.valueAddedService.findMany({
      where: { id: { in: ids } },
      select: { id: true, code: true, sortOrder: true },
      orderBy: [{ sortOrder: "asc" }, { code: "asc" }]
    });
    await prisma.$transaction(
      ids.map((id, index) =>
        prisma.valueAddedService.update({
          where: { id },
          data: { sortOrder: index + 1 }
        })
      )
    );
    await createAuditLog({
      actorId: admin?.id,
      actorEmail: admin?.email,
      action: "value_added_services_sort_updated",
      targetType: "value_added_service",
      targetId: "bulk",
      targetLabel: "Value-added service order",
      oldValue: auditSnapshot({ order: previous.map((item) => ({ id: item.id, code: item.code, sortOrder: item.sortOrder })) }),
      newValue: auditSnapshot({ order: ids.map((id, index) => ({ id, sortOrder: index + 1 })) }),
      message: "Value-added service sort order updated"
    });
    revalidateValueAddedServicePaths();
    return;
  }

  throw new Error("Unsupported sortable entity.");
}

export async function upsertValueAddedService(formData: FormData) {
  const admin = await requirePermission("value_added_services.manage");
  const id = formData.get("id") ? Number(formData.get("id")) : undefined;
  const data = {
    code: String(formData.get("code") || "").trim().toUpperCase(),
    name: String(formData.get("name") || "").trim(),
    description: String(formData.get("description") || "").trim(),
    applicableRange: String(formData.get("applicableRange") || "").trim() || null,
    chargeStandard: String(formData.get("chargeStandard") || "").trim(),
    priceUsd: Number(formData.get("priceUsd") || 0),
    priceMode: String(formData.get("priceMode") || "per_piece").trim() || "per_piece",
    serviceTime: String(formData.get("serviceTime") || "").trim() || null,
    buyerNotice: String(formData.get("buyerNotice") || "").trim() || null,
    serviceGuarantee: String(formData.get("serviceGuarantee") || "").trim() || null,
    specialNote: String(formData.get("specialNote") || "").trim() || null,
    sortOrder: Number(formData.get("sortOrder") || 0),
    isActive: formData.get("isActive") === "on"
  };

  if (!data.code) throw new Error("Service code is required.");
  if (!data.name) throw new Error("Service name is required.");
  if (!data.description) throw new Error("Description is required.");
  if (!data.chargeStandard) throw new Error("Charge standard is required.");
  if (!Number.isFinite(data.priceUsd) || data.priceUsd < 0) throw new Error("Price must be a non-negative number.");

  const previous = id
    ? await prisma.valueAddedService.findUnique({
        where: { id }
      })
    : null;

  const service = id
    ? await prisma.valueAddedService.update({
        where: { id },
        data
      })
    : await prisma.valueAddedService.upsert({
        where: { code: data.code },
        update: data,
        create: data
      });

  await createAuditLog({
    actorId: admin?.id,
    actorEmail: admin?.email,
    action: id ? "value_added_service_updated" : "value_added_service_created",
    targetType: "value_added_service",
    targetId: service.id,
    targetLabel: `${service.name} (${service.code})`,
    oldValue: previous ? auditSnapshot(previous) : null,
    newValue: auditSnapshot(data),
    message: id ? "Value-added service updated" : "Value-added service created"
  });
  revalidateValueAddedServicePaths();
}

export async function deleteValueAddedService(formData: FormData) {
  const admin = await requirePermission("value_added_services.manage");
  const id = Number(formData.get("id"));
  const service = await prisma.valueAddedService.findUnique({ where: { id } });
  if (!service) throw new Error("Value-added service not found.");

  await prisma.valueAddedService.delete({ where: { id } });
  await createAuditLog({
    actorId: admin?.id,
    actorEmail: admin?.email,
    action: "value_added_service_deleted",
    targetType: "value_added_service",
    targetId: id,
    targetLabel: `${service.name} (${service.code})`,
    oldValue: auditSnapshot(service),
    message: "Value-added service deleted"
  });
  revalidateValueAddedServicePaths();
}

export async function deleteShippingChannel(formData: FormData) {
  await requirePermission("shipping_channels.manage");
  await prisma.shippingChannel.delete({ where: { id: Number(formData.get("id")) } });
  revalidateShippingAdminPaths();
}

export async function upsertShippingRate(formData: FormData) {
  const admin = await requirePermission("shipping_rates.manage");
  const id = formData.get("id") ? Number(formData.get("id")) : undefined;
  const data = {
    channelId: Number(formData.get("channelId")),
    countryCode: String(formData.get("countryCode") || "").trim().toUpperCase(),
    countryName: String(formData.get("countryName") || ""),
    freightRmbPerKg: Number(formData.get("freightRmbPerKg") || 0),
    handlingFeeRmb: Number(formData.get("handlingFeeRmb") || 0),
    startWeightKg: Number(formData.get("startWeightKg") || 0.001),
    maxWeightKg: Number(formData.get("maxWeightKg") || 2)
  };
  const previousRate = id
    ? await prisma.shippingRate.findUnique({
        where: { id },
        include: { channel: { select: { code: true, name: true } } }
      })
    : null;
  await prisma.shippingRate.upsert({
    where: { id: id ?? 0 },
    update: data,
    create: data
  });
  await prisma.shippingChannel.update({
    where: { id: data.channelId },
    data: {
      supportedCountries: await prisma.shippingRate
        .findMany({ where: { channelId: data.channelId }, select: { countryCode: true } })
        .then((rates) => Array.from(new Set([...rates.map((rate) => rate.countryCode), data.countryCode])))
    }
  });
  await createAuditLog({
    actorId: admin?.id,
    actorEmail: admin?.email,
    action: "shipping_rate_rule_updated",
    targetType: "shipping_rate",
    targetId: id ?? `${data.channelId}:${data.countryCode}`,
    targetLabel: `${data.countryName} (${data.countryCode})`,
    oldValue: previousRate
      ? auditSnapshot({
          channelCode: previousRate.channel.code,
          countryCode: previousRate.countryCode,
          countryName: previousRate.countryName,
          freightRmbPerKg: Number(previousRate.freightRmbPerKg),
          handlingFeeRmb: Number(previousRate.handlingFeeRmb),
          startWeightKg: Number(previousRate.startWeightKg),
          maxWeightKg: Number(previousRate.maxWeightKg)
        })
      : null,
    newValue: auditSnapshot(data),
    message: id ? "Shipping rate rule updated" : "Shipping rate rule created"
  });
  revalidateShippingAdminPaths();
}

export async function deleteShippingRate(formData: FormData) {
  await requirePermission("shipping_rates.manage");
  const id = Number(formData.get("id"));
  const rate = await prisma.shippingRate.delete({ where: { id } });
  const remaining = await prisma.shippingRate.findMany({
    where: { channelId: rate.channelId },
    select: { countryCode: true }
  });
  await prisma.shippingChannel.update({
    where: { id: rate.channelId },
    data: { supportedCountries: remaining.map((item) => item.countryCode) }
  });
  revalidateShippingAdminPaths();
}

type ShippingRateRuleImportRow = {
  ruleName?: string;
  channelCode?: string;
  countryCode?: string;
  firstWeightKg?: string;
  firstWeightFee?: string;
  additionalWeightKg?: string;
  additionalWeightFee?: string;
  minChargeWeight?: string;
  volumeDivisor?: string;
  markup?: string;
  status?: string;
};

export async function importShippingRateRules(formData: FormData) {
  const admin = await requirePermission("shipping_rates.manage");
  const rows = JSON.parse(String(formData.get("rows") || "[]")) as ShippingRateRuleImportRow[];
  if (!Array.isArray(rows) || !rows.length) throw new Error("No CSV rows were provided.");

  const parsedRows = rows.map((row, index) => parseShippingRateRuleRow(row, index));
  await prisma.$transaction(async (tx) => {
    for (const row of parsedRows) {
      const channel = await tx.shippingChannel.upsert({
        where: { code: row.channelCode },
        update: {
          name: row.channelName,
          firstWeightKg: row.firstWeightKg,
          firstWeightFeeUsd: row.firstWeightFee,
          additionalWeightKg: row.additionalWeightKg,
          additionalWeightFeeUsd: row.additionalWeightFee,
          minWeightKg: row.minChargeWeight,
          volumeDivisor: row.volumeDivisor,
          isActive: row.isActive
        },
        create: {
          name: row.channelName,
          code: row.channelCode,
          supportedCountries: [row.countryCode],
          supportedCategories: ["general"],
          forbiddenCategories: [],
          calculationRule: "chargeable_weight * freight_rmb_per_kg + handling_fee_rmb",
          firstWeightKg: row.firstWeightKg,
          firstWeightFeeUsd: row.firstWeightFee,
          additionalWeightKg: row.additionalWeightKg,
          additionalWeightFeeUsd: row.additionalWeightFee,
          minWeightKg: row.minChargeWeight,
          volumeDivisor: row.volumeDivisor,
          deliveryTimeMin: 7,
          deliveryTimeMax: 18,
          isActive: row.isActive
        }
      });

      const currentCountries = Array.isArray(channel.supportedCountries) ? channel.supportedCountries.map(String) : [];
      if (!currentCountries.includes(row.countryCode)) {
        await tx.shippingChannel.update({
          where: { id: channel.id },
          data: { supportedCountries: [...currentCountries, row.countryCode] }
        });
      }

      await tx.shippingRate.upsert({
        where: {
          channelId_countryCode: {
            channelId: channel.id,
            countryCode: row.countryCode
          }
        },
        update: {
          countryName: row.countryName,
          freightRmbPerKg: row.additionalWeightFee,
          handlingFeeRmb: row.markup,
          startWeightKg: row.minChargeWeight,
          maxWeightKg: 999
        },
        create: {
          channelId: channel.id,
          countryCode: row.countryCode,
          countryName: row.countryName,
          freightRmbPerKg: row.additionalWeightFee,
          handlingFeeRmb: row.markup,
          startWeightKg: row.minChargeWeight,
          maxWeightKg: 999
        }
      });
    }
  });

  await createAuditLog({
    actorId: admin?.id,
    actorEmail: admin?.email,
    action: "shipping_rate_rules_imported",
    targetType: "shipping_rate",
    targetId: "csv_import",
    targetLabel: `${parsedRows.length} shipping rate rules`,
    oldValue: null,
    newValue: auditSnapshot({
      count: parsedRows.length,
      channels: Array.from(new Set(parsedRows.map((row) => row.channelCode))),
      countries: Array.from(new Set(parsedRows.map((row) => row.countryCode)))
    }),
    message: "Shipping rate rules imported from CSV"
  });
  revalidateShippingAdminPaths();
}

function parseShippingRateRuleRow(row: ShippingRateRuleImportRow, index: number) {
  const rowNumber = index + 2;
  const channelCode = String(row.channelCode || "").trim().toUpperCase();
  const countryCode = String(row.countryCode || "").trim().toUpperCase();
  const status = String(row.status || "").trim().toLowerCase();
  const ruleName = String(row.ruleName || "").trim();
  const firstWeightKg = readPositiveNumber(row.firstWeightKg, "firstWeightKg", rowNumber);
  const firstWeightFee = readNonNegativeNumber(row.firstWeightFee, "firstWeightFee", rowNumber);
  const additionalWeightKg = readPositiveNumber(row.additionalWeightKg, "additionalWeightKg", rowNumber);
  const additionalWeightFee = readNonNegativeNumber(row.additionalWeightFee, "additionalWeightFee", rowNumber);
  const minChargeWeight = readPositiveNumber(row.minChargeWeight, "minChargeWeight", rowNumber);
  const volumeDivisor = Math.round(readPositiveNumber(row.volumeDivisor, "volumeDivisor", rowNumber));
  const markup = readNonNegativeNumber(row.markup, "markup", rowNumber);

  if (!ruleName) throw new Error(`Row ${rowNumber}: ruleName is required.`);
  if (!channelCode) throw new Error(`Row ${rowNumber}: channelCode is required.`);
  if (!/^[A-Z0-9_-]{2,32}$/.test(channelCode)) throw new Error(`Row ${rowNumber}: channelCode format is invalid.`);
  if (!/^[A-Z]{2}$/.test(countryCode)) throw new Error(`Row ${rowNumber}: countryCode must be ISO2, for example US.`);
  if (!["active", "inactive"].includes(status)) throw new Error(`Row ${rowNumber}: status must be active or inactive.`);

  return {
    ruleName,
    channelName: ruleName || channelCode,
    channelCode,
    countryCode,
    countryName: countryName(countryCode),
    firstWeightKg,
    firstWeightFee,
    additionalWeightKg,
    additionalWeightFee,
    minChargeWeight,
    volumeDivisor,
    markup,
    isActive: status === "active"
  };
}

function readPositiveNumber(value: unknown, field: string, rowNumber: number) {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue) || numberValue <= 0) throw new Error(`Row ${rowNumber}: ${field} must be greater than 0.`);
  return numberValue;
}

function readNonNegativeNumber(value: unknown, field: string, rowNumber: number) {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue) || numberValue < 0) throw new Error(`Row ${rowNumber}: ${field} must be 0 or greater.`);
  return numberValue;
}

export async function importDgeubRates() {
  await requirePermission("shipping_rates.manage");
  await prisma.shippingChannel.deleteMany({ where: { code: { not: "DGEUB" } } });
  const channel = await prisma.shippingChannel.upsert({
    where: { code: "DGEUB" },
    update: {
      name: "广州E邮宝（DGEUB）",
      supportedCountries: dgeubSupportedCountries,
      supportedCategories: ["general", "fashion", "accessories"],
      forbiddenCategories: ["battery", "liquid", "powder", "brand", "food", "medicine"],
      calculationRule: "chargeable_weight * freight_rmb_per_kg + handling_fee_rmb",
      notesHtml: dgeubNotesHtml,
      trackingUrl: "https://www.17track.net/zh-cn",
      firstWeightKg: 0.001,
      firstWeightFeeUsd: 0,
      additionalWeightKg: 1,
      additionalWeightFeeUsd: 0,
      volumeDivisor: 5000,
      minWeightKg: 0.001,
      deliveryTimeMin: 7,
      deliveryTimeMax: 18,
      isActive: true
    },
    create: {
      name: "广州E邮宝（DGEUB）",
      code: "DGEUB",
      supportedCountries: dgeubSupportedCountries,
      supportedCategories: ["general", "fashion", "accessories"],
      forbiddenCategories: ["battery", "liquid", "powder", "brand", "food", "medicine"],
      calculationRule: "chargeable_weight * freight_rmb_per_kg + handling_fee_rmb",
      notesHtml: dgeubNotesHtml,
      trackingUrl: "https://www.17track.net/zh-cn",
      firstWeightKg: 0.001,
      firstWeightFeeUsd: 0,
      additionalWeightKg: 1,
      additionalWeightFeeUsd: 0,
      volumeDivisor: 5000,
      minWeightKg: 0.001,
      deliveryTimeMin: 7,
      deliveryTimeMax: 18,
      isActive: true
    }
  });

  for (const rate of dgeubRates) {
    await prisma.shippingRate.upsert({
      where: {
        channelId_countryCode: {
          channelId: channel.id,
          countryCode: rate.countryCode
        }
      },
      update: rate,
      create: { ...rate, channelId: channel.id }
    });
  }
  revalidateShippingAdminPaths();
}

export async function upsertHelpArticle(formData: FormData) {
  await requirePermission("help_articles.manage");
  await ensureHelpArticleDescriptions();
  const locales = await getEnabledFrontendLocaleConfigsRuntime();
  const id = formData.get("id") ? Number(formData.get("id")) : undefined;
  const baseLocale = "en";
  const category = String(formData.get("category") || "");
  const published = formData.get("isPublished") === "on";
  const englishTitle = String(formData.get(`title:${baseLocale}`) || "").trim();
  const englishSlug = String(formData.get(`slug:${baseLocale}`) || "").trim();
  const englishExcerpt = String(formData.get(`excerpt:${baseLocale}`) || "").trim();
  const englishContent = String(formData.get(`content:${baseLocale}`) || "").trim();

  const article = await prisma.helpArticle.upsert({
    where: { id: id ?? 0 },
    update: {
      slug: englishSlug,
      title: englishTitle,
      category,
      excerpt: englishExcerpt,
      content: englishContent,
      locale: baseLocale,
      isPublished: published
    },
    create: {
      slug: englishSlug,
      title: englishTitle,
      category,
      excerpt: englishExcerpt,
      content: englishContent,
      locale: baseLocale,
      isPublished: published
    }
  });

  for (const locale of locales) {
    const title = String(formData.get(`title:${locale.locale}`) || "").trim();
    const slug = String(formData.get(`slug:${locale.locale}`) || "").trim();
    const excerpt = String(formData.get(`excerpt:${locale.locale}`) || "").trim();
    const content = String(formData.get(`content:${locale.locale}`) || "").trim();
    const translationStatus = String(formData.get(`translationStatus:${locale.locale}`) || (published ? "published" : "draft"));

    if (!title || !slug || !content) {
      await prisma.helpArticleDescription.deleteMany({
        where: {
          helpArticleId: article.id,
          languageCode: locale.locale
        }
      });
      continue;
    }

    await prisma.helpArticleDescription.upsert({
      where: {
        helpArticleId_languageCode: {
          helpArticleId: article.id,
          languageCode: locale.locale
        }
      },
      update: {
        title,
        slug,
        summary: excerpt,
        content,
        translationStatus
      },
      create: {
        helpArticleId: article.id,
        languageCode: locale.locale,
        title,
        slug,
        summary: excerpt,
        content,
        translationStatus
      }
    });
  }

  revalidatePath("/admin/help");
  revalidatePath("/admin/content/help-articles");
  revalidatePath("/admin/content/faq");
  revalidatePath("/help");
  revalidatePath(`/help/${englishSlug}`);
  revalidatePath("/");
}

export async function deleteHelpArticle(formData: FormData) {
  await requirePermission("help_articles.manage");
  const id = Number(formData.get("id"));
  const article = await prisma.helpArticle.delete({ where: { id } });
  revalidatePath("/admin/help");
  revalidatePath("/admin/content/help-articles");
  revalidatePath("/admin/content/faq");
  revalidatePath("/help");
  revalidatePath(`/help/${article.slug}`);
  revalidatePath("/");
}

export async function upsertPage(formData: FormData) {
  await requirePermission("pages.manage");
  await ensurePageDescriptions();
  const locales = await getEnabledFrontendLocaleConfigsRuntime();
  const id = formData.get("id") ? Number(formData.get("id")) : undefined;
  const baseLocale = "en";
  const published = formData.get("isPublished") === "on";
  const englishTitle = String(formData.get(`title:${baseLocale}`) || "").trim();
  const englishSlug = String(formData.get(`slug:${baseLocale}`) || "").trim();
  const englishContent = String(formData.get(`contentHtml:${baseLocale}`) || "").trim();

  const page = await prisma.page.upsert({
    where: { id: id ?? 0 },
    update: {
      slug: englishSlug,
      title: englishTitle,
      contentHtml: englishContent,
      isPublished: published
    },
    create: {
      slug: englishSlug,
      title: englishTitle,
      contentHtml: englishContent,
      isPublished: published
    }
  });

  for (const locale of locales) {
    const title = String(formData.get(`title:${locale.locale}`) || "").trim();
    const slug = String(formData.get(`slug:${locale.locale}`) || "").trim();
    const contentHtml = String(formData.get(`contentHtml:${locale.locale}`) || "").trim();
    const translationStatus = String(formData.get(`translationStatus:${locale.locale}`) || (published ? "published" : "draft"));

    if (!title || !slug || !contentHtml) {
      await prisma.pageDescription.deleteMany({
        where: {
          pageId: page.id,
          languageCode: locale.locale
        }
      });
      continue;
    }

    await prisma.pageDescription.upsert({
      where: {
        pageId_languageCode: {
          pageId: page.id,
          languageCode: locale.locale
        }
      },
      update: {
        title,
        slug,
        contentHtml,
        translationStatus
      },
      create: {
        pageId: page.id,
        languageCode: locale.locale,
        title,
        slug,
        contentHtml,
        translationStatus
      }
    });
  }

  revalidatePath("/admin/pages");
  revalidatePath("/admin/content/announcements");
  revalidatePath(`/page/${englishSlug}`);
}

export async function deletePage(formData: FormData) {
  await requirePermission("pages.manage");
  const id = Number(formData.get("id"));
  const page = await prisma.page.delete({ where: { id } });
  revalidatePath("/admin/pages");
  revalidatePath("/admin/content/announcements");
  revalidatePath(`/page/${page.slug}`);
}

export async function addWalletAdjustment(formData: FormData) {
  const admin = await requirePermission("refunds.approve");
  await adjustWallet(
    Number(formData.get("userId")),
    Number(formData.get("amount")),
    String(formData.get("type") ?? "manual_adjustment"),
    String(formData.get("note") ?? "Admin adjustment"),
    admin?.id
  );
  revalidateFinanceAdminPaths();
}

export async function confirmWalletRechargePayment(formData: FormData) {
  const admin = await requirePermission("refunds.approve");
  const id = Number(formData.get("id"));
  if (!id) throw new Error("Missing payment id");

  await prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findUnique({ where: { id } });
    if (!payment) throw new Error("Payment not found");
    if (payment.type !== "wallet_recharge") throw new Error("This payment is not a wallet recharge");
    if (payment.status === "paid") return;

    const amount = roundMoney(Number(payment.amount));
    if (amount <= 0) throw new Error("Invalid recharge amount");

    const user = await tx.user.findUniqueOrThrow({ where: { id: payment.userId } });
    const balanceAfter = roundMoney(Number(user.walletBalance) + amount);

    await tx.user.update({
      where: { id: payment.userId },
      data: { walletBalance: balanceAfter }
    });
    await tx.walletTransaction.create({
      data: {
        userId: payment.userId,
        type: "recharge",
        amount,
        currency: payment.currency,
        balanceAfter,
        note: `Wallet recharge confirmed: ${payment.paymentNo}`,
        createdBy: admin?.id
      }
    });
    await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: "paid",
        paidAt: new Date(),
        callbackPayload: {
          confirmedBy: admin?.email ?? "admin",
          source: "admin_wallet_recharge_confirmation"
        }
      }
    });
  });

  revalidateFinanceAdminPaths();
}

export async function refundPayPalPaymentAction(formData: FormData) {
  const admin = await requirePermission("refunds.approve");
  const paymentId = Number(formData.get("paymentId") || 0);
  const amountValue = String(formData.get("amount") || "").trim();

  if (!Number.isInteger(paymentId) || paymentId <= 0) {
    throw new Error("Invalid payment id.");
  }

  const amount = amountValue ? Number(amountValue) : undefined;
  if (amountValue && (!Number.isFinite(amount) || (amount ?? 0) <= 0)) {
    throw new Error("Invalid refund amount.");
  }

  const result = await refundPayPalPayment(paymentId, amount);

  await createAuditLog({
    actorId: admin.id,
    action: "payment_refunded",
    targetType: "payment",
    targetId: paymentId,
    detail: `Admin refunded PayPal payment ${paymentId} (${result.amount})`
  });

  revalidateFinanceAdminPaths();
  revalidateOrderAdminPaths();
}
