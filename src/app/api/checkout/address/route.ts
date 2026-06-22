import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "User is required" }, { status: 401 });

  const body = await request.json();
  const id = body.id ? Number(body.id) : undefined;
  const payload = {
    label: String(body.label || "Shipping"),
    contactName: String(body.contactName || ""),
    phone: String(body.phone || ""),
    country: String(body.country || "US").toUpperCase(),
    state: String(body.state || ""),
    city: String(body.city || ""),
    postalCode: String(body.postalCode || ""),
    line1: String(body.line1 || ""),
    line2: String(body.line2 || ""),
    isDefault: Boolean(body.isDefault)
  };

  if (!payload.contactName || !payload.phone || !payload.city || !payload.postalCode || !payload.line1) {
    return NextResponse.json({ error: "Please complete the shipping address." }, { status: 400 });
  }

  if (!id) {
    const count = await prisma.address.count({ where: { userId: user.id } });
    if (count >= 3) {
      return NextResponse.json({ error: "You can save up to 3 delivery addresses. Please delete another address first." }, { status: 400 });
    }
  } else {
    const existing = await prisma.address.findFirst({ where: { id, userId: user.id } });
    if (!existing) {
      return NextResponse.json({ error: "Address not found" }, { status: 404 });
    }
  }

  const address = id
    ? await prisma.address.update({
        where: { id },
        data: payload
      })
    : await prisma.address.create({
        data: { ...payload, userId: user.id }
      });

  if (payload.isDefault) {
    await prisma.address.updateMany({
      where: { userId: user.id, id: { not: address.id } },
      data: { isDefault: false }
    });
  }

  return NextResponse.json({ addressId: address.id });
}

export async function DELETE(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "User is required" }, { status: 401 });

  const id = Number(new URL(request.url).searchParams.get("id"));
  if (!id) return NextResponse.json({ error: "Missing address id" }, { status: 400 });

  const address = await prisma.address.findFirst({ where: { id, userId: user.id } });
  if (!address) return NextResponse.json({ error: "Address not found" }, { status: 404 });

  const count = await prisma.address.count({ where: { userId: user.id } });
  if (count <= 1) {
    return NextResponse.json({ error: "At least one address must remain as your default shipping address." }, { status: 400 });
  }

  const remainingAddresses = await prisma.address.findMany({
    where: { userId: user.id, id: { not: id } },
    orderBy: [{ isDefault: "desc" }, { updatedAt: "desc" }]
  });
  const nextDefaultId = address.isDefault ? remainingAddresses[0]?.id : undefined;

  await prisma.$transaction(async (tx) => {
    await tx.order.updateMany({ where: { userId: user.id, addressId: id }, data: { addressId: null } });
    await tx.address.delete({ where: { id } });

    if (nextDefaultId) {
      await tx.address.update({
        where: { id: nextDefaultId },
        data: { isDefault: true }
      });
    }
  });

  return NextResponse.json({ ok: true, nextDefaultId });
}
