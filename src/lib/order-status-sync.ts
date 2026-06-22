import { money, roundMoney } from "@/lib/currency";
import { prisma } from "@/lib/db";

export type WorkflowData = Record<string, string | number | Date | null | undefined>;
export type ManualDerivationOrderSnapshot = {
  totalUsd: { toString(): string };
  paidUsd: { toString(): string };
  unpaidUsd: { toString(): string };
  paymentStatus: string;
  purchaseStatus: string;
  warehouseStatus: string;
  packageStatus: string;
  shippingPaymentStatus: string;
  shippingStatus: string;
  riskStatus: string;
  refundStatus: string;
  paidAt: Date | null;
  purchasedAt: Date | null;
  warehouseReceivedAt: Date | null;
  shippedAt: Date | null;
  completedAt: Date | null;
  cancelledAt: Date | null;
};

export function normalizeEditableProductPaymentStatus(value?: string | null) {
  if (value === "paid" || value === "paid_product") return "paid";
  if (value === "failed") return "failed";
  if (value === "refund" || value === "refunded") return "refund";
  return "pending";
}

export function normalizeEditableShippingPaymentStatus(value?: string | null) {
  if (value === "paid" || value === "international_freight_paid") return "paid";
  if (value === "failed") return "failed";
  if (value === "refund" || value === "refunded") return "refund";
  return "pending";
}

export function normalizeEditablePackageStatus(value?: string | null) {
  if (value === "waiting_shipping_payment" || value === "shipping_paid") return "created";
  if (value === "none" || value === "pending" || value === "created" || value === "shipped" || value === "delivered" || value === "abnormal") {
    return value;
  }
  return "pending";
}

export function packageStatusToOrderData(status: string) {
  if (status === "waiting_shipping_payment") {
    return {
      orderStatus: "international_freight_pending",
      packageStatus: "waiting_shipping_payment",
      shippingPaymentStatus: "international_freight_pending",
      shippingStatus: "pending",
      status: "shipping_pending"
    };
  }
  if (status === "shipping_paid") {
    return {
      orderStatus: "international_freight_paid",
      packageStatus: "shipping_paid",
      shippingPaymentStatus: "international_freight_paid",
      shippingStatus: "ready_to_ship",
      status: "shipping_paid"
    };
  }
  if (status === "shipped") return { orderStatus: "shipped", packageStatus: "shipped", shippingPaymentStatus: "international_freight_paid", shippingStatus: "shipped", status: "shipped" };
  if (status === "delivered") return { orderStatus: "completed", packageStatus: "delivered", shippingPaymentStatus: "international_freight_paid", shippingStatus: "delivered", status: "completed" };
  if (status === "returned") return { orderStatus: "order_after_sales", packageStatus: "shipped", shippingStatus: "returned", status: "abnormal" };
  if (status === "cancelled") return { orderStatus: "cancel", packageStatus: "none", shippingPaymentStatus: "pending", shippingStatus: "none", status: "cancelled" };
  if (status === "abnormal") return { orderStatus: "abnormal", packageStatus: "abnormal", shippingStatus: "exception", status: "abnormal" };
  return {
    orderStatus: "warehouse_received",
    packageStatus: "created",
    shippingPaymentStatus: "none",
    shippingStatus: "none",
    status: "package_created"
  };
}

export function syncOrderDataForProductPayment(params: {
  amountPaidUsd: number;
  totalUsd: number;
  previousPaidUsd?: number;
}) {
  const paidTotal = roundMoney((params.previousPaidUsd ?? 0) + params.amountPaidUsd);
  const unpaidTotal = roundMoney(Math.max(params.totalUsd - paidTotal, 0));
  const isFullyPaid = unpaidTotal <= 0.01;

  return {
    paymentStatus: isFullyPaid ? "paid" : "partial",
    orderStatus: isFullyPaid ? "paid" : "pending_payment",
    status: isFullyPaid ? "paid" : "pending_payment",
    paidUsd: paidTotal,
    unpaidUsd: isFullyPaid ? 0 : unpaidTotal
  };
}

