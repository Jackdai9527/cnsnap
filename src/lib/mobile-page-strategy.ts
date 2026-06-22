export type MobilePageStrategy = "seo_content_parity" | "app_rebuild_allowed";

const SEO_CONTENT_PARITY_PATHS = [
  "/",
  "/blog",
  "/help",
  "/platforms",
  "/shipping-to",
  "/campaign",
  "/estimation",
  "/promotion",
  "/diy-order",
  "/forwarding"
] as const;

const APP_REBUILD_ALLOWED_PATHS = [
  "/search",
  "/product/buy",
  "/cart",
  "/checkout",
  "/account",
  "/orders"
] as const;

function normalizePathname(pathname: string) {
  const basePath = pathname.split("?")[0]?.split("#")[0] ?? "/";
  const normalized = basePath.replace(/\/+$/, "");
  return normalized || "/";
}

function stripLocalePrefix(pathname: string) {
  const normalized = normalizePathname(pathname);
  return normalized.replace(/^\/[a-z]{2}(?:-[A-Z]{2})?(?=\/|$)/, "") || "/";
}

export function getMobilePageStrategy(pathname: string): MobilePageStrategy {
  const normalized = stripLocalePrefix(pathname);

  if (APP_REBUILD_ALLOWED_PATHS.some((prefix) => normalized === prefix || normalized.startsWith(`${prefix}/`))) {
    return "app_rebuild_allowed";
  }

  if (SEO_CONTENT_PARITY_PATHS.some((prefix) => normalized === prefix || normalized.startsWith(`${prefix}/`))) {
    return "seo_content_parity";
  }

  return "app_rebuild_allowed";
}
