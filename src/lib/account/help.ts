import type { HelpArticle, HelpCategory, HelpFaq } from "@/types/help";

export const helpCategories: HelpCategory[] = [
  { id: "how-to-buy", title: "How to Buy", description: "Use product links, keywords, or search results to place shopping-agent orders.", icon: "ShoppingBag", articleCount: 8 },
  { id: "orders", title: "Orders", description: "Order statuses, purchasing, out-of-stock handling, and seller price changes.", icon: "ClipboardList", articleCount: 10 },
  { id: "packages", title: "Packages", description: "Package creation, weighing, consolidation, and warehouse dispatch.", icon: "Package", articleCount: 7 },
  { id: "shipping-fee", title: "Shipping Fee", description: "International shipping calculation, volumetric weight, and channel selection.", icon: "Truck", articleCount: 9 },
  { id: "payments", title: "Payments & Recharge", description: "Product payment, shipping payment, wallet recharge, and payment records.", icon: "CreditCard", articleCount: 7 },
  { id: "refunds", title: "Refunds", description: "Out-of-stock refunds, cancellation refunds, and wallet balance refunds.", icon: "RefreshCcw", articleCount: 5 },
  { id: "diy-orders", title: "DIY Orders", description: "Submit manual purchasing requests when product data is incomplete.", icon: "PenTool", articleCount: 6 },
  { id: "restricted-items", title: "Restricted Items", description: "Forbidden goods, sensitive items, branded goods, and carrier restrictions.", icon: "ShieldAlert", articleCount: 6 },
  { id: "affiliate", title: "Affiliate", description: "Referral links, invitations, valid orders, and commission records.", icon: "Share2", articleCount: 4 },
  { id: "tickets", title: "Tickets Center", description: "Open tickets, check support replies, and reopen resolved issues.", icon: "MessageSquareText", articleCount: 5 },
  { id: "account-settings", title: "Account Settings", description: "Profile, language, currency, addresses, Google login, and security.", icon: "Settings", articleCount: 6 }
];

