import type { AdminDashboardStats } from "@/types/admin-dashboard";

export const mockAdminDashboardStats: AdminDashboardStats = {
  salesTrend: [
    { date: "06-01", salesUsd: 4128.4, serviceFeeUsd: 286.2 },
    { date: "06-02", salesUsd: 3894.7, serviceFeeUsd: 254.8 },
    { date: "06-03", salesUsd: 4722.1, serviceFeeUsd: 319.5 },
    { date: "06-04", salesUsd: 4388.9, serviceFeeUsd: 303.1 },
    { date: "06-05", salesUsd: 5316.6, serviceFeeUsd: 372.4 },
    { date: "06-06", salesUsd: 4978.2, serviceFeeUsd: 351.7 },
    { date: "06-07", salesUsd: 5841.3, serviceFeeUsd: 416.9 },
    { date: "06-08", salesUsd: 6217.8, serviceFeeUsd: 452.3 },
    { date: "06-09", salesUsd: 5579.5, serviceFeeUsd: 394.6 },
    { date: "06-10", salesUsd: 6688.4, serviceFeeUsd: 488.1 },
    { date: "06-11", salesUsd: 7034.9, serviceFeeUsd: 531.5 },
    { date: "06-12", salesUsd: 6421.7, serviceFeeUsd: 462.6 },
    { date: "06-13", salesUsd: 7186.3, serviceFeeUsd: 549.2 }
  ],
  ordersTrend: [
    { date: "06-01", orders: 67, paidOrders: 48 },
    { date: "06-02", orders: 61, paidOrders: 43 },
    { date: "06-03", orders: 76, paidOrders: 57 },
    { date: "06-04", orders: 72, paidOrders: 52 },
    { date: "06-05", orders: 88, paidOrders: 64 },
    { date: "06-06", orders: 81, paidOrders: 59 },
    { date: "06-07", orders: 94, paidOrders: 71 },
    { date: "06-08", orders: 103, paidOrders: 78 },
    { date: "06-09", orders: 91, paidOrders: 66 },
    { date: "06-10", orders: 110, paidOrders: 84 },
    { date: "06-11", orders: 118, paidOrders: 91 },
    { date: "06-12", orders: 106, paidOrders: 79 },
    { date: "06-13", orders: 123, paidOrders: 94 }
  ],
  paymentMethods: [
    { method: "Wallet", value: 38 },
    { method: "Credit Card", value: 27 },
    { method: "PayPal", value: 18 },
    { method: "SEPA", value: 9 },
    { method: "Manual", value: 8 }
  ],
  countryOrders: [
    { country: "United States", orders: 214 },
    { country: "Germany", orders: 143 },
    { country: "United Kingdom", orders: 116 },
    { country: "Canada", orders: 88 },
    { country: "France", orders: 73 },
    { country: "Australia", orders: 64 }
  ],
  topProducts: [
    { product: "Platform sneakers", orders: 86, revenueUsd: 6418.2 },
    { product: "Outdoor backpack", orders: 64, revenueUsd: 5386.9 },
    { product: "Retro keyboard", orders: 51, revenueUsd: 3094.1 },
    { product: "Leather loafers", orders: 47, revenueUsd: 4527.5 },
    { product: "Minimal shirt", orders: 42, revenueUsd: 1797.6 },
    { product: "Collector figure", orders: 38, revenueUsd: 2185.0 }
  ],
  apiUsage: [
    { date: "06-01", success: 281, failed: 16 },
    { date: "06-02", success: 264, failed: 21 },
    { date: "06-03", success: 309, failed: 18 },
    { date: "06-04", success: 318, failed: 24 },
    { date: "06-05", success: 352, failed: 19 },
    { date: "06-06", success: 331, failed: 28 },
    { date: "06-07", success: 374, failed: 17 },
    { date: "06-08", success: 401, failed: 22 },
    { date: "06-09", success: 389, failed: 31 },
    { date: "06-10", success: 428, failed: 19 },
    { date: "06-11", success: 451, failed: 26 },
    { date: "06-12", success: 437, failed: 23 },
    { date: "06-13", success: 463, failed: 18 }
  ]
};
