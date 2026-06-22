import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { ensureOrderNotExpired } from "@/lib/account/order-cancellation";
import { roundMoney } from "@/lib/currency";
import { syncOrderFromPayment } from "@/lib/order-status-sync";
import { sendOrderPaidEmail, sendShippingPaymentPaidEmail } from "@/lib/order-email";
import { getCurrentUser, inactiveUserMessage, isUserActive } from "@/lib/session";

function paymentNo() {
  return `BAL${Date.now()}${Math.floor(Math.random() * 9000 + 1000)}`;
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Please sign in before payment." }, { status: 401 });
    if (!isUserActive(user.status)) return NextResponse.json({ error: inactiveUserMessage }, { status: 403 });

    const body = await request.json();
    const orderId = Number(body.orderId);
    const packageId = Number(body.packageId);
    if (!orderId) return NextResponse.json({ error: "Missing orderId" }, { status: 400 });

    const order = await prisma.order.findFirst({
      where: { id: orderId, userId: user.id },
      include: { packages: true, payments: { orderBy: { createdAt: "desc" } } }
    });
    if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });
    await ensureOrderNotExpired(order.id, user.id);

    const targetPackage = packageId ? order.packages.find((pkg) => pkg.id === packageId) : undefined;
    const amount = roundMoney(packageId && targetPackage ? Number(targetPackage.shippingFeeUsd) : Number(order.unpaidUsd));
    if (amount <= 0) return NextResponse.json({ error: "No payable amount." }, { status: 400 });
    if (Number(user.walletBalance) < amount) return NextResponse.json({ error: "Insufficient CNSnap Balance." }, { status: 400 });

    const now = new Date();
    const provider = "wallet";
    const paymentType = packageId ? "shipping" : "product";
    let createdPaymentId = 0;

    await prisma.$transaction(async (tx) => {
      const refreshedUser = await tx.user.findUniqueOrThrow({ where: { id: user.id } });
      const balanceAfter = roundMoney(Number(refreshedUser.walletBalance) - amount);

      await tx.user.update({
        where: { id: user.id },
        data: { walletBalance: balanceAfter }
      });

      const payment = await tx.payment.create({
        data: {
          paymentNo: paymentNo(),
          provider,
          type: paymentType,
          userId: user.id,
          orderId: order.id,
          packageId: packageId || undefined,
          amount,
          currency: "USD",
          status: "paid",
          paymentMethod: "wallet_balance",
          paidAt: now
        }
      });
      createdPaymentId = payment.id;

      await tx.walletTransaction.create({
        data: {
          userId: user.id,
          type: packageId ? "pay_shipping" : "pay_order",
          amount: -amount,
          currency: "USD",
          balanceAfter,
          relatedOrderId: order.id,
          relatedPackageId: packageId || undefined,
          note: packageId ? `Shipping fee paid for package ${packageId}` : `Order payment paid for order ${order.orderNo}`
        }
      });

    });

    await syncOrderFromPayment(createdPaymentId, {
      paidAt: now,
      actorId: user.id,
      gatewayLabel: "CNSnap Balance",
      gatewayRef: `BALANCE-${createdPaymentId}`
    });

    if (packageId) {
      void sendShippingPaymentPaidEmail(orderId, packageId).catch(() => undefined);
    } else {
      void sendOrderPaidEmail(orderId).catch(() => undefined);
    }

    revalidatePath("/admin/orders");
    revalidatePath(`/admin/orders/${orderId}`);
    revalidatePath("/admin/packages");
    revalidatePath("/account/orders");
    revalidatePath(`/account/orders/${orderId}`);
    if (packageId) {
      revalidatePath(`/account/packages/${packageId}`);
    }

    return NextResponse.json({
      ok: true,
      redirectTo: packageId ? `/account/packages/${packageId}?payment=balance_paid` : `/account/orders/${orderId}?payment=balance_paid`
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Balance payment failed" }, { status: 400 });
  }
}
