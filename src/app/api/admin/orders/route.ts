import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { prisma } from "@/lib/db";
import { auditSnapshot, createAuditLog } from "@/lib/audit-log";
import { logger } from "@/lib/logger";
import { requirePermission } from "@/lib/admin-session";
import { sendOrderPaidEmail } from "@/lib/order-email";
import type { MockOrder, OrderTabKey } from "@/types/admin-orders";

type StatusField = "paymentStatus" | "purchaseStatus" | "warehouseStatus" | "packageStatus" | "shippingStatus" | "riskStatus";

type AdminActor = Awaited<ReturnType<typeof requirePermission>>;

type PatchBody = {
  orderId?: string;
  orderIds?: string[];
  field?: StatusField;
  status?: string;
} | null;

type OrderRowShape = {
  id: number;
  orderNo: string;
  status: string;
  orderSource: string;
  orderStatus: string;
  paymentStatus: string;
  purchaseStatus: string;
  warehouseStatus: string;
  packageStatus: string;
  shippingPaymentStatus: string;
  shippingStatus: string;
  riskStatus: string;
  refundStatus: string;
  destinationCountry: string | null;
  destinationCountryCode: string | null;
  shippingAddressSnapshot: unknown;
  currency: string;
  subtotalCny: { toString(): string };
  subtotalUsd: { toString(): string };
  exchangeRate: { toString(): string };
  serviceFeeUsd: { toString(): string };
  domesticShippingUsd: { toString(): string };
  valueAddedServicesUsd: { toString(): string };
  valueAddedServicesSnapshot: unknown;
  estimatedShippingUsd: { toString(): string };
  actualShippingUsd: { toString(): string };
  discountUsd: { toString(): string };
  refundUsd: { toString(): string };
  totalUsd: { toString(): string };
  paidUsd: { toString(): string };
  unpaidUsd: { toString(): string };
  itemCount: number;
  totalQuantity: number;
  assigneeId: number | null;
  addressId: number | null;
  userNote: string | null;
  adminNote: string | null;
  paidAt: Date | null;
  purchasedAt: Date | null;
  warehouseReceivedAt: Date | null;
  shippedAt: Date | null;
  completedAt: Date | null;
  cancelledAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: number;
    email: string;
    name: string | null;
  };
  address: {
    id: number;
    label: string;
    contactName: string;
    phone: string;
    country: string;
    state: string | null;
    city: string;
    postalCode: string;
    line1: string;
    line2: string | null;
    isDefault: boolean;
  } | null;
  items: Array<{
    id: number;
    platform: string;
    sourceItemId: string;
    sourceUrl: string;
    title: string;
    image: string;
    skuId: string | null;
    skuText: string | null;
    priceCny: { toString(): string };
    priceUsd: { toString(): string };
    quantity: number;
    purchaseStatus: string;
    createdAt: Date;
  }>;
  packages: Array<{
    id: number;
    packageNo: string;
    status: string;
    weightKg: { toString(): string };
    lengthCm: { toString(): string } | null;
    widthCm: { toString(): string } | null;
    heightCm: { toString(): string } | null;
    shippingFeeUsd: { toString(): string };
    trackingNumber: string | null;
    shippedAt: Date | null;
    deliveredAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    shippingChannel: {
      id: number;
      name: string;
      code: string;
    } | null;
    items: Array<{
      id: number;
      quantity: number;
      orderItem: {
        id: number;
        title: string;
      };
    }>;
  }>;
  payments: Array<{
    id: number;
    paymentNo: string;
    provider: string;
    providerOrderNo: string | null;
    gatewayOrderNo: string | null;
    type: string;
    amount: { toString(): string };
    currency: string;
    status: string;
    paymentMethod: string | null;
    redirectUrl: string | null;
    paidAt: Date | null;
    failedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }>;
  notes: Array<{
    id: number;
    type: string;
    content: string;
    visibleToUser: boolean;
    createdBy: number | null;
    createdAt: Date;
  }>;
};

const statusFields = new Set<StatusField>(["paymentStatus", "purchaseStatus", "warehouseStatus", "packageStatus", "shippingStatus", "riskStatus"]);

const singleMoveToTrashStatus = "__move_to_trash__";
const singleRestoreFromTrashStatus = "__restore_from_trash__";
const singlePermanentDeleteStatus = "__permanently_delete__";
const bulkMoveToTrashStatus = "__bulk_move_to_trash__";
const bulkRestoreFromTrashStatus = "__bulk_restore_from_trash__";
const bulkPermanentDeleteStatus = "__bulk_permanently_delete__";

