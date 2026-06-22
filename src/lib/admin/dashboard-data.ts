import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getPricingSettings } from "@/lib/currency";
import { statusLabel } from "@/lib/constants";
import type {
  ApiHealth,
  DashboardDateRange,
  DashboardDistribution,
  DashboardMetric,
  DashboardSummary,
  DashboardTasks,
  DashboardTrendPoint,
  DistributionPoint,
  RiskAlert,
  TaskItem
} from "@/types/dashboard";

const rangeDays: Record<DashboardDateRange, number> = {
  today: 1,
  "7d": 7,
  "30d": 30,
  "90d": 90
};

const activeOrderWhere: Prisma.OrderWhereInput = {
  AND: [
    { NOT: [{ status: "trash" }, { orderStatus: "trash" }] },
    {
      NOT: {
        OR: [
          { orderNo: { startsWith: "PKPAY-" } },
          { orderSource: "package_payment" }
        ]
      }
    }
  ]
};

const paidPaymentWhere = {
  status: {
    in: ["paid", "success", "completed", "captured", "live_success"]
  }
} satisfies Prisma.PaymentWhereInput;

const failedApiWhere = {
  OR: [{ status: { contains: "fail" } }, { status: { contains: "error" } }, { status: { contains: "exception" } }]
} satisfies Prisma.ApiLogWhereInput;

export async function getDashboardSummary(range: DashboardDateRange = "today"): Promise<DashboardSummary> {
  const today = getDateRange("today");
  const settings = await getPricingSettings();
  const [
    todayOrders,
    todayPaidOrdersFromOrders,
    todayPaidOrderPayments,
    todayPaidPayments,
    pendingPurchase,
    purchasing,
    warehousePending,
    pendingWeight,
    waitingShippingPayment,
    readyToShip,
    riskOrders,
    refundPending,
    apiErrorsToday,
    apiHealth,
    riskAlert
  ] = await Promise.all([
    prisma.order.count({ where: andOrderWhere(activeOrderWhere, { createdAt: dateFilter(today) }) }),
    prisma.order.findMany({
      where: andOrderWhere(activeOrderWhere, { paymentStatus: "paid", paidAt: dateFilter(today) }),
      select: { id: true }
    }),
    prisma.payment.findMany({
      where: andPaymentWhere(paidPaymentWhere, { paidAt: dateFilter(today), orderId: { not: null } }),
      select: { orderId: true }
    }),
    prisma.payment.findMany({
      where: andPaymentWhere(paidPaymentWhere, { paidAt: dateFilter(today) }),
      select: { amount: true, currency: true }
    }),
    prisma.order.count({ where: andOrderWhere(activeOrderWhere, { paymentStatus: "paid", purchaseStatus: "pending" }) }),
    prisma.order.count({ where: andOrderWhere(activeOrderWhere, { OR: [{ orderStatus: "purchasing" }, { purchaseStatus: { in: ["purchasing", "partial_purchased"] } }] }) }),
    prisma.order.count({ where: andOrderWhere(activeOrderWhere, { purchaseStatus: "purchased", warehouseStatus: { in: ["pending", "partial_received"] } }) }),
    prisma.package.count({ where: { status: { in: ["pending", "pending_weight"] } } }),
    prisma.order.count({ where: andOrderWhere(activeOrderWhere, { OR: [{ shippingPaymentStatus: "pending" }, { packageStatus: "waiting_shipping_payment" }] }) }),
    prisma.order.count({ where: andOrderWhere(activeOrderWhere, { OR: [{ shippingStatus: "ready_to_ship" }, { packageStatus: "shipping_paid" }] }) }),
    prisma.order.count({ where: andOrderWhere(activeOrderWhere, riskOrderWhere()) }),
    prisma.order.count({ where: andOrderWhere(activeOrderWhere, { refundStatus: "pending" }) }),
    prisma.apiLog.count({ where: andApiLogWhere(failedApiWhere, { createdAt: dateFilter(today) }) }),
    getApiHealth(),
    getRiskAlert()
  ]);

  const todayPaidOrderIds = new Set<number>();
  const validTodayPaidOrderIds = new Set(todayPaidOrdersFromOrders.map((order) => order.id));
  todayPaidOrdersFromOrders.forEach((order) => todayPaidOrderIds.add(order.id));
  todayPaidOrderPayments.forEach((payment) => {
    if (payment.orderId && validTodayPaidOrderIds.has(payment.orderId)) {
      todayPaidOrderIds.add(payment.orderId);
    }
  });

  const paidUsd = sumMoneyUsd(todayPaidPayments, settings.exchangeRate);

  return {
    range,
    generatedAt: new Date().toISOString(),
    metrics: buildSummaryMetrics({
      todayOrders,
      todayPaidOrders: todayPaidOrderIds.size,
      todayPaidAmountUsd: paidUsd,
      todayPaidAmountCny: paidUsd * settings.exchangeRate,
      pendingPurchase,
      purchasing,
      warehousePending,
      pendingWeight,
      waitingShippingPayment,
      readyToShip,
      riskOrders,
      refundPending,
      apiErrorsToday
    }),
    apiHealth,
    riskAlert
  };
}

