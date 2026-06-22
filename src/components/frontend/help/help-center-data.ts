import type { HelpArticle, HelpCategory, HelpFaq } from "@/types/help";

export type HelpTopic = {
  id: string;
  articleId: string;
};

type HelpCategorySeed = Omit<HelpCategory, "title" | "description"> & {
  titleKey: string;
  descriptionKey: string;
};

type HelpArticleSeed = Omit<HelpArticle, "title" | "summary" | "content" | "category"> & {
  titleKey: string;
  summaryKey: string;
  contentKey: string;
  categoryId: HelpCategoryId;
};

type HelpFaqSeed = Omit<HelpFaq, "question" | "answer" | "category"> & {
  questionKey: string;
  answerKey: string;
  categoryId: HelpCategoryId;
};

export const helpCategoryIds = [
  "howToBuy",
  "orders",
  "payment",
  "shippingFee",
  "packages",
  "forwarding",
  "diyOrders",
  "restrictedItems",
  "refunds",
  "affiliate",
  "tickets",
  "account"
] as const;

export type HelpCategoryId = (typeof helpCategoryIds)[number];

export const popularTopicKeys = [
  "orderLink",
  "estimation",
  "diyOrder",
  "forwarding",
  "separateShipping",
  "restricted",
  "recharge",
  "tracking",
  "ticket"
] as const;

export const searchExampleKeys = [
  "shoppingAgent",
  "shippingFee",
  "estimation",
  "diyOrder",
  "forwarding",
  "payment",
  "refund",
  "restrictedItems",
  "package",
  "tracking",
  "ticket"
] as const;

export const helpCategories: HelpCategorySeed[] = [
  { id: "howToBuy", titleKey: "categories.howToBuy.title", descriptionKey: "categories.howToBuy.description", icon: "ShoppingBag", articleCount: 7 },
  { id: "orders", titleKey: "categories.orders.title", descriptionKey: "categories.orders.description", icon: "ClipboardList", articleCount: 6 },
  { id: "payment", titleKey: "categories.payment.title", descriptionKey: "categories.payment.description", icon: "CreditCard", articleCount: 5 },
  { id: "shippingFee", titleKey: "categories.shippingFee.title", descriptionKey: "categories.shippingFee.description", icon: "Calculator", articleCount: 5 },
  { id: "packages", titleKey: "categories.packages.title", descriptionKey: "categories.packages.description", icon: "Package", articleCount: 6 },
  { id: "forwarding", titleKey: "categories.forwarding.title", descriptionKey: "categories.forwarding.description", icon: "Warehouse", articleCount: 5 },
  { id: "diyOrders", titleKey: "categories.diyOrders.title", descriptionKey: "categories.diyOrders.description", icon: "PenTool", articleCount: 5 },
  { id: "restrictedItems", titleKey: "categories.restrictedItems.title", descriptionKey: "categories.restrictedItems.description", icon: "ShieldAlert", articleCount: 4 },
  { id: "refunds", titleKey: "categories.refunds.title", descriptionKey: "categories.refunds.description", icon: "RefreshCcw", articleCount: 4 },
  { id: "affiliate", titleKey: "categories.affiliate.title", descriptionKey: "categories.affiliate.description", icon: "Share2", articleCount: 3 },
  { id: "tickets", titleKey: "categories.tickets.title", descriptionKey: "categories.tickets.description", icon: "MessageSquareText", articleCount: 4 },
  { id: "account", titleKey: "categories.account.title", descriptionKey: "categories.account.description", icon: "Settings", articleCount: 4 }
];

export const helpArticles: HelpArticleSeed[] = [
  {
    id: "place-order-link",
    slug: "how-to-place-an-order-using-a-product-link",
    categoryId: "howToBuy",
    titleKey: "articles.placeOrderLink.title",
    summaryKey: "articles.placeOrderLink.summary",
    contentKey: "articles.placeOrderLink.content",
    keywords: ["shopping agent", "order", "product link", "checkout", "taobao", "1688"],
    isPopular: true,
    updatedAt: "2026-06-01"
  },
  {
    id: "shopping-agent-service",
    slug: "how-to-use-the-shopping-agent-service",
    categoryId: "howToBuy",
    titleKey: "articles.shoppingAgent.title",
    summaryKey: "articles.shoppingAgent.summary",
    contentKey: "articles.shoppingAgent.content",
    keywords: ["shopping agent", "purchase", "service fee", "warehouse"],
    isPopular: true,
    updatedAt: "2026-06-01"
  },
  {
    id: "submit-diy-order",
    slug: "how-to-submit-a-diy-order",
    categoryId: "diyOrders",
    titleKey: "articles.submitDiy.title",
    summaryKey: "articles.submitDiy.summary",
    contentKey: "articles.submitDiy.content",
    keywords: ["DIY order", "manual quote", "image", "specification"],
    isPopular: true,
    updatedAt: "2026-06-02"
  },
  {
    id: "forwarding-service",
    slug: "how-forwarding-service-works",
    categoryId: "forwarding",
    titleKey: "articles.forwarding.title",
    summaryKey: "articles.forwarding.summary",
    contentKey: "articles.forwarding.content",
    keywords: ["forwarding", "warehouse address", "user code", "tracking"],
    isPopular: true,
    updatedAt: "2026-06-02"
  },
  {
    id: "shipping-fee-calculated",
    slug: "how-is-international-shipping-fee-calculated",
    categoryId: "shippingFee",
    titleKey: "articles.shippingFee.title",
    summaryKey: "articles.shippingFee.summary",
    contentKey: "articles.shippingFee.content",
    keywords: ["shipping fee", "estimation", "volumetric weight", "chargeable weight"],
    isPopular: true,
    updatedAt: "2026-06-03"
  },
  {
    id: "separate-shipping",
    slug: "why-do-i-need-to-pay-shipping-separately",
    categoryId: "shippingFee",
    titleKey: "articles.separateShipping.title",
    summaryKey: "articles.separateShipping.summary",
    contentKey: "articles.separateShipping.content",
    keywords: ["shipping separately", "warehouse", "payment", "package"],
    isPopular: true,
    updatedAt: "2026-06-03"
  },
  {
    id: "restricted-items",
    slug: "what-items-are-restricted",
    categoryId: "restrictedItems",
    titleKey: "articles.restricted.title",
    summaryKey: "articles.restricted.summary",
    contentKey: "articles.restricted.content",
    keywords: ["restricted items", "battery", "liquid", "powder", "food", "luxury"],
    isPopular: true,
    updatedAt: "2026-06-04"
  },
  {
    id: "recharge-wallet",
    slug: "how-to-recharge-my-wallet",
    categoryId: "payment",
    titleKey: "articles.recharge.title",
    summaryKey: "articles.recharge.summary",
    contentKey: "articles.recharge.content",
    keywords: ["wallet", "recharge", "payment", "manual payment"],
    isPopular: true,
    updatedAt: "2026-06-04"
  },
  {
    id: "track-package",
    slug: "how-to-track-my-package",
    categoryId: "packages",
    titleKey: "articles.tracking.title",
    summaryKey: "articles.tracking.summary",
    contentKey: "articles.tracking.content",
    keywords: ["package", "tracking", "shipping", "delivery"],
    isPopular: true,
    updatedAt: "2026-06-05"
  },
  {
    id: "open-ticket",
    slug: "how-to-open-a-support-ticket",
    categoryId: "tickets",
    titleKey: "articles.ticket.title",
    summaryKey: "articles.ticket.summary",
    contentKey: "articles.ticket.content",
    keywords: ["ticket", "support", "reply", "customer service"],
    isPopular: true,
    updatedAt: "2026-06-05"
  }
];

