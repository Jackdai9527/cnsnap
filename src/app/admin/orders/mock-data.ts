import type { DataTableFilterableColumn } from "@/components/admin/data-table";
import type { MockOrder } from "@/types/admin-orders";

export const mockOrders: MockOrder[] = [
  {
    id: "10041",
    orderNo: "CN202606130041",
    userEmail: "ava.chen@example.com",
    orderSource: "url",
    itemsPreview: [
      { id: "i-10041-1", title: "Platform sneakers", image: "https://picsum.photos/seed/cnsnap-order-10041-a/120/120" },
      { id: "i-10041-2", title: "Cotton tote", image: "https://picsum.photos/seed/cnsnap-order-10041-b/120/120" },
      { id: "i-10041-3", title: "Hair clip set", image: "https://picsum.photos/seed/cnsnap-order-10041-c/120/120" }
    ],
    itemCount: 3,
    totalQuantity: 6,
    destinationCountry: "United States",
    totalUsd: 128.42,
    subtotalCny: 823.5,
    paidUsd: 0,
    unpaidUsd: 128.42,
    paymentStatus: "pending",
    purchaseStatus: "pending",
    warehouseStatus: "pending",
    packageStatus: "none",
    shippingStatus: "none",
    riskStatus: "normal",
    assignee: "Celia",
    updatedAt: "2026-06-13 09:22",
    orderTab: "pending_payment"
  },
  {
    id: "10040",
    orderNo: "CN202606130040",
    userEmail: "mason.lee@example.com",
    orderSource: "keyword",
    itemsPreview: [
      { id: "i-10040-1", title: "Minimal shirt", image: "https://picsum.photos/seed/cnsnap-order-10040-a/120/120" }
    ],
    itemCount: 1,
    totalQuantity: 2,
    destinationCountry: "Germany",
    totalUsd: 42.8,
    subtotalCny: 274.2,
    paidUsd: 42.8,
    unpaidUsd: 0,
    paymentStatus: "paid",
    purchaseStatus: "pending",
    warehouseStatus: "pending",
    packageStatus: "none",
    shippingStatus: "none",
    riskStatus: "normal",
    assignee: "Noah",
    updatedAt: "2026-06-13 08:47",
    orderTab: "paid"
  },
  {
    id: "10039",
    orderNo: "CN202606120139",
    userEmail: "sofia.martin@example.com",
    orderSource: "manual",
    itemsPreview: [
      { id: "i-10039-1", title: "Designer-inspired bag", image: "https://picsum.photos/seed/cnsnap-order-10039-a/120/120" },
      { id: "i-10039-2", title: "Wallet chain", image: "https://picsum.photos/seed/cnsnap-order-10039-b/120/120" }
    ],
    itemCount: 2,
    totalQuantity: 2,
    destinationCountry: "France",
    totalUsd: 284.15,
    subtotalCny: 1827,
    paidUsd: 284.15,
    unpaidUsd: 0,
    paymentStatus: "paid",
    purchaseStatus: "reviewing",
    warehouseStatus: "pending",
    packageStatus: "none",
    shippingStatus: "none",
    riskStatus: "pending_review",
    assignee: "Celia",
    updatedAt: "2026-06-12 21:18",
    orderTab: "reviewing"
  },
  {
    id: "10038",
    orderNo: "CN202606120138",
    userEmail: "daniel.kim@example.com",
    orderSource: "cart",
    itemsPreview: [
      { id: "i-10038-1", title: "Canvas jacket", image: "https://picsum.photos/seed/cnsnap-order-10038-a/120/120" },
      { id: "i-10038-2", title: "Denim pants", image: "https://picsum.photos/seed/cnsnap-order-10038-b/120/120" }
    ],
    itemCount: 2,
    totalQuantity: 3,
    destinationCountry: "Canada",
    totalUsd: 76.34,
    subtotalCny: 491.2,
    paidUsd: 76.34,
    unpaidUsd: 0,
    paymentStatus: "paid",
    purchaseStatus: "purchasing",
    warehouseStatus: "pending",
    packageStatus: "none",
    shippingStatus: "none",
    riskStatus: "normal",
    assignee: "Ivy",
    updatedAt: "2026-06-12 18:03",
    orderTab: "purchasing"
  },
  {
    id: "10037",
    orderNo: "CN202606110137",
    userEmail: "emma.wilson@example.com",
    orderSource: "url",
    itemsPreview: [
      { id: "i-10037-1", title: "Leather loafers", image: "https://picsum.photos/seed/cnsnap-order-10037-a/120/120" },
      { id: "i-10037-2", title: "Shoe inserts", image: "https://picsum.photos/seed/cnsnap-order-10037-b/120/120" },
      { id: "i-10037-3", title: "Gift socks", image: "https://picsum.photos/seed/cnsnap-order-10037-c/120/120" }
    ],
    itemCount: 3,
    totalQuantity: 5,
    destinationCountry: "Australia",
    totalUsd: 196.77,
    subtotalCny: 1266.4,
    paidUsd: 196.77,
    unpaidUsd: 0,
    paymentStatus: "paid",
    purchaseStatus: "purchased",
    warehouseStatus: "pending",
    packageStatus: "created",
    shippingStatus: "pending",
    riskStatus: "normal",
    assignee: "Noah",
    updatedAt: "2026-06-11 16:40",
    orderTab: "warehouse_pending"
  },
  {
    id: "10036",
    orderNo: "CN202606110136",
    userEmail: "oliver.garcia@example.com",
    orderSource: "diy",
    itemsPreview: [
      { id: "i-10036-1", title: "Handmade desk lamp", image: "https://picsum.photos/seed/cnsnap-order-10036-a/120/120" },
      { id: "i-10036-2", title: "Lamp shade", image: "https://picsum.photos/seed/cnsnap-order-10036-b/120/120" }
    ],
    itemCount: 2,
    totalQuantity: 4,
    destinationCountry: "Spain",
    totalUsd: 151.2,
    subtotalCny: 968.7,
    paidUsd: 121.2,
    unpaidUsd: 30,
    paymentStatus: "partial",
    purchaseStatus: "purchased",
    warehouseStatus: "received",
    packageStatus: "waiting_shipping_payment",
    shippingStatus: "pending",
    riskStatus: "normal",
    assignee: "Mina",
    updatedAt: "2026-06-11 11:12",
    orderTab: "shipping_pending"
  },
  {
    id: "10035",
    orderNo: "CN202606100135",
    userEmail: "mia.johnson@example.com",
    orderSource: "url",
    itemsPreview: [
      { id: "i-10035-1", title: "Retro keyboard", image: "https://picsum.photos/seed/cnsnap-order-10035-a/120/120" }
    ],
    itemCount: 1,
    totalQuantity: 1,
    destinationCountry: "United Kingdom",
    totalUsd: 31.9,
    subtotalCny: 204.8,
    paidUsd: 31.9,
    unpaidUsd: 0,
    paymentStatus: "paid",
    purchaseStatus: "purchased",
    warehouseStatus: "received",
    packageStatus: "shipped",
    shippingStatus: "shipped",
    riskStatus: "normal",
    assignee: "Ivy",
    updatedAt: "2026-06-10 17:25",
    orderTab: "shipped"
  },
  {
    id: "10034",
    orderNo: "CN202606100134",
    userEmail: "lucas.brown@example.com",
    orderSource: "keyword",
    itemsPreview: [
      { id: "i-10034-1", title: "Camping cookware", image: "https://picsum.photos/seed/cnsnap-order-10034-a/120/120" },
      { id: "i-10034-2", title: "Trail bottle", image: "https://picsum.photos/seed/cnsnap-order-10034-b/120/120" },
      { id: "i-10034-3", title: "Packing cubes", image: "https://picsum.photos/seed/cnsnap-order-10034-c/120/120" }
    ],
    itemCount: 7,
    totalQuantity: 12,
    destinationCountry: "United States",
    totalUsd: 338.61,
    subtotalCny: 2177.1,
    paidUsd: 338.61,
    unpaidUsd: 0,
    paymentStatus: "paid",
    purchaseStatus: "purchased",
    warehouseStatus: "received",
    packageStatus: "delivered",
    shippingStatus: "delivered",
    riskStatus: "normal",
    assignee: "Celia",
    updatedAt: "2026-06-10 13:56",
    orderTab: "completed"
  },
  {
    id: "10033",
    orderNo: "CN202606090133",
    userEmail: "nora.smith@example.com",
    orderSource: "cart",
    itemsPreview: [
      { id: "i-10033-1", title: "Wool cardigan", image: "https://picsum.photos/seed/cnsnap-order-10033-a/120/120" },
      { id: "i-10033-2", title: "Pearl buttons", image: "https://picsum.photos/seed/cnsnap-order-10033-b/120/120" }
    ],
    itemCount: 2,
    totalQuantity: 2,
    destinationCountry: "Italy",
    totalUsd: 89.04,
    subtotalCny: 572,
    paidUsd: 0,
    unpaidUsd: 0,
    paymentStatus: "refunded",
    purchaseStatus: "cancelled",
    warehouseStatus: "pending",
    packageStatus: "none",
    shippingStatus: "none",
    riskStatus: "abnormal",
    assignee: "Mina",
    updatedAt: "2026-06-09 22:44",
    orderTab: "cancelled"
  },
  {
    id: "10032",
    orderNo: "CN202606090132",
    userEmail: "ethan.davis@example.com",
    orderSource: "url",
    itemsPreview: [
      { id: "i-10032-1", title: "Collector figure", image: "https://picsum.photos/seed/cnsnap-order-10032-a/120/120" }
    ],
    itemCount: 1,
    totalQuantity: 1,
    destinationCountry: "Netherlands",
    totalUsd: 57.5,
    subtotalCny: 369.5,
    paidUsd: 57.5,
    unpaidUsd: 0,
    paymentStatus: "refunded",
    purchaseStatus: "refunded",
    warehouseStatus: "exception",
    packageStatus: "none",
    shippingStatus: "none",
    riskStatus: "restricted",
    assignee: "Noah",
    updatedAt: "2026-06-09 10:05",
    orderTab: "refunded"
  },
  {
    id: "10031",
    orderNo: "CN202606080131",
    userEmail: "lily.zhang@example.com",
    orderSource: "manual",
    itemsPreview: [
      { id: "i-10031-1", title: "Silk scarf", image: "https://picsum.photos/seed/cnsnap-order-10031-a/120/120" },
      { id: "i-10031-2", title: "Gift box", image: "https://picsum.photos/seed/cnsnap-order-10031-b/120/120" }
    ],
    itemCount: 2,
    totalQuantity: 3,
    destinationCountry: "Singapore",
    totalUsd: 112.73,
    subtotalCny: 724.6,
    paidUsd: 112.73,
    unpaidUsd: 0,
    paymentStatus: "paid",
    purchaseStatus: "reviewing",
    warehouseStatus: "pending",
    packageStatus: "none",
    shippingStatus: "none",
    riskStatus: "pending_review",
    assignee: "Ivy",
    updatedAt: "2026-06-08 15:37",
    orderTab: "reviewing"
  },
  {
    id: "10030",
    orderNo: "CN202606080130",
    userEmail: "henry.miller@example.com",
    orderSource: "cart",
    itemsPreview: [
      { id: "i-10030-1", title: "Outdoor backpack", image: "https://picsum.photos/seed/cnsnap-order-10030-a/120/120" },
      { id: "i-10030-2", title: "Compression pouch", image: "https://picsum.photos/seed/cnsnap-order-10030-b/120/120" },
      { id: "i-10030-3", title: "Rain cover", image: "https://picsum.photos/seed/cnsnap-order-10030-c/120/120" }
    ],
    itemCount: 9,
    totalQuantity: 18,
    destinationCountry: "United States",
    totalUsd: 512.18,
    subtotalCny: 3292,
    paidUsd: 512.18,
    unpaidUsd: 0,
    paymentStatus: "paid",
    purchaseStatus: "purchased",
    warehouseStatus: "received",
    packageStatus: "delivered",
    shippingStatus: "delivered",
    riskStatus: "normal",
    assignee: "Mina",
    updatedAt: "2026-06-08 09:13",
    orderTab: "completed"
  }
];

