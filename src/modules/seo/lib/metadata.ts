import type { Metadata } from "next";
import { getEnabledSeoLocales, getSeoLocaleByAppLocale } from "../../../../config/i18n";
import { getCanonicalForPath } from "@/modules/seo/lib/canonical";
import { getSeoIndexPolicy, normalizeSeoPath } from "@/modules/seo/lib/index-policy";
import { withSeoLocale } from "@/modules/seo/lib/locale-routing";
import { getSeoRouteAlternates } from "@/modules/seo/lib/request-locale";
import { getCanonicalPathname } from "@/modules/seo/lib/route-resolver";
import { seoCorePageMetasMock, seoSettingsMock } from "@/modules/seo/mock/data";
import { createRobotsMetadata } from "@/modules/seo/lib/robots";
import { createOrganizationSchema, createWebPageSchema, createWebsiteSchema } from "@/modules/seo/lib/structured-data";
import type { CreatePageMetadataInput, ResolvedSeoMeta, SeoPageMeta, SeoRobotsValue, SeoSettings } from "@/modules/seo/types";

function normalizeTitle(title: string | undefined, settings: SeoSettings) {
  if (!title) return settings.defaultTitle;
  return settings.titleTemplate.includes("%s") ? settings.titleTemplate.replace("%s", title) : title;
}

