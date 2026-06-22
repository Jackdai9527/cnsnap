export type AccountUser = {
  name: string;
  email: string;
  avatarUrl?: string;
  walletBalanceUsd: number;
  frozenAmountUsd: number;
  language: string;
  currency: "USD" | "EUR" | "CNY";
  referralCode: string;
};

export type AccountOrderStatus =
  | "pending_payment"
  | "paid"
  | "purchasing"
  | "warehouse_pending"
  | "waiting_shipping_payment"
  | "shipped"
  | "completed"
  | "cancelled";

export type AccountOrderItem = {
  id: string;
  title: string;
  sku: string;
  quantity: number;
  priceUsd: number;
  priceCny: number;
  image: string;
  sourceUrl: string;
};

export type AccountOrder = {
  id: string;
  orderNo: string;
  createdAt: string;
  orderSource: "url" | "keyword" | "cart" | "diy";
  items: AccountOrderItem[];
  totalUsd: number;
  subtotalCny: number;
  serviceFeeUsd: number;
  domesticShippingUsd: number;
  estimatedShippingUsd: number;
  actualShippingUsd: number;
  paidUsd: number;
  unpaidUsd: number;
  paymentStatus: "pending" | "paid" | "partial" | "refunded" | "failed";
  purchaseStatus: "pending" | "purchasing" | "purchased" | "cancelled";
  warehouseStatus: "pending" | "partial_received" | "received";
  packageStatus: "none" | "created" | "waiting_shipping_payment" | "shipped" | "delivered";
  shippingStatus: "none" | "pending" | "in_transit" | "delivered";
  destinationCountry: string;
  status: AccountOrderStatus;
  address: {
    name: string;
    phone: string;
    email: string;
    country: string;
    state: string;
    city: string;
    postalCode: string;
    line1: string;
    line2?: string;
  };
  packages: string[];
  payments: Array<{ paymentNo: string; method: string; amountUsd: number; status: string; createdAt: string }>;
  qcPhotos?: Array<{ id: string; url: string; altText?: string; originalName: string; createdAt?: string }>;
  timeline: Array<{ title: string; description: string; status: "done" | "current" | "pending"; time?: string }>;
  userNote?: string;
};

export type AccountPackage = {
  id: string;
  packageNo: string;
  orderNo: string;
  createdAt: string;
  packageStatus: "waiting_shipping_payment" | "shipping_paid" | "shipped" | "delivered" | "exception";
  itemCount: number;
  actualWeightKg: number;
  dimensions: string;
  chargeableWeightKg: number;
  destinationCountry: string;
  shippingChannel: string;
  shippingFeeUsd: number;
  shippingPaymentStatus: "pending" | "paid" | "none";
  trackingNumber?: string;
  shippedAt?: string;
};

export type WalletTransaction = {
  transactionNo: string;
  type: "recharge" | "pay_order" | "pay_shipping" | "refund" | "adjustment" | "commission";
  amount: number;
  currency: "USD";
  balanceAfter: number;
  relatedOrderNo?: string;
  relatedPackageNo?: string;
  note: string;
  createdAt: string;
};

export type RechargeRecord = {
  rechargeNo: string;
  amount: number;
  currency: "USD";
  paymentMethod: string;
  status: "pending" | "paid" | "failed";
  createdAt: string;
  paidAt?: string;
};

export type DiyOrder = {
  id: string;
  diyNo: string;
  productUrl: string;
  productName: string;
  quantity: number;
  budgetUsd?: number;
  quoteUsd?: number;
  status: "submitted" | "reviewing" | "quoted" | "converted_to_order" | "rejected" | "cancelled";
  createdAt: string;
  remark: string;
};

export type CommissionRecord = {
  commissionNo: string;
  referredUserEmail: string;
  orderNo: string;
  orderAmount: number;
  commissionRate: number;
  commissionAmount: number;
  status: "pending" | "approved" | "rejected" | "paid";
  createdAt: string;
};

