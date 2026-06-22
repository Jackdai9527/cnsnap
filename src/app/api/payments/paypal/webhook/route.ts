import { NextRequest, NextResponse } from "next/server";
import { verifyAndSyncPayPalWebhook } from "@/modules/payment/paypal";

export async function POST(request: NextRequest) {
  try {
    const event = await request.json();
    const result = await verifyAndSyncPayPalWebhook(request.headers, event);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Webhook handling failed" }, { status: 400 });
  }
}