export async function getDashboardTrends(range: DashboardDateRange = "30d"): Promise<{ range: DashboardDateRange; points: DashboardTrendPoint[] }> {
  const window = getDateRange(range);
  const settings = await getPricingSettings();
  const [orders, payments, walletTransactions] = await Promise.all([
    prisma.order.findMany({
      where: {
        OR: [
          { createdAt: dateFilter(window) },
          { paidAt: dateFilter(window) },
          { completedAt: dateFilter(window) }
        ]
      },
      select: { createdAt: true, paidAt: true, completedAt: true, paymentStatus: true }
    }),
    prisma.payment.findMany({
      where: andPaymentWhere(paidPaymentWhere, { paidAt: dateFilter(window) }),
      select: { amount: true, currency: true, type: true, paidAt: true, createdAt: true }
    }),
    prisma.walletTransaction.findMany({
      where: {
        createdAt: dateFilter(window),
        type: { in: ["recharge", "refund"] }
      },
      select: { amount: true, currency: true, type: true, createdAt: true }
    })
  ]);
  const buckets = buildTrendBuckets(window);

  for (const order of orders) {
    incrementBucket(buckets, order.createdAt, "createdOrders", 1);
    if (order.paidAt && order.paymentStatus === "paid") {
      incrementBucket(buckets, order.paidAt, "paidOrders", 1);
    }
    if (order.completedAt) {
      incrementBucket(buckets, order.completedAt, "completedOrders", 1);
    }
  }

  for (const payment of payments) {
    const paidAt = payment.paidAt ?? payment.createdAt;
    const amountUsd = moneyToUsd(payment.amount, payment.currency, settings.exchangeRate);
    const type = payment.type.toLowerCase();

    if (type.includes("shipping")) {
      incrementBucket(buckets, paidAt, "shippingPayment", amountUsd);
    } else if (type.includes("recharge")) {
      incrementBucket(buckets, paidAt, "recharge", amountUsd);
    } else if (type.includes("refund")) {
      incrementBucket(buckets, paidAt, "refund", amountUsd);
    } else {
      incrementBucket(buckets, paidAt, "productPayment", amountUsd);
    }
  }

  for (const transaction of walletTransactions) {
    const amountUsd = Math.abs(moneyToUsd(transaction.amount, transaction.currency, settings.exchangeRate));
    if (transaction.type === "recharge") {
      incrementBucket(buckets, transaction.createdAt, "recharge", amountUsd);
    }
    if (transaction.type === "refund") {
      incrementBucket(buckets, transaction.createdAt, "refund", amountUsd);
    }
  }

  return { range, points: Array.from(buckets.values()).map(roundTrendPoint) };
}

