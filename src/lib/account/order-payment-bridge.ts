import { prisma } from "@/lib/db";
import { findMockOrder, inferMockOrderPlatform, inferMockOrderSourceItemId } from "@/lib/account/mock-data";

export async function ensureCheckoutOrderFromMockOrder(mockOrderId: string, userId: number) {
  const mockOrder = findMockOrder(mockOrderId);
  if (!mockOrder) {
    throw new Error("Mock order not found.");
  }

  const legacyOrderNo = `MOCK-${mockOrder.orderNo}`;
  const bridgedOrderNo = `MOCK-U${userId}-${mockOrder.orderNo}`;

  const existingOrder = await prisma.order.findFirst({
    where: {
      userId,
      OR: [
        { orderNo: bridgedOrderNo },
        { orderNo: legacyOrderNo }
      ]
    }
  });
  if (existingOrder) {
    return existingOrder;
  }

  const orderWithSameNo = await prisma.order.findUnique({
    where: { orderNo: bridgedOrderNo }
  });
  if (orderWithSameNo) {
    if (orderWithSameNo.userId === userId) {
      return orderWithSameNo;
    }
    throw new Error(`Mock checkout order number conflict: ${bridgedOrderNo}`);
  }

  const address = await prisma.address.findFirst({
    where: { userId },
    orderBy: [{ isDefault: "desc" }, { updatedAt: "desc" }]
  });

  const createdOrder = await prisma.order.create({
    data: {
      orderNo: bridgedOrderNo,
      userId,
      addressId: address?.id,
      status: mockOrder.status,
      orderStatus: mockOrder.status,
      orderSource: mockOrder.orderSource,
      paymentStatus: mockOrder.paymentStatus,
      purchaseStatus: mockOrder.purchaseStatus,
      warehouseStatus: mockOrder.warehouseStatus,
      packageStatus: mockOrder.packageStatus,
      shippingStatus: mockOrder.shippingStatus,
      destinationCountry: mockOrder.destinationCountry,
      destinationCountryCode: null,
      currency: "USD",
      subtotalCny: mockOrder.subtotalCny,
      subtotalUsd: mockOrder.items.reduce((sum, item) => sum + item.priceUsd * item.quantity, 0),
      exchangeRate: mockOrder.items.reduce((sum, item) => sum + item.priceUsd * item.quantity, 0) > 0
        ? mockOrder.subtotalCny / mockOrder.items.reduce((sum, item) => sum + item.priceUsd * item.quantity, 0)
        : 0,
      serviceFeeUsd: mockOrder.serviceFeeUsd,
      domesticShippingUsd: mockOrder.domesticShippingUsd,
      estimatedShippingUsd: mockOrder.estimatedShippingUsd,
      actualShippingUsd: mockOrder.actualShippingUsd,
      totalUsd: mockOrder.totalUsd,
      paidUsd: mockOrder.paidUsd,
      unpaidUsd: mockOrder.unpaidUsd,
      itemCount: mockOrder.items.length,
      totalQuantity: mockOrder.items.reduce((sum, item) => sum + item.quantity, 0),
      userNote: mockOrder.userNote,
      shippingAddressSnapshot: {
        label: "Mock order import",
        contactName: mockOrder.address.name,
        phone: mockOrder.address.phone,
        country: mockOrder.address.country,
        state: mockOrder.address.state,
        city: mockOrder.address.city,
        postalCode: mockOrder.address.postalCode,
        line1: mockOrder.address.line1,
        line2: mockOrder.address.line2 ?? null
      },
      items: {
        create: mockOrder.items.map((item) => ({
          platform: inferMockOrderPlatform(item.sourceUrl),
          sourceItemId: inferMockOrderSourceItemId(item.sourceUrl, item.id),
          sourceUrl: item.sourceUrl,
          title: item.title,
          image: item.image,
          skuText: item.sku,
          priceCny: item.priceCny,
          priceUsd: item.priceUsd,
          quantity: item.quantity
        }))
      },
      logs: {
        create: {
          actorId: userId,
          action: "mock_order_checkout_created",
          detail: `Created checkout bridge order from mock account order ${mockOrder.orderNo}`
        }
      }
    }
  });

  return createdOrder;
}