export const helpFaqs: HelpFaqSeed[] = [
  { id: "sa-taobao-1688", categoryId: "howToBuy", questionKey: "faq.saTaobao.question", answerKey: "faq.saTaobao.answer" },
  { id: "sa-image-search", categoryId: "howToBuy", questionKey: "faq.saImage.question", answerKey: "faq.saImage.answer" },
  { id: "sa-out-stock", categoryId: "orders", questionKey: "faq.saOutStock.question", answerKey: "faq.saOutStock.answer" },
  { id: "est-final", categoryId: "shippingFee", questionKey: "faq.estFinal.question", answerKey: "faq.estFinal.answer" },
  { id: "est-volumetric", categoryId: "shippingFee", questionKey: "faq.estVolumetric.question", answerKey: "faq.estVolumetric.answer" },
  { id: "est-chargeable", categoryId: "shippingFee", questionKey: "faq.estChargeable.question", answerKey: "faq.estChargeable.answer" },
  { id: "diy-when", categoryId: "diyOrders", questionKey: "faq.diyWhen.question", answerKey: "faq.diyWhen.answer" },
  { id: "diy-quote-time", categoryId: "diyOrders", questionKey: "faq.diyQuote.question", answerKey: "faq.diyQuote.answer" },
  { id: "diy-image", categoryId: "diyOrders", questionKey: "faq.diyImage.question", answerKey: "faq.diyImage.answer" },
  { id: "fw-buy-self", categoryId: "forwarding", questionKey: "faq.fwBuySelf.question", answerKey: "faq.fwBuySelf.answer" },
  { id: "fw-difference", categoryId: "forwarding", questionKey: "faq.fwDifference.question", answerKey: "faq.fwDifference.answer" },
  { id: "fw-user-code", categoryId: "forwarding", questionKey: "faq.fwUserCode.question", answerKey: "faq.fwUserCode.answer" },
  { id: "pay-product", categoryId: "payment", questionKey: "faq.payProduct.question", answerKey: "faq.payProduct.answer" },
  { id: "pay-shipping", categoryId: "payment", questionKey: "faq.payShipping.question", answerKey: "faq.payShipping.answer" },
  { id: "pay-refund", categoryId: "refunds", questionKey: "faq.payRefund.question", answerKey: "faq.payRefund.answer" },
  { id: "ticket-when", categoryId: "tickets", questionKey: "faq.ticketWhen.question", answerKey: "faq.ticketWhen.answer" },
  { id: "ticket-replies", categoryId: "tickets", questionKey: "faq.ticketReplies.question", answerKey: "faq.ticketReplies.answer" },
  { id: "ticket-reopen", categoryId: "tickets", questionKey: "faq.ticketReopen.question", answerKey: "faq.ticketReopen.answer" },
  { id: "package-arrival", categoryId: "packages", questionKey: "faq.packageArrival.question", answerKey: "faq.packageArrival.answer" },
  { id: "account-language", categoryId: "account", questionKey: "faq.accountLanguage.question", answerKey: "faq.accountLanguage.answer" },
  { id: "affiliate-reward", categoryId: "affiliate", questionKey: "faq.affiliateReward.question", answerKey: "faq.affiliateReward.answer" }
];

export const popularTopics: HelpTopic[] = [
  { id: "orderLink", articleId: "place-order-link" },
  { id: "estimation", articleId: "shipping-fee-calculated" },
  { id: "diyOrder", articleId: "submit-diy-order" },
  { id: "forwarding", articleId: "forwarding-service" },
  { id: "separateShipping", articleId: "separate-shipping" },
  { id: "restricted", articleId: "restricted-items" },
  { id: "recharge", articleId: "recharge-wallet" },
  { id: "tracking", articleId: "track-package" },
  { id: "ticket", articleId: "open-ticket" }
];