export const mockAccountUser: AccountUser = {
  name: "Jack Chen",
  email: "dguoquan60@gmail.com",
  walletBalanceUsd: 286.42,
  frozenAmountUsd: 18.5,
  language: "English",
  currency: "USD",
  referralCode: "CNSNAP-JACK"
};

const itemImages = [
  "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=160&h=160&fit=crop",
  "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=160&h=160&fit=crop",
  "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=160&h=160&fit=crop"
];

export const mockOrders: AccountOrder[] = [
  {
    id: "10041",
    orderNo: "CN10041",
    createdAt: "2026-06-12 16:20",
    orderSource: "url",
    items: [
      {
        id: "item-1",
        title: "Minimal leather shoulder bag",
        sku: "Color: Black / Size: Small",
        quantity: 1,
        priceUsd: 42.8,
        priceCny: 308.16,
        image: itemImages[0],
        sourceUrl: "https://item.taobao.com/item.htm?id=7526900902"
      },
      {
        id: "item-2",
        title: "Cotton oversized shirt",
        sku: "Color: Cloud / Size: M",
        quantity: 2,
        priceUsd: 19.9,
        priceCny: 143.28,
        image: itemImages[1],
        sourceUrl: "https://detail.tmall.com/item.htm?id=833477044980"
      }
    ],
    totalUsd: 96.44,
    subtotalCny: 594.72,
    serviceFeeUsd: 4.82,
    domesticShippingUsd: 2.4,
    estimatedShippingUsd: 18.3,
    actualShippingUsd: 0,
    paidUsd: 0,
    unpaidUsd: 96.44,
    paymentStatus: "pending",
    purchaseStatus: "pending",
    warehouseStatus: "pending",
    packageStatus: "none",
    shippingStatus: "none",
    destinationCountry: "United States",
    status: "pending_payment",
    address: {
      name: "Jack Chen",
      phone: "+1 415 555 0198",
      email: "dguoquan60@gmail.com",
      country: "United States",
      state: "CA",
      city: "San Francisco",
      postalCode: "94103",
      line1: "1355 Market Street",
      line2: "Suite 900"
    },
    packages: [],
    payments: [{ paymentNo: "PAY-10041", method: "Wallet", amountUsd: 0, status: "pending", createdAt: "2026-06-12 16:22" }],
    timeline: [
      { title: "Order submitted", description: "We received your shopping request.", status: "done", time: "2026-06-12 16:20" },
      { title: "Payment required", description: "Pay product cost before purchasing starts.", status: "current" },
      { title: "Purchasing", description: "Buyer will place the order with the seller.", status: "pending" },
      { title: "Warehouse inbound", description: "Items arrive and pass quality check.", status: "pending" }
    ],
    userNote: "Please check the shirt color before purchasing."
  },
  {
    id: "10038",
    orderNo: "CN10038",
    createdAt: "2026-06-10 09:10",
    orderSource: "keyword",
    items: [
      {
        id: "item-3",
        title: "Running sneakers limited color",
        sku: "Color: Blue / Size: 42",
        quantity: 1,
        priceUsd: 68.2,
        priceCny: 491.04,
        image: itemImages[2],
        sourceUrl: "https://item.taobao.com/item.htm?id=980291143707"
      }
    ],
    totalUsd: 89.2,
    subtotalCny: 491.04,
    serviceFeeUsd: 3.41,
    domesticShippingUsd: 0,
    estimatedShippingUsd: 17.59,
    actualShippingUsd: 21,
    paidUsd: 68.2,
    unpaidUsd: 21,
    paymentStatus: "partial",
    purchaseStatus: "purchased",
    warehouseStatus: "received",
    packageStatus: "waiting_shipping_payment",
    shippingStatus: "pending",
    destinationCountry: "Germany",
    status: "waiting_shipping_payment",
    address: {
      name: "Jack Chen",
      phone: "+49 30 555 0101",
      email: "dguoquan60@gmail.com",
      country: "Germany",
      state: "Berlin",
      city: "Berlin",
      postalCode: "10115",
      line1: "Invalidenstrasse 1"
    },
    packages: ["PK2038"],
    payments: [
      { paymentNo: "PAY-10038-1", method: "ONLYPAY", amountUsd: 68.2, status: "paid", createdAt: "2026-06-10 09:14" },
      { paymentNo: "PAY-10038-2", method: "Wallet", amountUsd: 21, status: "pending", createdAt: "2026-06-12 11:30" }
    ],
    timeline: [
      { title: "Order paid", description: "Product payment confirmed.", status: "done", time: "2026-06-10 09:14" },
      { title: "Purchased", description: "Buyer purchased the item.", status: "done", time: "2026-06-10 18:42" },
      { title: "Warehouse received", description: "Item entered warehouse.", status: "done", time: "2026-06-12 10:05" },
      { title: "Shipping payment", description: "International shipping fee is pending.", status: "current" }
    ]
  },
  {
    id: "10022",
    orderNo: "CN10022",
    createdAt: "2026-06-04 14:45",
    orderSource: "cart",
    items: [
      {
        id: "item-4",
        title: "Ceramic desk organizer",
        sku: "Color: Cream",
        quantity: 3,
        priceUsd: 12.5,
        priceCny: 90,
        image: itemImages[0],
        sourceUrl: "https://item.taobao.com/item.htm?id=1040252938808"
      }
    ],
    totalUsd: 54.1,
    subtotalCny: 270,
    serviceFeeUsd: 2.7,
    domesticShippingUsd: 1.9,
    estimatedShippingUsd: 12,
    actualShippingUsd: 11.5,
    paidUsd: 54.1,
    unpaidUsd: 0,
    paymentStatus: "paid",
    purchaseStatus: "purchased",
    warehouseStatus: "received",
    packageStatus: "shipped",
    shippingStatus: "in_transit",
    destinationCountry: "Canada",
    status: "shipped",
    address: {
      name: "Jack Chen",
      phone: "+1 604 555 0131",
      email: "dguoquan60@gmail.com",
      country: "Canada",
      state: "BC",
      city: "Vancouver",
      postalCode: "V6B 1A1",
      line1: "555 Burrard Street"
    },
    packages: ["PK2022"],
    payments: [{ paymentNo: "PAY-10022", method: "Wallet", amountUsd: 54.1, status: "paid", createdAt: "2026-06-04 14:52" }],
    timeline: [
      { title: "Completed payment", description: "All required fees are paid.", status: "done", time: "2026-06-04 14:52" },
      { title: "Shipped", description: "Package left the warehouse.", status: "current", time: "2026-06-07 19:35" },
      { title: "Delivered", description: "Waiting for carrier delivery scan.", status: "pending" }
    ]
  }
];