export async function getDashboardDistribution(range: DashboardDateRange = "30d"): Promise<DashboardDistribution> {
  const window = getDateRange(range);
  const [orderStatuses, payments, orders, packages] = await Promise.all([
    getOrderStatusDistribution(window),
    prisma.payment.findMany({
      where: andPaymentWhere(paidPaymentWhere, { paidAt: dateFilter(window) }),
      select: { provider: true, paymentMethod: true }
    }),
    prisma.order.findMany({
      where: andOrderWhere(activeOrderWhere, { createdAt: dateFilter(window) }),
      select: { destinationCountry: true, destinationCountryCode: true, orderSource: true }
    }),
    prisma.package.findMany({
      where: { createdAt: dateFilter(window) },
      include: { shippingChannel: { select: { name: true, code: true } } }
    })
  ]);

  return {
    range,
    orderStatuses,
    paymentMethods: countRecords(payments, (payment) => normalizePaymentMethod(payment.paymentMethod ?? payment.provider)),
    countryOrders: countRecords(orders, (order) => order.destinationCountryCode || order.destinationCountry || "Unknown"),
    shippingChannels: countRecords(packages, (pkg) => pkg.shippingChannel?.name || pkg.shippingChannel?.code || "No channel"),
    orderSources: countRecords(orders, (order) => statusLabel[order.orderSource] ?? titleize(order.orderSource || "unknown"))
  };
}

export async function getDashboardTasks(range: DashboardDateRange = "30d"): Promise<DashboardTasks> {
  const window = getDateRange(range);
  const overdueCutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const [pendingPurchaseOrders, overduePurchaseOrders, warehouseAbnormalOrders, waitingShippingPackages, readyToShipPackages, shippingExceptionPackages, apiErrors] =
    await Promise.all([
      prisma.order.findMany({
        where: andOrderWhere(activeOrderWhere, { paymentStatus: "paid", purchaseStatus: "pending" }),
        include: { user: { select: { email: true } } },
        orderBy: [{ paidAt: "asc" }, { updatedAt: "asc" }],
        take: 5
      }),
      prisma.order.findMany({
        where: andOrderWhere(activeOrderWhere, { paymentStatus: "paid", purchaseStatus: "pending", paidAt: { lt: overdueCutoff } }),
        include: { user: { select: { email: true } } },
        orderBy: { paidAt: "asc" },
        take: 5
      }),
      prisma.order.findMany({
        where: andOrderWhere(activeOrderWhere, { OR: [{ warehouseStatus: { in: ["abnormal", "exception"] } }, { packageStatus: "abnormal" }, { orderStatus: "abnormal" }] }),
        include: { items: { take: 1, select: { title: true } } },
        orderBy: { updatedAt: "desc" },
        take: 5
      }),
      prisma.package.findMany({
        where: {
          OR: [{ status: "waiting_shipping_payment" }, { order: { shippingPaymentStatus: "pending" } }]
        },
        include: { user: { select: { email: true } }, order: { select: { orderNo: true } } },
        orderBy: { updatedAt: "asc" },
        take: 5
      }),
      prisma.package.findMany({
        where: {
          OR: [{ status: { in: ["shipping_paid", "ready_to_ship"] } }, { order: { shippingStatus: "ready_to_ship" } }]
        },
        include: { user: { select: { email: true } }, shippingChannel: { select: { name: true, code: true } } },
        orderBy: { updatedAt: "asc" },
        take: 5
      }),
      prisma.package.findMany({
        where: {
          OR: [{ status: { in: ["abnormal", "returned", "cancelled"] } }, { order: { shippingStatus: { in: ["exception", "returned", "lost"] } } }]
        },
        include: { order: { select: { shippingStatus: true } } },
        orderBy: { updatedAt: "desc" },
        take: 5
      }),
      prisma.apiLog.findMany({
        where: andApiLogWhere(failedApiWhere, { createdAt: dateFilter(window) }),
        orderBy: { createdAt: "desc" },
        take: 5
      })
    ]);

  return {
    range,
    pendingPurchaseOrders: pendingPurchaseOrders.map((order) => orderTask(order, "pending_purchase")),
    overduePurchaseOrders: overduePurchaseOrders.map((order) => orderTask(order, "overdue_purchase")),
    warehouseAbnormal: warehouseAbnormalOrders.map((order) => ({
      id: `warehouse-${order.id}`,
      type: "warehouse_abnormal",
      title: "Warehouse abnormal",
      primaryRef: order.orderNo,
      itemTitle: order.items[0]?.title,
      message: statusLabel[order.warehouseStatus] ?? order.warehouseStatus,
      status: order.warehouseStatus,
      occurredAt: formatDateTime(order.updatedAt),
      waitingFor: elapsedLabel(order.updatedAt),
      href: `/admin/orders/${order.id}`
    })),
    waitingShippingPayment: waitingShippingPackages.map((pkg) => ({
      id: `shipping-payment-${pkg.id}`,
      type: "waiting_shipping_payment",
      title: "Shipping payment due",
      primaryRef: pkg.packageNo,
      user: pkg.user.email,
      shippingFeeUsd: Number(pkg.shippingFeeUsd),
      status: pkg.status,
      occurredAt: formatDateTime(pkg.updatedAt),
      waitingFor: elapsedLabel(pkg.updatedAt),
      href: `/admin/packages?shippingPaymentStatus=pending`
    })),
    readyToShip: readyToShipPackages.map((pkg) => ({
      id: `ready-ship-${pkg.id}`,
      type: "ready_to_ship",
      title: "Ready to dispatch",
      primaryRef: pkg.packageNo,
      user: pkg.user.email,
      channel: pkg.shippingChannel?.name ?? pkg.shippingChannel?.code ?? "No channel",
      status: pkg.status,
      occurredAt: formatDateTime(pkg.updatedAt),
      waitingFor: elapsedLabel(pkg.updatedAt),
      href: `/admin/packages?shippingStatus=ready_to_ship`
    })),
    shippingExceptions: shippingExceptionPackages.map((pkg) => ({
      id: `shipping-exception-${pkg.id}`,
      type: "shipping_exception",
      title: "Shipping exception",
      primaryRef: pkg.packageNo,
      trackingNumber: pkg.trackingNumber ?? undefined,
      message: statusLabel[pkg.order?.shippingStatus ?? pkg.status] ?? pkg.order?.shippingStatus ?? pkg.status,
      status: pkg.order?.shippingStatus ?? pkg.status,
      occurredAt: formatDateTime(pkg.updatedAt),
      waitingFor: elapsedLabel(pkg.updatedAt),
      href: "/admin/packages/shipping-records?status=exception"
    })),
    apiErrors: apiErrors.map((log) => ({
      id: `api-${log.id}`,
      type: "api_error",
      title: log.endpoint,
      primaryRef: log.endpoint,
      user: log.provider,
      message: log.error ?? log.status,
      status: log.status,
      occurredAt: formatDateTime(log.createdAt),
      waitingFor: elapsedLabel(log.createdAt),
      href: "/admin/products/api-logs?status=failed&date=today"
    }))
  };
}

