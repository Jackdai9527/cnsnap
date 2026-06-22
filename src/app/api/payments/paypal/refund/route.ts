import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { refundPayPalPayment } from "@/modules/payment/paypal";

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const paymentId = Number(body.paymentId || 0);
    const amount = body.amount ? Number(body.amount) : undefined;
    if (!paymentId) {
      return NextResponse.json({ error: "Missing payment id" }, { status: 400 });
    }
    const result = await refundPayPalPayment(paymentId, amount);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Refund failed" }, { status: 400 });
  }
}
