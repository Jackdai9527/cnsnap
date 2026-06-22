import type { SeoFaqItem, SeoLandingPage, SeoLandingPageSection, SeoRedirect } from "@/modules/seo/types";

const now = "2026-06-14T12:00:00.000Z";

function section(title: string, description: string, bullets: string[]): SeoLandingPageSection {
  return { title, description, bullets };
}

function toJson<T>(value: T) {
  return JSON.stringify(value);
}

function createPlatformSections(platformName: string, routeLabel: string): SeoLandingPageSection[] {
  return [
    section(`${platformName} introduction`, `${platformName} is a major China marketplace. This landing page explains how overseas buyers can use CNSnap as a ${routeLabel} with purchase support, warehouse QC, and international shipping.`, [
      `Understand how ${platformName} differs from other China marketplaces`,
      "See where shopping-agent support reduces friction",
      "Prepare product links, screenshots, or keywords before ordering"
    ]),
    section("What you can buy", `Buy fashion, home goods, accessories, hobby items, and other eligible products from ${platformName} while keeping QC and parcel flow inside one account.`, [
      "General merchandise",
      "Small-batch sourcing",
      "Seasonal products and campaign goods"
    ]),
    section("How to buy with our shopping agent", "Paste the product link or submit a sourcing request, pay for the item, review warehouse photos, and choose your final international route after parcel intake.", [
      "Paste product link",
      "Confirm specs before payment",
      "Review warehouse photos",
      "Consolidate parcels before export"
    ]),
    section("Supported search methods", "You can search by direct product URL, keyword, image reference, or manual sourcing notes depending on the seller and product type.", [
      "Product URL",
      "Keyword search",
      "DIY sourcing request",
      "Reference screenshots"
    ]),
    section("Fees and shipping", "CNSnap keeps product payment and international shipping as separate stages, making it easier to compare routes after final packing and weighing.", [
      "Service fee transparency",
      "Shipping route comparison",
      "Volumetric-weight explanation"
    ]),
    section("Related guides", "Link this landing page to relevant blog guides so search visitors can move from discovery content into a live service flow without hitting dead ends.", [
      "Buying guides",
      "Shipping estimation guides",
      "Restricted-item notes"
    ]),
    section("CTA to start shopping", "Use the CTA below to open product search or paste a direct URL.", [
      "Start shopping",
      "Submit DIY order if the listing is unclear"
    ])
  ];
}

function createShippingSections(country: string): SeoLandingPageSection[] {
  return [
    section(`Shipping from China to ${country}`, `This landing page explains what international buyers should expect when shipping parcels from China to ${country}, including route planning, customs awareness, and billing logic.`, [
      "Review eligible shipping channels",
      "Estimate parcel timing",
      "Plan around customs and restricted items"
    ]),
    section("Available shipping channels", `Different channels to ${country} can vary by speed, price, parcel sensitivity, and volumetric-weight rules.`, [
      "Economy route options",
      "Priority air options",
      "Sensitive-goods restrictions"
    ]),
    section("Estimated delivery time", `Transit time to ${country} depends on route selection, export queue, customs processing, and last-mile delivery service.`, [
      "Economy timeline overview",
      "Priority route expectations",
      "Delay scenarios"
    ]),
    section("Shipping fee explanation", "Parcel cost usually depends on billed weight, route policy, handling requirements, and any special restrictions the package may trigger.", [
      "Actual weight",
      "Volumetric weight",
      "Line-specific fees"
    ]),
    section("Volumetric weight explanation", "Bulky parcels may be charged by volume rather than physical weight, especially on faster air routes.", [
      "How billed volume is calculated",
      "Why large but light parcels can cost more"
    ]),
    section("Restricted items", `Always confirm route eligibility for batteries, liquids, magnets, branded goods, and other sensitive items before shipping to ${country}.`, [
      "Battery limitations",
      "Liquid restrictions",
      "Brand-risk review"
    ]),
    section("Customs notice", `Customs policy for ${country} can change by parcel value, product category, documentation quality, and local import thresholds.`, [
      "Value declaration awareness",
      "Commercial-use risks",
      "Need for accurate item descriptions"
    ]),
    section("CTA to estimation", "Use the CTA below to estimate route cost before final checkout.", [
      "Open shipping estimator",
      "Compare available channels"
    ])
  ];
}