function buildSummaryMetrics(values: {
  todayOrders: number;
  todayPaidOrders: number;
  todayPaidAmountUsd: number;
  todayPaidAmountCny: number;
  pendingPurchase: number;
  purchasing: number;
  warehousePending: number;
  pendingWeight: number;
  waitingShippingPayment: number;
  readyToShip: number;
  riskOrders: number;
  refundPending: number;
  apiErrorsToday: number;
}): DashboardMetric[] {
  return [
    metric("today-orders", "Today Orders", values.todayOrders, "New purchasing-agent orders created today.", "/admin/orders?created=today", "info"),
    metric("today-paid-orders", "Today Paid Orders", values.todayPaidOrders, "Orders with product payment captured today.", "/admin/orders?paymentStatus=paid&paidAt=today", "success"),
    {
      id: "today-paid-amount",
      label: "Today Paid Amount",
      value: roundMoney(values.todayPaidAmountUsd),
      format: "money",
      currency: "USD",
      secondaryValue: roundMoney(values.todayPaidAmountCny),
      secondaryLabel: "CNY estimate",
      description: "Real paid payment records captured today.",
      href: "/admin/orders?paymentStatus=paid&paidAt=today",
      tone: "success"
    },
    metric("pending-purchase", "Pending Purchase", values.pendingPurchase, "Paid orders waiting for buyer action.", "/admin/orders?paymentStatus=paid&purchaseStatus=pending", "warning"),
    metric("purchasing", "Purchasing", values.purchasing, "Orders currently assigned to purchasing staff.", "/admin/orders?purchaseStatus=purchasing", "info"),
    metric("warehouse-pending", "Warehouse Pending", values.warehousePending, "Purchased orders waiting for inbound confirmation.", "/admin/orders?purchaseStatus=purchased&warehouseStatus=pending", "warning"),
    metric("pending-weight", "Pending Weight", values.pendingWeight, "Packages waiting for actual or volumetric weight entry.", "/admin/packages?status=pending_weight", "warning"),
    metric("waiting-shipping-payment", "Waiting Shipping Payment", values.waitingShippingPayment, "International shipping bills generated but not paid.", "/admin/orders?shippingPaymentStatus=pending", "warning"),
    metric("ready-to-ship", "Ready To Ship", values.readyToShip, "Shipping paid packages waiting for dispatch.", "/admin/orders?shippingStatus=ready_to_ship", "success"),
    metric("risk-orders", "Risk Orders", values.riskOrders, "Orders that need risk or restricted-goods review.", "/admin/orders?riskStatus=pending_review", "danger"),
    metric("refund-pending", "Refund Pending", values.refundPending, "Refund requests waiting for finance approval.", "/admin/orders?refundStatus=pending", "danger"),
    metric("api-errors-today", "API Errors Today", values.apiErrorsToday, "Failed OneBound product/search calls today.", "/admin/products/api-logs?status=failed&date=today", "danger")
  ];
}

