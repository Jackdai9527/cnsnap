import { getSeoIndexPolicy } from "@/modules/seo/lib/index-policy";
import { getSeoArticles, getSeoLandingPages, getSeoRedirects } from "@/modules/seo/lib/article-store";
import { getSeoAuditSummary } from "@/modules/seo/lib/audit";
import { seoCorePageMetasMock, seoRobotsRulesMock, seoSettingsMock, seoSitemapEntriesMock } from "@/modules/seo/mock/data";
import type { SeoPageMeta, SeoPageRecord, SeoPageStatus } from "@/modules/seo/types";

export async function getSeoPages(): Promise<SeoPageRecord[]> {
  return seoCorePageMetasMock.map((page) => {
    const policy = getSeoIndexPolicy(page.path);
    const lockedNoindex = !policy.allowIndex;
    const status = getSeoPageStatus(page, lockedNoindex);

    return {
      ...page,
      indexPolicy: policy,
      includeInSitemap: policy.includeInSitemap,
      lockedNoindex,
      status
    };
  });
}

function getSeoPageStatus(page: SeoPageMeta, lockedNoindex: boolean): SeoPageStatus {
  if (!page.enabled) return "Disabled";
  if (lockedNoindex) return "Locked Noindex";
  if (!page.title.trim()) return "Missing Title";
  if (!page.description.trim()) return "Missing Description";
  if (page.robots && page.robots !== "index,follow") return "Noindex";
  return "Good";
}

export async function getSeoDashboardSummary() {
  const [pages, articles, landingPages, redirects, auditSummary] = await Promise.all([
    getSeoPages(),
    getSeoArticles(),
    getSeoLandingPages(),
    getSeoRedirects(),
    getSeoAuditSummary()
  ]);
  const lastUpdated = pages.reduce((latest, page) => (page.updatedAt > latest ? page.updatedAt : latest), seoSettingsMock.updatedAt);
  const articleLastUpdated = articles.reduce((latest, article) => (article.updatedAt > latest ? article.updatedAt : latest), lastUpdated);
  const landingLastUpdated = landingPages.reduce((latest, page) => (page.updatedAt > latest ? page.updatedAt : latest), articleLastUpdated);
  const redirectLastUpdated = redirects.reduce((latest, redirect) => (redirect.updatedAt > latest ? redirect.updatedAt : latest), landingLastUpdated);

  return {
    indexedPages: pages.filter((page) => page.indexPolicy.allowIndex && page.enabled).length,
    noindexPages: pages.filter((page) => !page.indexPolicy.allowIndex || page.robots !== "index,follow").length,
    pagesMissingTitle: pages.filter((page) => !page.title.trim()).length,
    pagesMissingDescription: pages.filter((page) => !page.description.trim()).length,
    sitemapUrls: seoSitemapEntriesMock.filter((entry) => entry.enabled).length + articles.filter((article) => article.includeInSitemap).length,
    robotsDisallowRules: seoRobotsRulesMock.filter((rule) => rule.enabled && rule.ruleType === "disallow").length,
    temporaryProductPagesNoindex: 1,
    searchPagesNoindex: 1,
    publishedArticles: articles.filter((article) => article.status === "published").length,
    draftArticles: articles.filter((article) => article.status === "draft").length,
    scheduledArticles: articles.filter((article) => article.status === "scheduled").length,
    archivedArticles: articles.filter((article) => article.status === "archived").length,
    articlesMissingSeoTitle: articles.filter((article) => !(article.seoTitle || "").trim()).length,
    articlesMissingMetaDescription: articles.filter((article) => !(article.seoDescription || "").trim()).length,
    articlesWithoutFaq: articles.filter((article) => !(article.faqJson || "").trim()).length,
    articlesWithoutCta: articles.filter((article) => article.ctaType === "none").length,
    publishedLandingPages: landingPages.filter((page) => page.status === "published").length,
    draftLandingPages: landingPages.filter((page) => page.status === "draft").length,
    archivedLandingPages: landingPages.filter((page) => page.status === "archived").length,
    platformLandingPages: landingPages.filter((page) => page.type === "platform").length,
    shippingCountryLandingPages: landingPages.filter((page) => page.type === "shipping_country").length,
    campaignLandingPages: landingPages.filter((page) => page.type === "campaign").length,
    landingPagesMissingFaq: landingPages.filter((page) => !(page.faqJson || "").trim()).length,
    landingPagesMissingCta: landingPages.filter((page) => !(page.ctaText || "").trim() || !(page.ctaHref || "").trim()).length,
    redirectRules: redirects.length,
    enabledRedirects: redirects.filter((redirect) => redirect.enabled).length,
    disabledRedirects: redirects.filter((redirect) => !redirect.enabled).length,
    redirectHits: redirects.reduce((sum, redirect) => sum + redirect.hitCount, 0),
    seoErrors: auditSummary.errors,
    seoWarnings: auditSummary.warnings,
    seoNotices: auditSummary.notices,
    missingTitles: auditSummary.missingTitles,
    missingDescriptions: auditSummary.missingDescriptions,
    sitemapConflicts: auditSummary.sitemapConflicts,
    latestPublishedArticles: articles.filter((article) => article.status === "published").slice(0, 5).map((article) => ({
      id: article.id,
      title: article.title,
      slug: article.slug,
      publishedAt: article.publishedAt,
      category: article.category?.name || "General"
    })),
    latestLandingPages: landingPages.slice(0, 5).map((page) => ({
      id: page.id,
      title: page.title,
      path: page.path,
      type: page.type,
      status: page.status,
      updatedAt: page.updatedAt
    })),
    latestRedirectRules: redirects.slice(0, 5).map((redirect) => ({
      id: redirect.id,
      fromPath: redirect.fromPath,
      toPath: redirect.toPath,
      statusCode: redirect.statusCode,
      enabled: redirect.enabled,
      hitCount: redirect.hitCount
    })),
    latestSeoIssues: auditSummary.latestIssues,
    lastUpdated: redirectLastUpdated
  };
}

export async function getSeoSettingsSnapshot() {
  return seoSettingsMock;
}

export async function getSeoSitemapRobotsSnapshot() {
  return {
    robotsRules: seoRobotsRulesMock,
    sitemapEntries: seoSitemapEntriesMock
  };
}