export const mockPackages: AccountPackage[] = [
  {
    id: "PK2038",
    packageNo: "PK2038",
    orderNo: "CN10038",
    createdAt: "2026-06-12 11:20",
    packageStatus: "waiting_shipping_payment",
    itemCount: 1,
    actualWeightKg: 1.15,
    dimensions: "32 x 22 x 13 cm",
    chargeableWeightKg: 1.15,
    destinationCountry: "Germany",
    shippingChannel: "Guangzhou EUB",
    shippingFeeUsd: 21,
    shippingPaymentStatus: "pending"
  },
  {
    id: "PK2022",
    packageNo: "PK2022",
    orderNo: "CN10022",
    createdAt: "2026-06-07 16:10",
    packageStatus: "shipped",
    itemCount: 3,
    actualWeightKg: 0.82,
    dimensions: "26 x 18 x 12 cm",
    chargeableWeightKg: 0.82,
    destinationCountry: "Canada",
    shippingChannel: "Guangzhou EUB",
    shippingFeeUsd: 11.5,
    shippingPaymentStatus: "paid",
    trackingNumber: "DGEUB1029384756",
    shippedAt: "2026-06-07 19:35"
  }
];

export const walletTransactions: WalletTransaction[] = [
  { transactionNo: "WTX-9006", type: "recharge", amount: 150, currency: "USD", balanceAfter: 286.42, note: "Manual payment recharge", createdAt: "2026-06-12 13:10" },
  { transactionNo: "WTX-9005", type: "pay_shipping", amount: -11.5, currency: "USD", balanceAfter: 136.42, relatedPackageNo: "PK2022", note: "International shipping fee", createdAt: "2026-06-07 18:20" },
  { transactionNo: "WTX-9004", type: "pay_order", amount: -54.1, currency: "USD", balanceAfter: 147.92, relatedOrderNo: "CN10022", note: "Product order payment", createdAt: "2026-06-04 14:52" },
  { transactionNo: "WTX-9003", type: "refund", amount: 8.2, currency: "USD", balanceAfter: 202.02, relatedOrderNo: "CN10018", note: "Seller price adjustment refund", createdAt: "2026-06-02 10:15" },
  { transactionNo: "WTX-9002", type: "commission", amount: 3.6, currency: "USD", balanceAfter: 193.82, note: "Affiliate commission", createdAt: "2026-05-31 12:00" }
];