function metric(id: string, label: string, value: number, description: string, href: string, tone: DashboardMetric["tone"]): DashboardMetric {
  return { id, label, value, description, href, tone };
}

async function getApiHealth(): Promise<ApiHealth> {
  const today = getDateRange("today");
  const logs = await prisma.apiLog.findMany({
    where: { createdAt: dateFilter(today) },
    select: { endpoint: true, status: true, latencyMs: true, error: true }
  });
  const failedLogs = logs.filter((log) => isFailedStatus(log.status));
  const totalCallsToday = logs.length;
  const averageResponseMs = totalCallsToday ? Math.round(logs.reduce((sum, log) => sum + log.latencyMs, 0) / totalCallsToday) : 0;

  return {
    totalCallsToday,
    successRate: totalCallsToday ? roundMoney(((totalCallsToday - failedLogs.length) / totalCallsToday) * 100) : 0,
    failedCallsToday: failedLogs.length,
    averageResponseMs,
    topErrorReasons: topCounts(failedLogs.map((log) => log.error || log.status || "Unknown error")).map(([reason, count]) => ({ reason, count })),
    typeDistribution: apiTypeDistribution(logs)
  };
}

async function getRiskAlert(): Promise<RiskAlert> {
  const [riskOrders, sensitiveGoodsOrders, forbiddenGoodsOrders, highValueGoodsOrders, paymentAbnormalOrders, riskUsers] = await Promise.all([
    prisma.order.count({ where: andOrderWhere(activeOrderWhere, riskOrderWhere()) }),
    prisma.order.count({ where: andOrderWhere(activeOrderWhere, sensitiveGoodsWhere()) }),
    prisma.order.count({ where: andOrderWhere(activeOrderWhere, { riskStatus: { in: ["restricted", "rejected"] } }) }),
    prisma.order.count({ where: andOrderWhere(activeOrderWhere, { totalUsd: { gte: 500 } }) }),
    prisma.order.count({ where: andOrderWhere(activeOrderWhere, { paymentStatus: { in: ["failed", "difference_pending"] } }) }),
    prisma.order.groupBy({
      by: ["userId"],
      where: andOrderWhere(activeOrderWhere, riskOrderWhere())
    })
  ]);

  return {
    riskOrders,
    sensitiveGoodsOrders,
    forbiddenGoodsOrders,
    highValueGoodsOrders,
    paymentAbnormalOrders,
    riskUsers: riskUsers.length
  };
}

async function getOrderStatusDistribution(window: DateWindow): Promise<DistributionPoint[]> {
  const where = (input: Prisma.OrderWhereInput) => andOrderWhere(activeOrderWhere, { createdAt: dateFilter(window) }, input);
  const entries = await Promise.all([
    countStatus("Pending Payment", "pending_payment", where({ paymentStatus: { in: ["pending", "partial", "difference_pending"] } })),
    countStatus("Paid", "paid", where({ paymentStatus: "paid", purchaseStatus: "pending" })),
    countStatus("Purchasing", "purchasing", where({ OR: [{ orderStatus: "purchasing" }, { purchaseStatus: { in: ["purchasing", "partial_purchased"] } }] })),
    countStatus("Warehouse Pending", "warehouse_pending", where({ purchaseStatus: "purchased", warehouseStatus: { in: ["pending", "partial_received"] } })),
    countStatus("Shipping Pending", "shipping_pending", where({ OR: [{ shippingPaymentStatus: "pending" }, { packageStatus: "waiting_shipping_payment" }] })),
    countStatus("Shipped", "shipped", where({ shippingStatus: { in: ["shipped", "in_transit", "customs_clearance", "delivery_attempted"] } })),
    countStatus("Completed", "completed", where({ OR: [{ orderStatus: "completed" }, { status: "completed" }] })),
    countStatus("Cancelled", "cancelled", where({ OR: [{ orderStatus: "cancelled" }, { status: "cancelled" }] })),
    countStatus("Refunded", "refunded", where({ OR: [{ orderStatus: "refunded" }, { refundStatus: { in: ["partial_refunded", "refunded"] } }, { paymentStatus: "refunded" }] })),
    countStatus("Abnormal", "abnormal", where(riskOrderWhere()))
  ]);

  return entries;
}