const orderInclude = {
  user: {
    select: {
      id: true,
      email: true,
      name: true
    }
  },
  address: {
    select: {
      id: true,
      label: true,
      contactName: true,
      phone: true,
      country: true,
      state: true,
      city: true,
      postalCode: true,
      line1: true,
      line2: true,
      isDefault: true
    }
  },
  items: {
    orderBy: { id: "asc" },
    select: {
      id: true,
      platform: true,
      sourceItemId: true,
      sourceUrl: true,
      title: true,
      image: true,
      skuId: true,
      skuText: true,
      priceCny: true,
      priceUsd: true,
      quantity: true,
      purchaseStatus: true,
      createdAt: true
    }
  },
  packages: {
    orderBy: { id: "asc" },
    include: {
      shippingChannel: {
        select: {
          id: true,
          name: true,
          code: true
        }
      },
      items: {
        orderBy: { id: "asc" },
        include: {
          orderItem: {
            select: {
              id: true,
              title: true
            }
          }
        }
      }
    }
  },
  payments: {
    orderBy: { id: "asc" },
    select: {
      id: true,
      paymentNo: true,
      provider: true,
      providerOrderNo: true,
      gatewayOrderNo: true,
      type: true,
      amount: true,
      currency: true,
      status: true,
      paymentMethod: true,
      redirectUrl: true,
      paidAt: true,
      failedAt: true,
      createdAt: true,
      updatedAt: true
    }
  },
  notes: {
    orderBy: { id: "asc" },
    select: {
      id: true,
      type: true,
      content: true,
      visibleToUser: true,
      createdBy: true,
      createdAt: true
    }
  }
} as const;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const exportFormat = searchParams.get("export");

  try {
    await requirePermission(exportFormat ? "orders.export" : "orders.view");
  } catch {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const q = (searchParams.get("search") ?? searchParams.get("q"))?.trim().toLowerCase();
  const orderStatus = searchParams.get("orderStatus") ?? searchParams.get("orderTab");
  const where = buildOrderWhere(searchParams, q, orderStatus);

  if (exportFormat === "csv" || exportFormat === "xlsx") {
    const orderIds = searchParams.getAll("orderIds").map((value) => Number(value)).filter((value) => Number.isInteger(value) && value > 0);
    const exportWhere = orderIds.length
      ? {
          AND: [
            where,
            { id: { in: orderIds } }
          ]
        }
      : where;
    const exportOrders = await prisma.order.findMany({
      where: exportWhere,
      include: orderInclude,
      orderBy: { createdAt: "desc" }
    });

    if (searchParams.get("scope") === "selected" && !orderIds.length) {
      return NextResponse.json({ message: "Select at least one order to export." }, { status: 400 });
    }

    return createOrdersExportResponse(exportOrders as OrderRowShape[], exportFormat);
  }

  const page = Math.max(1, Number(searchParams.get("page") ?? Number(searchParams.get("pageIndex") ?? 0) + 1));
  const pageIndex = page - 1;
  const pageSize = Math.min(200, Math.max(1, Number(searchParams.get("pageSize") ?? 25)));
  const sortBy = searchParams.get("sortBy") as keyof MockOrder | null;
  const sortDir = searchParams.get("sortDir") === "desc" ? "desc" : "asc";

  const [orders, total, allMatchingForCounts] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        user: true,
        items: { orderBy: { id: "asc" } }
      },
      orderBy: buildOrderBy(sortBy, sortDir),
      skip: pageIndex * pageSize,
      take: pageSize
    }),
    prisma.order.count({ where }),
    prisma.order.findMany({
      where: buildOrderWhere(searchParams, q, null),
      include: {
        user: true,
        items: { orderBy: { id: "asc" } }
      },
      orderBy: { createdAt: "desc" }
    })
  ]);

  const data = orders.map(mapOrderToAdminRow);
  const filtered = allMatchingForCounts.map(mapOrderToAdminRow);
  const statusCounts = buildStatusCounts(filtered);
  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  return NextResponse.json({
    data,
    meta: {
      pageIndex,
      page,
      pageSize,
      pageCount,
      total,
      statusCounts
    }
  });
}