export const filterableColumns: DataTableFilterableColumn[] = [
  {
    id: "paymentStatus",
    title: "Payment",
    options: [
      { label: "Pending", value: "pending" },
      { label: "Paid", value: "paid" },
      { label: "Failed", value: "failed" },
      { label: "Partial", value: "partial" },
      { label: "Refunded", value: "refunded" }
    ]
  },
  {
    id: "purchaseStatus",
    title: "Purchase",
    options: [
      { label: "Pending", value: "pending" },
      { label: "Reviewing", value: "reviewing" },
      { label: "Purchasing", value: "purchasing" },
      { label: "Purchased", value: "purchased" },
      { label: "Cancelled", value: "cancelled" },
      { label: "Refunded", value: "refunded" }
    ]
  },
  {
    id: "warehouseStatus",
    title: "Warehouse",
    options: [
      { label: "Pending", value: "pending" },
      { label: "Partially Received", value: "partial_received" },
      { label: "Received", value: "received" },
      { label: "Exception", value: "exception" }
    ]
  },
  {
    id: "packageStatus",
    title: "Package",
    options: [
      { label: "None", value: "none" },
      { label: "Created", value: "created" },
      { label: "Waiting Shipping Payment", value: "waiting_shipping_payment" },
      { label: "Ready To Ship", value: "ready_to_ship" },
      { label: "Shipped", value: "shipped" },
      { label: "Delivered", value: "delivered" }
    ]
  },
  {
    id: "shippingStatus",
    title: "Shipping",
    options: [
      { label: "None", value: "none" },
      { label: "Pending", value: "pending" },
      { label: "Ready To Ship", value: "ready_to_ship" },
      { label: "Shipped", value: "shipped" },
      { label: "In Transit", value: "in_transit" },
      { label: "Delivered", value: "delivered" }
    ]
  },
  {
    id: "riskStatus",
    title: "Risk",
    options: [
      { label: "Normal", value: "normal" },
      { label: "Pending Review", value: "pending_review" },
      { label: "Restricted", value: "restricted" },
      { label: "Abnormal", value: "abnormal" }
    ]
  },
  {
    id: "destinationCountry",
    title: "Country",
    options: Array.from(new Set(mockOrders.map((order) => order.destinationCountry))).sort().map((country) => ({ label: country, value: country }))
  },
  {
    id: "assignee",
    title: "Assignee",
    options: Array.from(new Set(mockOrders.map((order) => order.assignee))).sort().map((assignee) => ({ label: assignee, value: assignee }))
  }
];