async function countStatus(label: string, status: string, where: Prisma.OrderWhereInput): Promise<DistributionPoint> {
  return {
    label,
    status,
    value: await prisma.order.count({ where })
  };
}

function orderTask(
  order: {
    id: number;
    orderNo: string;
    totalUsd: Prisma.Decimal;
    paidAt: Date | null;
    updatedAt: Date;
    user: { email: string };
  },
  type: "pending_purchase" | "overdue_purchase"
): TaskItem {
  const time = order.paidAt ?? order.updatedAt;
  return {
    id: `${type}-${order.id}`,
    type,
    title: type === "overdue_purchase" ? "Purchase overdue" : "Needs purchasing",
    primaryRef: order.orderNo,
    user: order.user.email,
    amountUsd: Number(order.totalUsd),
    status: type === "overdue_purchase" ? "abnormal" : "pending",
    occurredAt: formatDateTime(time),
    waitingFor: elapsedLabel(time),
    href: `/admin/orders/${order.id}`
  };
}

function sensitiveGoodsWhere(): Prisma.OrderWhereInput {
  const terms = ["battery", "liquid", "powder", "magnet", "perfume", "knife", "medicine", "brand"];
  return {
    OR: [
      { riskStatus: "pending_review" },
      ...terms.flatMap((term) => [
        { adminNote: { contains: term } },
        { userNote: { contains: term } },
        { items: { some: { title: { contains: term } } } },
        { items: { some: { skuText: { contains: term } } } }
      ])
    ]
  };
}

function riskOrderWhere(): Prisma.OrderWhereInput {
  return {
    OR: [
      { orderStatus: "abnormal" },
      { riskStatus: { not: "normal" } },
      { warehouseStatus: { in: ["abnormal", "exception"] } },
      { packageStatus: "abnormal" },
      { shippingStatus: { in: ["exception", "returned", "lost"] } }
    ]
  };
}

function apiTypeDistribution(logs: Array<{ endpoint: string }>): ApiHealth["typeDistribution"] {
  const counts: Record<ApiHealth["typeDistribution"][number]["type"], number> = {
    detail: 0,
    search: 0,
    image: 0,
    shop: 0,
    price_refresh: 0
  };

  logs.forEach((log) => {
    counts[classifyApiType(log.endpoint)] += 1;
  });

  return Object.entries(counts).map(([type, count]) => ({
    type: type as ApiHealth["typeDistribution"][number]["type"],
    count
  }));
}

function classifyApiType(endpoint: string): ApiHealth["typeDistribution"][number]["type"] {
  const value = endpoint.toLowerCase();
  if (value.includes("image") || value.includes("img")) return "image";
  if (value.includes("shop")) return "shop";
  if (value.includes("price")) return "price_refresh";
  if (value.includes("search")) return "search";
  return "detail";
}

function countRecords<T>(items: T[], getLabel: (item: T) => string): DistributionPoint[] {
  const counts = new Map<string, number>();
  items.forEach((item) => {
    const label = getLabel(item).trim() || "Unknown";
    counts.set(label, (counts.get(label) ?? 0) + 1);
  });

  return Array.from(counts.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((left, right) => right.value - left.value || left.label.localeCompare(right.label));
}

function topCounts(items: string[]) {
  const counts = new Map<string, number>();
  items.forEach((item) => counts.set(item, (counts.get(item) ?? 0) + 1));
  return Array.from(counts.entries())
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, 5);
}