export function syncOrderDataForShippingPayment(params: {
  amountPaidUsd: number;
  packageStatus?: string;
}) {
  const packageStatus = params.packageStatus === "shipped" || params.packageStatus === "delivered"
    ? params.packageStatus
    : "shipping_paid";

  return {
    ...packageStatusToOrderData(packageStatus),
    actualShippingUsd: roundMoney(params.amountPaidUsd)
  };
}

export function applyManualOrderStatusDerivations(
  previousOrder: ManualDerivationOrderSnapshot,
  data: WorkflowData,
  now = new Date()
) {
  const totalUsd = Number(previousOrder.totalUsd);
  const previousPaidUsd = Number(previousOrder.paidUsd);
  const previousUnpaidUsd = Number(previousOrder.unpaidUsd);
  const paidUsdWasManuallyChanged = data.paidUsd !== undefined && Number(data.paidUsd) !== previousPaidUsd;
  const unpaidUsdWasManuallyChanged = data.unpaidUsd !== undefined && Number(data.unpaidUsd) !== previousUnpaidUsd;
  const nextPaymentStatus = normalizeEditableProductPaymentStatus(String(data.paymentStatus ?? previousOrder.paymentStatus));
  const nextWarehouseStatus = String(data.warehouseStatus ?? previousOrder.warehouseStatus);
  const nextShippingPaymentStatus = normalizeEditableShippingPaymentStatus(String(data.shippingPaymentStatus ?? previousOrder.shippingPaymentStatus));
  const nextShippingStatus = String(data.shippingStatus ?? previousOrder.shippingStatus);

  if (data.paymentStatus !== undefined) {
    if (nextPaymentStatus === "paid") {
      data.paymentStatus = "paid";
      if (!paidUsdWasManuallyChanged) data.paidUsd = totalUsd;
      if (!unpaidUsdWasManuallyChanged) data.unpaidUsd = 0;
      if (!previousOrder.paidAt && data.paidAt === undefined) data.paidAt = now;
    } else if (nextPaymentStatus === "pending") {
      data.paymentStatus = "pending";
      if (!paidUsdWasManuallyChanged) data.paidUsd = 0;
      if (!unpaidUsdWasManuallyChanged) data.unpaidUsd = totalUsd;
      if (data.paidAt === undefined) data.paidAt = null;
    } else if (nextPaymentStatus === "refund") {
      data.paymentStatus = "refunded";
    }
  }

  if (data.shippingPaymentStatus !== undefined) {
    if (nextShippingPaymentStatus === "paid") {
      data.shippingPaymentStatus = "international_freight_paid";
      if (data.shippingStatus === undefined && nextShippingStatus === "none") data.shippingStatus = "ready_to_ship";
    } else if (nextShippingPaymentStatus === "pending") {
      data.shippingPaymentStatus = "pending";
      if (data.shippingStatus === undefined && ["ready_to_ship", "none"].includes(nextShippingStatus)) data.shippingStatus = "pending";
    } else if (nextShippingPaymentStatus === "refund") {
      data.shippingPaymentStatus = "refund";
    }
  }

  const resolvedPaymentStatus = normalizeEditableProductPaymentStatus(String(data.paymentStatus ?? previousOrder.paymentStatus));
  const resolvedShippingPaymentStatus = normalizeEditableShippingPaymentStatus(String(data.shippingPaymentStatus ?? previousOrder.shippingPaymentStatus));
  const resolvedPurchaseStatus = String(data.purchaseStatus ?? previousOrder.purchaseStatus);
  const resolvedWarehouseStatus = String(data.warehouseStatus ?? previousOrder.warehouseStatus);
  const resolvedPackageStatus = normalizeEditablePackageStatus(String(data.packageStatus ?? previousOrder.packageStatus));
  const resolvedShippingStatus = String(data.shippingStatus ?? previousOrder.shippingStatus);
  const resolvedRiskStatus = String(data.riskStatus ?? previousOrder.riskStatus);
  const resolvedRefundStatus = String(data.refundStatus ?? previousOrder.refundStatus);

  if (resolvedPurchaseStatus === "purchased" && !previousOrder.purchasedAt && data.purchasedAt === undefined) {
    data.purchasedAt = now;
  }

  if (resolvedWarehouseStatus === "received" && !previousOrder.warehouseReceivedAt && data.warehouseReceivedAt === undefined) {
    data.warehouseReceivedAt = now;
  }

  if (resolvedShippingStatus === "shipped" && !previousOrder.shippedAt && data.shippedAt === undefined) {
    data.shippedAt = now;
  }

  if (resolvedShippingStatus === "delivered" && !previousOrder.completedAt && data.completedAt === undefined) {
    data.completedAt = now;
  }

  if (resolvedRefundStatus === "refunded" || resolvedPaymentStatus === "refund") {
    data.orderStatus = "refund";
    data.status = "refunded";
    if (data.paymentStatus === undefined) data.paymentStatus = "refunded";
    return data;
  }

  if (resolvedRiskStatus === "rejected") {
    data.orderStatus = "order_after_sales";
    data.status = "cancelled";
    if (data.cancelledAt === undefined && !previousOrder.cancelledAt) data.cancelledAt = now;
    return data;
  }

  if (resolvedRiskStatus === "pending_review") {
    data.orderStatus = "paid_product";
    data.status = "reviewing";
    return data;
  }

  if (["failed", "out_of_stock", "price_changed"].includes(resolvedPurchaseStatus) || nextWarehouseStatus === "abnormal") {
    data.orderStatus = "abnormal";
    data.status = "abnormal";
    return data;
  }

  if (resolvedPaymentStatus !== "paid") {
    data.packageStatus = "none";
    data.shippingPaymentStatus = "none";
    data.shippingStatus = "none";
    data.orderStatus = "pending_payment";
    data.status = "pending_payment";
    return data;
  }

  if (resolvedPurchaseStatus === "pending") {
    data.packageStatus = "none";
    data.shippingPaymentStatus = "none";
    data.shippingStatus = "none";
    data.orderStatus = "paid_product";
    data.status = resolvedRiskStatus === "pending_review" ? "reviewing" : "paid";
    return data;
  }

  if (resolvedPurchaseStatus === "purchasing") {
    data.packageStatus = "none";
    data.shippingPaymentStatus = "none";
    data.shippingStatus = "none";
    data.orderStatus = "purchasing";
    data.status = "purchasing";
    return data;
  }

  if (resolvedPurchaseStatus === "partial_purchased") {
    data.packageStatus = "none";
    data.shippingPaymentStatus = "none";
    data.shippingStatus = "none";
    data.orderStatus = "partial_purchased";
    data.status = "purchasing";
    return data;
  }

  if (resolvedPurchaseStatus === "purchased" && resolvedWarehouseStatus !== "received") {
    data.packageStatus = "none";
    data.shippingPaymentStatus = "none";
    data.shippingStatus = "none";
    data.orderStatus = "purchased";
    data.status = resolvedWarehouseStatus === "partial_received" ? "warehouse_pending" : "purchased";
    return data;
  }

  if (resolvedShippingStatus === "delivered") {
    data.orderStatus = "completed";
    data.status = "completed";
    if (data.packageStatus === undefined) data.packageStatus = "delivered";
    if (data.shippingPaymentStatus === undefined) data.shippingPaymentStatus = "international_freight_paid";
    return data;
  }

  if (["shipped", "in_transit", "customs_clearance", "delivery_attempted"].includes(resolvedShippingStatus)) {
    data.orderStatus = "shipped";
    data.status = "shipped";
    if (data.packageStatus === undefined) data.packageStatus = "shipped";
    if (data.shippingPaymentStatus === undefined) data.shippingPaymentStatus = "international_freight_paid";
    return data;
  }

  if (resolvedShippingStatus === "ready_to_ship" || resolvedShippingPaymentStatus === "paid") {
    data.orderStatus = "international_freight_paid";
    data.status = "shipping_paid";
    if (data.shippingStatus === undefined) data.shippingStatus = "ready_to_ship";
    return data;
  }

  if (resolvedWarehouseStatus === "received" && (resolvedPackageStatus === "created" || resolvedShippingPaymentStatus === "pending")) {
    data.orderStatus = "international_freight_pending";
    data.status = "shipping_pending";
    if (data.shippingStatus === undefined) data.shippingStatus = "pending";
    return data;
  }

  if (resolvedWarehouseStatus === "received") {
    data.orderStatus = "warehouse_received";
    data.status = "warehouse_received";
    return data;
  }

  data.orderStatus = "pending_payment";
  data.status = "pending_payment";
  return data;
}

