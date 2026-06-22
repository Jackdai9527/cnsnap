import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ensureOrderNotExpired } from "@/lib/account/order-cancellation";
import { getCurrentUser, inactiveUserMessage, isUserActive } from "@/lib/session";
import { createPayPalPayment } from "@/modules/payment/paypal";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Please sign in before payment." }, { status: 401 });
    if (!isUserActive(user.status)) return NextResponse.json({ error: inactiveUserMessage }, { status: 403 });

    const body = await request.json();
    const orderId = Number(body.orderId);
    const packageId = Number(body.packageId);
    if (!orderId) return NextResponse.json({ error: "Missing orderId" }, { status: 400 });

    const order = await prisma.order.findFirst({ where: { id: orderId, userId: user.id } });
    if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });
    await ensureOrderNotExpired(order.id, user.id);

    const result = await createPayPalPayment(orderId, Number.isFinite(packageId) && packageId > 0 ? packageId : undefined);
    return NextResponse.json({ id: result.paypalOrderId, paymentId: result.paymentId });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "PayPal payment failed" }, { status: 400 });
  }
}