export const helpArticles: HelpArticle[] = [
  {
    id: "article-link-order",
    title: "How to place an order using a product link",
    slug: "place-order-product-link",
    category: "How to Buy",
    summary: "Paste a Taobao, Tmall, or supported platform link into search, review product details, select variants, then add it to cart.",
    content: "Paste the original product URL into the home search box. CNSnap identifies the source platform, loads product details, and shows available images, variants, price, domestic freight, and service fee. Select the correct SKU, enter quantity, add to cart, and complete checkout from your account.",
    keywords: ["order", "product link", "taobao", "tmall", "buy"],
    isPopular: true,
    updatedAt: "2026-06-12"
  },
  {
    id: "article-diy-order",
    title: "How to submit a DIY Order",
    slug: "submit-diy-order",
    category: "DIY Orders",
    summary: "Use DIY Orders when a listing cannot be parsed, requires manual quote, or needs a special purchase note.",
    content: "Open DIY Orders from your account, click New DIY Order, and provide the product URL, product name, quantity, specification, budget, and notes. Support will review the request, quote the final cost, and continue purchasing after you approve.",
    keywords: ["DIY order", "manual quote", "custom request", "image"],
    isPopular: true,
    updatedAt: "2026-06-10"
  },
  {
    id: "article-shipping-calc",
    title: "How is international shipping fee calculated?",
    slug: "international-shipping-fee",
    category: "Shipping Fee",
    summary: "Shipping fee depends on chargeable weight, destination country, shipping channel, and package restrictions.",
    content: "International shipping is usually calculated from chargeable weight. Chargeable weight is the greater of actual weight, volumetric weight, and the channel minimum weight. Volumetric weight is based on package dimensions and carrier rules. The final fee is confirmed after warehouse weighing.",
    keywords: ["shipping", "shipping fee", "chargeable weight", "volumetric weight", "package"],
    isPopular: true,
    updatedAt: "2026-06-11"
  },
  {
    id: "article-second-payment",
    title: "Why do I need to pay shipping fee after warehouse arrival?",
    slug: "why-pay-shipping-after-warehouse",
    category: "Packages",
    summary: "The product payment and international shipping payment are separated because the final parcel weight is known after warehouse arrival.",
    content: "Product checkout pays for item cost, domestic shipping, and service fee. International shipping is paid later because the warehouse must receive, inspect, pack, and weigh the goods before the final parcel fee can be calculated.",
    keywords: ["package", "warehouse", "shipping payment", "international shipping"],
    isPopular: true,
    updatedAt: "2026-06-09"
  },
  {
    id: "article-restricted",
    title: "What items are restricted or forbidden?",
    slug: "restricted-forbidden-items",
    category: "Restricted Items",
    summary: "Some products cannot be shipped internationally or may require manual review before purchase.",
    content: "Restricted goods include pure batteries, liquids, powders, weapons, hazardous materials, counterfeit goods, some branded products, food, medicine, and oversized items. Sensitive products may need a manual quote or a special route. Open a ticket before purchasing uncertain goods.",
    keywords: ["restricted items", "forbidden", "sensitive goods", "battery", "liquid"],
    isPopular: true,
    updatedAt: "2026-06-08"
  },
  {
    id: "article-recharge",
    title: "How to recharge my wallet?",
    slug: "recharge-wallet",
    category: "Payments & Recharge",
    summary: "Recharge your wallet from Account Recharge and use the balance for orders or shipping fees.",
    content: "Go to Recharge, enter an amount, choose a payment method, and submit. V1.0 supports manual payment placeholder records. Once confirmed, your wallet balance can be used to pay product orders and package shipping fees.",
    keywords: ["recharge", "wallet", "payment", "balance"],
    isPopular: true,
    updatedAt: "2026-06-07"
  },
  {
    id: "article-track-package",
    title: "How to track my package?",
    slug: "track-package",
    category: "Packages",
    summary: "Tracking becomes available after the package is shipped and the carrier returns a tracking number.",
    content: "Open Packages in your account. If tracking is available, use Track Package from the row actions or package detail page. Tracking may take time to update after carrier handover.",
    keywords: ["tracking", "package", "shipped", "carrier"],
    isPopular: true,
    updatedAt: "2026-06-06"
  },
  {
    id: "article-open-ticket",
    title: "How to open a support ticket?",
    slug: "open-support-ticket",
    category: "Tickets Center",
    summary: "Use Tickets Center to contact support about orders, packages, payment, refunds, DIY Orders, or account issues.",
    content: "Open Tickets Center, click New Ticket, choose a category, add the related order or package when possible, describe the issue, and submit. You can check replies in ticket detail and reopen resolved tickets if needed.",
    keywords: ["ticket", "support", "customer service", "reply"],
    isPopular: true,
    updatedAt: "2026-06-12"
  },
  {
    id: "article-out-of-stock",
    title: "What happens if the item is out of stock?",
    slug: "item-out-of-stock",
    category: "Orders",
    summary: "If the seller cannot provide the item, support will update the order and refund the affected amount.",
    content: "When an item is out of stock, purchasing staff will mark the item or order status and notify you. You can choose alternatives when available, cancel the item, or receive a refund to your wallet balance.",
    keywords: ["out of stock", "order", "refund", "seller"],
    isPopular: true,
    updatedAt: "2026-06-05"
  },
  {
    id: "article-price-change",
    title: "What happens if the price changes?",
    slug: "seller-price-change",
    category: "Orders",
    summary: "Seller price may change before purchasing. Support may ask you to confirm additional payment or issue a refund.",
    content: "If the seller changes the price, CNSnap compares the paid amount with the final purchase price. If price increases, you may need to pay the difference. If price decreases, the difference can be refunded to your wallet.",
    keywords: ["price change", "seller", "order", "refund", "additional payment"],
    isPopular: true,
    updatedAt: "2026-06-04"
  }
];