export function syncOrderDataFromManualInputs(params: {
  previousOrder: ManualDerivationOrderSnapshot;
  data: WorkflowData;
  now?: Date;
}) {
  applyManualOrderStatusDerivations(params.previousOrder, params.data, params.now);

  const normalizedProductPayment = normalizeEditableProductPaymentStatus(String(params.data.paymentStatus ?? params.previousOrder.paymentStatus));
  const normalizedShippingPayment = normalizeEditableShippingPaymentStatus(String(params.data.shippingPaymentStatus ?? params.previousOrder.shippingPaymentStatus));
  const normalizedPackageStatus = String(params.data.packageStatus ?? params.previousOrder.packageStatus);

  if (normalizedProductPayment === "paid" && (params.data.paidUsd === undefined || Number(params.data.paidUsd) <= 0)) {
    const next = syncOrderDataForProductPayment({
      amountPaidUsd: Number(params.previousOrder.totalUsd),
      totalUsd: Number(params.previousOrder.totalUsd),
      previousPaidUsd: 0
    });
    params.data.paymentStatus = next.paymentStatus;
    params.data.orderStatus = next.orderStatus;
    params.data.status = next.status;
    params.data.paidUsd = next.paidUsd;
    params.data.unpaidUsd = next.unpaidUsd;
  }

  if (normalizedShippingPayment === "paid" || ["shipping_paid", "shipped", "delivered"].includes(normalizedPackageStatus)) {
    const next = syncOrderDataForShippingPayment({
      amountPaidUsd: Number(params.data.actualShippingUsd ?? 0),
      packageStatus: normalizedPackageStatus
    });
    params.data.orderStatus = next.orderStatus;
    params.data.packageStatus = next.packageStatus;
    params.data.shippingPaymentStatus = next.shippingPaymentStatus;
    params.data.shippingStatus = next.shippingStatus;
    params.data.status = next.status;
    if (params.data.actualShippingUsd === undefined) {
      params.data.actualShippingUsd = next.actualShippingUsd;
    }
  }

  return params.data;
}