function normalizePaymentMethod(value: string | null | undefined) {
  if (!value) return "Unknown";
  const normalized = value.replaceAll("_", " ").replaceAll("-", " ").trim();
  if (!normalized) return "Unknown";
  if (normalized.toLowerCase() === "onlypay") return "ONLYPAY";
  return titleize(normalized);
}

function titleize(value: string) {
  return value
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

type DateWindow = {
  start: Date;
  end: Date;
  days: number;
};

const businessUtcOffsetMinutes = 8 * 60;

function getDateRange(range: DashboardDateRange): DateWindow {
  const days = rangeDays[range];
  const now = new Date();
  const businessNow = toBusinessTime(now);
  const businessStart = startOfDay(addDays(businessNow, -(days - 1)));
  return {
    start: fromBusinessTime(businessStart),
    end: now,
    days
  };
}

function buildTrendBuckets(window: DateWindow) {
  const buckets = new Map<string, DashboardTrendPoint>();
  for (let index = 0; index < window.days; index += 1) {
    const date = addDays(window.start, index);
    buckets.set(dateKey(date), {
      date: formatShortDate(date),
      createdOrders: 0,
      paidOrders: 0,
      completedOrders: 0,
      productPayment: 0,
      shippingPayment: 0,
      recharge: 0,
      refund: 0
    });
  }
  return buckets;
}

function incrementBucket<K extends keyof Omit<DashboardTrendPoint, "date">>(
  buckets: Map<string, DashboardTrendPoint>,
  date: Date,
  key: K,
  amount: number
) {
  const bucket = buckets.get(dateKey(date));
  if (bucket) {
    bucket[key] += amount;
  }
}

function roundTrendPoint(point: DashboardTrendPoint): DashboardTrendPoint {
  return {
    ...point,
    productPayment: roundMoney(point.productPayment),
    shippingPayment: roundMoney(point.shippingPayment),
    recharge: roundMoney(point.recharge),
    refund: roundMoney(point.refund)
  };
}

function dateFilter(window: DateWindow) {
  return { gte: window.start, lte: window.end };
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function formatShortDate(date: Date) {
  const businessDate = toBusinessTime(date);
  return `${String(businessDate.getMonth() + 1).padStart(2, "0")}/${String(businessDate.getDate()).padStart(2, "0")}`;
}

function formatDateTime(date: Date) {
  const businessDate = toBusinessTime(date);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${businessDate.getFullYear()}-${pad(businessDate.getMonth() + 1)}-${pad(businessDate.getDate())} ${pad(businessDate.getHours())}:${pad(businessDate.getMinutes())}`;
}

function elapsedLabel(date: Date) {
  const minutes = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60000));
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (hours < 48) return `${hours}h ${remainingMinutes}m`;
  const days = Math.floor(hours / 24);
  return `${days}d ${hours % 24}h`;
}

function andOrderWhere(...items: Prisma.OrderWhereInput[]): Prisma.OrderWhereInput {
  return { AND: items };
}

function andPaymentWhere(...items: Prisma.PaymentWhereInput[]): Prisma.PaymentWhereInput {
  return { AND: items };
}

function andApiLogWhere(...items: Prisma.ApiLogWhereInput[]): Prisma.ApiLogWhereInput {
  return { AND: items };
}

function sumMoneyUsd(items: Array<{ amount: Prisma.Decimal; currency: string }>, exchangeRate: number) {
  return roundMoney(items.reduce((sum, item) => sum + moneyToUsd(item.amount, item.currency, exchangeRate), 0));
}

function moneyToUsd(amount: Prisma.Decimal, currency: string | null | undefined, exchangeRate: number) {
  const numericAmount = Number(amount);
  if ((currency ?? "USD").toUpperCase() === "CNY") {
    return exchangeRate > 0 ? numericAmount / exchangeRate : numericAmount;
  }
  return numericAmount;
}

function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function isFailedStatus(status: string) {
  const value = status.toLowerCase();
  return value.includes("fail") || value.includes("error") || value.includes("exception");
}

function toBusinessTime(date: Date) {
  return new Date(date.getTime() + businessUtcOffsetMinutes * 60 * 1000);
}

function fromBusinessTime(date: Date) {
  return new Date(date.getTime() - businessUtcOffsetMinutes * 60 * 1000);
}
