import type { Metadata } from "next";
import { getSeoLocaleByAppLocale, isSeoLocale } from "../../../../config/i18n";
import { getSeoArticlePath, getSeoLandingPagePath } from "@/modules/seo/lib/locale-routing";
import type { SeoArticleRecord, SeoLandingPageRecord } from "@/modules/seo/types";

type HreflangEntity =
  | {
      type: "article";
      entity: SeoArticleRecord;
      siblings: SeoArticleRecord[];
      baseUrl: string;
    }
  | {
      type: "landing";
      entity: SeoLandingPageRecord;
      siblings: SeoLandingPageRecord[];
      baseUrl: string;
    };

function absoluteUrl(baseUrl: string, pathname: string) {
  const normalizedBase = baseUrl.replace(/\/+$/, "");
  return pathname === "/" ? normalizedBase : `${normalizedBase}${pathname}`;
}

function isPublishedIndexable(item: { status: string; robots: string; language: string }) {
  return item.status === "published" && item.robots === "index,follow";
}

function resolvePublicSeoLocale(language: string) {
  if (isSeoLocale(language)) return language;
  return getSeoLocaleByAppLocale(language) ?? undefined;
}

export function createAlternatesLanguages(input: HreflangEntity) {
  if (input.type === "article") {
    const eligible = input.siblings.filter(isPublishedIndexable);
    return Object.fromEntries(
      eligible.flatMap((item) => {
        const locale = resolvePublicSeoLocale(item.language);
        if (!locale) return [];
        return [[locale, absoluteUrl(input.baseUrl, getSeoArticlePath(item, locale))] as const];
      })
    );
  }

  const eligible = input.siblings.filter(isPublishedIndexable);
  return Object.fromEntries(
    eligible.flatMap((item) => {
      const locale = resolvePublicSeoLocale(item.language);
      if (!locale) return [];
      return [[locale, absoluteUrl(input.baseUrl, getSeoLandingPagePath(item, locale))] as const];
    })
  );
}

export function getXDefaultUrl(input: HreflangEntity) {
  if (input.type === "article") {
    const englishVersion = input.siblings.find((item) => item.language === "en" && isPublishedIndexable(item));
    return englishVersion ? absoluteUrl(input.baseUrl, getSeoArticlePath(englishVersion, "en")) : undefined;
  }

  const englishVersion = input.siblings.find((item) => item.language === "en" && isPublishedIndexable(item));
  return englishVersion ? absoluteUrl(input.baseUrl, getSeoLandingPagePath(englishVersion, "en")) : undefined;
}

export function getHreflangAlternates(input: HreflangEntity): Metadata["alternates"] | undefined {
  if (!isPublishedIndexable(input.entity)) {
    return undefined;
  }

  const languages = createAlternatesLanguages(input);
  const xDefault = getXDefaultUrl(input);

  return {
    languages: {
      ...languages,
      ...(xDefault ? { "x-default": xDefault } : {})
    }
  };
}