export async function PATCH(request: Request) {
  const body = (await request.json().catch(() => null)) as PatchBody;

  if (!body?.field || !body.status) {
    return NextResponse.json({ message: "Missing field or status." }, { status: 400 });
  }

  const singleOrderId = body.orderId ? Number(body.orderId) : null;
  const orderIds = (body.orderIds ?? []).map((value) => Number(value)).filter((value) => Number.isInteger(value) && value > 0);
  const isSingleAction = singleOrderId !== null;
  const isBulkAction = orderIds.length > 0;

  if (!isSingleAction && !isBulkAction) {
    return NextResponse.json({ message: "Missing orderId or orderIds." }, { status: 400 });
  }

  const isMoveToTrash = body.field === "riskStatus" && body.status === singleMoveToTrashStatus;
  const isRestoreFromTrash = body.field === "riskStatus" && body.status === singleRestoreFromTrashStatus;
  const isPermanentDelete = body.field === "riskStatus" && body.status === singlePermanentDeleteStatus;
  const isBulkMoveToTrash = body.field === "riskStatus" && body.status === bulkMoveToTrashStatus;
  const isBulkRestoreFromTrash = body.field === "riskStatus" && body.status === bulkRestoreFromTrashStatus;
  const isBulkPermanentDelete = body.field === "riskStatus" && body.status === bulkPermanentDeleteStatus;

  let admin: AdminActor;
  try {
    admin = await requirePermission(
      isMoveToTrash
      || isRestoreFromTrash
      || isPermanentDelete
      || isBulkMoveToTrash
      || isBulkRestoreFromTrash
      || isBulkPermanentDelete
        ? "orders.manage"
        : "orders.update"
    );
  } catch {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  if (isMoveToTrash && singleOrderId !== null) {
    await moveOrdersToTrash([singleOrderId], admin);
    return NextResponse.json({ message: "Order moved to trash." });
  }

  if (isRestoreFromTrash && singleOrderId !== null) {
    await restoreOrdersFromTrash([singleOrderId], admin);
    return NextResponse.json({ message: "Order restored." });
  }

  if (isPermanentDelete && singleOrderId !== null) {
    await permanentlyDeleteOrders([singleOrderId], admin);
    return NextResponse.json({ message: "Order permanently deleted." });
  }

  if (isBulkMoveToTrash) {
    await moveOrdersToTrash(orderIds, admin);
    return NextResponse.json({ message: `${orderIds.length} orders moved to trash.` });
  }

  if (isBulkRestoreFromTrash) {
    await restoreOrdersFromTrash(orderIds, admin);
    return NextResponse.json({ message: `${orderIds.length} orders restored.` });
  }

  if (isBulkPermanentDelete) {
    await permanentlyDeleteOrders(orderIds, admin);
    return NextResponse.json({ message: `${orderIds.length} orders permanently deleted.` });
  }

  if (!statusFields.has(body.field) || singleOrderId === null) {
    return NextResponse.json({ message: "Unsupported status field." }, { status: 400 });
  }

  const existingOrder = await prisma.order.findUnique({
    where: { id: singleOrderId },
    select: {
      id: true,
      orderNo: true,
      status: true,
      orderStatus: true,
      paymentStatus: true,
      purchaseStatus: true,
      warehouseStatus: true,
      packageStatus: true,
      shippingStatus: true,
      riskStatus: true,
      paidUsd: true,
      unpaidUsd: true,
      totalUsd: true
    }
  });

  if (!existingOrder) {
    return NextResponse.json({ message: "Order not found." }, { status: 404 });
  }

  const oldStatus = existingOrder[body.field];
  const nextData = buildOrderStatusUpdate(existingOrder, body.field, body.status);
  const shouldSendOrderPaidEmail = body.field === "paymentStatus" && body.status === "paid" && existingOrder.paymentStatus !== "paid";

  const updatedOrder = await prisma.order.update({
    where: { id: existingOrder.id },
    data: {
      ...nextData,
      logs: {
        create: {
          actorId: admin.id,
          action: body.field === "paymentStatus" && body.status === "paid" ? "order_marked_paid" : "order_status_updated",
          detail: `Updated ${body.field} to ${body.status} from admin order list.`
        }
      }
    },
    include: {
      user: true,
      items: { orderBy: { id: "asc" } }
    }
  });

  logger.info(
    {
      event: "order_status_update",
      orderNo: existingOrder.orderNo,
      field: body.field,
      oldStatus,
      newStatus: body.status,
      operatorId: admin.id
    },
    "Order status updated from admin API"
  );

  await createAuditLog({
    actorId: admin.id,
    actorEmail: admin.email,
    action: body.field === "paymentStatus" && body.status === "paid" ? "order_marked_paid" : "order_status_updated",
    targetType: "order",
    targetId: existingOrder.id,
    targetLabel: existingOrder.orderNo,
    oldValue: auditSnapshot({ [body.field]: oldStatus }),
    newValue: auditSnapshot({ [body.field]: body.status }),
    message: "Order status updated from admin API"
  });

  if (shouldSendOrderPaidEmail) {
    void sendOrderPaidEmail(existingOrder.id).catch(() => undefined);
  }

  return NextResponse.json({ data: mapOrderToAdminRow(updatedOrder), message: "Order status updated." });
}

function buildOrderWhere(searchParams: URLSearchParams, q?: string, orderStatus?: string | null) {
  const and: Array<Record<string, unknown>> = [];
  const view = searchParams.get("view");

  and.push({
    NOT: {
      OR: [
        { orderNo: { startsWith: "PKPAY-" } },
        { orderSource: "package_payment" }
      ]
    }
  });

  if (view === "trash") {
    and.push({ OR: [{ status: "trash" }, { orderStatus: "trash" }] });
  } else {
    and.push({ status: { not: "trash" } });
    and.push({ orderStatus: { not: "trash" } });
  }

  if (q) {
    and.push({
      OR: [
        { orderNo: { contains: q } },
        { orderSource: { contains: q } },
        { destinationCountry: { contains: q } },
        { user: { email: { contains: q } } },
        { items: { some: { title: { contains: q } } } }
      ]
    });
  }

  const paymentStatus = searchParams.get("paymentStatus");
  if (paymentStatus && paymentStatus !== "all") and.push({ paymentStatus });

  const created = searchParams.get("created");
  if (created === "today") {
    and.push({ createdAt: todayDateFilter() });
  }

  const paidAt = searchParams.get("paidAt");
  if (paidAt === "today") {
    and.push({ paidAt: todayDateFilter() });
  }

  const purchaseStatus = searchParams.get("purchaseStatus");
  if (purchaseStatus && purchaseStatus !== "all") and.push({ purchaseStatus });

  const warehouseStatus = searchParams.get("warehouseStatus");
  if (warehouseStatus && warehouseStatus !== "all") and.push({ warehouseStatus });

  const packageStatus = searchParams.get("packageStatus");
  if (packageStatus && packageStatus !== "all") and.push({ packageStatus });

  const shippingStatus = searchParams.get("shippingStatus");
  if (shippingStatus && shippingStatus !== "all") and.push({ shippingStatus });

  const shippingPaymentStatus = searchParams.get("shippingPaymentStatus");
  if (shippingPaymentStatus && shippingPaymentStatus !== "all") {
    if (shippingPaymentStatus === "pending") {
      and.push({
        OR: [
          { shippingPaymentStatus: "pending" },
          { packageStatus: "waiting_shipping_payment" }
        ]
      });
    } else {
      and.push({ shippingPaymentStatus });
    }
  }

  const riskStatus = searchParams.get("riskStatus");
  if (riskStatus && riskStatus !== "all") and.push({ riskStatus });

  const refundStatus = searchParams.get("refundStatus");
  if (refundStatus && refundStatus !== "all") and.push({ refundStatus });

  const destinationCountry = searchParams.get("destinationCountry");
  if (destinationCountry && destinationCountry !== "all") and.push({ destinationCountry });

  if (orderStatus && orderStatus !== "all") {
    and.push(orderTabWhere(orderStatus));
  }

  return and.length ? { AND: and } : {};
}

function todayDateFilter() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return {
    gte: start,
    lt: end
  };
}

