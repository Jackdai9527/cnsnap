import type {
  ApiHealth,
  DashboardDateRange,
  DashboardDistribution,
  DashboardMetric,
  DashboardSummary,
  DashboardTasks,
  DashboardTrendPoint,
  RiskAlert,
  TaskItem
} from "@/types/dashboard";

const rangeDays: Record<DashboardDateRange, number> = {
  today: 1,
  "7d": 7,
  "30d": 30,
  "90d": 90
};

const metricData: DashboardMetric[] = [
  {
    id: "today-orders",
    label: "Today Orders",
    value: 47,
    description: "New purchasing-agent orders created today.",
    href: "/admin/orders?created=today",
    tone: "info"
  },
  {
    id: "today-paid-orders",
    label: "Today Paid Orders",
    value: 31,
    description: "Orders with product payment captured today.",
    href: "/admin/orders?paymentStatus=paid&paidAt=today",
    tone: "success"
  },
  {
    id: "today-paid-amount",
    label: "Today Paid Amount",
    value: 18492.76,
    format: "money",
    currency: "USD",
    secondaryValue: 132204.93,
    secondaryLabel: "CNY estimate",
    description: "Real paid payment records captured today.",
    href: "/admin/orders?paymentStatus=paid&paidAt=today",
    tone: "success"
  },
  {
    id: "pending-purchase",
    label: "Pending Purchase",
    value: 26,
    description: "Paid orders waiting for buyer action.",
    href: "/admin/orders?paymentStatus=paid&purchaseStatus=pending",
    tone: "warning"
  },
  {
    id: "purchasing",
    label: "Purchasing",
    value: 18,
    description: "Orders currently assigned to purchasing staff.",
    href: "/admin/orders?purchaseStatus=purchasing",
    tone: "info"
  },
  {
    id: "warehouse-pending",
    label: "Warehouse Pending",
    value: 34,
    description: "Purchased orders waiting for inbound confirmation.",
    href: "/admin/warehouse/inbound?status=pending",
    tone: "warning"
  },
  {
    id: "pending-weight",
    label: "Pending Weight",
    value: 22,
    description: "Packages waiting for actual or volumetric weight entry.",
    href: "/admin/packages?status=pending_weight",
    tone: "warning"
  },
  {
    id: "waiting-shipping-payment",
    label: "Waiting Shipping Payment",
    value: 29,
    description: "International shipping bills generated but not paid.",
    href: "/admin/orders?shippingPaymentStatus=pending",
    tone: "warning"
  },
  {
    id: "ready-to-ship",
    label: "Ready To Ship",
    value: 16,
    description: "Shipping paid packages waiting for dispatch.",
    href: "/admin/packages?shippingStatus=ready_to_ship",
    tone: "success"
  },
  {
    id: "risk-orders",
    label: "Risk Orders",
    value: 9,
    description: "Orders that need risk or restricted-goods review.",
    href: "/admin/orders?riskStatus=pending_review",
    tone: "danger"
  },
  {
    id: "refund-pending",
    label: "Refund Pending",
    value: 7,
    description: "Refund requests waiting for finance approval.",
    href: "/admin/finance/refunds?status=pending",
    tone: "danger"
  },
  {
    id: "api-errors-today",
    label: "API Errors Today",
    value: 14,
    description: "Failed OneBound product/search calls today.",
    href: "/admin/products/api-logs?status=failed&date=today",
    tone: "danger"
  }
];

const apiHealth: ApiHealth = {
  totalCallsToday: 2384,
  successRate: 97.42,
  failedCallsToday: 61,
  averageResponseMs: 742,
  topErrorReasons: [
    { reason: "seller throttled item detail", count: 18 },
    { reason: "variant image missing", count: 13 },
    { reason: "search timeout", count: 11 },
    { reason: "price refresh mismatch", count: 10 },
    { reason: "shop page unavailable", count: 9 }
  ],
  typeDistribution: [
    { type: "detail", count: 1228 },
    { type: "search", count: 624 },
    { type: "image", count: 213 },
    { type: "shop", count: 181 },
    { type: "price_refresh", count: 138 }
  ]
};

const riskAlert: RiskAlert = {
  riskOrders: 9,
  sensitiveGoodsOrders: 14,
  forbiddenGoodsOrders: 3,
  highValueGoodsOrders: 21,
  paymentAbnormalOrders: 5,
  riskUsers: 4
};

export function getDashboardSummary(range: DashboardDateRange = "today"): DashboardSummary {
  return {
    range,
    generatedAt: new Date().toISOString(),
    metrics: metricData,
    apiHealth,
    riskAlert
  };
}

