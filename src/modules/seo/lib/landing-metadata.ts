import type { Metadata } from "next";
import { getHreflangAlternates } from "@/modules/seo/lib/hreflang";
import { getSeoLandingPagePath } from "@/modules/seo/lib/locale-routing";
import { getSeoLandingPageTranslations, getSeoSettingsFromStore } from "@/modules/seo/lib/article-store";
import { createBreadcrumbSchema, createFAQSchema, createWebPageSchema, parseFaqJson } from "@/modules/seo/lib/structured-data";
import type { SeoLandingPageRecord } from "@/modules/seo/types";

function absoluteUrl(baseUrl: string, pathname: string) {
  const normalizedBase = baseUrl.replace(/\/+$/, "");
  return pathname === "/" ? normalizedBase : `${normalizedBase}${pathname}`;
}

function toRobots(robots: SeoLandingPageRecord["robots"]) {
  return robots === "index,follow"
    ? { index: true, follow: true }
    : robots === "noindex,follow"
      ? { index: false, follow: true }
      : { index: false, follow: false };
}

export async function createLandingPageMetadata(
  page: SeoLandingPageRecord,
  options?: { canonicalPathname?: string; requestedLocale?: SeoLandingPageRecord["language"] }
): Promise<Metadata> {
  const settings = await getSeoSettingsFromStore();
  const canonical = absoluteUrl(
    settings.canonicalBaseUrl,
    options?.canonicalPathname || getSeoLandingPagePath(page, page.language as never)
  );
  const title = page.seoTitle || page.heroTitle || page.title;
  const description = page.seoDescription || page.heroSubtitle || page.content.replace(/<[^>]+>/g, " ").trim();
  const alternates = getHreflangAlternates({
    type: "landing",
    entity: page,
    siblings: await getSeoLandingPageTranslations(page.translationGroupId),
    baseUrl: settings.canonicalBaseUrl
  });

  return {
    title: settings.titleTemplate.replace("%s", title),
    description,
    alternates: {
      canonical,
      ...(alternates ?? {}),
      ...(options?.requestedLocale
        ? {
            languages: {
              ...(alternates?.languages ?? {}),
              [options.requestedLocale]: canonical
            }
          }
        : {})
    },
    robots: toRobots(page.robots),
    openGraph: {
      title: page.ogTitle || title,
      description: page.ogDescription || description,
      url: canonical,
      images: [absoluteUrl(settings.canonicalBaseUrl, page.ogImage || settings.defaultOgImage)]
    },
    twitter: {
      card: "summary_large_image",
      title: page.twitterTitle || page.ogTitle || title,
      description: page.twitterDescription || page.ogDescription || description,
      images: [absoluteUrl(settings.canonicalBaseUrl, page.twitterImage || page.ogImage || settings.defaultTwitterImage)]
    }
  };
}

export async function createLandingPageStructuredData(page: SeoLandingPageRecord, options?: { canonicalPathname?: string; rootPathname?: string }) {
  const settings = await getSeoSettingsFromStore();
  const canonical = absoluteUrl(
    settings.canonicalBaseUrl,
    options?.canonicalPathname || getSeoLandingPagePath(page, page.language as never)
  );
  const schemas: Record<string, unknown>[] = [
    createWebPageSchema({
      name: page.seoTitle || page.heroTitle || page.title,
      url: canonical,
      description: page.seoDescription || page.heroSubtitle || undefined
    }),
    createBreadcrumbSchema(createLandingBreadcrumbs(settings.canonicalBaseUrl, page, options))
  ];
  const faq = parseFaqJson(page.faqJson);

  if (faq.length) {
    schemas.push(createFAQSchema(faq));
  }

  return schemas;
}

function createLandingBreadcrumbs(
  baseUrl: string,
  page: SeoLandingPageRecord,
  options?: { canonicalPathname?: string; rootPathname?: string }
) {
  const rootPath = options?.rootPathname || "/en";
  const canonicalPath = options?.canonicalPathname || getSeoLandingPagePath(page, page.language as never);
  const rootUrl = absoluteUrl(baseUrl, rootPath);
  const items = [{ name: "Home", url: rootUrl }];

  if (page.type === "platform") {
    items.push({ name: "Platforms", url: absoluteUrl(baseUrl, canonicalPath.replace(/\/[^/]+$/, "")) });
  }

  if (page.type === "shipping_country") {
    items.push({ name: "Shipping To", url: absoluteUrl(baseUrl, canonicalPath.replace(/\/[^/]+$/, "")) });
  }

  if (page.type === "campaign") {
    items.push({ name: "Campaign", url: absoluteUrl(baseUrl, canonicalPath.replace(/\/[^/]+$/, "")) });
  }

  items.push({ name: page.title, url: absoluteUrl(baseUrl, canonicalPath) });
  return items;
}
