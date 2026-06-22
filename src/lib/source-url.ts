export function isSourceUrl(value: string) {
  return /^https?:\/\//i.test(value.trim());
}

export function detectPlatformFromUrl(value: string) {
  const lowered = value.toLowerCase();
  if (lowered.includes("tmall.com")) return "tmall";
  if (lowered.includes("1688.com")) return "1688";
  if (lowered.includes("jd.com")) return "jd";
  if (lowered.includes("weidian.com")) return "weidian";
  if (lowered.includes("vip.com")) return "vip";
  if (lowered.includes("xianyu") || lowered.includes("goofish")) return "xianyu";
  return "taobao";
}

function encodeReadableSourceUrl(sourceUrl: string) {
  return encodeURIComponent(sourceUrl)
    .replace(/%3A/gi, ":")
    .replace(/%2F/gi, "/")
    .replace(/%3F/gi, "?")
    .replace(/%3D/gi, "=");
}

export function buildBuyUrl(sourceUrl: string, locale = "en") {
  return `/${locale}/product/buy?from=search-input&url=${encodeReadableSourceUrl(sourceUrl)}`;
}

export function buildSearchBuyUrl(sourceUrl: string, itemId?: string) {
  const id = itemId || extractSourceItemId(sourceUrl);
  const tag = id ? `pc.cn.search.${id}` : "pc.cn.search";
  const params = new URLSearchParams({
    url: sourceUrl,
    htag: tag,
    nTag: tag
  });
  return `/cn/product/buy/?${params.toString()}`;
}

export function extractSourceItemId(input: string) {
  try {
    const url = new URL(input);
    return url.searchParams.get("id") || url.searchParams.get("itemID") || url.pathname.split("/").filter(Boolean).pop() || "";
  } catch {
    return input.match(/[A-Za-z0-9]{4,}/)?.[0] ?? "";
  }
}