export function createManualDerivationSnapshot(
  overrides: Partial<ManualDerivationOrderSnapshot> = {}
): ManualDerivationOrderSnapshot {
  return {
    totalUsd: { toString: () => "100" },
    paidUsd: { toString: () => "0" },
    unpaidUsd: { toString: () => "100" },
    paymentStatus: "pending",
    purchaseStatus: "pending",
    warehouseStatus: "pending",
    packageStatus: "none",
    shippingPaymentStatus: "none",
    shippingStatus: "none",
    riskStatus: "normal",
    refundStatus: "none",
    paidAt: null,
    purchasedAt: null,
    warehouseReceivedAt: null,
    shippedAt: null,
    completedAt: null,
    cancelledAt: null,
    ...overrides
  };
}

export function runOrderStatusSyncAssertions() {
  const checks: Array<{ name: string; run: () => void }> = [
    {
      name: "full product payment becomes paid",
      run: () => {
        const result = syncOrderDataForProductPayment({ amountPaidUsd: 100, totalUsd: 100, previousPaidUsd: 0 });
        if (result.paymentStatus !== "paid" || result.orderStatus !== "paid" || result.unpaidUsd !== 0) {
          throw new Error(`Unexpected payment result: ${JSON.stringify(result)}`);
        }
      }
    },
    {
      name: "shipping paid package maps to ready_to_ship",
      run: () => {
        const result = syncOrderDataForShippingPayment({ amountPaidUsd: 12.5 });
        if (result.orderStatus !== "international_freight_paid" || result.shippingStatus !== "ready_to_ship") {
          throw new Error(`Unexpected shipping result: ${JSON.stringify(result)}`);
        }
      }
    },
    {
      name: "manual risk review maps to reviewing",
      run: () => {
        const data: WorkflowData = { paymentStatus: "paid", riskStatus: "pending_review" };
        const previous = createManualDerivationSnapshot({
          paymentStatus: "paid",
          paidUsd: { toString: () => "100" },
          unpaidUsd: { toString: () => "0" }
        });
        const result = applyManualOrderStatusDerivations(previous, data);
        if (result.orderStatus !== "paid_product" || result.status !== "reviewing") {
          throw new Error(`Unexpected review result: ${JSON.stringify(result)}`);
        }
      }
    },
    {
      name: "manual delivered shipping maps to completed",
      run: () => {
        const data: WorkflowData = {
          paymentStatus: "paid",
          purchaseStatus: "purchased",
          warehouseStatus: "received",
          shippingPaymentStatus: "international_freight_paid",
          shippingStatus: "delivered"
        };
        const previous = createManualDerivationSnapshot({
          paymentStatus: "paid",
          paidUsd: { toString: () => "100" },
          unpaidUsd: { toString: () => "0" },
          purchaseStatus: "purchased",
          warehouseStatus: "received",
          shippingPaymentStatus: "international_freight_paid"
        });
        const result = applyManualOrderStatusDerivations(previous, data);
        if (result.orderStatus !== "completed" || result.status !== "completed") {
          throw new Error(`Unexpected delivered result: ${JSON.stringify(result)}`);
        }
      }
    },
    {
      name: "partial product payment remains partial and pending_payment",
      run: () => {
        const result = syncOrderDataForProductPayment({ amountPaidUsd: 40, totalUsd: 100, previousPaidUsd: 0 });
        if (result.paymentStatus !== "partial" || result.orderStatus !== "pending_payment" || result.unpaidUsd !== 60) {
          throw new Error(`Unexpected partial payment result: ${JSON.stringify(result)}`);
        }
      }
    },
    {
      name: "rejected risk becomes after-sales cancelled",
      run: () => {
        const previous = createManualDerivationSnapshot({
          paymentStatus: "paid",
          paidUsd: { toString: () => "100" },
          unpaidUsd: { toString: () => "0" }
        });
        const data: WorkflowData = {
          paymentStatus: "paid",
          riskStatus: "rejected",
          cancelledAt: new Date()
        };
        const result = applyManualOrderStatusDerivations(previous, data);
        if (result.orderStatus !== "order_after_sales" || result.status !== "cancelled") {
          throw new Error(`Unexpected rejected risk result: ${JSON.stringify(result)}`);
        }
      }
    },
    {
      name: "manual shipping-paid sync becomes ready_to_ship",
      run: () => {
        const previous = createManualDerivationSnapshot({
          paymentStatus: "paid",
          paidUsd: { toString: () => "100" },
          unpaidUsd: { toString: () => "0" },
          purchaseStatus: "purchased",
          warehouseStatus: "received",
          packageStatus: "created"
        });
        const data: WorkflowData = {
          paymentStatus: "paid",
          purchaseStatus: "purchased",
          warehouseStatus: "received",
          packageStatus: "shipping_paid",
          actualShippingUsd: 15
        };
        const result = syncOrderDataFromManualInputs({ previousOrder: previous, data });
        if (result.orderStatus !== "international_freight_paid" || result.shippingStatus !== "ready_to_ship") {
          throw new Error(`Unexpected manual shipping sync result: ${JSON.stringify(result)}`);
        }
      }
    }
  ];

  for (const check of checks) {
    check.run();
  }

  return checks.map((check) => check.name);
}

