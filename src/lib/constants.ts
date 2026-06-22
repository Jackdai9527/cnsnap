export const platforms = ["taobao", "tmall", "1688", "jd", "weidian", "vip", "xianyu"];

export const orderStatuses = [
  "pending_payment",
  "paid",
  "reviewing",
  "purchasing",
  "purchased",
  "warehouse_pending",
  "warehouse_received",
  "package_created",
  "shipping_pending",
  "shipping_paid",
  "shipped",
  "completed",
  "cancelled",
  "refunded",
  "abnormal",
  "trash"
];

export const orderSourceOptions = ["url", "keyword", "image", "shop", "diy", "admin", "package_payment"] as const;

export const orderStatusOptions = [
  "order_pending",
  "paid_product",
  "purchasing",
  "partial_purchased",
  "purchased",
  "warehouse_received",
  "international_freight_pending",
  "international_freight_paid",
  "customer_confirmed",
  "shipped",
  "completed",
  "abnormal",
  "order_after_sales",
  "refund",
  "cancel",
  "trash"
] as const;

export const paymentStatusOptions = ["pending", "paid_product", "international_freight_pending", "international_freight_paid", "failed", "refund"] as const;

export const purchaseStatusOptions = [
  "pending",
  "purchasing",
  "partial_purchased",
  "purchased",
  "out_of_stock",
] as const;

export const warehouseStatusOptions = ["pending", "partial_received", "received", "abnormal"] as const;

export const orderPackageStatusOptions = [
  "none",
  "pending",
  "created",
  "waiting_shipping_payment",
  "shipping_paid",
  "shipped",
  "delivered",
  "abnormal"
] as const;

export const shippingPaymentStatusOptions = ["pending", "paid_product", "international_freight_pending", "international_freight_paid", "failed", "refund"] as const;

export const shippingStatusOptions = [
  "none",
  "pending",
  "ready_to_ship",
  "shipped",
  "in_transit",
  "customs_clearance",
  "delivery_attempted",
  "delivered",
  "exception",
  "returned",
  "lost"
] as const;

export const riskStatusOptions = ["normal", "pending_review", "restricted", "rejected"] as const;

export const refundStatusOptions = ["none", "pending", "partial_refunded", "refunded", "rejected"] as const;

export const orderNoteTypeOptions = ["admin", "purchase", "warehouse", "finance", "support", "risk", "user"] as const;

export const packageStatuses = [
  "pending",
  "created",
  "waiting_shipping_payment",
  "shipping_paid",
  "shipped",
  "delivered",
  "returned",
  "cancelled",
  "abnormal"
];

export const statusLabel: Record<string, string> = {
  order_pending: "Order Pending",
  paid_product: "Paid Product",
  pending_payment: "Pending payment",
  paid: "Paid",
  reviewing: "Reviewing",
  purchasing: "Purchasing",
  customer_confirmed: "Customer Confirmed",
  purchased: "Purchased",
  warehouse_pending: "Warehouse pending",
  warehouse_received: "Warehouse received",
  package_created: "Package created",
  international_freight_pending: "International Freight Pending",
  international_freight_paid: "International Freight Paid",
  shipping_pending: "Shipping pending",
  shipping_paid: "Shipping paid",
  shipped: "Shipped",
  completed: "Completed",
  cancel: "Cancel",
  cancelled: "Cancelled",
  refund: "Refund",
  refunded: "Refunded",
  order_after_sales: "Order After Sales",
  partial_refunded: "Partial refunded",
  processing: "Processing",
  partial: "Partial",
  difference_pending: "Difference pending",
  failed: "Failed",
  partial_purchased: "Partial purchased",
  out_of_stock: "Out of stock",
  price_changed: "Price changed",
  partial_received: "Partial received",
  received: "Received",
  abnormal: "Abnormal",
  none: "None",
  created: "Created",
  ready_to_ship: "Ready to ship",
  in_transit: "In transit",
  customs_clearance: "Customs clearance",
  delivery_attempted: "Delivery attempted",
  exception: "Exception",
  lost: "Lost",
  normal: "Normal",
  pending_review: "Pending review",
  restricted: "Restricted",
  rejected: "Rejected",
  url: "URL",
  keyword: "Keyword",
  image: "Image",
  shop: "Shop",
  diy: "DIY",
  admin: "Admin",
  package_payment: "Package Payment Bridge",
  pending: "Pending",
  ready: "Ready",
  incomplete: "Incomplete",
  disabled: "Disabled",
  active: "Active",
  inactive: "Inactive",
  submitted: "Submitted",
  quoted: "Quoted",
  converted_to_order: "Converted to order",
  not_purchased: "Not purchased",
  not_arrived: "Not arrived",
  arrived: "Arrived",
  open: "Open",
  in_progress: "In progress",
  waiting_user: "Waiting user",
  resolved: "Resolved",
  closed: "Closed",
  tracking: "Tracking",
  not_configured: "Not configured",
  redirected: "Redirected",
  awaiting_transfer: "Awaiting transfer",
  waiting_shipping_payment: "Waiting shipping payment",
  delivered: "Delivered",
  returned: "Returned",
  warehouse: "Warehouse",
  finance: "Finance",
  support: "Support",
  risk: "Risk",
  user: "User",
  trash: "Trash"
};