function normalizeAbsoluteUrl(url: string | undefined, settings: SeoSettings) {
  if (!url) return undefined;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${settings.canonicalBaseUrl.replace(/\/+$/, "")}${url.startsWith("/") ? url : `/${url}`}`;
}

export async function getSeoSettings() {
  return seoSettingsMock;
}

export async function getSeoMetaByPath(pathname: string) {
  const normalized = normalizeSeoPath(pathname);
  return seoCorePageMetasMock.find((item) => item.path === normalized) ?? null;
}

export function mergeSeoWithDefaults(page: Partial<SeoPageMeta> | null, settings: SeoSettings) {
  const title = normalizeTitle(page?.title, settings);
  const description = page?.description || settings.defaultDescription;
  const canonicalUrl = page?.canonicalUrl || undefined;
  const robots = page?.robots || settings.defaultRobots;
  const ogTitle = page?.ogTitle || title;
  const ogDescription = page?.ogDescription || description;
  const ogImage = normalizeAbsoluteUrl(page?.ogImage || settings.defaultOgImage, settings);
  const twitterTitle = page?.twitterTitle || ogTitle;
  const twitterDescription = page?.twitterDescription || ogDescription;
  const twitterImage = normalizeAbsoluteUrl(page?.twitterImage || settings.defaultTwitterImage, settings);

  return {
    title,
    description,
    canonicalUrl,
    robots,
    ogTitle,
    ogDescription,
    ogImage,
    twitterTitle,
    twitterDescription,
    twitterImage
  };
}

export function createPageMetadata(input: CreatePageMetadataInput, settings = seoSettingsMock): Metadata {
  const title = normalizeTitle(input.title, settings);
  const description = input.description || settings.defaultDescription;

  return {
    title,
    description,
    alternates: input.canonicalUrl
      ? {
          canonical: input.canonicalUrl
        }
      : undefined,
    robots: createRobotsMetadata({
      pageType: "service",
      robots: input.robots || settings.defaultRobots,
      allowIndex: (input.robots || settings.defaultRobots) === "index,follow",
      allowFollow: input.robots !== "noindex,nofollow",
      includeInSitemap: true,
      allowStructuredData: true,
      allowProductSchema: false,
      allowCanonicalSelf: true
    }),
    openGraph: {
      title: input.ogTitle || title,
      description: input.ogDescription || description,
      images: input.ogImage ? [normalizeAbsoluteUrl(input.ogImage, settings)!] : undefined
    },
    twitter: {
      card: "summary_large_image",
      title: input.twitterTitle || input.ogTitle || title,
      description: input.twitterDescription || input.ogDescription || description,
      images: input.twitterImage ? [normalizeAbsoluteUrl(input.twitterImage, settings)!] : undefined
    }
  };
}

export function createNoIndexMetadata(reasonTitle: string, description: string): Metadata {
  return {
    title: reasonTitle,
    description,
    robots: {
      index: false,
      follow: false
    }
  };
}

export async function createMetadataFromIndexPolicy(pathname: string, fallback?: Partial<SeoPageMeta>): Promise<ResolvedSeoMeta> {
  const normalizedPath = normalizeSeoPath(pathname);
  const [settings, storedPage] = await Promise.all([getSeoSettings(), getSeoMetaByPath(normalizedPath)]);
  const policy = getSeoIndexPolicy(pathname);
  const page = storedPage
    ? ({
        ...storedPage,
        ...(fallback ?? {})
      } as SeoPageMeta)
    : (fallback ? ({ ...fallback, path: normalizedPath, pageType: policy.pageType, enabled: true } as SeoPageMeta) : null);
  const merged = mergeSeoWithDefaults(page, settings);

  let robots: SeoRobotsValue = merged.robots as SeoRobotsValue;
  if (!policy.allowIndex) {
    robots = policy.pageType === "search" ? "noindex,follow" : "noindex,nofollow";
  }
  if (policy.pageType === "temporary_product") {
    robots = "noindex,nofollow";
  }
  if (policy.pageType === "search") {
    robots = "noindex,follow";
  }

  const routeAlternates = await getSeoRouteAlternates(pathname);
  const canonicalPath = routeAlternates?.locale
    ? getCanonicalPathname(pathname, routeAlternates.locale)
    : pathname === "/"
      ? "/en"
      : pathname;
  const canonical = getCanonicalForPath(canonicalPath, settings.canonicalBaseUrl);
  const alternateStrippedPath = routeAlternates?.strippedPathname || (pathname === "/" ? "/" : normalizeSeoPath(pathname));
  const serviceAlternates = policy.pageType === "service" && robots === "index,follow"
    ? {
        languages: Object.fromEntries(
          getEnabledSeoLocales().map((locale) => [
            locale,
            `${settings.canonicalBaseUrl.replace(/\/+$/, "")}${withSeoLocale(locale as never, alternateStrippedPath)}`
          ])
        )
      }
    : undefined;
  const metadata = createPageMetadata(
    {
      pathname,
      title: page?.title,
      description: page?.description,
      canonicalUrl: canonical,
      robots,
      ogTitle: page?.ogTitle,
      ogDescription: page?.ogDescription,
      ogImage: page?.ogImage || settings.defaultOgImage,
      twitterTitle: page?.twitterTitle,
      twitterDescription: page?.twitterDescription,
      twitterImage: page?.twitterImage || settings.defaultTwitterImage
    },
    settings
  );

  const structuredData = policy.allowStructuredData
    ? [
        createOrganizationSchema({
          name: settings.siteName,
          url: settings.canonicalBaseUrl,
          logo: normalizeAbsoluteUrl(settings.defaultOgImage, settings)
        }),
        createWebsiteSchema({
          name: settings.siteName,
          url: settings.canonicalBaseUrl
        }),
        createWebPageSchema({
          name: page?.title || settings.defaultTitle,
          url: canonical || settings.canonicalBaseUrl,
          description: page?.description || settings.defaultDescription
        })
      ]
    : [];

  return {
    page,
    policy: {
      ...policy,
      robots,
      allowIndex: robots === "index,follow",
      allowFollow: robots !== "noindex,nofollow"
    },
    metadata: {
      ...metadata,
      alternates: canonical
        ? {
            canonical,
            ...(serviceAlternates ? {
              languages: {
                ...serviceAlternates.languages,
                "x-default": `${settings.canonicalBaseUrl.replace(/\/+$/, "")}${withSeoLocale("en", alternateStrippedPath)}`
              }
            } : {})
          }
        : undefined
    },
    structuredData
  };
}