function orderTabWhere(orderStatus: string) {
  switch (orderStatus) {
    case "pending_payment":
      return { paymentStatus: { in: ["pending", "partial", "difference_pending", "awaiting_transfer", "redirected", "processing"] } };
    case "paid":
      return { paymentStatus: "paid", purchaseStatus: "pending", riskStatus: "normal" };
    case "reviewing":
      return { riskStatus: "pending_review" };
    case "purchasing":
      return { purchaseStatus: "purchasing" };
    case "warehouse_pending":
      return { purchaseStatus: { in: ["purchased", "partial_purchased"] }, warehouseStatus: { in: ["pending", "partial_received"] } };
    case "shipping_pending":
      return { packageStatus: "waiting_shipping_payment" };
    case "shipped":
      return { shippingStatus: { in: ["shipped", "in_transit"] } };
    case "completed":
      return { shippingStatus: "delivered" };
    case "cancelled":
      return { orderStatus: "cancelled" };
    case "refunded":
      return { paymentStatus: "refunded" };
    default:
      return {};
  }
}

function buildOrderBy(sortBy: keyof MockOrder | null, sortDir: "asc" | "desc") {
  switch (sortBy) {
    case "orderNo":
      return { orderNo: sortDir } as const;
    case "orderSource":
      return { orderSource: sortDir } as const;
    case "destinationCountry":
      return { destinationCountry: sortDir } as const;
    case "totalUsd":
      return { totalUsd: sortDir } as const;
    case "subtotalCny":
      return { subtotalCny: sortDir } as const;
    case "paidUsd":
      return { paidUsd: sortDir } as const;
    case "unpaidUsd":
      return { unpaidUsd: sortDir } as const;
    case "paymentStatus":
      return { paymentStatus: sortDir } as const;
    case "purchaseStatus":
      return { purchaseStatus: sortDir } as const;
    case "warehouseStatus":
      return { warehouseStatus: sortDir } as const;
    case "packageStatus":
      return { packageStatus: sortDir } as const;
    case "shippingStatus":
      return { shippingStatus: sortDir } as const;
    case "riskStatus":
      return { riskStatus: sortDir } as const;
    case "updatedAt":
      return { updatedAt: sortDir } as const;
    default:
      return { createdAt: "desc" } as const;
  }
}

function mapOrderToAdminRow(order: {
  id: number;
  orderNo: string;
  orderSource: string;
  destinationCountry: string | null;
  totalUsd: { toString(): string };
  subtotalCny: { toString(): string };
  paidUsd: { toString(): string };
  unpaidUsd: { toString(): string };
  paymentStatus: string;
  purchaseStatus: string;
  warehouseStatus: string;
  packageStatus: string;
  shippingStatus: string;
  riskStatus: string;
  orderStatus: string;
  updatedAt: Date;
  items: Array<{ id: number; title: string; image: string; quantity: number }>;
  user: { email: string };
}): MockOrder {
  const itemsPreview = order.items.slice(0, 3).map((item) => ({
    id: String(item.id),
    title: item.title,
    image: item.image
  }));
  const totalQuantity = order.items.reduce((sum, item) => sum + item.quantity, 0);

  return {
    id: String(order.id),
    orderNo: order.orderNo,
    userEmail: order.user.email,
    orderSource: normalizeOrderSource(order.orderSource),
    itemsPreview,
    itemCount: order.items.length,
    totalQuantity,
    destinationCountry: order.destinationCountry || "",
    totalUsd: Number(order.totalUsd),
    subtotalCny: Number(order.subtotalCny),
    paidUsd: Number(order.paidUsd),
    unpaidUsd: Number(order.unpaidUsd),
    paymentStatus: normalizePaymentStatus(order.paymentStatus),
    purchaseStatus: normalizePurchaseStatus(order.purchaseStatus),
    warehouseStatus: normalizeWarehouseStatus(order.warehouseStatus),
    packageStatus: normalizePackageStatus(order.packageStatus),
    shippingStatus: normalizeShippingStatus(order.shippingStatus),
    riskStatus: normalizeRiskStatus(order.riskStatus),
    assignee: "Unassigned",
    updatedAt: formatDateTime(order.updatedAt),
    orderTab: deriveOrderTab(order)
  };
}

