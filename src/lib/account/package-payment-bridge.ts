import { prisma } from "@/lib/db";

export async function ensureCheckoutOrderFromPackage(packageId: number, userId: number) {
  const pkg = await prisma.package.findFirst({
    where: { id: packageId, userId },
    include: {
      order: {
        include: {
          items: true,
          address: true
        }
      },
      user: true
    }
  });

  if (!pkg) {
    throw new Error("Package not found.");
  }

  const amountUsd = Number(pkg.shippingFeeUsd);
  if (amountUsd <= 0) {
    throw new Error("Package shipping fee is not set.");
  }

  const bridgedOrderNo = `PKPAY-U${userId}-P${pkg.id}`;
  const existingOrder = await prisma.order.findFirst({
    where: {
      userId,
      orderNo: bridgedOrderNo
    }
  });
  if (existingOrder) {
    return existingOrder;
  }

  const sourceOrder = pkg.order;
  const shippingAddressSnapshot = sourceOrder?.shippingAddressSnapshot || (sourceOrder?.address ? {
    label: sourceOrder.address.label,
    contactName: sourceOrder.address.contactName,
    phone: sourceOrder.address.phone,
    country: sourceOrder.address.country,
    state: sourceOrder.address.state,
    city: sourceOrder.address.city,
    postalCode: sourceOrder.address.postalCode,
    line1: sourceOrder.address.line1,
    line2: sourceOrder.address.line2
  } : null);

  const createdOrder = await prisma.order.create({
    data: {
      orderNo: bridgedOrderNo,
      userId,
      addressId: sourceOrder?.addressId ?? null,
      status: "pending_payment",
      orderStatus: "pending_payment",
      orderSource: "package_payment",
      paymentStatus: "pending",
      purchaseStatus: "pending",
      warehouseStatus: "pending",
      packageStatus: "none",
      shippingPaymentStatus: "pending",
      shippingStatus: "none",
      riskStatus: "normal",
      refundStatus: "none",
      destinationCountry: sourceOrder?.destinationCountry ?? sourceOrder?.address?.country ?? null,
      destinationCountryCode: sourceOrder?.destinationCountryCode ?? sourceOrder?.address?.country ?? null,
      shippingAddressSnapshot: shippingAddressSnapshot ?? undefined,
      currency: "USD",
      subtotalCny: 0,
      subtotalUsd: amountUsd,
      exchangeRate: sourceOrder ? sourceOrder.exchangeRate : 0,
      serviceFeeUsd: 0,
      domesticShippingUsd: 0,
      estimatedShippingUsd: amountUsd,
      actualShippingUsd: amountUsd,
      discountUsd: 0,
      refundUsd: 0,
      totalUsd: amountUsd,
      paidUsd: 0,
      unpaidUsd: amountUsd,
      itemCount: 1,
      totalQuantity: 1,
      adminNote: `Shipping payment bridge for package ${pkg.packageNo} (source order ${sourceOrder?.orderNo ?? "N/A"}).`,
      items: {
        create: [
          {
            platform: "manual",
            sourceItemId: `package-${pkg.id}`,
            sourceUrl: sourceOrder ? `/account/orders/${sourceOrder.id}` : `/account/packages/${pkg.id}`,
            title: `International shipping fee for ${pkg.packageNo}`,
            image: "/brand/cnsnap-logo.svg",
            skuText: sourceOrder?.orderNo ? `Related order ${sourceOrder.orderNo}` : "Package shipping fee",
            priceCny: 0,
            priceUsd: amountUsd,
            quantity: 1,
            purchaseStatus: "pending"
          }
        ]
      },
      payments: {
        create: {
          paymentNo: `PKPAY-${pkg.id}-${Date.now()}`,
          provider: "package_shipping",
          type: "shipping",
          userId,
          packageId: pkg.id,
          amount: amountUsd,
          currency: "USD",
          status: "pending"
        }
      },
      logs: {
        create: {
          actorId: userId,
          action: "package_shipping_checkout_created",
          detail: `Created shipping-payment checkout bridge for package ${pkg.packageNo}`
        }
      }
    }
  });

  return createdOrder;
}
