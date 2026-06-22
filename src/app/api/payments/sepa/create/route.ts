import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ensureOrderNotExpired } from "@/lib/account/order-cancellation";
import { getCurrentUser, inactiveUserMessage, isUserActive } from "@/lib/session";
import { createSepaPayment } from "@/modules/payment/sepa";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Please sign in before payment." }, { status: 401 });
    if (!isUserActive(user.status)) return NextResponse.json({ error: inactiveUserMessage }, { status: 403 });

    const form = await request.formData();
    const orderId = Number(form.get("orderId"));
    const packageId = Number(form.get("packageId"));
    const holderName = String(form.get("holderName") || "");
    const transactionReference = String(form.get("transactionReference") || "");
    if (!orderId) return NextResponse.json({ error: "Missing orderId" }, { status: 400 });
    const order = await prisma.order.findFirst({ where: { id: orderId, userId: user.id } });
    if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });
    await ensureOrderNotExpired(order.id, user.id);

    await createSepaPayment({
      orderId,
      packageId: Number.isFinite(packageId) && packageId > 0 ? packageId : undefined,
      holderName,
      transactionReference
    });
    return NextResponse.redirect(new URL(packageId > 0 ? `/account/packages/${packageId}?payment=sepa_submitted` : `/account/orders/${orderId}?payment=sepa_submitted`, request.url), 303);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "SEPA payment failed" }, { status: 400 });
  }
}