function createCampaignSections(): SeoLandingPageSection[] {
  return [
    section("Campaign introduction", "This demo campaign landing page shows how a promotion can live inside SEO Center with its own metadata, CTA paths, and robots control.", [
      "Independent promo page management",
      "Optional noindex support",
      "Reusable CTA structure"
    ]),
    section("Exclusive offer", "Showcase a new-user package, wallet bonus, shipping coupon, or referral-driven promotion without coupling it to product pages.", [
      "Coupon value",
      "Eligibility note",
      "Limited-time window"
    ]),
    section("How to use this offer", "Explain how to register, where to apply the offer, and what steps the user should finish before the promotion expires.", [
      "Register account",
      "Meet campaign conditions",
      "Start shopping or recharge"
    ]),
    section("Promotion rules", "Keep the promotion rules explicit so audit checks and operations handoff stay readable in the admin.", [
      "One account per user",
      "Rule exclusions",
      "Expiry conditions"
    ]),
    section("CTA to register and shop", "Drive users into the most relevant next action instead of leaving campaign visitors stranded.", [
      "Register",
      "Start shopping"
    ])
  ];
}

function createFaq(items: Array<[string, string]>): string {
  const faq: SeoFaqItem[] = items.map(([question, answer]) => ({ question, answer }));
  return toJson(faq);
}

function createLandingPage(input: {
  id: string;
  title: string;
  slug: string;
  type: SeoLandingPage["type"];
  path: string;
  heroTitle: string;
  heroSubtitle: string;
  content: string;
  sectionsJson: string;
  faqJson: string;
  ctaText: string;
  ctaHref: string;
  seoTitle: string;
  seoDescription: string;
  ogTitle?: string;
  ogDescription?: string;
}): SeoLandingPage {
  return {
    id: input.id,
    title: input.title,
    slug: input.slug,
    type: input.type,
    path: input.path,
    heroTitle: input.heroTitle,
    heroSubtitle: input.heroSubtitle,
    content: input.content,
    sectionsJson: input.sectionsJson,
    faqJson: input.faqJson,
    ctaText: input.ctaText,
    ctaHref: input.ctaHref,
    status: "published",
    language: "en",
    publishedAt: now,
    createdAt: now,
    updatedAt: now,
    seoTitle: input.seoTitle,
    seoDescription: input.seoDescription,
    canonicalUrl: `https://www.cnsnap.com${input.path}`,
    robots: "index,follow",
    ogTitle: input.ogTitle || input.seoTitle,
    ogDescription: input.ogDescription || input.seoDescription,
    ogImage: "/brand/cnsnap-logo.svg",
    twitterTitle: input.ogTitle || input.seoTitle,
    twitterDescription: input.ogDescription || input.seoDescription,
    twitterImage: "/brand/cnsnap-logo.svg",
    structuredDataJson: ""
  };
}

