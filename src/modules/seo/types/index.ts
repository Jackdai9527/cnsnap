import type { Metadata } from "next";

export const seoPageTypes = [
  "service",
  "help_article",
  "blog",
  "landing",
  "search",
  "temporary_product",
  "cart",
  "checkout",
  "account",
  "admin",
  "api",
  "system",
  "unknown"
] as const;

export type SeoPageType = (typeof seoPageTypes)[number];

export type SeoPageStatus =
  | "Good"
  | "Missing Title"
  | "Missing Description"
  | "Noindex"
  | "Disabled"
  | "Locked Noindex";

export type SeoRobotsValue = "index,follow" | "noindex,follow" | "noindex,nofollow";

export type SeoIndexPolicy = {
  pageType: SeoPageType;
  robots: SeoRobotsValue;
  allowIndex: boolean;
  allowFollow: boolean;
  includeInSitemap: boolean;
  allowStructuredData: boolean;
  allowProductSchema: boolean;
  allowCanonicalSelf: boolean;
  reason?: string;
};

export type SeoSettings = {
  id: string;
  siteName: string;
  defaultTitle: string;
  titleTemplate: string;
  defaultDescription: string;
  defaultOgImage: string;
  defaultTwitterImage: string;
  defaultRobots: SeoRobotsValue;
  canonicalBaseUrl: string;
  googleSiteVerification: string;
  googleAnalyticsId: string;
  googleTagManagerId: string;
  createdAt: string;
  updatedAt: string;
};

export const seoArticleStatuses = ["draft", "published", "scheduled", "archived"] as const;
export type SeoArticleStatus = (typeof seoArticleStatuses)[number];

export const seoLandingPageTypes = ["platform", "shipping_country", "campaign", "service", "custom"] as const;
export type SeoLandingPageType = (typeof seoLandingPageTypes)[number];

export const seoLandingPageStatuses = ["draft", "published", "archived"] as const;
export type SeoLandingPageStatus = (typeof seoLandingPageStatuses)[number];

export const seoRedirectStatusCodes = [301, 302] as const;
export type SeoRedirectStatusCode = (typeof seoRedirectStatusCodes)[number];

export const seoAuditSeverities = ["error", "warning", "notice"] as const;
export type SeoAuditSeverity = (typeof seoAuditSeverities)[number];

export const seoArticleCtaTypes = [
  "start_shopping",
  "estimate_shipping",
  "submit_diy_order",
  "use_forwarding",
  "open_ticket",
  "register",
  "none"
] as const;
export type SeoArticleCtaType = (typeof seoArticleCtaTypes)[number];

export type SeoPageMeta = {
  id: string;
  path: string;
  pageType: SeoPageType;
  title: string;
  description: string;
  canonicalUrl?: string;
  robots?: SeoRobotsValue;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  structuredDataJson?: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
};

