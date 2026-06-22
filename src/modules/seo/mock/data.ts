import type { SeoPageMeta, SeoRobotsRule, SeoSettings, SeoSitemapEntry } from "@/modules/seo/types";

const now = "2026-06-14T12:00:00.000Z";

export const seoSettingsMock: SeoSettings = {
  id: "seo-settings-1",
  siteName: "CNSnap",
  defaultTitle: "CNSnap China Purchasing Agent",
  titleTemplate: "%s | CNSnap",
  defaultDescription: "China purchasing agent service for Taobao, 1688, Weidian, parcel forwarding, and DIY sourcing.",
  defaultOgImage: "/brand/cnsnap-logo.svg",
  defaultTwitterImage: "/brand/cnsnap-logo.svg",
  defaultRobots: "index,follow",
  canonicalBaseUrl: "https://www.cnsnap.com",
  googleSiteVerification: "",
  googleAnalyticsId: "",
  googleTagManagerId: "",
  createdAt: now,
  updatedAt: now
};

export const seoCorePageMetasMock: SeoPageMeta[] = [
  {
    id: "seo-page-home",
    path: "/",
    pageType: "service",
    title: "China Purchasing Agent for Taobao, 1688 and Weidian",
    description: "Buy from Chinese marketplaces with warehouse QC, parcel consolidation, and global shipping support.",
    canonicalUrl: "https://www.cnsnap.com/",
    robots: "index,follow",
    ogTitle: "China Purchasing Agent for Taobao, 1688 and Weidian",
    ogDescription: "Paste a product link, place a DIY order, and ship parcels worldwide with CNSnap.",
    ogImage: "/brand/cnsnap-logo.svg",
    twitterTitle: "China Purchasing Agent for Taobao, 1688 and Weidian",
    twitterDescription: "Paste a product link, place a DIY order, and ship parcels worldwide with CNSnap.",
    twitterImage: "/brand/cnsnap-logo.svg",
    structuredDataJson: "",
    enabled: true,
    createdAt: now,
    updatedAt: now
  },
  {
    id: "seo-page-estimation",
    path: "/estimation",
    pageType: "service",
    title: "Shipping Estimation Calculator",
    description: "Estimate parcel fees, compare routes, and understand volumetric weight before you buy.",
    canonicalUrl: "https://www.cnsnap.com/estimation",
    robots: "index,follow",
    ogTitle: "Shipping Estimation Calculator",
    ogDescription: "Compare shipping channels and forecast parcel costs before checkout.",
    ogImage: "/brand/cnsnap-logo.svg",
    twitterTitle: "Shipping Estimation Calculator",
    twitterDescription: "Compare shipping channels and forecast parcel costs before checkout.",
    twitterImage: "/brand/cnsnap-logo.svg",
    structuredDataJson: "",
    enabled: true,
    createdAt: now,
    updatedAt: now
  },
  {
    id: "seo-page-promotion",
    path: "/promotion",
    pageType: "service",
    title: "Promotions, Coupons and Affiliate Rewards",
    description: "See new-user offers, recharge bonuses, shipping coupons, and affiliate rewards from CNSnap.",
    canonicalUrl: "https://www.cnsnap.com/promotion",
    robots: "index,follow",
    ogTitle: "Promotions, Coupons and Affiliate Rewards",
    ogDescription: "Browse limited campaigns, shipping coupons, and wallet recharge bonuses.",
    ogImage: "/brand/cnsnap-logo.svg",
    twitterTitle: "Promotions, Coupons and Affiliate Rewards",
    twitterDescription: "Browse limited campaigns, shipping coupons, and wallet recharge bonuses.",
    twitterImage: "/brand/cnsnap-logo.svg",
    structuredDataJson: "",
    enabled: true,
    createdAt: now,
    updatedAt: now
  },
  {
    id: "seo-page-diy",
    path: "/diy-order",
    pageType: "service",
    title: "DIY Order and Manual Sourcing Service",
    description: "Submit custom sourcing requests when you cannot find the item yourself.",
    canonicalUrl: "https://www.cnsnap.com/diy-order",
    robots: "index,follow",
    ogTitle: "DIY Order and Manual Sourcing Service",
    ogDescription: "Ask our team to source hard-to-find products and confirm custom purchasing details.",
    ogImage: "/brand/cnsnap-logo.svg",
    twitterTitle: "DIY Order and Manual Sourcing Service",
    twitterDescription: "Ask our team to source hard-to-find products and confirm custom purchasing details.",
    twitterImage: "/brand/cnsnap-logo.svg",
    structuredDataJson: "",
    enabled: true,
    createdAt: now,
    updatedAt: now
  },
  {
    id: "seo-page-forwarding",
    path: "/forwarding",
    pageType: "service",
    title: "Parcel Forwarding From China Warehouse",
    description: "Forward parcels from China with warehouse intake, consolidation, and global shipping support.",
    canonicalUrl: "https://www.cnsnap.com/forwarding",
    robots: "index,follow",
    ogTitle: "Parcel Forwarding From China Warehouse",
    ogDescription: "Ship parcels already bought in China through CNSnap warehouse and forwarding workflows.",
    ogImage: "/brand/cnsnap-logo.svg",
    twitterTitle: "Parcel Forwarding From China Warehouse",
    twitterDescription: "Ship parcels already bought in China through CNSnap warehouse and forwarding workflows.",
    twitterImage: "/brand/cnsnap-logo.svg",
    structuredDataJson: "",
    enabled: true,
    createdAt: now,
    updatedAt: now
  },
  {
    id: "seo-page-help",
    path: "/help",
    pageType: "service",
    title: "Help Center and Purchasing Guide",
    description: "Read guides for shopping, payment, shipping, forwarding, and support workflows.",
    canonicalUrl: "https://www.cnsnap.com/help",
    robots: "index,follow",
    ogTitle: "Help Center and Purchasing Guide",
    ogDescription: "Learn how CNSnap handles search, purchasing, warehouse processing, and international delivery.",
    ogImage: "/brand/cnsnap-logo.svg",
    twitterTitle: "Help Center and Purchasing Guide",
    twitterDescription: "Learn how CNSnap handles search, purchasing, warehouse processing, and international delivery.",
    twitterImage: "/brand/cnsnap-logo.svg",
    structuredDataJson: "",
    enabled: true,
    createdAt: now,
    updatedAt: now
  }
];

