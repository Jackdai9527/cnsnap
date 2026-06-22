import { getSeoIndexPolicy } from "@/modules/seo/lib/index-policy";

function normalizeCanonicalPath(pathname: string) {
  const basePath = pathname.split("?")[0]?.split("#")[0] ?? "/";
  const normalized = basePath.replace(/\/+$/, "");
  return normalized || "/";
}

export function buildCanonicalUrl(pathname: string, baseUrl: string) {
  const normalizedPath = normalizeCanonicalPath(pathname);
  const normalizedBase = baseUrl.replace(/\/+$/, "");
  return normalizedPath === "/" ? normalizedBase : `${normalizedBase}${normalizedPath}`;
}

export function getCanonicalForPath(pathname: string, baseUrl: string, canonicalUrl?: string) {
  const policy = getSeoIndexPolicy(pathname);
  if (!policy.allowCanonicalSelf) return undefined;
  return canonicalUrl || buildCanonicalUrl(pathname, baseUrl);
}
