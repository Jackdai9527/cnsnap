import { prisma } from "../src/lib/db";
import { getEnabledFrontendLocaleConfigsRuntime } from "../src/lib/i18n/locale-config-store";
import { getNamespaceMessages } from "../src/lib/i18n/messages";
import { getAppLocaleBySeoLocale, type AppLocale } from "../config/i18n";
import { helpArticles } from "../src/components/frontend/help/help-center-data";

type ArticleTemplate = {
  slug: string;
  title: string;
  summary: string;
  content: string;
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function getNestedValue(record: Record<string, unknown>, path: string) {
  return path.split(".").reduce<unknown>((current, segment) => {
    if (!current || typeof current !== "object") return undefined;
    return (current as Record<string, unknown>)[segment];
  }, record);
}

async function getHelpMessages(locale: string) {
  const appLocale = (getAppLocaleBySeoLocale(locale) ?? locale) as AppLocale;
  const frontendMessages = await getNamespaceMessages("frontend", appLocale) as Record<string, unknown>;
  return (frontendMessages.HelpCenter as Record<string, unknown>) || {};
}

function getText(messages: Record<string, unknown>, path: string, fallback = "") {
  const value = getNestedValue(messages, path);
  return typeof value === "string" ? value : fallback;
}

function buildArticleContent(input: {
  title: string;
  summary: string;
  intro: string;
  steps: string[];
  details: string[];
  tips: string[];
}) {
  return [
    `<p>${escapeHtml(input.intro)}</p>`,
    `<p>${escapeHtml(input.summary)}</p>`,
    `<h2>Main steps</h2>`,
    `<ol>${input.steps.map((step) => `<li>${escapeHtml(step)}</li>`).join("")}</ol>`,
    `<h2>What to check</h2>`,
    `<ul>${input.details.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`,
    `<h2>Helpful tips</h2>`,
    `<ul>${input.tips.map((tip) => `<li>${escapeHtml(tip)}</li>`).join("")}</ul>`
  ].join("");
}

const englishTemplates: Record<string, Omit<ArticleTemplate, "title" | "summary">> = {
  "how-to-place-an-order-using-a-product-link": {
    content: buildArticleContent({
      title: "How to place an order using a product link",
      summary: "Paste a Chinese product link, choose variants and quantity, then submit checkout for product cost and domestic shipping review.",
      intro: "Using a product link is the fastest way to create a standard shopping-agent order when the listing can be parsed correctly.",
      steps: [
        "Paste the product URL into the CNSnap search or parser.",
        "Review product title, images, variants, quantity, and domestic shipping details.",
        "Select the exact SKU and confirm that the listing matches what you want to buy.",
        "Add the item to cart or continue to buy now, then complete the first payment."
      ],
      details: [
        "Check seller options such as color, size, model, bundle, or version before paying.",
        "Watch for domestic shipping costs, service fees, and any notes about stock or preorder timing.",
        "Use DIY Order if the page cannot be parsed or the listing details are incomplete."
      ],
      tips: [
        "Save screenshots of the chosen SKU so support can verify the exact option if questions appear later.",
        "Do not assume international shipping is included in the first payment; it is confirmed after warehouse intake."
      ]
    })
  },
  "how-to-use-the-shopping-agent-service": {
    content: buildArticleContent({
      title: "How to use the shopping agent service",
      summary: "Shopping Agent means our team purchases items for you, receives them at our warehouse and prepares international shipping.",
      intro: "The shopping-agent workflow is designed for buyers who want CNSnap to handle purchase, warehouse intake, and export coordination inside one account.",
      steps: [
        "Choose a supported product link or submit a DIY request for manual review.",
        "Pay the product cost, domestic shipping, and service fee during the first checkout.",
        "Wait for the purchasing team to place the order and confirm seller-side progress.",
        "Review package updates after the warehouse receives the parcel, then pay international shipping separately."
      ],
      details: [
        "Shopping Agent is useful when direct overseas payment or delivery is not supported by the seller.",
        "Warehouse intake makes it easier to confirm package status, QC updates, and final shipping options.",
        "International shipping is billed after weighing because the final route depends on packed size and weight."
      ],
      tips: [
        "Prepare clear product links and variant notes to reduce follow-up questions.",
        "If the item becomes unavailable after payment, support will help you review replacement or refund options."
      ]
    })
  },
  "how-to-submit-a-diy-order": {
    content: buildArticleContent({
      title: "How to submit a DIY Order",
      summary: "Use DIY Order when a product link cannot be parsed, you only have an image, or the request needs manual quotation.",
      intro: "DIY Order is the right workflow when automation is not enough and a human review is needed before you pay.",
      steps: [
        "Open the DIY Order page and provide a link, image URL, or manual description.",
        "Describe specifications such as size, color, material, quantity, and destination country.",
        "Wait for the team to review availability, seller pricing, and shipping feasibility.",
        "Approve the quote only after the request details look correct."
      ],
      details: [
        "DIY Order is useful for image-only requests, complex bundles, custom specifications, and unclear seller pages.",
        "A stronger request includes screenshots, exact variant notes, and quantity expectations.",
        "Manual review helps reduce pricing surprises before payment."
      ],
      tips: [
        "If you can include both a link and an image, quote accuracy usually improves.",
        "Use precise product names and feature notes to speed up the review."
      ]
    })
  },
  "how-forwarding-service-works": {
    content: buildArticleContent({
      title: "How forwarding service works",
      summary: "Forwarding is for users who buy by themselves and ship items to our China warehouse for international forwarding.",
      intro: "Forwarding is separate from shopping-agent purchasing. You buy the product yourself, and CNSnap handles warehouse receiving plus international shipment.",
      steps: [
        "Copy the warehouse address and user code from your account.",
        "Place your own order on the seller platform and include the user code in the shipping details.",
        "Submit the domestic tracking number after the seller ships.",
        "Wait for warehouse receiving, package creation, and final shipping payment."
      ],
      details: [
        "The user code is critical because it lets warehouse staff match the parcel to your account.",
        "Forwarding is useful when you already know how to purchase on a Chinese platform but still need export support.",
        "Domestic tracking submission helps reduce delays in parcel identification."
      ],
      tips: [
        "Double-check the recipient details before you pay the seller.",
        "Do not combine unrelated user codes in the same seller shipment."
      ]
    })
  },
  "how-is-international-shipping-fee-calculated": {
    content: buildArticleContent({
      title: "How is international shipping fee calculated?",
      summary: "Shipping fee depends on destination, channel, actual weight, volumetric weight, minimum chargeable weight and product restrictions.",
      intro: "International shipping is calculated after warehouse intake because the final parcel, route, and billed weight cannot be confirmed earlier with accuracy.",
      steps: [
        "Wait until the parcel arrives at the warehouse and is processed.",
        "Review the package dimensions, actual weight, and available route options.",
        "Compare chargeable weight and route-specific restrictions.",
        "Pay the shipping bill only after the final route and cost make sense for your package."
      ],
      details: [
        "Carriers may bill by actual weight or volumetric weight, depending on which is higher.",
        "Sensitive products can affect route availability and cost.",
        "Large but light parcels often cost more than users expect because of billed volume."
      ],
      tips: [
        "Use the estimator for planning, but treat the warehouse measurement as the real billing reference.",
        "Ask support before payment if route restrictions or sensitive items are unclear."
      ]
    })
  },
  "why-do-i-need-to-pay-shipping-separately": {
    content: buildArticleContent({
      title: "Why do I need to pay shipping separately?",
      summary: "Product payment happens before purchase. International shipping can only be confirmed after the warehouse receives and weighs the package.",
      intro: "Separate shipping payment is not a duplicate fee. It exists because the final international parcel details are unknown until warehouse handling is complete.",
      steps: [
        "Pay for the product, domestic shipping, and service fee first.",
        "Wait for the seller to ship the item to the warehouse.",
        "Review the final package after weighing, measuring, and route selection.",
        "Pay international shipping only when the actual parcel cost is known."
      ],
      details: [
        "A seller listing does not include the final international route logic.",
        "Packed size, route restrictions, and actual parcel handling can change the shipping cost.",
        "This two-step process makes route comparison more accurate."
      ],
      tips: [
        "Do not rely on seller-side package weight estimates for final freight planning.",
        "Use package updates in your account to decide whether to consolidate before export."
      ]
    })
  },
  "what-items-are-restricted": {
    content: buildArticleContent({
      title: "What items are restricted?",
      summary: "Battery, liquid, powder, food, cosmetics, branded luxury goods and dangerous items may require review or be rejected.",
      intro: "Restricted items depend on carrier rules, customs controls, product sensitivity, and destination-specific limitations.",
      steps: [
        "Check whether the product contains batteries, liquids, powders, magnets, or other sensitive parts.",
        "Confirm whether the route you want supports that product type.",
        "Ask for manual review before payment if the category looks risky.",
        "Choose a compliant route instead of assuming all channels accept the same item."
      ],
      details: [
        "Battery products, liquids, powders, food, medicine, and branded luxury goods often need additional review.",
        "Some items are not prohibited but can only move through selected channels.",
        "A rejected parcel is harder to solve after dispatch than before payment."
      ],
      tips: [
        "Send screenshots or product details when you are unsure about restrictions.",
        "Do not hide sensitive attributes in product notes; transparency helps the route review."
      ]
    })
  },
  "how-to-recharge-my-wallet": {
    content: buildArticleContent({
      title: "How to recharge my wallet?",
      summary: "Wallet balance can be used for product payments, shipping payments and service fees after recharge records are confirmed.",
      intro: "Wallet recharge gives you a stored balance that can simplify order payment, shipping payment, and future adjustments.",
      steps: [
        "Go to the recharge page in your account.",
        "Enter the amount and choose the available payment method.",
        "Wait for recharge confirmation if the method is not instant.",
        "Use the credited wallet balance during product or shipping checkout."
      ],
      details: [
        "Recharge records help track when balance was added and how it was used.",
        "Wallet balance can support product payments, shipping bills, and later adjustments.",
        "Some methods may require manual confirmation before the balance becomes available."
      ],
      tips: [
        "Keep payment proof if a manual confirmation step is required.",
        "Review recharge history before opening a support ticket about missing balance."
      ]
    })
  },
  "how-to-track-my-package": {
    content: buildArticleContent({
      title: "How to track my package?",
      summary: "After a package is shipped internationally, tracking number and shipping status are shown in Account Packages.",
      intro: "Package tracking begins after dispatch. Before that stage, your account shows warehouse and package preparation status instead of carrier scans.",
      steps: [
        "Open Account Packages to find the package number and current shipping status.",
        "Copy the tracking number once it appears after dispatch.",
        "Check the package page again if the tracking site takes time to update.",
        "Open a ticket if tracking stops for too long or shows an exception you do not understand."
      ],
      details: [
        "Tracking updates may lag immediately after the parcel is handed to the carrier.",
        "Warehouse receipt and package creation happen before the tracking number appears.",
        "The package number and tracking number are different and both are useful for support."
      ],
      tips: [
        "Keep screenshots if the carrier page shows a confusing exception.",
        "Use the package page first before searching external tracking sites."
      ]
    })
  },
  "how-to-open-a-support-ticket": {
    content: buildArticleContent({
      title: "How to open a support ticket?",
      summary: "Use Tickets Center for order issues, package questions, payment proof, refunds, restricted items or shipping exceptions.",
      intro: "Support tickets are the best place to collect evidence, reference order numbers, and keep replies in one threaded history.",
      steps: [
        "Open Tickets Center and create a new ticket.",
        "Choose the closest category and add the order or package reference.",
        "Describe the issue clearly, including what has already happened and what outcome you need.",
        "Check the same ticket thread for replies instead of starting duplicate requests."
      ],
      details: [
        "Tickets are useful for payment proof, shipping exceptions, refund questions, and package issues.",
        "A stronger ticket includes screenshots, tracking details, timestamps, and order numbers.",
        "Keeping one issue in one thread usually leads to faster support handling."
      ],
      tips: [
        "Use short paragraphs and clear bullet points when the issue is complex.",
        "Reference old ticket numbers if the new ticket continues an earlier case."
      ]
    })
  },
  "contact-us": {
    content: buildArticleContent({
      title: "Contact Us",
      summary: "Reach the CNSnap team for support, cooperation, and service questions through the right contact channel.",
      intro: "Use the correct support channel to avoid delays and to make sure your question reaches the right team.",
      steps: [
        "Use the service email for customer support and account-related questions.",
        "Use the business email for cooperation requests and non-customer partnership discussions.",
        "Use the counterfeit reporting address when a product authenticity issue needs to be escalated.",
        "Include order, package, or ticket references whenever they exist."
      ],
      details: [
        "Business cooperation requests should not be mixed into normal support channels.",
        "Order or package references help the support team locate your case faster.",
        "The support hotline is useful when a faster human response is needed during service hours."
      ],
      tips: [
        "If your issue is operational, a support ticket is usually better than a standalone email.",
        "Keep your subject line specific when sending email."
      ]
    })
  },
  "about-us": {
    content: buildArticleContent({
      title: "About Us",
      summary: "Learn how CNSnap supports overseas buyers with shopping agent, warehouse, forwarding, and shipping workflows from China.",
      intro: "CNSnap is designed to help international buyers move through China shopping, warehouse handling, and parcel export with less friction and clearer account-level visibility.",
      steps: [
        "Search products by link, keyword, or image when possible.",
        "Use Shopping Agent or DIY Order depending on how clear the listing is.",
        "Follow warehouse updates after domestic delivery inside China.",
        "Complete international shipping after package intake and route confirmation."
      ],
      details: [
        "The platform is built around a two-stage payment logic: product first, international shipping later.",
        "Warehouse handling is central to quality checks, consolidation, and route comparison.",
        "Support channels are intended to keep the full order and package lifecycle visible."
      ],
      tips: [
        "New users should start with the Help Center to understand the basic workflow.",
        "For unusual products, DIY Order is often the safest first step."
      ]
    })
  },
  "counterfeit-item-policy": {
    content: buildArticleContent({
      title: "Counterfeit Item Policy",
      summary: "Understand how CNSnap handles suspected counterfeit goods, brand-risk review, and escalation paths.",
      intro: "Counterfeit-risk handling exists to protect buyers, reduce dispute risk, and prevent packages from being blocked later in the shipping process.",
      steps: [
        "Flag suspicious listings before payment when possible.",
        "Submit supporting evidence or screenshots if a product seems risky.",
        "Wait for manual review before assuming the listing can move through a standard route.",
        "Use the reporting channel if a serious authenticity concern needs escalation."
      ],
      details: [
        "High brand risk can affect both purchasing and shipping decisions.",
        "Some items may require refusal or extra review even if the seller listing looks normal.",
        "Early review is safer than trying to fix authenticity concerns after dispatch."
      ],
      tips: [
        "Do not rely only on seller claims for authenticity-sensitive products.",
        "If a listing is unclear, ask for manual review before you pay."
      ]
    })
  },
  "tutorial": {
    content: buildArticleContent({
      title: "Tutorial",
      summary: "Follow the full CNSnap workflow from product search and first payment to warehouse QC and international shipping.",
      intro: "This tutorial is the best starting point for new buyers who want to understand how the entire China shopping workflow fits together.",
      steps: [
        "Search the product or submit a DIY request if the listing is unclear.",
        "Pay for the product, domestic shipping, and service fee.",
        "Wait for seller purchase and warehouse receiving updates.",
        "Review package handling, then pay international shipping after weighing."
      ],
      details: [
        "The workflow separates product payment from international shipping on purpose.",
        "Warehouse intake is where package handling and shipping route decisions become accurate.",
        "Most support questions become easier when users understand this two-stage structure."
      ],
      tips: [
        "Save this tutorial as a reference before placing your first order.",
        "Use the Help Center categories when you need a more specific answer about one stage."
      ]
    })
  },
  "service-fees": {
    content: buildArticleContent({
      title: "Service & Fees",
      summary: "Review the main fee types used in the CNSnap workflow and understand when each charge applies.",
      intro: "A clear fee structure helps you understand which costs belong to product purchase, warehouse handling, and international shipping.",
      steps: [
        "Review the product price and domestic shipping shown before the first payment.",
        "Check the service fee charged for the purchasing workflow.",
        "Wait for warehouse intake before expecting the final international freight amount.",
        "Use the package page to review the final shipping fee before dispatch."
      ],
      details: [
        "Product payment and shipping payment belong to different stages of the workflow.",
        "Warehouse measurement is required before final international shipping can be priced accurately.",
        "Sensitive goods or route restrictions may influence final shipping cost."
      ],
      tips: [
        "Do not compare the first checkout total with the final all-in cost without including shipping separately.",
        "Use the estimator when you want a planning range before the warehouse stage."
      ]
    })
  },
  "order-status": {
    content: buildArticleContent({
      title: "Order Status",
      summary: "Understand what each order status means, from payment and purchasing to warehouse processing and final package flow.",
      intro: "Order statuses help you understand which team or stage is currently responsible for progress in the workflow.",
      steps: [
        "Check whether the order is waiting for payment, purchasing, or warehouse processing.",
        "Review notes if an item is out of stock, delayed, or under manual review.",
        "Wait for package creation after warehouse intake if the item has already arrived.",
        "Follow shipping payment and dispatch status after the package is ready."
      ],
      details: [
        "Order status and package status are related, but they are not the same thing.",
        "Some delays are seller-side, while others happen during warehouse or route review.",
        "Support can help faster when you reference the current order status."
      ],
      tips: [
        "Refresh the order timeline before opening a ticket about a delay.",
        "Take note of the last status change time if you need escalation."
      ]
    })
  },
  "receipt-information": {
    content: buildArticleContent({
      title: "Receipt Information",
      summary: "Review what receipt or documentation details may be needed during ordering, shipping, or customs-sensitive handling.",
      intro: "Receipt information matters when buyers need cleaner financial records or when parcel documentation needs to stay consistent.",
      steps: [
        "Review whether your destination or payment method needs extra documentation.",
        "Confirm product details before the first payment if naming consistency matters.",
        "Check package information again before final shipping payment.",
        "Ask support if a specific receipt format is required for your use case."
      ],
      details: [
        "Receipt expectations can vary by payment method and customer purpose.",
        "Accurate order and package information reduces mismatch risk later.",
        "Customs-related documentation is not the same as customer receipt preferences."
      ],
      tips: [
        "State special documentation needs early in the workflow.",
        "Keep a copy of order and package references for future reconciliation."
      ]
    })
  },
  "privacy-policy": {
    content: buildArticleContent({
      title: "Privacy Policy",
      summary: "Understand how CNSnap handles user information in the course of shopping, package processing, support, and account services.",
      intro: "Privacy expectations are important because the platform touches account identity, order details, package data, and customer-service records.",
      steps: [
        "Review what data is needed to place orders and manage shipping.",
        "Understand how account, package, and support information may be stored.",
        "Check how communication channels and account settings affect your profile data.",
        "Contact support if you need clarification about a privacy-related request."
      ],
      details: [
        "Operational data is often necessary to complete orders and shipments correctly.",
        "Support records help keep issue resolution traceable.",
        "Different services inside the platform may rely on shared account information."
      ],
      tips: [
        "Use your account settings to keep profile data current.",
        "Escalate privacy concerns through the official support channel."
      ]
    })
  },
  "customs-and-taxation": {
    content: buildArticleContent({
      title: "Customs and Taxation",
      summary: "Learn what can affect customs handling, declarations, and tax-related questions when shipping internationally from China.",
      intro: "Customs and taxation depend on destination rules, declared values, product categories, and route-specific compliance requirements.",
      steps: [
        "Confirm whether your destination has sensitivity or declaration concerns for the parcel type.",
        "Review package contents carefully before final shipping payment.",
        "Use route guidance to avoid avoidable customs problems where possible.",
        "Ask support before dispatch if the parcel category looks risky."
      ],
      details: [
        "Customs rules are destination-specific and can change over time.",
        "Accurate product information usually matters more than guesswork on declarations.",
        "High-value or sensitive categories may carry extra risk."
      ],
      tips: [
        "Do not wait until after dispatch to ask customs-related questions.",
        "Use the shipping estimator together with route review when import risk matters."
      ]
    })
  },
  "mail-restrictions": {
    content: buildArticleContent({
      title: "Mail Restrictions",
      summary: "Check which parcel types, product categories, and route rules may limit what can be shipped internationally.",
      intro: "Mail restrictions are usually tied to carrier rules, dangerous-goods handling, customs policy, and destination-specific controls.",
      steps: [
        "Check whether the item category is standard, sensitive, or restricted.",
        "Review route eligibility before you pay international shipping.",
        "Use manual review if the listing does not clearly show product attributes.",
        "Avoid assuming a previously accepted item always works on every route."
      ],
      details: [
        "Restrictions can change between channels even when the destination is the same.",
        "Batteries, liquids, powders, magnets, and branded goods often need extra review.",
        "A shipping route can be valid for one package but not another because of dimensions or content."
      ],
      tips: [
        "Prepare screenshots and product notes when asking for a restrictions review.",
        "Review the latest package status before escalating a blocked shipment."
      ]
    })
  },
  "returns-and-refunds": {
    content: buildArticleContent({
      title: "Returns and Refunds",
      summary: "Understand when returns or refunds may be possible, what affects eligibility, and how support cases are handled.",
      intro: "Return and refund outcomes depend on seller policy, order stage, warehouse handling status, and whether the item has already moved into shipping.",
      steps: [
        "Check whether the item has been purchased, received, packed, or shipped.",
        "Review seller-side constraints before assuming a return is possible.",
        "Open a support ticket with order details and evidence if a refund review is needed.",
        "Wait for the team to confirm the available resolution path."
      ],
      details: [
        "Pre-purchase cancellations are usually easier than post-shipping refund cases.",
        "Warehouse status can affect how a product issue is reviewed.",
        "Clear evidence improves dispute handling."
      ],
      tips: [
        "Document condition issues as early as possible after warehouse receipt.",
        "Keep all related order and package references in one ticket thread."
      ]
    })
  },
  "storage": {
    content: buildArticleContent({
      title: "Storage",
      summary: "Understand how warehouse storage supports package planning, parcel consolidation, and timing decisions before international shipment.",
      intro: "Storage is a practical part of the workflow because not every order arrives at the warehouse at the same time.",
      steps: [
        "Wait for domestic parcels to arrive at the warehouse.",
        "Review whether more than one order should be consolidated before export.",
        "Check package timing if you are waiting for additional items to arrive.",
        "Pay international shipping only when the package plan is ready."
      ],
      details: [
        "Storage helps buyers combine multiple parcels into a more efficient export flow.",
        "Warehouse timing can affect how long users wait before paying final shipping.",
        "Support can clarify storage-related concerns when multiple orders are involved."
      ],
      tips: [
        "Track arrival dates when planning a consolidated shipment.",
        "Use package notes if certain parcels should not be combined."
      ]
    })
  },
  "inspection-information": {
    content: buildArticleContent({
      title: "Inspection Information",
      summary: "Review what warehouse inspection can and cannot confirm before your parcel is shipped internationally.",
      intro: "Inspection information helps buyers understand the role of warehouse checks in the larger purchasing and shipping workflow.",
      steps: [
        "Wait for the parcel to arrive at the warehouse.",
        "Review available photos and status notes after intake.",
        "Check whether the visible item details match the order expectations.",
        "Raise issues before shipping payment if something looks wrong."
      ],
      details: [
        "Inspection confirms visible conditions and package-level details, not every product function.",
        "Clear variant notes at purchase time make inspection easier later.",
        "The best time to question a mismatch is before final parcel dispatch."
      ],
      tips: [
        "Keep screenshots of the ordered variant for easier warehouse comparison.",
        "Open a support ticket quickly if warehouse photos show an unexpected item."
      ]
    })
  },
  "insurance-and-compensation": {
    content: buildArticleContent({
      title: "Insurance and Compensation",
      summary: "Learn when compensation review may apply and how to prepare information if a package issue needs escalation.",
      intro: "Insurance and compensation handling depends on route rules, package stage, and the type of problem reported.",
      steps: [
        "Document the issue with order, package, and tracking references.",
        "Open a support ticket and include evidence as early as possible.",
        "Wait for route-side and warehouse-side facts to be reviewed together.",
        "Follow the compensation guidance provided for the specific case."
      ],
      details: [
        "Compensation review is usually evidence-driven and case-specific.",
        "Timing matters; delayed reporting can weaken an investigation.",
        "Not every operational issue automatically qualifies as a compensable loss."
      ],
      tips: [
        "Keep screenshots, photos, and tracking history when a package problem occurs.",
        "Use one ticket thread so the case history stays complete."
      ]
    })
  },
  "how-to-buy": {
    content: buildArticleContent({
      title: "How to Buy",
      summary: "Understand the basic CNSnap purchase flow from product discovery to shipping payment.",
      intro: "This overview is for users who want a concise explanation of how to buy from Chinese marketplaces with CNSnap.",
      steps: [
        "Find a product by link, keyword, image, or DIY request.",
        "Review item details and pay the first checkout.",
        "Follow warehouse receiving and package updates.",
        "Pay international shipping after parcel weighing."
      ],
      details: [
        "The process is intentionally split into product payment and shipping payment.",
        "Warehouse handling is central to final route and cost decisions.",
        "Support and Help Center guides fill in the details at each stage."
      ],
      tips: [
        "Start with a standard product link if you want the simplest path.",
        "Use DIY Order when the listing or product details are unclear."
      ]
    })
  },
  "shipping-guide": {
    content: buildArticleContent({
      title: "Shipping Guide",
      summary: "Get a quick overview of how international package shipping works after warehouse intake.",
      intro: "This guide gives users a concise introduction to package flow, route review, and freight payment after warehouse processing.",
      steps: [
        "Wait for warehouse receiving and package creation.",
        "Check dimensions, weight, and available route options.",
        "Compare channels before the final shipping payment.",
        "Track the package after dispatch."
      ],
      details: [
        "The final shipping fee depends on the packed parcel, not the seller listing.",
        "Restricted products can change route availability.",
        "Tracking begins after the carrier accepts the parcel."
      ],
      tips: [
        "Use the shipping estimator for planning, not final billing.",
        "Ask support before dispatch if route rules seem unclear."
      ]
    })
  },
  "refund-policy": {
    content: buildArticleContent({
      title: "Refund Policy",
      summary: "Review the main considerations behind refund handling for orders, packages, and shipping-stage issues.",
      intro: "Refunds depend on timing, seller-side policy, warehouse status, and whether the issue is still reversible in the workflow.",
      steps: [
        "Check the current order or package stage first.",
        "Collect evidence such as screenshots or warehouse photos.",
        "Open a support ticket and explain the reason for the refund request.",
        "Wait for the case review before assuming the outcome."
      ],
      details: [
        "Seller-side decisions often influence what refund path is available.",
        "Cases are easier before shipment than after international dispatch.",
        "Clear evidence speeds up review."
      ],
      tips: [
        "Keep all refund discussion inside one support thread.",
        "Document issues as early as possible."
      ]
    })
  }
};

function resolveEnglishTemplate(slug: string, title: string, summary: string, fallbackContent: string) {
  const template = englishTemplates[slug];
  if (!template) {
    return {
      title,
      summary: summary || title,
      content: fallbackContent
    };
  }

  return {
    title,
    summary,
    content: template.content
  };
}

async function main() {
  const locales = await getEnabledFrontendLocaleConfigsRuntime();
  const articles = await prisma.helpArticle.findMany({
    include: {
      descriptions: true
    },
    orderBy: [{ category: "asc" }, { updatedAt: "desc" }]
  });

  const seedMap = new Map(helpArticles.map((item) => [item.slug, item]));

  for (const article of articles) {
    const seed = seedMap.get(article.slug);
    const englishMessages = await getHelpMessages("en");
    const englishTitle = seed ? getText(englishMessages, seed.titleKey, article.title) : article.title;
    const englishSummary = seed ? getText(englishMessages, seed.summaryKey, article.excerpt || article.title) : (article.excerpt || article.title);
    const englishContentSource = seed ? getText(englishMessages, seed.contentKey, article.content) : article.content;
    const englishResolved = resolveEnglishTemplate(article.slug, englishTitle, englishSummary, englishContentSource);

    await prisma.helpArticle.update({
      where: { id: article.id },
      data: {
        title: englishResolved.title,
        excerpt: englishResolved.summary,
        content: englishResolved.content,
        locale: "en",
        isPublished: true
      }
    });

    await prisma.helpArticleDescription.upsert({
      where: {
        helpArticleId_languageCode: {
          helpArticleId: article.id,
          languageCode: "en"
        }
      },
      update: {
        title: englishResolved.title,
        slug: article.slug,
        summary: englishResolved.summary,
        content: englishResolved.content,
        translationStatus: "published"
      },
      create: {
        helpArticleId: article.id,
        languageCode: "en",
        title: englishResolved.title,
        slug: article.slug,
        summary: englishResolved.summary,
        content: englishResolved.content,
        translationStatus: "published"
      }
    });

    for (const locale of locales) {
      if (locale.locale === "en") continue;
      const localeMessages = await getHelpMessages(locale.locale);
      const localizedTitle = seed ? getText(localeMessages, seed.titleKey, englishResolved.title) : englishResolved.title;
      const localizedSummary = seed ? getText(localeMessages, seed.summaryKey, englishResolved.summary) : englishResolved.summary;
      const localizedContent = seed ? getText(localeMessages, seed.contentKey, englishResolved.content) : englishResolved.content;

      await prisma.helpArticleDescription.upsert({
        where: {
          helpArticleId_languageCode: {
            helpArticleId: article.id,
            languageCode: locale.locale
          }
        },
        update: {
          title: localizedTitle,
          slug: article.slug,
          summary: localizedSummary,
          content: localizedContent,
          translationStatus: "published"
        },
        create: {
          helpArticleId: article.id,
          languageCode: locale.locale,
          title: localizedTitle,
          slug: article.slug,
          summary: localizedSummary,
          content: localizedContent,
          translationStatus: "published"
        }
      });
    }

    console.log(`Updated help article ${article.slug}`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