function normalizeOrderSource(value: string): MockOrder["orderSource"] {
  if (value === "admin") return "admin";
  if (value === "diy") return "diy";
  if (value === "keyword") return "keyword";
  if (value === "cart") return "cart";
  if (value === "image") return "image";
  if (value === "shop") return "shop";
  return "url";
}

function normalizePaymentStatus(value: string): MockOrder["paymentStatus"] {
  if (value === "paid") return "paid";
  if (value === "failed") return "failed";
  if (value === "refunded") return "refunded";
  if (value === "partial") return "partial";
  if (value === "difference_pending") return "difference_pending";
  if (value === "awaiting_transfer") return "awaiting_transfer";
  if (value === "redirected") return "redirected";
  if (value === "processing") return "processing";
  return "pending";
}

function normalizePurchaseStatus(value: string): MockOrder["purchaseStatus"] {
  if (value === "reviewing") return "reviewing";
  if (value === "purchasing") return "purchasing";
  if (value === "purchased") return "purchased";
  if (value === "partial_purchased") return "partial_purchased";
  if (value === "out_of_stock") return "out_of_stock";
  if (value === "price_changed") return "price_changed";
  if (value === "refunded") return "refunded";
  if (value === "failed") return "failed";
  if (value === "cancelled") return "cancelled";
  return "pending";
}

function normalizeWarehouseStatus(value: string): MockOrder["warehouseStatus"] {
  if (value === "partial_received") return "partial_received";
  if (value === "received") return "received";
  if (value === "exception") return "exception";
  if (value === "abnormal") return "exception";
  return "pending";
}

function normalizePackageStatus(value: string): MockOrder["packageStatus"] {
  if (value === "pending") return "pending";
  if (value === "created") return "created";
  if (value === "waiting_shipping_payment") return "waiting_shipping_payment";
  if (value === "ready_to_ship") return "ready_to_ship";
  if (value === "shipping_paid") return "shipping_paid";
  if (value === "shipped") return "shipped";
  if (value === "delivered") return "delivered";
  if (value === "abnormal") return "abnormal";
  return "none";
}

function normalizeShippingStatus(value: string): MockOrder["shippingStatus"] {
  if (value === "pending") return "pending";
  if (value === "ready_to_ship") return "ready_to_ship";
  if (value === "shipped") return "shipped";
  if (value === "in_transit") return "in_transit";
  if (value === "customs_clearance") return "customs_clearance";
  if (value === "delivery_attempted") return "delivery_attempted";
  if (value === "delivered") return "delivered";
  if (value === "exception") return "exception";
  if (value === "returned") return "returned";
  if (value === "lost") return "lost";
  return "none";
}

function normalizeRiskStatus(value: string): MockOrder["riskStatus"] {
  if (value === "pending_review") return "pending_review";
  if (value === "restricted") return "restricted";
  if (value === "abnormal") return "abnormal";
  if (value === "rejected") return "rejected";
  return "normal";
}

function deriveOrderTab(order: { paymentStatus: string; purchaseStatus: string; warehouseStatus: string; packageStatus: string; shippingStatus: string; riskStatus: string; orderStatus: string }): OrderTabKey {
  if (order.orderStatus === "trash") return "cancelled";
  if (order.paymentStatus === "refunded") return "refunded";
  if (order.orderStatus === "cancelled") return "cancelled";
  if (order.shippingStatus === "delivered") return "completed";
  if (order.shippingStatus === "shipped" || order.shippingStatus === "in_transit") return "shipped";
  if (order.packageStatus === "waiting_shipping_payment") return "shipping_pending";
  if (order.purchaseStatus === "purchasing" || order.purchaseStatus === "partial_purchased") return "purchasing";
  if (order.riskStatus === "pending_review") return "reviewing";
  if (order.paymentStatus === "paid" && order.purchaseStatus === "pending") return "paid";
  if ((order.purchaseStatus === "purchased" || order.purchaseStatus === "partial_purchased") && (order.warehouseStatus === "pending" || order.warehouseStatus === "partial_received")) return "warehouse_pending";
  if (order.paymentStatus === "paid") return "paid";
  return "pending_payment";
}

