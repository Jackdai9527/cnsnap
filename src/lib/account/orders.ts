import { prisma } from "@/lib/db";
import { cancelOrderIfEligible } from "@/lib/account/order-cancellation";
import { getCurrentUser } from "@/lib/session";
import type { AccountOrder } from "@/lib/account/mock-data";

export async function getAccountOrders(): Promise<AccountOrder[]> {
  const user = await getCurrentUser();
  if (!user) return [];

  const maybeExpiredOrders = await prisma.order.findMany({
    where: {
      userId: user.id,
      orderStatus: "pending_payment",
      paymentStatus: "pending",
      purchaseStatus: "pending",
      cancelledAt: null
    },
    select: { id: true }
  });

  await Promise.all(
    maybeExpiredOrders.map((order) =>
      cancelOrderIfEligible({
        orderId: order.id,
        userId: user.id,
        reason: "payment_timeout",
        actorId: null
      })
    )
  );

  const orders = await prisma.order.findMany({
    where: {
      userId: user.id,
      NOT: {
        OR: [
          { orderNo: { startsWith: "PKPAY-" } },
          { orderSource: "package_payment" }
        ]
      }
    },
    include: {
      items: { orderBy: { id: "asc" } },
      address: true,
      packages: { orderBy: { createdAt: "desc" } },
      payments: { orderBy: { createdAt: "desc" } },
      logs: { orderBy: { createdAt: "asc" } },
      mediaAssets: { where: { usage: "qc_photo" }, orderBy: { createdAt: "desc" } }
    },
    orderBy: { createdAt: "desc" }
  });

  return orders.map((order) => ({
    id: String(order.id),
    orderNo: order.orderNo,
    createdAt: order.createdAt.toLocaleString(),
    orderSource: mapOrderSource(order.orderSource),
    items: order.items.map((item) => ({
      id: String(item.id),
      title: item.title,
      sku: item.skuText || "Default SKU",
      quantity: item.quantity,
      priceUsd: Number(item.priceUsd),
      priceCny: Number(item.priceCny),
      image: item.image,
      sourceUrl: item.sourceUrl
    })),
    totalUsd: Number(order.totalUsd),
    subtotalCny: Number(order.subtotalCny),
    serviceFeeUsd: Number(order.serviceFeeUsd),
    domesticShippingUsd: Number(order.domesticShippingUsd),
    estimatedShippingUsd: Number(order.estimatedShippingUsd),
    actualShippingUsd: Number(order.actualShippingUsd),
    paidUsd: Number(order.paidUsd),
    unpaidUsd: Number(order.unpaidUsd),
    paymentStatus: mapPaymentStatus(order.paymentStatus),
    purchaseStatus: mapPurchaseStatus(order.purchaseStatus),
    warehouseStatus: mapWarehouseStatus(order.warehouseStatus),
    packageStatus: mapPackageStatus(order.packageStatus),
    shippingStatus: mapShippingStatus(order.shippingStatus),
    destinationCountry: order.destinationCountry || order.address?.country || "",
    status: mapAccountOrderStatus(order.orderStatus, order.paymentStatus, order.purchaseStatus, order.packageStatus, order.shippingStatus),
    address: {
      name: order.address?.contactName || user.name || user.email,
      phone: order.address?.phone || "",
      email: user.email,
      country: order.address?.country || "",
      state: order.address?.state || "",
      city: order.address?.city || "",
      postalCode: order.address?.postalCode || "",
      line1: order.address?.line1 || "",
      line2: order.address?.line2 || undefined
    },
    packages: order.packages.map((pkg) => pkg.packageNo),
    payments: order.payments.map((payment) => ({
      paymentNo: payment.paymentNo,
      method: payment.paymentMethod || payment.provider,
      amountUsd: Number(payment.amount),
      status: payment.status,
      createdAt: payment.createdAt.toLocaleString()
    })),
    qcPhotos: order.mediaAssets.map((asset) => ({
      id: String(asset.id),
      url: asset.url,
      altText: asset.altText || undefined,
      originalName: asset.originalName,
      createdAt: asset.createdAt.toLocaleString()
    })),
    timeline: order.logs.slice(-4).map((log, index, logs) => ({
      title: log.action,
      description: log.detail || "Order updated.",
      status: index === logs.length - 1 ? "current" : "done",
      time: log.createdAt.toLocaleString()
    })),
    userNote: order.userNote || undefined
  }));
}

function mapOrderSource(value: string): AccountOrder["orderSource"] {
  if (value === "keyword") return "keyword";
  if (value === "cart") return "cart";
  if (value === "diy") return "diy";
  return "url";
}

function mapPaymentStatus(value: string): AccountOrder["paymentStatus"] {
  if (value === "paid") return "paid";
  if (value === "partial") return "partial";
  if (value === "refunded" || value === "refund") return "refunded";
  if (value === "failed") return "failed";
  return "pending";
}

function mapPurchaseStatus(value: string): AccountOrder["purchaseStatus"] {
  if (value === "purchasing") return "purchasing";
  if (value === "purchased" || value === "partial_purchased") return "purchased";
  if (value === "cancelled" || value === "failed" || value === "out_of_stock" || value === "price_changed") return "cancelled";
  return "pending";
}

function mapWarehouseStatus(value: string): AccountOrder["warehouseStatus"] {
  if (value === "received") return "received";
  if (value === "partial_received") return "partial_received";
  return "pending";
}

function mapPackageStatus(value: string): AccountOrder["packageStatus"] {
  if (value === "created" || value === "waiting_shipping_payment") return "waiting_shipping_payment";
  if (value === "shipped") return "shipped";
  if (value === "delivered" || value === "shipping_paid") return "delivered";
  return "none";
}

function mapShippingStatus(value: string): AccountOrder["shippingStatus"] {
  if (value === "delivered") return "delivered";
  if (value === "shipped" || value === "in_transit" || value === "customs_clearance" || value === "delivery_attempted") return "in_transit";
  if (value === "pending" || value === "ready_to_ship") return "pending";
  return "none";
}

function mapAccountOrderStatus(
  orderStatus: string,
  paymentStatus: string,
  purchaseStatus: string,
  packageStatus: string,
  shippingStatus: string
): AccountOrder["status"] {
  if (orderStatus === "completed" || shippingStatus === "delivered") return "completed";
  if (orderStatus === "cancel" || orderStatus === "cancelled") return "cancelled";
  if (shippingStatus === "shipped" || shippingStatus === "in_transit") return "shipped";
  if (packageStatus === "waiting_shipping_payment" || orderStatus === "international_freight_pending") return "waiting_shipping_payment";
  if (purchaseStatus === "purchased" || purchaseStatus === "partial_purchased") return "warehouse_pending";
  if (purchaseStatus === "purchasing") return "purchasing";
  if (paymentStatus === "paid") return "paid";
  return "pending_payment";
}
