import type { SeoIndexPolicy, SeoPageType } from "@/modules/seo/types";

const SERVICE_PATHS = new Set(["/", "/estimation", "/promotion", "/diy-order", "/forwarding", "/help"]);

function normalizePathname(pathname: string) {
  const basePath = pathname.split("?")[0]?.split("#")[0] ?? "/";
  const normalized = basePath.replace(/\/+$/, "");
  return normalized || "/";
}

function stripLocalePrefix(pathname: string) {
  const normalized = normalizePathname(pathname);
  return normalized.replace(/^\/[a-z]{2}(?:-[A-Z]{2})?(?=\/|$)/, "") || "/";
}

function isPathMatch(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function getSeoPageType(pathname: string): SeoPageType {
  const normalized = stripLocalePrefix(pathname);

  if (normalized.startsWith("/help/") && normalized !== "/help") return "help_article";
  if (SERVICE_PATHS.has(normalized)) return "service";
  if (normalized === "/search" || normalized.startsWith("/search/")) return "search";
  if (normalized === "/cart" || normalized.startsWith("/cart/")) return "cart";
  if (
    normalized === "/checkout" ||
    normalized.startsWith("/checkout/") ||
    normalized === "/order-success" ||
    normalized === "/order-failed" ||
    isPathMatch(normalized, "/payment") ||
    isPathMatch(normalized, "/pay")
  ) {
    return "checkout";
  }
  if (normalized === "/account" || normalized.startsWith("/account/")) return "account";
  if (normalized === "/admin" || normalized.startsWith("/admin/")) {
    return "admin";
  }
  if (normalized === "/api" || normalized.startsWith("/api/")) return "api";
  if (
    isPathMatch(normalized, "/product") ||
    isPathMatch(normalized, "/product/buy") ||
    isPathMatch(normalized, "/item") ||
    isPathMatch(normalized, "/products/temp") ||
    isPathMatch(normalized, "/p") ||
    isPathMatch(normalized, "/page/buy")
  ) {
    return "temporary_product";
  }

  return "unknown";
}

const POLICY_MAP: Record<SeoPageType, SeoIndexPolicy> = {
  service: {
    pageType: "service",
    robots: "index,follow",
    allowIndex: true,
    allowFollow: true,
    includeInSitemap: true,
    allowStructuredData: true,
    allowProductSchema: false,
    allowCanonicalSelf: true
  },
  help_article: {
    pageType: "help_article",
    robots: "index,follow",
    allowIndex: true,
    allowFollow: true,
    includeInSitemap: true,
    allowStructuredData: true,
    allowProductSchema: false,
    allowCanonicalSelf: true
  },
  blog: {
    pageType: "blog",
    robots: "index,follow",
    allowIndex: true,
    allowFollow: true,
    includeInSitemap: true,
    allowStructuredData: true,
    allowProductSchema: false,
    allowCanonicalSelf: true
  },
  landing: {
    pageType: "landing",
    robots: "index,follow",
    allowIndex: true,
    allowFollow: true,
    includeInSitemap: true,
    allowStructuredData: true,
    allowProductSchema: false,
    allowCanonicalSelf: true
  },
  search: {
    pageType: "search",
    robots: "noindex,follow",
    allowIndex: false,
    allowFollow: true,
    includeInSitemap: false,
    allowStructuredData: false,
    allowProductSchema: false,
    allowCanonicalSelf: false,
    reason: "Search result pages create many parameter URLs and should not be indexed."
  },
  temporary_product: {
    pageType: "temporary_product",
    robots: "noindex,nofollow",
    allowIndex: false,
    allowFollow: false,
    includeInSitemap: false,
    allowStructuredData: false,
    allowProductSchema: false,
    allowCanonicalSelf: false,
    reason: "Product pages are generated from third-party platform links and content quality is not controlled."
  },
  cart: {
    pageType: "cart",
    robots: "noindex,nofollow",
    allowIndex: false,
    allowFollow: false,
    includeInSitemap: false,
    allowStructuredData: false,
    allowProductSchema: false,
    allowCanonicalSelf: false
  },
  checkout: {
    pageType: "checkout",
    robots: "noindex,nofollow",
    allowIndex: false,
    allowFollow: false,
    includeInSitemap: false,
    allowStructuredData: false,
    allowProductSchema: false,
    allowCanonicalSelf: false
  },
  account: {
    pageType: "account",
    robots: "noindex,nofollow",
    allowIndex: false,
    allowFollow: false,
    includeInSitemap: false,
    allowStructuredData: false,
    allowProductSchema: false,
    allowCanonicalSelf: false
  },
  admin: {
    pageType: "admin",
    robots: "noindex,nofollow",
    allowIndex: false,
    allowFollow: false,
    includeInSitemap: false,
    allowStructuredData: false,
    allowProductSchema: false,
    allowCanonicalSelf: false
  },
  api: {
    pageType: "api",
    robots: "noindex,nofollow",
    allowIndex: false,
    allowFollow: false,
    includeInSitemap: false,
    allowStructuredData: false,
    allowProductSchema: false,
    allowCanonicalSelf: false
  },
  system: {
    pageType: "system",
    robots: "noindex,nofollow",
    allowIndex: false,
    allowFollow: false,
    includeInSitemap: false,
    allowStructuredData: false,
    allowProductSchema: false,
    allowCanonicalSelf: false
  },
  unknown: {
    pageType: "unknown",
    robots: "noindex,nofollow",
    allowIndex: false,
    allowFollow: false,
    includeInSitemap: false,
    allowStructuredData: false,
    allowProductSchema: false,
    allowCanonicalSelf: false,
    reason: "Unknown pages should not be indexed by default until explicitly configured."
  }
};

export function getSeoIndexPolicy(pathname: string): SeoIndexPolicy {
  const pageType = getSeoPageType(pathname);
  return POLICY_MAP[pageType];
}

export function isSeoPageLocked(pathname: string) {
  return !getSeoIndexPolicy(pathname).allowIndex;
}

export function normalizeSeoPath(pathname: string) {
  return stripLocalePrefix(pathname);
}
