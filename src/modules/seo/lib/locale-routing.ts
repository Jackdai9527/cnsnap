import { defaultLocale, getEnabledSeoLocales, isSeoLocale, type SeoLocale } from "../../../../config/i18n";
import type { SeoArticleRecord, SeoLandingPageRecord } from "@/modules/seo/types";

export const seoStaticPaths = [
  "/",
  "/estimation",
  "/promotion",
  "/diy-order",
  "/forwarding",
  "/help",
  "/blog"
] as const;

export function withSeoLocale(locale: SeoLocale, pathname: string) {
  const normalizedPath = pathname === "/" ? "" : pathname.replace(/\/+$/, "");
  return normalizedPath ? `/${locale}${normalizedPath}` : `/${locale}`;
}

export function stripSeoLocale(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);
  const locale = segments[0];

  if (isSeoLocale(locale)) {
    const remaining = segments.slice(1).join("/");
    return {
      locale,
      pathname: remaining ? `/${remaining}` : "/"
    } as const;
  }

  return {
    locale: defaultLocale,
    pathname
  } as const;
}

export function isSeoPathname(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);
  if (isSeoLocale(segments[0])) return true;
  return seoStaticPaths.includes((pathname === "/" ? "/" : pathname.replace(/\/+$/, "")) as (typeof seoStaticPaths)[number]);
}

export function getSeoArticlePath(article: SeoArticleRecord, locale: SeoLocale) {
  const slug = article.localizedSlug || article.slug;
  return withSeoLocale(locale, `/blog/${slug}`);
}

export function getSeoLandingPagePath(page: SeoLandingPageRecord, locale: SeoLocale) {
  return withSeoLocale(locale, page.localizedPath || page.path);
}

export function getSeoStaticLocalizedPaths() {
  const locales = getEnabledSeoLocales().filter((locale): locale is SeoLocale => isSeoLocale(locale));
  return locales.flatMap((locale) =>
    seoStaticPaths.map((path) => ({
      locale,
      path: withSeoLocale(locale, path)
    }))
  );
}
