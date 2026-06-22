export type DashboardDateRange = "today" | "7d" | "30d" | "90d";

export type DashboardMetric = {
  id: string;
  label: string;
  value: number;
  format?: "number" | "money" | "percent" | "milliseconds";
  currency?: "USD" | "CNY";
  secondaryValue?: number;
  secondaryLabel?: string;
  description: string;
  href: string;
  tone?: "default" | "info" | "success" | "warning" | "danger";
};

export type DashboardSummary = {
  range: DashboardDateRange;
  generatedAt: string;
  metrics: DashboardMetric[];
  apiHealth: ApiHealth;
  riskAlert: RiskAlert;
};

export type DashboardTrendPoint = {
  date: string;
  createdOrders: number;
  paidOrders: number;
  completedOrders: number;
  productPayment: number;
  shippingPayment: number;
  recharge: number;
  refund: number;
};

export type DashboardTrends = {
  range: DashboardDateRange;
  points: DashboardTrendPoint[];
};

export type DistributionPoint = {
  label: string;
  value: number;
  status?: string;
};

export type DashboardDistribution = {
  range: DashboardDateRange;
  orderStatuses: DistributionPoint[];
  paymentMethods: DistributionPoint[];
  countryOrders: DistributionPoint[];
  shippingChannels: DistributionPoint[];
  orderSources: DistributionPoint[];
};

export type TaskItem = {
  id: string;
  type:
    | "pending_purchase"
    | "overdue_purchase"
    | "warehouse_abnormal"
    | "waiting_shipping_payment"
    | "ready_to_ship"
    | "shipping_exception"
    | "api_error";
  title: string;
  primaryRef: string;
  user?: string;
  amountUsd?: number;
  shippingFeeUsd?: number;
  channel?: string;
  trackingNumber?: string;
  itemTitle?: string;
  message?: string;
  status?: string;
  occurredAt: string;
  waitingFor: string;
  href: string;
};

export type DashboardTasks = {
  range: DashboardDateRange;
  pendingPurchaseOrders: TaskItem[];
  overduePurchaseOrders: TaskItem[];
  warehouseAbnormal: TaskItem[];
  waitingShippingPayment: TaskItem[];
  readyToShip: TaskItem[];
  shippingExceptions: TaskItem[];
  apiErrors: TaskItem[];
};

export type ApiHealth = {
  totalCallsToday: number;
  successRate: number;
  failedCallsToday: number;
  averageResponseMs: number;
  topErrorReasons: Array<{
    reason: string;
    count: number;
  }>;
  typeDistribution: Array<{
    type: "detail" | "search" | "image" | "shop" | "price_refresh";
    count: number;
  }>;
};

export type RiskAlert = {
  riskOrders: number;
  sensitiveGoodsOrders: number;
  forbiddenGoodsOrders: number;
  highValueGoodsOrders: number;
  paymentAbnormalOrders: number;
  riskUsers: number;
};
