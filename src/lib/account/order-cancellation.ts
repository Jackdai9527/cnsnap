import { prisma } from "@/lib/db";

const AUTO_CANCEL_WINDOW_MS = 24 * 60 * 60 * 1000;

type MinimalOrderForCancellation = {
  id: number;
  userId: number;
  orderNo: string;
  createdAt: Date;
  paidUsd: { toString(): string };
  unpaidUsd: { toString(): string };
  totalUsd: { toString(): string };
  paymentStatus: string;
  purchaseStatus: string;
  warehouseStatus: string;
  packageStatus: string;
  shippingPaymentStatus: string;
  shippingStatus: string;
  orderStatus: string;
  status: string;
  cancelledAt: Date | null;
};

export type CancellationReason = "user_requested" | "payment_timeout";

export function canCustomerCancelOrder(order: Pick<MinimalOrderForCancellation, "orderStatus" | "paymentStatus" | "purchaseStatus" | "unpaidUsd" | "paidUsd" | "cancelledAt">) {
  if (order.cancelledAt) return false;
  if (order.orderStatus !== "pending_payment") return false;
  if (order.paymentStatus !== "pending") return false;
  if (order.purchaseStatus !== "pending") return false;
  if (Number(order.paidUsd) > 0.01) return false;
  return Number(order.unpaidUsd) > 0.01;
}

export function getAutoCancelDeadline(createdAt: Date) {
  return new Date(createdAt.getTime() + AUTO_CANCEL_WINDOW_MS);
}

export function isPendingPaymentExpired(order: Pick<MinimalOrderForCancellation, "createdAt" | "cancelledAt" | "orderStatus" | "paymentStatus" | "purchaseStatus" | "unpaidUsd" | "paidUsd">, now = new Date()) {
  if (!canCustomerCancelOrder(order)) return false;
  return getAutoCancelDeadline(order.createdAt).getTime() <= now.getTime();
}

export async function cancelOrderIfEligible(params: {
  orderId: number;
  userId?: number;
  actorId?: number | null;
  reason: CancellationReason;
  now?: Date;
}) {
  const now = params.now ?? new Date();
  const order = await prisma.order.findFirst({
    where: {
      id: params.orderId,
      ...(typeof params.userId === "number" ? { userId: params.userId } : {})
    },
    select: {
      id: true,
      userId: true,
      orderNo: true,
      createdAt: true,
      paidUsd: true,
      unpaidUsd: true,
      totalUsd: true,
      paymentStatus: true,
      purchaseStatus: true,
      warehouseStatus: true,
      packageStatus: true,
      shippingPaymentStatus: true,
      shippingStatus: true,
      orderStatus: true,
      status: true,
      cancelledAt: true
    }
  });

  if (!order) {
    return { ok: false as const, code: "not_found" as const };
  }

  if (order.cancelledAt || ["cancel", "cancelled"].includes(order.orderStatus)) {
    return { ok: true as const, code: "already_cancelled" as const, orderId: order.id };
  }

  if (params.reason === "payment_timeout" && !isPendingPaymentExpired(order, now)) {
    return { ok: false as const, code: "not_expired" as const, orderId: order.id };
  }

  if (params.reason === "user_requested" && !canCustomerCancelOrder(order)) {
    return { ok: false as const, code: "not_cancellable" as const, orderId: order.id };
  }

  const detail = params.reason === "payment_timeout"
    ? "Order auto-cancelled after 24 hours without payment"
    : "Customer cancelled unpaid order from account center";

  await prisma.order.update({
    where: { id: order.id },
    data: {
      orderStatus: "cancelled",
      status: "cancelled",
      paymentStatus: Number(order.paidUsd) > 0.01 ? order.paymentStatus : "failed",
      purchaseStatus: "cancelled",
      warehouseStatus: "pending",
      packageStatus: "none",
      shippingPaymentStatus: "none",
      shippingStatus: "none",
      unpaidUsd: 0,
      cancelledAt: now,
      logs: {
        create: {
          actorId: params.actorId ?? undefined,
          action: params.reason === "payment_timeout" ? "order_auto_cancelled" : "order_cancelled_by_customer",
          detail
        }
      }
    }
  });

  return { ok: true as const, code: "cancelled" as const, orderId: order.id };
}

export async function ensureOrderNotExpired(orderId: number, userId?: number) {
  const result = await cancelOrderIfEligible({
    orderId,
    userId,
    reason: "payment_timeout",
    actorId: null
  });

  if (result.ok && result.code === "cancelled") {
    throw new Error("This unpaid order expired after 24 hours and was automatically cancelled. Please place a new order.");
  }

  if (result.ok && result.code === "already_cancelled") {
    throw new Error("This order has already been cancelled. Please place a new order.");
  }

  return result;
}