export const rechargeRecords: RechargeRecord[] = [
  { rechargeNo: "RC-3004", amount: 150, currency: "USD", paymentMethod: "Manual Payment", status: "paid", createdAt: "2026-06-12 12:58", paidAt: "2026-06-12 13:10" },
  { rechargeNo: "RC-3003", amount: 80, currency: "USD", paymentMethod: "Manual Payment", status: "pending", createdAt: "2026-06-08 19:24" }
];

export const diyOrders: DiyOrder[] = [
  { id: "DIY-501", diyNo: "DIY-501", productUrl: "https://item.taobao.com/item.htm?id=777", productName: "Handmade silver charm", quantity: 2, budgetUsd: 40, quoteUsd: 46.5, status: "quoted", createdAt: "2026-06-09 17:12", remark: "Prefer gift box." },
  { id: "DIY-492", diyNo: "DIY-492", productUrl: "https://detail.tmall.com/item.htm?id=888", productName: "Vintage jacket", quantity: 1, budgetUsd: 120, status: "reviewing", createdAt: "2026-06-05 09:42", remark: "Need size chart confirmation." }
];

export const commissionRecords: CommissionRecord[] = [
  { commissionNo: "COM-1001", referredUserEmail: "mia@example.com", orderNo: "CN10012", orderAmount: 120.4, commissionRate: 0.04, commissionAmount: 4.82, status: "approved", createdAt: "2026-06-04" },
  { commissionNo: "COM-1002", referredUserEmail: "leo@example.com", orderNo: "CN10019", orderAmount: 88.2, commissionRate: 0.04, commissionAmount: 3.53, status: "pending", createdAt: "2026-06-08" },
  { commissionNo: "COM-1003", referredUserEmail: "nora@example.com", orderNo: "CN10002", orderAmount: 64, commissionRate: 0.04, commissionAmount: 2.56, status: "paid", createdAt: "2026-05-29" }
];

export function useAccountDashboard() {
  return {
    user: mockAccountUser,
    orders: mockOrders,
    packages: mockPackages,
    pendingPaymentOrders: mockOrders.filter((order) => order.status === "pending_payment").length,
    waitingShippingPaymentPackages: mockPackages.filter((pkg) => pkg.shippingPaymentStatus === "pending").length,
    inTransitPackages: mockPackages.filter((pkg) => pkg.packageStatus === "shipped").length
  };
}

export function useMyOrders() {
  return mockOrders;
}

export function useMyPackages() {
  return mockPackages;
}

export function findMockOrder(id: string) {
  return mockOrders.find((order) => order.id === id || order.orderNo === id);
}

export function inferMockOrderPlatform(sourceUrl: string) {
  try {
    const hostname = new URL(sourceUrl).hostname.toLowerCase();
    if (hostname.includes("tmall")) return "tmall";
    if (hostname.includes("taobao")) return "taobao";
    if (hostname.includes("1688")) return "1688";
    return hostname.replace(/^www\./, "");
  } catch {
    return "source";
  }
}

export function inferMockOrderSourceItemId(sourceUrl: string, fallback: string) {
  try {
    return new URL(sourceUrl).searchParams.get("id") ?? fallback;
  } catch {
    return fallback;
  }
}