export function getDashboardTrends(range: DashboardDateRange = "30d") {
  const days = rangeDays[range];
  const points = buildTrendPoints(days === 1 ? 7 : days);

  return {
    range,
    points: range === "today" ? points.slice(-1) : points
  };
}

export function getDashboardDistribution(range: DashboardDateRange = "30d"): DashboardDistribution {
  const multiplier = range === "today" ? 0.32 : range === "7d" ? 0.62 : range === "90d" ? 1.9 : 1;
  const scale = (value: number) => Math.max(1, Math.round(value * multiplier));

  return {
    range,
    orderStatuses: [
      { label: "Pending Payment", value: scale(88), status: "pending_payment" },
      { label: "Paid", value: scale(64), status: "paid" },
      { label: "Purchasing", value: scale(48), status: "purchasing" },
      { label: "Warehouse Pending", value: scale(53), status: "warehouse_pending" },
      { label: "Shipping Pending", value: scale(41), status: "shipping_pending" },
      { label: "Shipped", value: scale(72), status: "shipped" },
      { label: "Completed", value: scale(196), status: "completed" },
      { label: "Cancelled", value: scale(23), status: "cancelled" },
      { label: "Refunded", value: scale(17), status: "refunded" },
      { label: "Abnormal", value: scale(12), status: "abnormal" }
    ],
    paymentMethods: [
      { label: "Wallet", value: scale(158) },
      { label: "PayPal", value: scale(92) },
      { label: "Stripe", value: scale(76) },
      { label: "Manual Payment", value: scale(39) },
      { label: "Credit Card", value: scale(114) }
    ],
    countryOrders: [
      { label: "US", value: scale(148) },
      { label: "DE", value: scale(74) },
      { label: "FR", value: scale(61) },
      { label: "NL", value: scale(44) },
      { label: "PL", value: scale(37) },
      { label: "JP", value: scale(32) },
      { label: "KR", value: scale(28) }
    ],
    shippingChannels: [
      { label: "DHL", value: scale(82) },
      { label: "FedEx", value: scale(51) },
      { label: "UPS", value: scale(43) },
      { label: "EMS", value: scale(76) },
      { label: "Air Cargo", value: scale(67) },
      { label: "Sea Shipping", value: scale(28) },
      { label: "Economy Line", value: scale(93) }
    ],
    orderSources: [
      { label: "URL Search", value: scale(176) },
      { label: "Keyword Search", value: scale(108) },
      { label: "Image Search", value: scale(47) },
      { label: "Shop Search", value: scale(36) },
      { label: "DIY Order", value: scale(58) },
      { label: "Admin Created", value: scale(22) }
    ]
  };
}

export function getDashboardTasks(range: DashboardDateRange = "30d"): DashboardTasks {
  return {
    range,
    pendingPurchaseOrders: taskGroups.pendingPurchaseOrders,
    overduePurchaseOrders: taskGroups.overduePurchaseOrders,
    warehouseAbnormal: taskGroups.warehouseAbnormal,
    waitingShippingPayment: taskGroups.waitingShippingPayment,
    readyToShip: taskGroups.readyToShip,
    shippingExceptions: taskGroups.shippingExceptions,
    apiErrors: taskGroups.apiErrors
  };
}

function buildTrendPoints(days: number): DashboardTrendPoint[] {
  const today = new Date("2026-06-13T12:00:00+08:00");

  return Array.from({ length: days }).map((_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (days - index - 1));
    const wave = Math.sin(index / 2.7) + 1;
    const createdOrders = Math.round(38 + wave * 12 + (index % 5) * 3);
    const paidOrders = Math.round(createdOrders * (0.58 + (index % 4) * 0.035));
    const completedOrders = Math.max(11, Math.round(createdOrders * (0.28 + (index % 3) * 0.04)));

    return {
      date: `${String(date.getMonth() + 1).padStart(2, "0")}/${String(date.getDate()).padStart(2, "0")}`,
      createdOrders,
      paidOrders,
      completedOrders,
      productPayment: Math.round((paidOrders * (112 + (index % 6) * 9) + wave * 220) * 100) / 100,
      shippingPayment: Math.round((paidOrders * (28 + (index % 4) * 4.7) + wave * 86) * 100) / 100,
      recharge: Math.round((paidOrders * (41 + (index % 5) * 5.3) + wave * 120) * 100) / 100,
      refund: Math.round(((index % 6) * 92 + wave * 41) * 100) / 100
    };
  });
}