export const seoRobotsRulesMock: SeoRobotsRule[] = [
  {
    id: "robots-admin",
    pathPattern: "/admin",
    ruleType: "disallow",
    userAgent: "*",
    enabled: true,
    sortOrder: 10,
    createdAt: now,
    updatedAt: now
  },
  {
    id: "robots-admin-trailing",
    pathPattern: "/admin/",
    ruleType: "disallow",
    userAgent: "*",
    enabled: true,
    sortOrder: 20,
    createdAt: now,
    updatedAt: now
  },
  {
    id: "robots-api",
    pathPattern: "/api",
    ruleType: "disallow",
    userAgent: "*",
    enabled: true,
    sortOrder: 30,
    createdAt: now,
    updatedAt: now
  },
  {
    id: "robots-api-trailing",
    pathPattern: "/api/",
    ruleType: "disallow",
    userAgent: "*",
    enabled: true,
    sortOrder: 40,
    createdAt: now,
    updatedAt: now
  },
  {
    id: "robots-checkout",
    pathPattern: "/checkout",
    ruleType: "disallow",
    userAgent: "*",
    enabled: true,
    sortOrder: 50,
    createdAt: now,
    updatedAt: now
  },
  {
    id: "robots-cart",
    pathPattern: "/cart",
    ruleType: "disallow",
    userAgent: "*",
    enabled: true,
    sortOrder: 60,
    createdAt: now,
    updatedAt: now
  }
];

export const seoSitemapEntriesMock: SeoSitemapEntry[] = [
  { id: "sitemap-home", path: "/", changeFrequency: "daily", priority: 1, lastModified: now, enabled: true, sourceType: "service", sourceId: "seo-page-home", createdAt: now, updatedAt: now },
  { id: "sitemap-estimation", path: "/estimation", changeFrequency: "weekly", priority: 0.8, lastModified: now, enabled: true, sourceType: "service", sourceId: "seo-page-estimation", createdAt: now, updatedAt: now },
  { id: "sitemap-promotion", path: "/promotion", changeFrequency: "weekly", priority: 0.8, lastModified: now, enabled: true, sourceType: "service", sourceId: "seo-page-promotion", createdAt: now, updatedAt: now },
  { id: "sitemap-diy", path: "/diy-order", changeFrequency: "weekly", priority: 0.8, lastModified: now, enabled: true, sourceType: "service", sourceId: "seo-page-diy", createdAt: now, updatedAt: now },
  { id: "sitemap-forwarding", path: "/forwarding", changeFrequency: "weekly", priority: 0.8, lastModified: now, enabled: true, sourceType: "service", sourceId: "seo-page-forwarding", createdAt: now, updatedAt: now },
  { id: "sitemap-help", path: "/help", changeFrequency: "weekly", priority: 0.8, lastModified: now, enabled: true, sourceType: "service", sourceId: "seo-page-help", createdAt: now, updatedAt: now }
];
