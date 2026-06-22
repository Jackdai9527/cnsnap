export type OrderListItemPreview = {
  id: string;
  title: string;
  image: string;
};

export type OrderTabKey =
  | "all"
  | "pending_payment"
  | "paid"
  | "reviewing"
  | "purchasing"
  | "warehouse_pending"
  | "shipping_pending"
  | "shipped"
  | "completed"
  | "cancelled"
  | "refunded";

export type MockOrder = {
  id: string;
  orderNo: string;
  userEmail: string;
  orderSource: "url" | "keyword" | "manual" | "diy" | "cart" | "admin" | "image" | "shop";
  itemsPreview: OrderListItemPreview[];
  itemCount: number;
  totalQuantity: number;
  destinationCountry: string;
  totalUsd: number;
  subtotalCny: number;
  paidUsd: number;
  unpaidUsd: number;
  paymentStatus: "pending" | "paid" | "failed" | "refunded" | "partial" | "difference_pending" | "awaiting_transfer" | "redirected" | "processing";
  purchaseStatus: "pending" | "reviewing" | "purchasing" | "purchased" | "cancelled" | "refunded" | "partial_purchased" | "out_of_stock" | "price_changed" | "failed";
  warehouseStatus: "pending" | "partial_received" | "received" | "exception" | "abnormal";
  packageStatus: "none" | "pending" | "created" | "waiting_shipping_payment" | "ready_to_ship" | "shipping_paid" | "shipped" | "delivered" | "abnormal";
  shippingStatus: "none" | "pending" | "ready_to_ship" | "shipped" | "in_transit" | "delivered" | "customs_clearance" | "delivery_attempted" | "exception" | "returned" | "lost";
  riskStatus: "normal" | "pending_review" | "restricted" | "abnormal" | "rejected";
  assignee: string;
  updatedAt: string;
  orderTab: OrderTabKey;
};
