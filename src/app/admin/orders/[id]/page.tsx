import { notFound } from "next/navigation";
import LegacyAdminOrderDetailPage from "@/app/_admin/orders/[id]/page";
import { mockOrders } from "@/app/admin/orders/mock-data";
import type { MockOrder } from "@/app/admin/orders/columns";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/admin-session";

type AdminOrderDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminOrderDetailPage({ params }: AdminOrderDetailPageProps) {
  await requirePermission("orders.view");
  const { id } = await params;
  const existing = await findOrderId(id);
  if (existing) return <LegacyAdminOrderDetailPage params={Promise.resolve({ id: String(existing) })} />;

  const mockOrder = mockOrders.find((item) => item.id === id || item.orderNo === id);
  if (!mockOrder) notFound();

  const createdId = await ensureMockOrder(mockOrder);
  return <LegacyAdminOrderDetailPage params={Promise.resolve({ id: String(createdId) })} />;
}

async function findOrderId(id: string) {
  const byId = /^\d+$/.test(id) ? await prisma.order.findUnique({ where: { id: Number(id) }, select: { id: true } }) : null;
  if (byId) return byId.id;
  const byOrderNo = await prisma.order.findUnique({ where: { orderNo: id }, select: { id: true } }).catch(() => null);
  return byOrderNo?.id ?? null;
}

async function ensureMockOrder(order: MockOrder) {
  const existing = await prisma.order.findUnique({ where: { orderNo: order.orderNo }, select: { id: true } });
  if (existing) return existing.id;

  const countryCode = countryCodeFromName(order.destinationCountry);
  const user = await prisma.user.upsert({
    where: { email: order.userEmail },
    update: { status: "active" },
    create: {
      email: order.userEmail,
      name: order.userEmail.split("@")[0].replace(/[._-]+/g, " "),
      role: "user",
      status: "active",
      referralCode: `MOCK${order.id}`,
      walletBalance: 0
    }
  });
  const address = await prisma.address.create({
    data: {
      userId: user.id,
      label: "Shipping",
      contactName: user.name ?? order.userEmail,
      phone: "+1 000 000 0000",
      country: countryCode,
      state: "",
      city: "Please edit",
      postalCode: "00000",
      line1: "Please edit shipping address",
      line2: "",
      isDefault: false
    }
  });
  const shippingAddressSnapshot = {
    label: address.label,
    contactName: address.contactName,
    phone: address.phone,
    country: address.country,
    state: address.state,
    city: address.city,
    postalCode: address.postalCode,
    line1: address.line1,
    line2: address.line2
  };

  const created = await prisma.order.create({
    data: {
      id: Number(order.id),
      orderNo: order.orderNo,
      userId: user.id,
      addressId: address.id,
      status: order.orderTab === "all" ? "pending_payment" : order.orderTab,
      orderStatus: order.orderTab === "all" ? "pending_payment" : order.orderTab,
      orderSource: normalizeOrderSource(order.orderSource),
      paymentStatus: order.paymentStatus,
      purchaseStatus: normalizePurchaseStatus(order.purchaseStatus),
      warehouseStatus: normalizeWarehouseStatus(order.warehouseStatus),
      packageStatus: normalizePackageStatus(order.packageStatus),
      shippingPaymentStatus: order.packageStatus === "waiting_shipping_payment" ? "pending" : order.paymentStatus === "paid" ? "paid" : "none",
      shippingStatus: order.shippingStatus,
      riskStatus: normalizeRiskStatus(order.riskStatus),
      destinationCountry: countryCode,
      destinationCountryCode: countryCode,
      shippingAddressSnapshot,
      subtotalCny: order.subtotalCny,
      subtotalUsd: order.totalUsd,
      exchangeRate: order.subtotalCny && order.totalUsd ? order.subtotalCny / order.totalUsd : 7.2,
      totalUsd: order.totalUsd,
      paidUsd: order.paidUsd,
      unpaidUsd: order.unpaidUsd,
      itemCount: order.itemCount,
      totalQuantity: order.totalQuantity,
      adminNote: `Created from /admin/orders mock row ${order.id}. Edit and save this order as normal SQLite data.`,
      items: {
        create: order.itemsPreview.map((item, index) => ({
          platform: normalizeOrderSource(order.orderSource) === "url" ? "taobao" : "manual",
          sourceItemId: item.id,
          sourceUrl: `https://item.taobao.com/item.htm?id=${encodeURIComponent(item.id)}`,
          title: item.title,
          image: item.image,
          skuId: "",
          skuText: "Default",
          priceCny: round(order.subtotalCny / Math.max(order.totalQuantity, 1)),
          priceUsd: round(order.totalUsd / Math.max(order.totalQuantity, 1)),
          quantity: index === 0 ? Math.max(1, order.totalQuantity - (order.itemsPreview.length - 1)) : 1,
          purchaseStatus: normalizePurchaseStatus(order.purchaseStatus)
        }))
      },
      logs: {
        create: {
          action: "mock_order_materialized",
          detail: `Mock order ${order.orderNo} materialized into SQLite for admin editing.`
        }
      }
    },
    select: { id: true }
  });
  return created.id;
}

function round(value: number) {
  return Math.round(value * 100) / 100;
}

function normalizeOrderSource(value: MockOrder["orderSource"]) {
  if (value === "cart") return "url";
  if (value === "manual") return "admin";
  return value;
}

function normalizePurchaseStatus(value: MockOrder["purchaseStatus"]) {
  if (value === "reviewing") return "pending";
  if (value === "cancelled" || value === "refunded") return "failed";
  return value;
}

function normalizeWarehouseStatus(value: MockOrder["warehouseStatus"]) {
  if (value === "exception") return "abnormal";
  return value;
}

function normalizePackageStatus(value: MockOrder["packageStatus"]) {
  if (value === "ready_to_ship") return "shipping_paid";
  return value;
}

function normalizeRiskStatus(value: MockOrder["riskStatus"]) {
  if (value === "abnormal") return "restricted";
  return value;
}

function countryCodeFromName(name: string) {
  const map: Record<string, string> = {
    "Australia": "AU",
    "Canada": "CA",
    "France": "FR",
    "Germany": "DE",
    "Italy": "IT",
    "Netherlands": "NL",
    "Singapore": "SG",
    "Spain": "ES",
    "United Kingdom": "GB",
    "United States": "US"
  };
  return map[name] ?? "US";
}