const taskGroups: Omit<DashboardTasks, "range"> = {
  pendingPurchaseOrders: [
    task("pp-10082", "pending_purchase", "CN202606130082", "ava.chen@example.com", 186.42, "2026-06-13 10:46", "1h 22m", "/admin/orders/10082"),
    task("pp-10081", "pending_purchase", "CN202606130081", "mason.lee@example.com", 74.95, "2026-06-13 10:18", "1h 50m", "/admin/orders/10081"),
    task("pp-10078", "pending_purchase", "CN202606130078", "iris.nakamura@example.com", 311.6, "2026-06-13 09:37", "2h 31m", "/admin/orders/10078"),
    task("pp-10076", "pending_purchase", "CN202606130076", "matteo.rossi@example.com", 52.2, "2026-06-13 08:52", "3h 16m", "/admin/orders/10076"),
    task("pp-10073", "pending_purchase", "CN202606130073", "lina.meyer@example.com", 428.18, "2026-06-13 07:43", "4h 25m", "/admin/orders/10073")
  ],
  overduePurchaseOrders: [
    task("op-10033", "overdue_purchase", "CN202606120033", "nora.smith@example.com", 215.9, "2026-06-12 08:06", "28h 02m", "/admin/orders/10033"),
    task("op-10028", "overdue_purchase", "CN202606120028", "ethan.davis@example.com", 91.4, "2026-06-12 06:41", "29h 27m", "/admin/orders/10028"),
    task("op-10025", "overdue_purchase", "CN202606110025", "clara.dupont@example.com", 633.25, "2026-06-11 22:10", "37h 58m", "/admin/orders/10025"),
    task("op-10019", "overdue_purchase", "CN202606110019", "leo.kowalski@example.com", 148.33, "2026-06-11 19:24", "40h 44m", "/admin/orders/10019"),
    task("op-10014", "overdue_purchase", "CN202606100014", "sara.ibrahim@example.com", 87.71, "2026-06-10 16:55", "67h 13m", "/admin/orders/10014")
  ],
  warehouseAbnormal: [
    abnormalTask("wa-1", "warehouse_abnormal", "CN202606120097", "missing color variant", "Black Willow Nail Chain", "2026-06-13 10:02", "/admin/warehouse/inbound?status=abnormal"),
    abnormalTask("wa-2", "warehouse_abnormal", "CN202606120091", "quantity mismatch", "Vintage track jacket", "2026-06-13 09:26", "/admin/warehouse/inbound?status=abnormal"),
    abnormalTask("wa-3", "warehouse_abnormal", "CN202606110084", "seller sent wrong SKU", "Mechanical keyboard kit", "2026-06-13 08:18", "/admin/warehouse/inbound?status=abnormal"),
    abnormalTask("wa-4", "warehouse_abnormal", "CN202606110076", "damaged packaging", "Porcelain tea set", "2026-06-12 18:44", "/admin/warehouse/inbound?status=abnormal"),
    abnormalTask("wa-5", "warehouse_abnormal", "CN202606100066", "restricted battery item", "Mini power bank", "2026-06-12 16:35", "/admin/warehouse/inbound?status=abnormal")
  ],
  waitingShippingPayment: [
    packageTask("wsp-1", "waiting_shipping_payment", "PKG202606130021", "joel.parker@example.com", 42.18, "2026-06-13 09:58", "2h 10m", "/admin/packages?shippingPaymentStatus=pending"),
    packageTask("wsp-2", "waiting_shipping_payment", "PKG202606130019", "amelie.bernard@example.com", 31.74, "2026-06-13 08:39", "3h 29m", "/admin/packages?shippingPaymentStatus=pending"),
    packageTask("wsp-3", "waiting_shipping_payment", "PKG202606120187", "han.seojun@example.com", 67.22, "2026-06-12 22:03", "14h 05m", "/admin/packages?shippingPaymentStatus=pending"),
    packageTask("wsp-4", "waiting_shipping_payment", "PKG202606120179", "eva.nowak@example.com", 28.93, "2026-06-12 18:16", "17h 52m", "/admin/packages?shippingPaymentStatus=pending"),
    packageTask("wsp-5", "waiting_shipping_payment", "PKG202606120166", "nils.schmidt@example.com", 104.6, "2026-06-12 14:30", "21h 38m", "/admin/packages?shippingPaymentStatus=pending")
  ],
  readyToShip: [
    readyShipTask("rts-1", "PKG202606130014", "zoe.wang@example.com", "DHL", "2026-06-13 10:34", "/admin/packages?shippingStatus=ready_to_ship"),
    readyShipTask("rts-2", "PKG202606130011", "lucas.muller@example.com", "FedEx", "2026-06-13 09:12", "/admin/packages?shippingStatus=ready_to_ship"),
    readyShipTask("rts-3", "PKG202606120155", "mia.andersen@example.com", "EMS", "2026-06-12 20:19", "/admin/packages?shippingStatus=ready_to_ship"),
    readyShipTask("rts-4", "PKG202606120142", "noah.smith@example.com", "Economy Line", "2026-06-12 17:48", "/admin/packages?shippingStatus=ready_to_ship"),
    readyShipTask("rts-5", "PKG202606110118", "ines.martin@example.com", "Air Cargo", "2026-06-11 23:25", "/admin/packages?shippingStatus=ready_to_ship")
  ],
  shippingExceptions: [
    exceptionTask("se-1", "PKG202606090086", "DHL987364120CN", "customs inspection hold", "2026-06-13 07:18"),
    exceptionTask("se-2", "PKG202606080074", "EMS775431892CN", "delivery address needs confirmation", "2026-06-12 22:54"),
    exceptionTask("se-3", "PKG202606070061", "FX451982360CN", "flight delay, next scan pending", "2026-06-12 19:36"),
    exceptionTask("se-4", "PKG202606060042", "UPS772634901CN", "remote-area surcharge review", "2026-06-12 12:15"),
    exceptionTask("se-5", "PKG202606050031", "AC661209554CN", "tracking stale for 72 hours", "2026-06-11 20:40")
  ],
  apiErrors: [
    apiTask("api-1", "item_get", "tmall", "seller throttled item detail", "2026-06-13 11:58"),
    apiTask("api-2", "item_search", "taobao", "search timeout", "2026-06-13 11:41"),
    apiTask("api-3", "item_get", "1688", "price_refresh mismatch", "2026-06-13 10:55"),
    apiTask("api-4", "item_search_img", "taobao", "image hash unavailable", "2026-06-13 10:28"),
    apiTask("api-5", "shop_get", "tmall", "shop page unavailable", "2026-06-13 09:46")
  ]
};