export const seoLandingPagesMock: SeoLandingPage[] = [
  createLandingPage({
    id: "landing-platform-taobao-agent",
    title: "Taobao Agent Service",
    slug: "taobao-agent",
    type: "platform",
    path: "/platforms/taobao-agent",
    heroTitle: "Taobao agent service for global buyers",
    heroSubtitle: "Buy from Taobao with purchase support, warehouse QC, parcel consolidation, and international shipping in one workflow.",
    content: "<p>Use CNSnap as your Taobao agent when you need local payment, seller communication, warehouse handling, and parcel export from China.</p>",
    sectionsJson: toJson(createPlatformSections("Taobao", "Taobao agent")),
    faqJson: createFaq([
      ["Why use a Taobao agent?", "A Taobao agent helps when sellers do not support overseas payment or international delivery."],
      ["Can I consolidate Taobao orders before shipping?", "Yes. Orders can arrive at the warehouse first and be combined before final export."]
    ]),
    ctaText: "Start shopping on Taobao",
    ctaHref: "/",
    seoTitle: "Taobao Agent Service for International Buyers",
    seoDescription: "Use CNSnap as your Taobao shopping agent with warehouse QC, parcel consolidation, and global shipping."
  }),
  createLandingPage({
    id: "landing-platform-1688-agent",
    title: "1688 Agent Service",
    slug: "1688-agent",
    type: "platform",
    path: "/platforms/1688-agent",
    heroTitle: "1688 buying support for overseas buyers",
    heroSubtitle: "Handle supplier communication, MOQ clarification, warehouse intake, and shipping through one 1688 agent workflow.",
    content: "<p>1688 is built for domestic wholesale, so overseas buyers often need an agent to coordinate payment, communication, and logistics.</p>",
    sectionsJson: toJson(createPlatformSections("1688", "1688 agent")),
    faqJson: createFaq([
      ["Is 1688 suitable for small buyers?", "Some suppliers support lower MOQs, but you should confirm terms before payment."],
      ["Why is an agent useful on 1688?", "An agent helps bridge language, payment, and downstream shipping issues."]
    ]),
    ctaText: "Submit a 1688 request",
    ctaHref: "/diy-order",
    seoTitle: "1688 Agent Service for International Buyers",
    seoDescription: "Buy from 1688 with supplier support, warehouse QC, and global parcel forwarding through CNSnap."
  }),
  createLandingPage({
    id: "landing-platform-tmall-agent",
    title: "Tmall Agent Service",
    slug: "tmall-agent",
    type: "platform",
    path: "/platforms/tmall-agent",
    heroTitle: "Tmall shopping agent from China",
    heroSubtitle: "Order premium marketplace products from Tmall with secure purchasing support and international shipping.",
    content: "<p>Tmall buyers often care about official-brand storefronts, predictable order handling, and safer cross-border support.</p>",
    sectionsJson: toJson(createPlatformSections("Tmall", "Tmall agent")),
    faqJson: createFaq([
      ["Is Tmall different from Taobao?", "Yes. Tmall typically focuses more on branded and official storefronts."],
      ["Can I still use warehouse QC for Tmall orders?", "Yes. The warehouse can inspect and consolidate eligible parcels before export."]
    ]),
    ctaText: "Start shopping on Tmall",
    ctaHref: "/",
    seoTitle: "Tmall Agent Service for Overseas Orders",
    seoDescription: "Buy from Tmall with an agent workflow that covers payment, QC, consolidation, and international shipping."
  }),
  createLandingPage({
    id: "landing-platform-weidian-agent",
    title: "Weidian Agent Service",
    slug: "weidian-agent",
    type: "platform",
    path: "/platforms/weidian-agent",
    heroTitle: "Weidian agent for cross-border buyers",
    heroSubtitle: "Use CNSnap to buy from Weidian when direct overseas checkout is limited or unavailable.",
    content: "<p>Weidian orders often require extra support around seller communication, order confirmation, and route planning.</p>",
    sectionsJson: toJson(createPlatformSections("Weidian", "Weidian agent")),
    faqJson: createFaq([
      ["Can I buy from Weidian outside China?", "Yes, with a shopping-agent workflow that manages payment and logistics for you."],
      ["Does Weidian support normal international checkout?", "Not consistently, which is why agent support is often needed."]
    ]),
    ctaText: "Open Weidian order flow",
    ctaHref: "/",
    seoTitle: "Weidian Agent Service with Warehouse QC",
    seoDescription: "Use CNSnap to place Weidian orders, receive warehouse QC, and ship parcels worldwide."
  }),
  createLandingPage({
    id: "landing-platform-xianyu-agent",
    title: "Xianyu Agent Service",
    slug: "xianyu-agent",
    type: "platform",
    path: "/platforms/xianyu-agent",
    heroTitle: "Xianyu buying agent from China",
    heroSubtitle: "Shop second-hand and unique items from Xianyu with manual support, risk review, and export planning.",
    content: "<p>Xianyu purchases may need more manual confirmation because listings can be second-hand, fast-moving, or seller-specific.</p>",
    sectionsJson: toJson(createPlatformSections("Xianyu", "Xianyu agent")),
    faqJson: createFaq([
      ["Is Xianyu good for rare products?", "Yes, but listing quality and seller reliability should be checked carefully."],
      ["Does Xianyu require more manual review?", "Usually yes, especially for used goods and one-off listings."]
    ]),
    ctaText: "Submit a Xianyu sourcing request",
    ctaHref: "/diy-order",
    seoTitle: "Xianyu Agent Service for Second-Hand China Goods",
    seoDescription: "Use CNSnap to source Xianyu products with manual review, warehouse handling, and international shipping."
  }),
  createLandingPage({
    id: "landing-shipping-germany",
    title: "Shipping from China to Germany",
    slug: "germany",
    type: "shipping_country",
    path: "/shipping-to/germany",
    heroTitle: "Ship parcels from China to Germany with route clarity",
    heroSubtitle: "Review shipping channels, delivery timing, customs notes, and volumetric-weight rules before you pay.",
    content: "<p>This page helps Germany-bound buyers compare options before final parcel checkout.</p>",
    sectionsJson: toJson(createShippingSections("Germany")),
    faqJson: createFaq([
      ["How long does shipping to Germany take?", "Transit time depends on the route, export queue, customs, and last-mile carrier."],
      ["Can bulky parcels cost more than expected?", "Yes. Volumetric-weight billing can raise the fee for large parcels."]
    ]),
    ctaText: "Estimate shipping to Germany",
    ctaHref: "/estimation",
    seoTitle: "Shipping from China to Germany",
    seoDescription: "Compare shipping channels, customs notes, and parcel-fee logic for parcels sent from China to Germany."
  }),
  createLandingPage({
    id: "landing-shipping-france",
    title: "Shipping from China to France",
    slug: "france",
    type: "shipping_country",
    path: "/shipping-to/france",
    heroTitle: "China parcel shipping guide for France",
    heroSubtitle: "Plan routes, estimated timing, customs expectations, and restricted-item checks before dispatch.",
    content: "<p>This page helps France-bound parcels move through route comparison and pre-shipping decision points more clearly.</p>",
    sectionsJson: toJson(createShippingSections("France")),
    faqJson: createFaq([
      ["Do all routes to France support the same products?", "No. Sensitive items and line rules can vary by channel."],
      ["Why should I estimate before checkout?", "It helps you compare cost, timing, and route eligibility before you commit."]
    ]),
    ctaText: "Estimate shipping to France",
    ctaHref: "/estimation",
    seoTitle: "Shipping from China to France",
    seoDescription: "Understand route options, customs considerations, and shipping-fee rules for parcels going from China to France."
  }),
  createLandingPage({
    id: "landing-shipping-netherlands",
    title: "Shipping from China to the Netherlands",
    slug: "netherlands",
    type: "shipping_country",
    path: "/shipping-to/netherlands",
    heroTitle: "Ship from China to the Netherlands with fewer surprises",
    heroSubtitle: "Review route fit, billed weight, customs awareness, and parcel restrictions in one page.",
    content: "<p>This page gives Netherlands-bound buyers a stable route-planning surface inside the SEO Center.</p>",
    sectionsJson: toJson(createShippingSections("the Netherlands")),
    faqJson: createFaq([
      ["What affects shipping cost to the Netherlands?", "Route type, billed weight, special handling, and item restrictions all influence pricing."],
      ["Should I worry about customs paperwork?", "Accurate item descriptions and value awareness are always important for cross-border parcels."]
    ]),
    ctaText: "Estimate shipping to the Netherlands",
    ctaHref: "/estimation",
    seoTitle: "Shipping from China to the Netherlands",
    seoDescription: "Plan parcel shipping from China to the Netherlands with route, customs, and volumetric-weight guidance."
  }),
  createLandingPage({
    id: "landing-shipping-poland",
    title: "Shipping from China to Poland",
    slug: "poland",
    type: "shipping_country",
    path: "/shipping-to/poland",
    heroTitle: "China shipping options for Poland-bound parcels",
    heroSubtitle: "Check available channels, parcel timing, customs notes, and shipping-fee logic before export.",
    content: "<p>This page focuses on the practical steps for shipping from China to Poland through CNSnap workflows.</p>",
    sectionsJson: toJson(createShippingSections("Poland")),
    faqJson: createFaq([
      ["Can I ship sensitive products to Poland?", "It depends on the line and product category, so route checking is essential."],
      ["Does consolidation help?", "It can improve efficiency, but large combined parcels may still be billed by volume."]
    ]),
    ctaText: "Estimate shipping to Poland",
    ctaHref: "/estimation",
    seoTitle: "Shipping from China to Poland",
    seoDescription: "Review parcel shipping routes, customs notes, and billing logic for shipments from China to Poland."
  }),
  createLandingPage({
    id: "landing-shipping-united-states",
    title: "Shipping from China to the United States",
    slug: "united-states",
    type: "shipping_country",
    path: "/shipping-to/united-states",
    heroTitle: "Shipping from China to the United States",
    heroSubtitle: "Compare routes, estimate delivery time, and understand parcel cost before your final shipping payment.",
    content: "<p>This landing page helps United States buyers understand route fit, restrictions, and customs-sensitive considerations in advance.</p>",
    sectionsJson: toJson(createShippingSections("the United States")),
    faqJson: createFaq([
      ["How do I estimate China shipping to the United States?", "Use the estimator after confirming weight, size, and route restrictions."],
      ["Why is volumetric weight important?", "Large but light parcels may be charged by volume rather than physical weight."]
    ]),
    ctaText: "Estimate shipping to the United States",
    ctaHref: "/estimation",
    seoTitle: "Shipping from China to the United States",
    seoDescription: "Compare shipping channels, customs notes, and parcel fee rules for shipments from China to the United States."
  }),
  createLandingPage({
    id: "landing-campaign-demo",
    title: "Demo Campaign Landing Page",
    slug: "demo",
    type: "campaign",
    path: "/campaign/demo",
    heroTitle: "Launch a campaign landing page inside SEO Center",
    heroSubtitle: "Use this demo page to manage promo metadata, FAQ, CTAs, and robots settings without touching the main business flows.",
    content: "<p>This campaign page demonstrates how SEO Center can host promotions with their own structured content and CTA targets.</p>",
    sectionsJson: toJson(createCampaignSections()),
    faqJson: createFaq([
      ["Can campaign pages be noindex?", "Yes. Campaign pages can be published with noindex,follow when needed."],
      ["Should a campaign page have direct CTAs?", "Yes. A promotion page should always guide visitors into a clear next action."]
    ]),
    ctaText: "Register and start shopping",
    ctaHref: "/register",
    seoTitle: "SEO Campaign Landing Page Demo",
    seoDescription: "A demo campaign landing page inside SEO Center with promo messaging, CTAs, FAQ, and flexible robots control."
  })
];