export const helpFaqs: HelpFaq[] = [
  { id: "faq-order-1", category: "Orders", question: "How do I place an order?", answer: "Paste a product link or search keyword, select product options, add the item to cart, and complete checkout.", relatedAction: { label: "Search Products", href: "/" } },
  { id: "faq-order-2", category: "Orders", question: "Can I cancel my order?", answer: "Pending payment orders can usually be cancelled. After purchasing starts, cancellation depends on seller status.", relatedAction: { label: "Go to Orders", href: "/account/orders" } },
  { id: "faq-order-3", category: "Orders", question: "What if the seller changes the price?", answer: "Support will update the order. You may need to pay the difference or receive a wallet refund." },
  { id: "faq-order-4", category: "Orders", question: "What if the item is out of stock?", answer: "We will notify you, update the order, and refund unavailable items to your wallet when needed." },
  { id: "faq-package-1", category: "Packages", question: "Why do I need to pay international shipping separately?", answer: "The warehouse must receive and weigh goods before the final international shipping fee is known.", relatedAction: { label: "View Packages", href: "/account/packages" } },
  { id: "faq-package-2", category: "Packages", question: "How is chargeable weight calculated?", answer: "Chargeable weight is normally the greatest value among actual weight, volumetric weight, and the route minimum weight." },
  { id: "faq-package-3", category: "Packages", question: "What is volumetric weight?", answer: "Volumetric weight converts package size into a billable weight according to carrier rules." },
  { id: "faq-package-4", category: "Packages", question: "How can I track my package?", answer: "Open Packages and use Track Package after a tracking number is available.", relatedAction: { label: "View Packages", href: "/account/packages" } },
  { id: "faq-pay-1", category: "Payments & Recharge", question: "How do I recharge my wallet?", answer: "Open Recharge, enter an amount, select a method, and submit the recharge request.", relatedAction: { label: "Recharge", href: "/account/recharge" } },
  { id: "faq-pay-2", category: "Payments & Recharge", question: "Can I get a refund?", answer: "Refunds are normally returned to wallet balance first. External refunds depend on payment method and order status." },
  { id: "faq-pay-3", category: "Payments & Recharge", question: "Where can I see my wallet transactions?", answer: "Open Wallet to see recharge, order payment, shipping payment, refund, adjustment, and commission records.", relatedAction: { label: "View Wallet", href: "/account/wallet" } },
  { id: "faq-diy-1", category: "DIY Orders", question: "When should I submit a DIY Order?", answer: "Use DIY Orders when the item cannot be parsed, requires manual quote, or has special purchase requirements.", relatedAction: { label: "Submit DIY Order", href: "/account/diy-orders/new" } },
  { id: "faq-diy-2", category: "DIY Orders", question: "How long does a DIY Order quote take?", answer: "Most quotes are reviewed during support hours. Complex items may take longer if seller confirmation is required." },
  { id: "faq-diy-3", category: "DIY Orders", question: "Can I attach product images?", answer: "V1.0 supports image URL placeholders. File upload can be connected later." },
  { id: "faq-ticket-1", category: "Tickets Center", question: "When should I open a ticket?", answer: "Open a ticket for order problems, package questions, payment issues, refunds, DIY Orders, or account support.", relatedAction: { label: "Open Ticket", href: "/account/tickets/new?category=other" } },
  { id: "faq-ticket-2", category: "Tickets Center", question: "How do I check ticket replies?", answer: "Open Tickets Center, choose your ticket, and read the conversation thread.", relatedAction: { label: "Tickets Center", href: "/account/tickets" } },
  { id: "faq-ticket-3", category: "Tickets Center", question: "Can I reopen a resolved ticket?", answer: "Resolved tickets can be reopened from ticket detail in V1.0 mock mode, and later through the ticket API." }
];
