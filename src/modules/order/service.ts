import { prisma } from "@/lib/db";
import { calculateServiceFee, getPricingSettings, roundMoney } from "@/lib/currency";
import { calculateCheckoutPricing } from "@/lib/checkout-pricing";
import { requireActiveUser } from "@/lib/session";
import type { Prisma } from "@prisma/client";

export type CheckoutItem = {
  productId: number;
  platform?: string;
  sourceItemId?: string;
  skuId?: string;
  skuText?: string;
  quantity: number;
  chinaFreight?: number;
};

export type CheckoutValueAddedService = {
  serviceId: number;
  quantity: number;
  note?: string;
};

export async function createOrderFromItems(
  items: CheckoutItem[],
  addressId?: number,
  userNote?: string,
  valueAddedServices: CheckoutValueAddedService[] = [],
  preferredPaymentMethod?: string
) {
  const user = await requireActiveUser();

  const numericProductIds = items.map((item) => item.productId).filter((value) => Number.isFinite(value) && value > 0);
  const sourceKeys = items
    .filter((item) => item.platform && item.sourceItemId)
    .map((item) => ({ platform: String(item.platform), sourceItemId: String(item.sourceItemId) }));

  const productWhere: Prisma.ProductCacheWhereInput = {
    OR: [
      ...(numericProductIds.length ? [{ id: { in: numericProductIds } }] : []),
      ...sourceKeys.map((key) => ({
        platform: key.platform,
        sourceItemId: key.sourceItemId
      }))
    ]
  };

  const products = await prisma.productCache.findMany({ where: productWhere });
  const settings = await getPricingSettings();
  const orderItems = items.map((item) => {
    const product = products.find((candidate) =>
      candidate.id === item.productId ||
      (item.platform ? candidate.platform === item.platform : false) &&
      (item.sourceItemId ? candidate.sourceItemId === item.sourceItemId : false)
    );
    if (!product) {
      throw new Error(`Product ${item.sourceItemId || item.productId} not found`);
    }
    return { item, product };
  });

  const selectedValueAddedServices = await normalizeValueAddedServices(valueAddedServices);
  const pricing = calculateCheckoutPricing({
    items: orderItems.map(({ item, product }) => ({
      priceUsd: Number(product.priceUsd),
      priceCny: Number(product.priceCny),
      quantity: item.quantity,
      chinaFreightCny: Number(item.chinaFreight) || 0
    })),
    upsells: selectedValueAddedServices,
    pricingSettings: settings
  });
  const itemCount = orderItems.length;
  const totalQuantity = orderItems.reduce((sum, { item }) => sum + item.quantity, 0);
  const address = addressId ? await prisma.address.findUnique({ where: { id: addressId } }) : null;

  const orderNo = `HT${new Date().toISOString().slice(0, 10).replaceAll("-", "")}${Date.now()
    .toString()
    .slice(-5)}`;

  const order = await prisma.order.create({
    data: {
      orderNo,
      userId: user.id,
      addressId,
      subtotalCny: pricing.subtotalCny,
      subtotalUsd: pricing.subtotalUsd,
      exchangeRate: settings.exchangeRate,
      serviceFeeUsd: pricing.serviceFeeUsd,
      domesticShippingUsd: pricing.domesticShippingUsd,
      valueAddedServicesUsd: pricing.upsellUsd,
      valueAddedServicesSnapshot: selectedValueAddedServices.length ? selectedValueAddedServices : undefined,
      estimatedShippingUsd: 0,
      totalUsd: pricing.totalUsd,
      unpaidUsd: pricing.totalUsd,
      itemCount,
      totalQuantity,
      destinationCountry: address?.country,
      destinationCountryCode: address?.country,
      preferredPaymentMethod: preferredPaymentMethod || undefined,
      shippingAddressSnapshot: address
        ? {
            label: address.label,
            contactName: address.contactName,
            phone: address.phone,
            country: address.country,
            state: address.state,
            city: address.city,
            postalCode: address.postalCode,
            line1: address.line1,
            line2: address.line2
          }
        : undefined,
      userNote,
      items: {
        create: orderItems.map(({ item, product }) => ({
          productCacheId: product.id,
          platform: product.platform,
          sourceItemId: product.sourceItemId,
          sourceUrl: product.sourceUrl,
          title: product.title,
          image: product.mainImage,
          skuId: item.skuId,
          skuText: item.skuText,
          priceCny: product.priceCny,
          priceUsd: product.priceUsd,
          quantity: item.quantity
        }))
      },
      logs: {
        create: {
          actorId: user.id,
          action: "order_created",
          detail: `Order ${orderNo} created from checkout${selectedValueAddedServices.length ? ` with ${selectedValueAddedServices.length} value-added service(s)` : ""}`
        }
      }
    },
    include: { items: true }
  });

  await prisma.emailLog.create({
    data: {
      to: user.email,
      subject: `Order ${order.orderNo} created`,
      template: "order_created",
      status: "queued"
    }
  });

  return order;
}

async function normalizeValueAddedServices(valueAddedServices: CheckoutValueAddedService[]) {
  const ids = Array.from(
    new Set(
      valueAddedServices
        .map((service) => Number(service.serviceId))
        .filter((serviceId) => Number.isInteger(serviceId) && serviceId > 0)
    )
  );
  if (!ids.length) return [];

  const services = await prisma.valueAddedService.findMany({
    where: { id: { in: ids }, isActive: true },
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }]
  });
  const quantityById = new Map(
    valueAddedServices.map((service) => [
      Number(service.serviceId),
      {
        quantity: Math.max(1, Math.min(999, Number(service.quantity) || 1)),
        note: typeof service.note === "string" ? service.note.trim().slice(0, 500) : ""
      }
    ])
  );

  return services.map((service) => {
    const selected = quantityById.get(service.id);
    const quantity = selected?.quantity ?? 1;
    const priceUsd = Number(service.priceUsd);
    return {
      serviceId: service.id,
      code: service.code,
      name: service.name,
      chargeStandard: service.chargeStandard,
      priceUsd,
      priceMode: service.priceMode,
      quantity,
      subtotalUsd: roundMoney(priceUsd * quantity),
      note: selected?.note || undefined
    };
  });
}

export async function getOrderSummary() {
  const [orders, packages, diyOrders, users, apiFailures] = await Promise.all([
    prisma.order.findMany({ include: { user: true, items: true }, orderBy: { createdAt: "desc" } }),
    prisma.package.findMany({ include: { user: true, order: true }, orderBy: { createdAt: "desc" } }),
    prisma.diyOrder.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.user.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.apiLog.count({ where: { status: { contains: "fail" } } })
  ]);

  return { orders, packages, diyOrders, users, apiFailures };
}