function buildStatusCounts(orders: MockOrder[]) {
  return orders.reduce<Record<OrderTabKey, number>>(
    (counts, order) => {
      counts.all += 1;
      counts[order.orderTab] += 1;
      return counts;
    },
    {
      all: 0,
      pending_payment: 0,
      paid: 0,
      reviewing: 0,
      purchasing: 0,
      warehouse_pending: 0,
      shipping_pending: 0,
      shipped: 0,
      completed: 0,
      cancelled: 0,
      refunded: 0
    }
  );
}

function buildOrderStatusUpdate(
  order: {
    paymentStatus: string;
    purchaseStatus: string;
    warehouseStatus: string;
    packageStatus: string;
    shippingStatus: string;
    status: string;
    orderStatus: string;
    totalUsd: { toString(): string };
  },
  field: StatusField,
  status: string
) {
  const data: Record<string, string | number | Date | null> = {
    [field]: status
  };

  if (field === "paymentStatus" && status === "paid") {
    data.paidUsd = Number(order.totalUsd);
    data.unpaidUsd = 0;
    data.paidAt = new Date();
    if (order.orderStatus === "pending_payment" || order.orderStatus === "processing") {
      data.orderStatus = "paid";
    }
    if (order.status === "pending_payment" || order.status === "processing") {
      data.status = "paid";
    }
  }

  if (field === "paymentStatus" && status !== "paid" && order.orderStatus === "paid") {
    data.orderStatus = "pending_payment";
    data.status = "pending_payment";
  }

  if (field === "purchaseStatus" && status === "purchasing") {
    data.orderStatus = "purchasing";
    data.status = "purchasing";
  }

  if (field === "purchaseStatus" && status === "purchased") {
    data.orderStatus = "warehouse_pending";
    data.status = "purchased";
  }

  if (field === "warehouseStatus" && status === "received") {
    data.orderStatus = "warehouse_received";
    data.status = "warehouse_received";
  }

  if (field === "packageStatus" && status === "waiting_shipping_payment") {
    data.orderStatus = "shipping_pending";
    data.status = "shipping_pending";
  }

  if (field === "shippingStatus" && status === "shipped") {
    data.orderStatus = "shipped";
    data.status = "shipped";
    data.shippedAt = new Date();
  }

  if (field === "shippingStatus" && status === "delivered") {
    data.orderStatus = "completed";
    data.status = "completed";
    data.completedAt = new Date();
  }

  if (field === "riskStatus" && status === "pending_review") {
    data.orderStatus = "reviewing";
    data.status = "reviewing";
  }

  return data;
}

async function moveOrdersToTrash(orderIds: number[], admin: AdminActor) {
  const orders = await prisma.order.findMany({
    where: { id: { in: orderIds } },
    select: { id: true, orderNo: true, status: true, orderStatus: true }
  });

  ensureAllOrdersExist(orderIds, orders);

  await prisma.$transaction(
    orders.map((order) =>
      prisma.order.update({
        where: { id: order.id },
        data: {
          status: "trash",
          orderStatus: "trash",
          logs: {
            create: {
              actorId: admin.id,
              action: "order_moved_to_trash",
              detail: "Order moved to trash from admin order list."
            }
          }
        }
      })
    )
  );

  await Promise.all(
    orders.map((order) =>
      createAuditLog({
        actorId: admin.id,
        actorEmail: admin.email,
        action: "order_moved_to_trash",
        targetType: "order",
        targetId: order.id,
        targetLabel: order.orderNo,
        oldValue: auditSnapshot({ status: order.status, orderStatus: order.orderStatus }),
        newValue: auditSnapshot({ status: "trash", orderStatus: "trash" }),
        message: "Order moved to trash from admin order list"
      })
    )
  );
}

async function restoreOrdersFromTrash(orderIds: number[], admin: AdminActor) {
  const orders = await prisma.order.findMany({
    where: { id: { in: orderIds } },
    select: { id: true, orderNo: true, status: true, orderStatus: true, paymentStatus: true }
  });

  ensureAllOrdersExist(orderIds, orders);

  await prisma.$transaction(
    orders.map((order) => {
      const restoredStatus = order.paymentStatus === "paid" ? "paid" : "pending_payment";

      return prisma.order.update({
        where: { id: order.id },
        data: {
          status: restoredStatus,
          orderStatus: restoredStatus,
          logs: {
            create: {
              actorId: admin.id,
              action: "order_restored_from_trash",
              detail: `Order restored as ${restoredStatus} from admin order list.`
            }
          }
        }
      });
    })
  );

  await Promise.all(
    orders.map((order) => {
      const restoredStatus = order.paymentStatus === "paid" ? "paid" : "pending_payment";

      return createAuditLog({
        actorId: admin.id,
        actorEmail: admin.email,
        action: "order_restored_from_trash",
        targetType: "order",
        targetId: order.id,
        targetLabel: order.orderNo,
        oldValue: auditSnapshot({ status: order.status, orderStatus: order.orderStatus }),
        newValue: auditSnapshot({ status: restoredStatus, orderStatus: restoredStatus }),
        message: "Order restored from trash from admin order list"
      });
    })
  );
}

