import type { MetadataRoute } from "next";
import { isBuildTimeRuntime } from "@/lib/build-runtime";
import { getSeoIndexPolicy } from "@/modules/seo/lib/index-policy";
import { getPublishedSeoArticles, getPublishedSeoLandingPages, getSeoSettingsFromStore, getSeoArticleTranslations, getSeoLandingPageTranslations } from "@/modules/seo/lib/article-store";
import { ensureHelpArticleDescriptions } from "@/lib/content-localization";
import { getEnabledSeoLocalesRuntime } from "@/lib/i18n/locale-config-store";
import { getSeoArticlePath, getSeoLandingPagePath, getSeoStaticLocalizedPaths } from "@/modules/seo/lib/locale-routing";
import { seoSettingsMock } from "@/modules/seo/mock/data";
import { getSeoLocaleByAppLocale, isSeoLocale } from "../../../../config/i18n";
import { prisma } from "@/lib/db";
import { getHelpCenterData } from "@/lib/help-center-service";

export async function getSitemapEntries() {
  const enabledSeoLocales = await getEnabledSeoLocalesRuntime();
  const [baseEntries, articles, landingPages, helpArticleDescriptions, helpCategoryEntries] = await Promise.all([
    Promise.resolve(
      getSeoStaticLocalizedPaths()
        .filter(({ locale, path }) => {
          if (!enabledSeoLocales.includes(locale as never)) return false;
          const stripped = path.replace(/^\/[a-z]{2}(?:-[A-Z]{2})?/, "") || "/";
          return getSeoIndexPolicy(stripped).includeInSitemap;
        })
        .map(({ locale, path }) => ({
          id: `static-${locale}-${path}`,
          path,
          changeFrequency: "weekly" as const,
          priority: path === `/${locale}` ? 1 : 0.8,
          lastModified: new Date().toISOString(),
          enabled: true,
          sourceType: "service" as const,
          sourceId: `static-${locale}-${path}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }))
    ),
    getPublishedSeoArticles(),
    getPublishedSeoLandingPages(),
    getPublishedHelpArticleDescriptions(enabledSeoLocales),
    getPublishedHelpCategoryEntries(enabledSeoLocales)
  ]);

  const articleEntries = articles
    .filter((article) => article.includeInSitemap && article.robots === "index,follow")
    .map((article) => ({
      id: `article-${article.id}`,
      path: getSeoArticlePath(article, article.language as never),
      changeFrequency: "weekly" as const,
      priority: 0.7,
      lastModified: article.updatedAt,
      enabled: true,
      sourceType: "manual" as const,
      sourceId: article.id,
      createdAt: article.createdAt,
      updatedAt: article.updatedAt
    }));

  const landingEntries = landingPages
    .filter((page) => page.includeInSitemap && page.robots === "index,follow")
    .map((page) => ({
      id: `landing-${page.id}`,
      path: getSeoLandingPagePath(page, page.language as never),
      changeFrequency: "weekly" as const,
      priority: page.type === "campaign" ? 0.6 : 0.75,
      lastModified: page.updatedAt,
      enabled: true,
      sourceType: "manual" as const,
      sourceId: page.id,
      createdAt: page.createdAt,
      updatedAt: page.updatedAt
    }));

  const articleTranslations = (await Promise.all(
    articles.map((article) => getSeoArticleTranslations(article.translationGroupId))
  ))
    .flat()
    .filter((article, index, list) => {
      const publicLocale = isSeoLocale(article.language) ? article.language : getSeoLocaleByAppLocale(article.language);
      if (!publicLocale || !enabledSeoLocales.includes(publicLocale as never)) return false;
      if (!article.includeInSitemap || article.robots !== "index,follow") return false;
      return list.findIndex((item) => `${item.translationGroupId}:${item.language}` === `${article.translationGroupId}:${article.language}`) === index;
    })
    .map((article) => {
      const publicLocale = (isSeoLocale(article.language) ? article.language : getSeoLocaleByAppLocale(article.language)) as never;
      return {
        id: `article-${article.id}-${publicLocale}`,
        path: getSeoArticlePath(article, publicLocale),
        changeFrequency: "weekly" as const,
        priority: 0.7,
        lastModified: article.updatedAt,
        enabled: true,
        sourceType: "manual" as const,
        sourceId: article.id,
        createdAt: article.createdAt,
        updatedAt: article.updatedAt
      };
    });

  const landingTranslations = (await Promise.all(
    landingPages.map((page) => getSeoLandingPageTranslations(page.translationGroupId))
  ))
    .flat()
    .filter((page, index, list) => {
      const publicLocale = isSeoLocale(page.language) ? page.language : getSeoLocaleByAppLocale(page.language);
      if (!publicLocale || !enabledSeoLocales.includes(publicLocale as never)) return false;
      if (!page.includeInSitemap || page.robots !== "index,follow") return false;
      return list.findIndex((item) => `${item.translationGroupId}:${item.language}` === `${page.translationGroupId}:${page.language}`) === index;
    })
    .map((page) => {
      const publicLocale = (isSeoLocale(page.language) ? page.language : getSeoLocaleByAppLocale(page.language)) as never;
      return {
        id: `landing-${page.id}-${publicLocale}`,
        path: getSeoLandingPagePath(page, publicLocale),
        changeFrequency: "weekly" as const,
        priority: page.type === "campaign" ? 0.6 : 0.75,
        lastModified: page.updatedAt,
        enabled: true,
        sourceType: "manual" as const,
        sourceId: page.id,
        createdAt: page.createdAt,
        updatedAt: page.updatedAt
      };
    });

  return [...baseEntries, ...articleTranslations, ...landingTranslations, ...helpArticleDescriptions, ...helpCategoryEntries];
}

async function getPublishedHelpArticleDescriptions(enabledSeoLocales: string[]) {
  if (isBuildTimeRuntime()) return [];
  await ensureHelpArticleDescriptions();
  const items = await prisma.helpArticleDescription.findMany({
    where: {
      translationStatus: "published",
      robots: "index,follow",
      helpArticle: {
        isPublished: true
      }
    },
    include: {
      helpArticle: true
    },
    orderBy: { updatedAt: "desc" }
  });

  return items.flatMap((item) => {
    const publicLocale = isSeoLocale(item.languageCode) ? item.languageCode : getSeoLocaleByAppLocale(item.languageCode);
    if (!publicLocale || !enabledSeoLocales.includes(publicLocale as never)) return [];
    const path = `/${publicLocale}/help/${item.slug}`;
    if (!getSeoIndexPolicy(path).includeInSitemap) return [];

    return [{
      id: `help-article-${item.id}-${publicLocale}`,
      path,
      changeFrequency: "weekly" as const,
      priority: 0.65,
      lastModified: item.updatedAt.toISOString(),
      enabled: true,
      sourceType: "manual" as const,
      sourceId: `help-article-${item.helpArticleId}`,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString()
    }];
  });
}

async function getPublishedHelpCategoryEntries(enabledSeoLocales: string[]) {
  if (isBuildTimeRuntime()) return [];
  const entries = await Promise.all(
    enabledSeoLocales.map(async (locale) => {
      const data = await getHelpCenterData(locale);
      return data.categories
        .filter((category) => category.slug && category.articleCount > 0)
        .flatMap((category) => {
          const path = `/${locale}/help/category/${category.slug}`;
          if (!getSeoIndexPolicy(path).includeInSitemap) return [];
          return [{
            id: `help-category-${locale}-${category.slug}`,
            path,
            changeFrequency: "weekly" as const,
            priority: 0.6,
            lastModified: new Date().toISOString(),
            enabled: true,
            sourceType: "manual" as const,
            sourceId: `help-category-${category.id}`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }];
        });
    })
  );

  return entries.flat();
}

export async function createSitemap(): Promise<MetadataRoute.Sitemap> {
  const [entries, settings] = await Promise.all([getSitemapEntries(), getSeoSettingsFromStore().catch(() => seoSettingsMock)]);
  const baseUrl = settings.canonicalBaseUrl.replace(/\/+$/, "");

  return entries.map((entry) => ({
    url: entry.path === "/" ? baseUrl : `${baseUrl}${entry.path}`,
    lastModified: entry.lastModified,
    changeFrequency: entry.changeFrequency,
    priority: entry.priority
  }));
}
