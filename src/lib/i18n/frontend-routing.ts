import {
  frontendUiLocales,
  getSeoLocaleByAppLocale,
  isFrontendLocale,
  isSeoLocale,
  type FrontendLocale,
  type SeoLocale
} from "../../../config/i18n";
import {
  getSeoArticlePath,
  getSeoLandingPagePath,
  isSeoPathname,
  stripSeoLocale
} from "@/modules/seo/lib/locale-routing";
import type { SeoArticleRecord, SeoLandingPageRecord } from "@/modules/seo/types";

const FRONTEND_UI_LOCALE_SET = new Set<string>(frontendUiLocales);

const nonSeoLocalizedPrefixes = [
  "/login",
  "/register",
  "/cart",
  "/checkout",
  "/search",
  "/product/buy",
  "/page/buy"
] as const;

function normalizePathname(pathname: string) {
  const basePath = pathname.split("?")[0]?.split("#")[0] ?? "/";
  const normalized = basePath.replace(/\/+$/, "");
  return normalized || "/";
}

function withSearch(pathname: string, search?: string) {
  if (!search) return pathname;
  return `${pathname}${search.startsWith("?") ? search : `?${search}`}`;
}

export function isNonSeoLocalizedPath(pathname: string) {
  const normalized = normalizePathname(pathname);
  const firstSegment = normalized.split("/").filter(Boolean)[0];

  if (!FRONTEND_UI_LOCALE_SET.has(firstSegment ?? "")) {
    return nonSeoLocalizedPrefixes.some((prefix) => normalized === prefix || normalized.startsWith(`${prefix}/`));
  }

  const strippedPath = normalized.replace(new RegExp(`^/${firstSegment}(?=/|$)`), "") || "/";
  return nonSeoLocalizedPrefixes.some((prefix) => strippedPath === prefix || strippedPath.startsWith(`${prefix}/`));
}

export function stripFrontendUiLocale(pathname: string) {
  const normalized = normalizePathname(pathname);
  const segments = normalized.split("/").filter(Boolean);
  const locale = segments[0];

  if (isFrontendLocale(locale)) {
    const remaining = segments.slice(1).join("/");
    return {
      locale,
      pathname: remaining ? `/${remaining}` : "/"
    } as const;
  }

  return {
    locale: undefined,
    pathname: normalized
  } as const;
}

export function localizeUiPathname(pathname: string, locale: FrontendLocale) {
  return localizeUiPathnameForPublicLocale(pathname, locale);
}

export function localizeUiPathnameForPublicLocale(pathname: string, locale: FrontendLocale, publicLocale?: string) {
  const normalized = normalizePathname(pathname);
  const effectiveSeoLocale = publicLocale && isSeoLocale(publicLocale)
    ? publicLocale
    : getSeoLocaleByAppLocale(locale);

  if (isSeoPathname(normalized)) {
    return effectiveSeoLocale
      ? `/${effectiveSeoLocale}${stripSeoLocale(normalized).pathname === "/" ? "" : stripSeoLocale(normalized).pathname}`
      : stripSeoLocale(normalized).pathname;
  }

  if (isNonSeoLocalizedPath(normalized)) {
    const stripped = stripFrontendUiLocale(normalized).pathname;
    const localePrefix = effectiveSeoLocale || locale;
    return `/${localePrefix}${stripped === "/" ? "" : stripped}`;
  }

  return normalized;
}

export function buildLocalizedUiHref(pathname: string, locale: FrontendLocale, search?: string, publicLocale?: string) {
  return withSearch(localizeUiPathnameForPublicLocale(pathname, locale, publicLocale), search);
}

export function buildSeoLocalePathFromContext(input: {
  pathname: string;
  locale: SeoLocale;
  article?: SeoArticleRecord | null;
  landingPage?: SeoLandingPageRecord | null;
}) {
  const normalized = normalizePathname(input.pathname);

  if (input.article) {
    return getSeoArticlePath(input.article, input.locale);
  }

  if (input.landingPage) {
    return getSeoLandingPagePath(input.landingPage, input.locale);
  }

  const stripped = stripSeoLocale(normalized).pathname;
  return `/${input.locale}${stripped === "/" ? "" : stripped}`;
}
