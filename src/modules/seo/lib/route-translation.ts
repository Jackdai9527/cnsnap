import type { FrontendLocale, SeoLocale } from "../../../../config/i18n";
import { getSeoLocaleByAppLocale, isSeoLocale } from "../../../../config/i18n";
import { localizeUiPathname } from "@/lib/i18n/frontend-routing";
import {
  getSeoArticleForLocale,
  getSeoLandingPageByPath,
  getSeoLandingPageForLocale
} from "@/modules/seo/lib/article-store";
import { getSeoArticlePath, getSeoLandingPagePath, isSeoPathname, stripSeoLocale } from "@/modules/seo/lib/locale-routing";

type ResolvedRoute = {
  pathname: string;
  fallback: boolean;
};

function normalizePathname(pathname: string) {
  const basePath = pathname.split("?")[0]?.split("#")[0] ?? "/";
  const normalized = basePath.replace(/\/+$/, "");
  return normalized || "/";
}

function detectLandingType(pathname: string) {
  if (pathname.startsWith("/platforms/")) return "platform" as const;
  if (pathname.startsWith("/shipping-to/")) return "shipping_country" as const;
  if (pathname.startsWith("/campaign/")) return "campaign" as const;
  return null;
}

export async function resolveLocalizedRoute(pathname: string, locale: FrontendLocale): Promise<ResolvedRoute> {
  const normalized = normalizePathname(pathname);
  const seoLocale = getSeoLocaleByAppLocale(locale);

  if (!isSeoPathname(normalized) || !seoLocale) {
    return {
      pathname: localizeUiPathname(normalized, locale),
      fallback: false
    };
  }

  const stripped = stripSeoLocale(normalized).pathname;

  if (stripped === "/blog") {
    return {
      pathname: `/${seoLocale}/blog`,
      fallback: false
    };
  }

  if (stripped.startsWith("/blog/")) {
    const slug = stripped.slice("/blog/".length);
    const resolved = await getSeoArticleForLocale(slug, seoLocale as SeoLocale);

    if (!resolved) {
      return {
        pathname: `/${seoLocale}${stripped}`,
        fallback: false
      };
    }

    if (resolved.fallback) {
      return {
        pathname: `/${seoLocale}/blog/${slug}`,
        fallback: true
      };
    }

    return {
      pathname: getSeoArticlePath(resolved.article, resolved.article.language as SeoLocale),
      fallback: resolved.fallback
    };
  }

  const landingType = detectLandingType(stripped);
  if (landingType) {
    const segment = stripped.split("/").filter(Boolean).at(-1);
    if (segment) {
      const resolved = await getSeoLandingPageForLocale(landingType, segment, seoLocale as SeoLocale);
      if (resolved) {
        if (resolved.fallback) {
          return {
            pathname: `/${seoLocale}${stripped}`,
            fallback: true
          };
        }

        return {
          pathname: getSeoLandingPagePath(resolved.page, resolved.page.language as SeoLocale),
          fallback: resolved.fallback
        };
      }
    }
  }

  const landingByPath = await getSeoLandingPageByPath(stripped);
  if (landingByPath) {
    const localized = await getSeoLandingPageForLocale(landingByPath.type, landingByPath.slug, seoLocale as SeoLocale);
    if (localized) {
      if (localized.fallback) {
        return {
          pathname: `/${seoLocale}${stripped}`,
          fallback: true
        };
      }

      return {
        pathname: getSeoLandingPagePath(localized.page, localized.page.language as SeoLocale),
        fallback: localized.fallback
      };
    }
  }

  return {
    pathname: `/${seoLocale}${stripped === "/" ? "" : stripped}`,
    fallback: false
  };
}