export async function syncOrderFromPackage(packageId: number, actorId?: number) {
  const pkg = await prisma.package.findUnique({
    where: { id: packageId },
    include: { order: true }
  });
  if (!pkg?.orderId) return;

  await prisma.order.update({
    where: { id: pkg.orderId },
    data: {
      ...packageStatusToOrderData(pkg.status),
      actualShippingUsd: Number(pkg.shippingFeeUsd),
      shippedAt: pkg.status === "shipped" && !pkg.order?.shippedAt ? new Date() : undefined,
      completedAt: pkg.status === "delivered" && !pkg.order?.completedAt ? new Date() : undefined,
      logs: {
        create: {
          actorId,
          action: "package_updated",
          detail: `Package ${pkg.packageNo} updated to ${pkg.status}${pkg.trackingNumber ? `, tracking ${pkg.trackingNumber}` : ""}`
        }
      }
    }
  });
}

export async function syncOrderFromPayment(
  paymentId: number,
  options: {
    paidAt?: Date;
    actorId?: number;
    gatewayLabel?: string;
    gatewayRef?: string;
  } = {}
) {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: {
      order: true,
      package: true
    }
  });
  if (!payment?.orderId || !payment.order) return;

  const paidAt = options.paidAt;
  const gatewayLabel = options.gatewayLabel || payment.provider;
  const gatewayRef = options.gatewayRef || payment.gatewayOrderNo || payment.providerOrderNo || payment.paymentNo;
  const amountUsd = roundMoney(Number(payment.amount));

  if (payment.type === "shipping" && payment.packageId) {
    await prisma.$transaction(async (tx) => {
      const pkg = await tx.package.findUnique({
        where: { id: payment.packageId! },
        select: { id: true, orderId: true, status: true }
      });
      if (!pkg?.orderId) return;

      const nextPackageStatus = pkg.status === "shipped" || pkg.status === "delivered" ? pkg.status : "shipping_paid";

      if (pkg.status !== nextPackageStatus || Number(payment.package?.shippingFeeUsd ?? 0) !== amountUsd) {
        await tx.package.update({
          where: { id: pkg.id },
          data: {
            status: nextPackageStatus,
            shippingFeeUsd: amountUsd
          }
        });
      }

      await tx.order.update({
        where: { id: pkg.orderId },
        data: {
          ...syncOrderDataForShippingPayment({
            amountPaidUsd: amountUsd,
            packageStatus: nextPackageStatus
          }),
          paidAt: paidAt ?? undefined,
          logs: {
            create: {
              actorId: options.actorId ?? payment.userId,
              action: "shipping_payment_paid",
              detail: `${gatewayLabel} shipping paid ${money(amountUsd, payment.currency)} (${gatewayRef})`
            }
          }
        }
      });
    });
    return;
  }

  await prisma.order.update({
    where: { id: payment.orderId },
    data: {
      ...syncOrderDataForProductPayment({
        amountPaidUsd: amountUsd,
        totalUsd: Number(payment.order.totalUsd),
        previousPaidUsd: Number(payment.order.paidUsd)
      }),
      paidAt: paidAt ?? undefined,
      logs: {
        create: {
          actorId: options.actorId ?? payment.userId,
          action: "payment_paid",
          detail: `${gatewayLabel} paid ${money(amountUsd, payment.currency)} (${gatewayRef})`
        }
      }
    }
  });
}