async function permanentlyDeleteOrders(orderIds: number[], admin: AdminActor) {
  const orders = await prisma.order.findMany({
    where: { id: { in: orderIds } },
    include: {
      items: { select: { id: true } },
      packages: { select: { id: true } }
    }
  });

  ensureAllOrdersExist(orderIds, orders);

  for (const order of orders) {
    if (order.status !== "trash" && order.orderStatus !== "trash") {
      throw new Error(`Move order ${order.orderNo} to trash before permanently deleting it.`);
    }
  }

  for (const order of orders) {
    const packageIds = order.packages.map((pkg) => pkg.id);
    const itemIds = order.items.map((item) => item.id);
    const packageItemWhere =
      packageIds.length && itemIds.length
        ? { OR: [{ packageId: { in: packageIds } }, { orderItemId: { in: itemIds } }] }
        : packageIds.length
          ? { packageId: { in: packageIds } }
          : itemIds.length
            ? { orderItemId: { in: itemIds } }
            : { id: -1 };
    const paymentWhere =
      packageIds.length
        ? { OR: [{ orderId: order.id }, { packageId: { in: packageIds } }] }
        : { orderId: order.id };

    await prisma.$transaction([
      prisma.packageItem.deleteMany({ where: packageItemWhere }),
      prisma.payment.deleteMany({ where: paymentWhere }),
      prisma.walletTransaction.updateMany({ where: { relatedOrderId: order.id }, data: { relatedOrderId: null } }),
      packageIds.length
        ? prisma.walletTransaction.updateMany({ where: { relatedPackageId: { in: packageIds } }, data: { relatedPackageId: null } })
        : prisma.walletTransaction.updateMany({ where: { id: -1 }, data: { relatedPackageId: null } }),
      prisma.operationLog.deleteMany({ where: { orderId: order.id } }),
      prisma.orderNote.deleteMany({ where: { orderId: order.id } }),
      prisma.package.deleteMany({ where: { orderId: order.id } }),
      prisma.orderItem.deleteMany({ where: { orderId: order.id } }),
      prisma.order.delete({ where: { id: order.id } })
    ]);

    await createAuditLog({
      actorId: admin.id,
      actorEmail: admin.email,
      action: "order_permanently_deleted",
      targetType: "order",
      targetId: order.id,
      targetLabel: order.orderNo,
      oldValue: auditSnapshot({ status: order.status, orderStatus: order.orderStatus }),
      newValue: auditSnapshot({ deleted: true }),
      message: "Order permanently deleted from trash from admin order list"
    });
  }
}

function ensureAllOrdersExist<TOrder extends { id: number }>(orderIds: number[], orders: TOrder[]) {
  const foundIds = new Set(orders.map((order) => order.id));
  const missingIds = orderIds.filter((orderId) => !foundIds.has(orderId));

  if (missingIds.length) {
    throw new Error(`Order not found: ${missingIds.join(", ")}`);
  }
}

function createOrdersExportResponse(orders: OrderRowShape[], format: "csv" | "xlsx") {
  const rows = orders.map(flattenOrderForExport);
  const timestamp = formatFilenameTimestamp(new Date());

  if (format === "csv") {
    const headers = Array.from(
      rows.reduce<Set<string>>((keys, row) => {
        Object.keys(row).forEach((key) => keys.add(key));
        return keys;
      }, new Set<string>())
    );
    const csvRows = rows.map((row) => {
      const record = row as Record<string, string | number>;
      return headers.map((header) => csvCell(String(record[header] ?? ""))).join(",");
    });
    const csv = [`\uFEFF${headers.join(",")}`, ...csvRows].join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="orders-full-${timestamp}.csv"`
      }
    });
  }

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Orders");
  const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer", compression: true });

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="orders-full-${timestamp}.xlsx"`
    }
  });
}

