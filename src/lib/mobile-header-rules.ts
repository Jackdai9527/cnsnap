import { normalizeMobileBusinessPath } from "@/lib/mobile-footer-rules";

export function shouldShowMobileSearchHeader(pathname: string) {
  const normalized = normalizeMobileBusinessPath(pathname);

  if (normalized === "/") return true;
  if (normalized === "/product/buy" || normalized.startsWith("/product/buy/")) return true;

  return false;
}
