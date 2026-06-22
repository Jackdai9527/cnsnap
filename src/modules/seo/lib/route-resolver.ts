import type { SeoLocale, FrontendLocale } from "../../../../config/i18n";
import { getSeoLocaleByAppLocale, isSeoLocale } from "../../../../config/i18n";
import { localizeUiPathnameForPublicLocale } from "@/lib/i18n/frontend-routing";
import { getSeoArticlePath, getSeoLandingPagePath, isSeoPathname, stripSeoLocale } from "@/modules/seo/lib/locale-routing";
import type { SeoArticleRecord, SeoLandingPageRecord } from "@/modules/seo/types";

type ResolveFrontendHrefInput = {
  pathname: string;
  locale: FrontendLocale;
  search?: string;
  article?: SeoArticleRecord | null;
  landingPage?: SeoLandingPageRecord | null;
};

function withSearch(pathname: string, search?: string) {
  if (!search) return pathname;
  return `${pathname}${search.startsWith("?") ? search : `?${search}`}`;
}

export function resolveFrontendHrefForLocale(input: ResolveFrontendHrefInput) {
  const seoLocale = getSeoLocaleByAppLocale(input.locale);

  if (input.article && seoLocale) {
    return withSearch(getSeoArticlePath(input.article, seoLocale), input.search);
  }

  if (input.landingPage && seoLocale) {
    return withSearch(getSeoLandingPagePath(input.landingPage, seoLocale), input.search);
  }

  if (isSeoPathname(input.pathname)) {
    const stripped = stripSeoLocale(input.pathname).pathname;
    if (seoLocale) {
      return withSearch(`/${seoLocale}${stripped === "/" ? "" : stripped}`, input.search);
    }

    return withSearch(stripped, input.search);
  }

  return withSearch(localizeUiPathnameForPublicLocale(input.pathname, input.locale, seoLocale || undefined), input.search);
}

export function getCanonicalPathname(pathname: string, locale?: SeoLocale) {
  if (!locale) return pathname;
  const stripped = stripSeoLocale(pathname).pathname;
  return `/${locale}${stripped === "/" ? "" : stripped}`;
}