export const seoRedirectsMock: SeoRedirect[] = [
  {
    id: "redirect-taobao-buying-guide",
    fromPath: "/taobao-buying-guide",
    toPath: "/platforms/taobao-agent",
    statusCode: 301,
    enabled: true,
    hitCount: 128,
    lastHitAt: "2026-06-14T11:42:00.000Z",
    createdAt: now,
    updatedAt: now
  },
  {
    id: "redirect-1688-guide",
    fromPath: "/buy-from-1688",
    toPath: "/platforms/1688-agent",
    statusCode: 301,
    enabled: true,
    hitCount: 76,
    lastHitAt: "2026-06-14T10:18:00.000Z",
    createdAt: now,
    updatedAt: now
  },
  {
    id: "redirect-germany-shipping",
    fromPath: "/shipping-germany",
    toPath: "/shipping-to/germany",
    statusCode: 302,
    enabled: false,
    hitCount: 14,
    lastHitAt: "2026-06-10T08:30:00.000Z",
    createdAt: now,
    updatedAt: now
  },
  {
    id: "redirect-promo-demo",
    fromPath: "/promo/demo",
    toPath: "/campaign/demo",
    statusCode: 301,
    enabled: true,
    hitCount: 33,
    lastHitAt: "2026-06-13T13:55:00.000Z",
    createdAt: now,
    updatedAt: now
  }
];
