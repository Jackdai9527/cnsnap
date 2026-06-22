import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/session";
import { capturePayPalPayment } from "@/modules/payment/paypal";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Please sign in before payment." }, { status: 401 });

    const body = await request.json();
    const paypalOrderId = String(body.paypalOrderId || "");
    if (!paypalOrderId) return NextResponse.json({ error: "Missing PayPal order id" }, { status: 400 });

    const result = await capturePayPalPayment(paypalOrderId, user.id);
    if ("orderId" in result && result.orderId) {
      revalidatePath("/admin/orders");
      revalidatePath(`/admin/orders/${result.orderId}`);
      revalidatePath("/admin/packages");
      revalidatePath("/account/orders");
      revalidatePath(`/account/orders/${result.orderId}`);
    }
    if ("packageId" in result && result.packageId) {
      revalidatePath(`/account/packages/${result.packageId}`);
    }
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "PayPal capture failed" }, { status: 400 });
  }
}
