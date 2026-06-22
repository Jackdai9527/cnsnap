import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser, isUserActive, inactiveUserMessage } from "@/lib/session";
import { createOrderFromItems } from "@/modules/order/service";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Please sign in before checkout." }, { status: 401 });
    }
    if (!isUserActive(user.status)) {
      return NextResponse.json({ error: inactiveUserMessage }, { status: 403 });
    }

    const contentType = request.headers.get("content-type") ?? "";
    const form = contentType.includes("application/json") ? await request.json() : Object.fromEntries((await request.formData()).entries());
    const items = typeof form.items === "string" ? JSON.parse(form.items) : form.items;
    const valueAddedServices = typeof form.valueAddedServices === "string"
      ? JSON.parse(form.valueAddedServices)
      : form.valueAddedServices;

    if (!Array.isArray(items) || !items.length) {
      return NextResponse.json({ error: "No checkout items" }, { status: 400 });
    }

    const addressId = form.addressId ? Number(form.addressId) : undefined;
    if (addressId) {
      const address = await prisma.address.findFirst({ where: { id: addressId, userId: user.id } });
      if (!address) {
        return NextResponse.json({ error: "Invalid shipping address" }, { status: 400 });
      }
    }
    const order = await createOrderFromItems(
      items,
      addressId,
      typeof form.userNote === "string" ? form.userNote : undefined,
      Array.isArray(valueAddedServices) ? valueAddedServices : [],
      typeof form.preferredPaymentMethod === "string" ? form.preferredPaymentMethod : undefined
    );

    return NextResponse.json(order);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to create order." }, { status: 500 });
  }
}
