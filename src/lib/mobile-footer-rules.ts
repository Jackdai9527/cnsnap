function stripLocalePrefix(pathname: string) {
  const normalized = pathname.replace(/\/+$/, "") || "/";
  return normalized.replace(/^\/[a-z]{2}(?:-[A-Z]{2})?(?=\/|$)/, "") || "/";
}

export function normalizeMobileBusinessPath(pathname: string) {
  const base = pathname.split("?")[0]?.split("#")[0] ?? "/";
  return stripLocalePrefix(base || "/");
}

export function shouldHideFooterOnMobilePath(pathname: string) {
  const normalized = normalizeMobileBusinessPath(pathname);

  if (normalized === "/login" || normalized === "/register") return true;
  if (normalized === "/search" || normalized.startsWith("/search/")) return true;
  if (normalized === "/product/buy" || normalized.startsWith("/product/buy/")) return true;
  if (normalized === "/cart" || normalized.startsWith("/cart/")) return true;
  if (normalized === "/checkout" || normalized.startsWith("/checkout/")) return true;
  if (normalized === "/orders" || normalized.startsWith("/orders/")) return true;
  if (normalized === "/account" || normalized.startsWith("/account/")) return true;

  return false;
}