function task(
  id: string,
  type: TaskItem["type"],
  primaryRef: string,
  user: string,
  amountUsd: number,
  occurredAt: string,
  waitingFor: string,
  href: string
): TaskItem {
  return {
    id,
    type,
    title: type === "overdue_purchase" ? "Purchase overdue" : "Needs purchasing",
    primaryRef,
    user,
    amountUsd,
    occurredAt,
    waitingFor,
    href,
    status: type === "overdue_purchase" ? "abnormal" : "pending"
  };
}

function abnormalTask(
  id: string,
  type: TaskItem["type"],
  primaryRef: string,
  message: string,
  itemTitle: string,
  occurredAt: string,
  href: string
): TaskItem {
  return {
    id,
    type,
    title: "Warehouse abnormal",
    primaryRef,
    message,
    itemTitle,
    occurredAt,
    waitingFor: "needs review",
    href,
    status: "exception"
  };
}

function packageTask(
  id: string,
  type: TaskItem["type"],
  primaryRef: string,
  user: string,
  shippingFeeUsd: number,
  occurredAt: string,
  waitingFor: string,
  href: string
): TaskItem {
  return {
    id,
    type,
    title: "Shipping payment due",
    primaryRef,
    user,
    shippingFeeUsd,
    occurredAt,
    waitingFor,
    href,
    status: "pending"
  };
}

function readyShipTask(id: string, primaryRef: string, user: string, channel: string, occurredAt: string, href: string): TaskItem {
  return {
    id,
    type: "ready_to_ship",
    title: "Ready to dispatch",
    primaryRef,
    user,
    channel,
    occurredAt,
    waitingFor: "label handoff",
    href,
    status: "ready_to_ship"
  };
}

function exceptionTask(id: string, primaryRef: string, trackingNumber: string, message: string, occurredAt: string): TaskItem {
  return {
    id,
    type: "shipping_exception",
    title: "Shipping exception",
    primaryRef,
    trackingNumber,
    message,
    occurredAt,
    waitingFor: "carrier update",
    href: "/admin/packages/shipping-records?status=exception",
    status: "exception"
  };
}

function apiTask(id: string, primaryRef: string, user: string, message: string, occurredAt: string): TaskItem {
  return {
    id,
    type: "api_error",
    title: primaryRef,
    primaryRef,
    user,
    message,
    occurredAt,
    waitingFor: "retry or fallback",
    href: "/admin/products/api-logs?status=failed&date=today",
    status: "failed"
  };
}
