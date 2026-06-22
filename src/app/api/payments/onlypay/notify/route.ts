import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { handleOnlyPayCallback, parseOnlyPayCallback } from "@/modules/payment/onlypay";

export async function POST(request: NextRequest) {
  try {
    const data = await parseOnlyPayCallback(request);
    const result = await handleOnlyPayCallback(data);
    if (data.mchOrderNo) {
      revalidatePath("/admin/orders");
      revalidatePath("/admin/packages");
      revalidatePath("/account/orders");
      revalidatePath("/account/packages");
    }
    return new NextResponse("SUCCESS", { status: 200 });
  } catch (error) {
    return new NextResponse(`FAIL: ${error instanceof Error ? error.message : "Unknown error"}`, { status: 400 });
  }
}