export type SeoRobotsRule = {
  id: string;
  pathPattern: string;
  ruleType: "allow" | "disallow";
  userAgent: string;
  enabled: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type SeoSitemapEntry = {
  id: string;
  path: string;
  changeFrequency: "daily" | "weekly" | "monthly";
  priority: number;
  lastModified: string;
  enabled: boolean;
  sourceType: "service" | "manual";
  sourceId: string;
  createdAt: string;
  updatedAt: string;
};

export type SeoArticleCategory = {
  id: string;
  name: string;
  slug: string;
  localizedSlug?: string;
  description: string;
  seoTitle?: string;
  seoDescription?: string;
  language?: string;
  translationGroupId?: string;
  sourceLanguage?: string;
  translatedFromId?: string;
  sortOrder: number;
  status: "active" | "disabled";
  createdAt: string;
  updatedAt: string;
};

export type SeoArticleTag = {
  id: string;
  name: string;
  slug: string;
  description: string;
  createdAt: string;
  updatedAt: string;
};

export type SeoArticleTagRelation = {
  id: string;
  articleId: string;
  tagId: string;
};

export type SeoFaqItem = {
  question: string;
  answer: string;
};

export type SeoRelatedLink = {
  label: string;
  href: string;
  description?: string;
};

export type SeoArticle = {
  id: string;
  title: string;
  slug: string;
  localizedSlug?: string;
  excerpt: string;
  content: string;
  coverImage?: string;
  categoryId: string;
  authorId?: string;
  status: SeoArticleStatus;
  language: string;
  translationGroupId?: string;
  sourceLanguage?: string;
  translatedFromId?: string;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  seoTitle?: string;
  seoDescription?: string;
  canonicalUrl?: string;
  robots: SeoRobotsValue;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  readingTime?: number;
  tableOfContents?: string;
  faqJson?: string;
  structuredDataJson?: string;
  relatedArticleIds?: string[];
  relatedLinksJson?: string;
  ctaType: SeoArticleCtaType;
};

export type SeoArticleRecord = SeoArticle & {
  category: SeoArticleCategory | null;
  tags: SeoArticleTag[];
  tagIds: string[];
  authorName: string;
  includeInSitemap: boolean;
};

export type SeoLandingPageSection = {
  title: string;
  description: string;
  bullets?: string[];
};

export type SeoLandingPage = {
  id: string;
  title: string;
  slug: string;
  localizedPath?: string;
  type: SeoLandingPageType;
  path: string;
  heroTitle: string;
  heroSubtitle?: string;
  content: string;
  sectionsJson?: string;
  faqJson?: string;
  ctaText?: string;
  ctaHref?: string;
  status: SeoLandingPageStatus;
  language: string;
  translationGroupId?: string;
  sourceLanguage?: string;
  translatedFromId?: string;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  seoTitle?: string;
  seoDescription?: string;
  canonicalUrl?: string;
  robots: SeoRobotsValue;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  structuredDataJson?: string;
};

export type SeoLandingPageRecord = SeoLandingPage & {
  includeInSitemap: boolean;
  faqCount: number;
  sectionCount: number;
};

export type SeoRedirect = {
  id: string;
  fromPath: string;
  toPath: string;
  statusCode: SeoRedirectStatusCode;
  enabled: boolean;
  hitCount: number;
  lastHitAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type SeoAuditIssue = {
  id: string;
  severity: SeoAuditSeverity;
  area: "page" | "article" | "landing_page" | "redirect";
  rule:
    | "missing_seo_title"
    | "missing_meta_description"
    | "title_too_long"
    | "description_too_long"
    | "missing_canonical"
    | "noindex_warning"
    | "missing_faq"
    | "missing_cta"
    | "missing_og_image"
    | "duplicate_slug"
    | "duplicate_title"
    | "sitemap_noindex_conflict"
    | "redirect_chain"
    | "redirect_loop"
    | "broken_internal_links";
  entityId: string;
  entityLabel: string;
  path?: string;
  message: string;
  recommendation?: string;
  createdAt: string;
};

export type SeoArticleStore = {
  settings: SeoSettings;
  pageMetas: SeoPageMeta[];
  robotsRules: SeoRobotsRule[];
  sitemapEntries: SeoSitemapEntry[];
  articleCategories: SeoArticleCategory[];
  articleTags: SeoArticleTag[];
  articles: SeoArticle[];
  articleTagRelations: SeoArticleTagRelation[];
  landingPages: SeoLandingPage[];
  redirects: SeoRedirect[];
};

export type SeoArticleFormValues = {
  id?: string;
  title: string;
  slug: string;
  localizedSlug?: string;
  excerpt: string;
  content: string;
  coverImage: string;
  categoryId: string;
  tagIds: string[];
  status: SeoArticleStatus;
  language: string;
  translationGroupId?: string;
  sourceLanguage?: string;
  translatedFromId?: string;
  publishedAt: string;
  seoTitle: string;
  seoDescription: string;
  canonicalUrl: string;
  robots: SeoRobotsValue;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  twitterTitle: string;
  twitterDescription: string;
  twitterImage: string;
  faqJson: string;
  relatedArticleIds: string[];
  relatedLinksJson: string;
  ctaType: SeoArticleCtaType;
};

export type SeoPageRecord = SeoPageMeta & {
  indexPolicy: SeoIndexPolicy;
  includeInSitemap: boolean;
  lockedNoindex: boolean;
  status: SeoPageStatus;
};

export type SeoLandingPageFormValues = {
  id?: string;
  title: string;
  slug: string;
  localizedPath?: string;
  type: SeoLandingPageType;
  path: string;
  heroTitle: string;
  heroSubtitle: string;
  content: string;
  sectionsJson: string;
  faqJson: string;
  ctaText: string;
  ctaHref: string;
  status: SeoLandingPageStatus;
  language: string;
  translationGroupId?: string;
  sourceLanguage?: string;
  translatedFromId?: string;
  publishedAt: string;
  seoTitle: string;
  seoDescription: string;
  canonicalUrl: string;
  robots: SeoRobotsValue;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  twitterTitle: string;
  twitterDescription: string;
  twitterImage: string;
  structuredDataJson: string;
};

export type SeoRedirectFormValues = {
  id?: string;
  fromPath: string;
  toPath: string;
  statusCode: SeoRedirectStatusCode;
  enabled: boolean;
};

export type ResolvedSeoMeta = {
  page: SeoPageMeta | null;
  policy: SeoIndexPolicy;
  metadata: Metadata;
  structuredData: Record<string, unknown>[];
};

export type CreatePageMetadataInput = {
  pathname: string;
  title?: string;
  description?: string;
  canonicalUrl?: string;
  robots?: SeoRobotsValue;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  structuredData?: Record<string, unknown>[];
};