function flattenOrderForExport(order: OrderRowShape) {
  const addressSnapshot = stringifyValue(order.shippingAddressSnapshot);
  const valueAddedServicesSnapshot = stringifyValue(order.valueAddedServicesSnapshot);

  return {
    orderId: order.id,
    orderNo: order.orderNo,
    status: order.status,
    orderSource: order.orderSource,
    orderStatus: order.orderStatus,
    paymentStatus: order.paymentStatus,
    purchaseStatus: order.purchaseStatus,
    warehouseStatus: order.warehouseStatus,
    packageStatus: order.packageStatus,
    shippingPaymentStatus: order.shippingPaymentStatus,
    shippingStatus: order.shippingStatus,
    riskStatus: order.riskStatus,
    refundStatus: order.refundStatus,
    destinationCountry: order.destinationCountry ?? "",
    destinationCountryCode: order.destinationCountryCode ?? "",
    currency: order.currency,
    subtotalCny: decimalToString(order.subtotalCny),
    subtotalUsd: decimalToString(order.subtotalUsd),
    exchangeRate: decimalToString(order.exchangeRate),
    serviceFeeUsd: decimalToString(order.serviceFeeUsd),
    domesticShippingUsd: decimalToString(order.domesticShippingUsd),
    valueAddedServicesUsd: decimalToString(order.valueAddedServicesUsd),
    estimatedShippingUsd: decimalToString(order.estimatedShippingUsd),
    actualShippingUsd: decimalToString(order.actualShippingUsd),
    discountUsd: decimalToString(order.discountUsd),
    refundUsd: decimalToString(order.refundUsd),
    totalUsd: decimalToString(order.totalUsd),
    paidUsd: decimalToString(order.paidUsd),
    unpaidUsd: decimalToString(order.unpaidUsd),
    itemCount: order.itemCount,
    totalQuantity: order.totalQuantity,
    assigneeId: order.assigneeId ?? "",
    addressId: order.addressId ?? "",
    userId: order.user.id,
    userEmail: order.user.email,
    userName: order.user.name ?? "",
    userNote: order.userNote ?? "",
    adminNote: order.adminNote ?? "",
    shippingAddressSnapshot: addressSnapshot,
    valueAddedServicesSnapshot,
    paidAt: formatNullableDate(order.paidAt),
    purchasedAt: formatNullableDate(order.purchasedAt),
    warehouseReceivedAt: formatNullableDate(order.warehouseReceivedAt),
    shippedAt: formatNullableDate(order.shippedAt),
    completedAt: formatNullableDate(order.completedAt),
    cancelledAt: formatNullableDate(order.cancelledAt),
    createdAt: formatDateTime(order.createdAt),
    updatedAt: formatDateTime(order.updatedAt),
    addressLabel: order.address?.label ?? "",
    addressContactName: order.address?.contactName ?? "",
    addressPhone: order.address?.phone ?? "",
    addressCountry: order.address?.country ?? "",
    addressState: order.address?.state ?? "",
    addressCity: order.address?.city ?? "",
    addressPostalCode: order.address?.postalCode ?? "",
    addressLine1: order.address?.line1 ?? "",
    addressLine2: order.address?.line2 ?? "",
    items: stringifyValue(
      order.items.map((item) => ({
        id: item.id,
        platform: item.platform,
        sourceItemId: item.sourceItemId,
        sourceUrl: item.sourceUrl,
        title: item.title,
        image: item.image,
        skuId: item.skuId,
        skuText: item.skuText,
        priceCny: decimalToString(item.priceCny),
        priceUsd: decimalToString(item.priceUsd),
        quantity: item.quantity,
        purchaseStatus: item.purchaseStatus,
        createdAt: formatDateTime(item.createdAt)
      }))
    ),
    packages: stringifyValue(
      order.packages.map((pkg) => ({
        id: pkg.id,
        packageNo: pkg.packageNo,
        status: pkg.status,
        weightKg: decimalToString(pkg.weightKg),
        lengthCm: decimalOrEmpty(pkg.lengthCm),
        widthCm: decimalOrEmpty(pkg.widthCm),
        heightCm: decimalOrEmpty(pkg.heightCm),
        shippingFeeUsd: decimalToString(pkg.shippingFeeUsd),
        trackingNumber: pkg.trackingNumber,
        shippedAt: formatNullableDate(pkg.shippedAt),
        deliveredAt: formatNullableDate(pkg.deliveredAt),
        createdAt: formatDateTime(pkg.createdAt),
        updatedAt: formatDateTime(pkg.updatedAt),
        shippingChannel: pkg.shippingChannel,
        items: pkg.items.map((item) => ({
          id: item.id,
          quantity: item.quantity,
          orderItemId: item.orderItem.id,
          orderItemTitle: item.orderItem.title
        }))
      }))
    ),
    payments: stringifyValue(
      order.payments.map((payment) => ({
        id: payment.id,
        paymentNo: payment.paymentNo,
        provider: payment.provider,
        providerOrderNo: payment.providerOrderNo,
        gatewayOrderNo: payment.gatewayOrderNo,
        type: payment.type,
        amount: decimalToString(payment.amount),
        currency: payment.currency,
        status: payment.status,
        paymentMethod: payment.paymentMethod,
        redirectUrl: payment.redirectUrl,
        paidAt: formatNullableDate(payment.paidAt),
        failedAt: formatNullableDate(payment.failedAt),
        createdAt: formatDateTime(payment.createdAt),
        updatedAt: formatDateTime(payment.updatedAt)
      }))
    ),
    notes: stringifyValue(
      order.notes.map((note) => ({
        id: note.id,
        type: note.type,
        content: note.content,
        visibleToUser: note.visibleToUser,
        createdBy: note.createdBy,
        createdAt: formatDateTime(note.createdAt)
      }))
    )
  };
}

function formatDateTime(date: Date) {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function formatNullableDate(date: Date | null) {
  return date ? formatDateTime(date) : "";
}

function decimalToString(value: { toString(): string }) {
  return value.toString();
}

function decimalOrEmpty(value: { toString(): string } | null) {
  return value ? value.toString() : "";
}

function stringifyValue(value: unknown) {
  if (value == null) return "";

  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function csvCell(value: string) {
  return `"${value.replace(/"/g, "\"\"")}"`;
}

function formatFilenameTimestamp(date: Date) {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
}
