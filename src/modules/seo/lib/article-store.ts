import { cache } from "react";
import { unstable_noStore as noStore } from "next/cache";
import { isBuildTimeRuntime } from "@/lib/build-runtime";
import { prisma } from "@/lib/db";
import { getAppLocaleBySeoLocale, isSeoLocale, type SeoLocale } from "../../../../config/i18n";
import { stripSeoLocale } from "@/modules/seo/lib/locale-routing";
import { ensureSeoDatabaseSeeded } from "@/modules/seo/lib/db-sync";
import { seoArticleCategoriesMock, seoArticleTagRelationsMock, seoArticleTagsMock } from "@/modules/seo/mock/articles";
import { seoRedirectsMock } from "@/modules/seo/mock/landing-pages";
import { seoCorePageMetasMock, seoRobotsRulesMock, seoSettingsMock, seoSitemapEntriesMock } from "@/modules/seo/mock/data";
import type {
  SeoArticle,
  SeoArticleCategory,
  SeoArticleFormValues,
  SeoArticleRecord,
  SeoArticleStore,
  SeoArticleTag,
  SeoLandingPage,
  SeoLandingPageFormValues,
  SeoLandingPageRecord,
  SeoRedirect,
  SeoRedirectFormValues,
  SeoSettings
} from "@/modules/seo/types";

type DbArticle = Awaited<ReturnType<typeof prisma.seoArticle.findMany>>[number];
type DbLandingPage = Awaited<ReturnType<typeof prisma.seoLandingPage.findMany>>[number];

function toIso(value?: Date | null) {
  return value ? value.toISOString() : undefined;
}

function parseJsonArray(input?: string | null) {
  if (!input) return [];
  try {
    const parsed = JSON.parse(input);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function normalizeRobots(value?: string | null) {
  if (value === "noindex,follow" || value === "noindex,nofollow") return value;
  return "index,follow";
}

function sortByUpdatedDesc<T extends { updatedAt: string }>(items: T[]) {
  return [...items].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

function getLocaleCandidates(locale?: string | null) {
  if (!locale) return [];
  const candidates = [locale];
  const appLocale = getAppLocaleBySeoLocale(locale);
  if (appLocale && !candidates.includes(appLocale)) {
    candidates.push(appLocale);
  }
  return candidates;
}

function buildArticleCategoryMap() {
  return new Map(seoArticleCategoriesMock.map((category) => [category.id, category]));
}

function buildArticleTagMap() {
  return new Map(seoArticleTagsMock.map((tag) => [tag.id, tag]));
}

async function loadDbArticles() {
  if (isBuildTimeRuntime()) return [];
  try {
    await ensureSeoDatabaseSeeded();
    const articles = await prisma.seoArticle.findMany({
      include: {
        descriptions: {
          orderBy: { languageCode: "asc" }
        }
      },
      orderBy: [{ updatedAt: "desc" }]
    });
    return articles;
  } catch {
    return [];
  }
}

async function loadDbLandingPages() {
  if (isBuildTimeRuntime()) return [];
  try {
    await ensureSeoDatabaseSeeded();
    const pages = await prisma.seoLandingPage.findMany({
      include: {
        descriptions: {
          orderBy: { languageCode: "asc" }
        }
      },
      orderBy: [{ updatedAt: "desc" }]
    });
    return pages;
  } catch {
    return [];
  }
}

function hydrateArticleFromDb(article: DbArticle & {
  descriptions: Array<{
    languageCode: string;
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    seoTitle: string | null;
    seoDescription: string | null;
    canonicalUrl: string | null;
    ogTitle: string | null;
    ogDescription: string | null;
    ogImage: string | null;
    twitterTitle: string | null;
    twitterDescription: string | null;
    twitterImage: string | null;
    faqJson: string | null;
    structuredDataJson: string | null;
    robots: string;
    readingTime: number | null;
    tableOfContents: string | null;
    translationStatus: string;
    createdAt: Date;
    updatedAt: Date;
  }>;
},
  locale?: string
): SeoArticleRecord | null {
  const translation = locale
    ? article.descriptions.find((item) => getLocaleCandidates(locale).includes(item.languageCode))
    : article.descriptions[0];

  if (!translation) return null;

  const categories = buildArticleCategoryMap();
  const tagMap = buildArticleTagMap();
  const tagIds = seoArticleTagRelationsMock.filter((relation) => relation.articleId === article.id).map((relation) => relation.tagId);
  const tags = tagIds.map((id) => tagMap.get(id)).filter(Boolean) as SeoArticleTag[];
  const includeInSitemap = article.status === "published"
    && normalizeRobots(translation.robots) === "index,follow"
    && translation.translationStatus === "published"
    && Boolean(getLocaleCandidates(translation.languageCode).find((candidate) => isSeoLocale(candidate)));

  return {
    id: article.id,
    title: translation.title,
    slug: translation.slug,
    localizedSlug: translation.slug,
    excerpt: translation.excerpt,
    content: translation.content,
    coverImage: article.coverImage || undefined,
    categoryId: article.categoryId,
    authorId: article.authorId || undefined,
    status: article.status as SeoArticle["status"],
    language: translation.languageCode,
    translationGroupId: article.id,
    sourceLanguage: "en",
    publishedAt: toIso(article.publishedAt),
    createdAt: article.createdAt.toISOString(),
    updatedAt: translation.updatedAt.toISOString(),
    seoTitle: translation.seoTitle || undefined,
    seoDescription: translation.seoDescription || undefined,
    canonicalUrl: translation.canonicalUrl || undefined,
    robots: normalizeRobots(translation.robots),
    ogTitle: translation.ogTitle || undefined,
    ogDescription: translation.ogDescription || undefined,
    ogImage: translation.ogImage || undefined,
    twitterTitle: translation.twitterTitle || undefined,
    twitterDescription: translation.twitterDescription || undefined,
    twitterImage: translation.twitterImage || undefined,
    readingTime: translation.readingTime || undefined,
    tableOfContents: translation.tableOfContents || undefined,
    faqJson: translation.faqJson || undefined,
    structuredDataJson: translation.structuredDataJson || undefined,
    relatedArticleIds: article.relatedArticleIds ? parseJsonArray(article.relatedArticleIds) as string[] : [],
    relatedLinksJson: article.relatedLinksJson || undefined,
    ctaType: article.ctaType as SeoArticle["ctaType"],
    category: categories.get(article.categoryId) ?? null,
    tags,
    tagIds,
    authorName: "CNSnap Editorial Team",
    includeInSitemap
  };
}

function hydrateLandingPageFromDb(page: DbLandingPage & {
  descriptions: Array<{
    languageCode: string;
    path: string;
    localizedPath: string | null;
    heroTitle: string;
    heroSubtitle: string | null;
    content: string;
    sectionsJson: string | null;
    faqJson: string | null;
    ctaText: string | null;
    ctaHref: string | null;
    seoTitle: string | null;
    seoDescription: string | null;
    canonicalUrl: string | null;
    robots: string;
    ogTitle: string | null;
    ogDescription: string | null;
    ogImage: string | null;
    twitterTitle: string | null;
    twitterDescription: string | null;
    twitterImage: string | null;
    structuredDataJson: string | null;
    translationStatus: string;
    updatedAt: Date;
  }>;
},
  locale?: string
): SeoLandingPageRecord | null {
  const translation = locale
    ? page.descriptions.find((item) => getLocaleCandidates(locale).includes(item.languageCode))
    : page.descriptions[0];

  if (!translation) return null;

  const includeInSitemap = page.status === "published"
    && normalizeRobots(translation.robots) === "index,follow"
    && translation.translationStatus === "published"
    && Boolean(getLocaleCandidates(translation.languageCode).find((candidate) => isSeoLocale(candidate)));

  return {
    id: String(page.id),
    title: page.title,
    slug: page.slug,
    localizedPath: translation.localizedPath || undefined,
    type: page.type as SeoLandingPage["type"],
    path: translation.path,
    heroTitle: translation.heroTitle,
    heroSubtitle: translation.heroSubtitle || undefined,
    content: translation.content,
    sectionsJson: translation.sectionsJson || undefined,
    faqJson: translation.faqJson || undefined,
    ctaText: translation.ctaText || undefined,
    ctaHref: translation.ctaHref || undefined,
    status: page.status as SeoLandingPage["status"],
    language: translation.languageCode,
    translationGroupId: String(page.id),
    sourceLanguage: "en",
    publishedAt: toIso(page.publishedAt),
    createdAt: page.createdAt.toISOString(),
    updatedAt: translation.updatedAt.toISOString(),
    seoTitle: translation.seoTitle || undefined,
    seoDescription: translation.seoDescription || undefined,
    canonicalUrl: translation.canonicalUrl || undefined,
    robots: normalizeRobots(translation.robots),
    ogTitle: translation.ogTitle || undefined,
    ogDescription: translation.ogDescription || undefined,
    ogImage: translation.ogImage || undefined,
    twitterTitle: translation.twitterTitle || undefined,
    twitterDescription: translation.twitterDescription || undefined,
    twitterImage: translation.twitterImage || undefined,
    structuredDataJson: translation.structuredDataJson || undefined,
    includeInSitemap,
    faqCount: parseJsonArray(translation.faqJson).length,
    sectionCount: parseJsonArray(translation.sectionsJson).length
  };
}

export const readSeoStore = cache(async (): Promise<SeoArticleStore> => {
  noStore();
  await ensureSeoDatabaseSeeded();
  const pages = await loadDbLandingPages();
  return {
    settings: seoSettingsMock,
    pageMetas: seoCorePageMetasMock,
    robotsRules: seoRobotsRulesMock,
    sitemapEntries: seoSitemapEntriesMock,
    articleCategories: seoArticleCategoriesMock,
    articleTags: seoArticleTagsMock,
    articles: (await loadDbArticles()).flatMap((article) =>
      article.descriptions.map((description) => ({
        id: article.id,
        title: description.title,
        slug: description.slug,
        localizedSlug: description.slug,
        excerpt: description.excerpt,
        content: description.content,
        coverImage: article.coverImage || undefined,
        categoryId: article.categoryId,
        authorId: article.authorId || undefined,
        status: article.status as SeoArticle["status"],
        language: description.languageCode,
        translationGroupId: article.id,
        sourceLanguage: "en",
        publishedAt: toIso(article.publishedAt),
        createdAt: article.createdAt.toISOString(),
        updatedAt: description.updatedAt.toISOString(),
        seoTitle: description.seoTitle || undefined,
        seoDescription: description.seoDescription || undefined,
        canonicalUrl: description.canonicalUrl || undefined,
        robots: normalizeRobots(description.robots),
        ogTitle: description.ogTitle || undefined,
        ogDescription: description.ogDescription || undefined,
        ogImage: description.ogImage || undefined,
        twitterTitle: description.twitterTitle || undefined,
        twitterDescription: description.twitterDescription || undefined,
        twitterImage: description.twitterImage || undefined,
        readingTime: description.readingTime || undefined,
        tableOfContents: description.tableOfContents || undefined,
        faqJson: description.faqJson || undefined,
        structuredDataJson: description.structuredDataJson || undefined,
        relatedArticleIds: article.relatedArticleIds ? parseJsonArray(article.relatedArticleIds) as string[] : [],
        relatedLinksJson: article.relatedLinksJson || undefined,
        ctaType: article.ctaType as SeoArticle["ctaType"]
      }))
    ),
    articleTagRelations: seoArticleTagRelationsMock,
    landingPages: pages.flatMap((page) =>
      page.descriptions.map((description) => ({
        id: String(page.id),
        title: page.title,
        slug: page.slug,
        localizedPath: description.localizedPath || undefined,
        type: page.type as SeoLandingPage["type"],
        path: description.path,
        heroTitle: description.heroTitle,
        heroSubtitle: description.heroSubtitle || undefined,
        content: description.content,
        sectionsJson: description.sectionsJson || undefined,
        faqJson: description.faqJson || undefined,
        ctaText: description.ctaText || undefined,
        ctaHref: description.ctaHref || undefined,
        status: page.status as SeoLandingPage["status"],
        language: description.languageCode,
        translationGroupId: String(page.id),
        sourceLanguage: "en",
        publishedAt: toIso(page.publishedAt),
        createdAt: page.createdAt.toISOString(),
        updatedAt: description.updatedAt.toISOString(),
        seoTitle: description.seoTitle || undefined,
        seoDescription: description.seoDescription || undefined,
        canonicalUrl: description.canonicalUrl || undefined,
        robots: normalizeRobots(description.robots),
        ogTitle: description.ogTitle || undefined,
        ogDescription: description.ogDescription || undefined,
        ogImage: description.ogImage || undefined,
        twitterTitle: description.twitterTitle || undefined,
        twitterDescription: description.twitterDescription || undefined,
        twitterImage: description.twitterImage || undefined,
        structuredDataJson: description.structuredDataJson || undefined
      }))
    ),
    redirects: seoRedirectsMock
  };
});

export async function saveSeoStore() {}

export async function getSeoArticleCategories() {
  return [...seoArticleCategoriesMock].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
}

export async function getSeoArticleCategoriesByLocale(locale: SeoLocale) {
  const categories = await getSeoArticleCategories();
  const localized = categories.filter((category) => getLocaleCandidates(locale).includes(category.language || "en"));
  if (localized.length) return localized;
  return categories.filter((category) => (category.language || "en") === "en");
}

export async function getSeoArticleTags() {
  return [...seoArticleTagsMock].sort((a, b) => a.name.localeCompare(b.name));
}

export async function getSeoArticles() {
  const items = (await loadDbArticles()).map((article) => hydrateArticleFromDb(article, "en")).filter(Boolean) as SeoArticleRecord[];
  return sortByUpdatedDesc(items);
}

export async function getPublishedSeoArticles() {
  return (await getSeoArticles()).filter((article) => article.status === "published");
}

export async function getPublishedSeoArticlesByLocale(locale: SeoLocale) {
  const items = (await loadDbArticles())
    .map((article) => hydrateArticleFromDb(article, locale))
    .filter(Boolean) as SeoArticleRecord[];
  return sortByUpdatedDesc(items.filter((article) => article.status === "published"));
}

export async function getSeoArticleById(id: string) {
  await ensureSeoDatabaseSeeded();
  const article = await prisma.seoArticle.findUnique({
    where: { id },
    include: { descriptions: { orderBy: { languageCode: "asc" } } }
  });
  return article ? hydrateArticleFromDb(article, "en") : null;
}

export async function getSeoArticleBySlug(slug: string) {
  await ensureSeoDatabaseSeeded();
  const description = await prisma.seoArticleDescription.findFirst({
    where: { slug },
    include: { article: { include: { descriptions: true } } }
  });
  return description ? hydrateArticleFromDb(description.article, description.languageCode) : null;
}

export async function getSeoArticleBySlugAndLocale(slug: string, locale: SeoLocale) {
  await ensureSeoDatabaseSeeded();
  const description = await prisma.seoArticleDescription.findFirst({
    where: { slug, languageCode: { in: getLocaleCandidates(locale) } },
    include: { article: { include: { descriptions: true } } }
  });
  return description ? hydrateArticleFromDb(description.article, locale) : null;
}

export async function getSeoArticleBySlugInAnyLocale(slug: string) {
  return getSeoArticleBySlug(slug);
}

export async function getSeoArticleForLocale(slug: string, locale: SeoLocale) {
  await ensureSeoDatabaseSeeded();
  const description = await prisma.seoArticleDescription.findFirst({
    where: { slug, languageCode: { in: getLocaleCandidates(locale) } },
    include: { article: { include: { descriptions: true } } }
  });
  if (description) {
    const article = hydrateArticleFromDb(description.article, locale);
    return article ? { article, matchedLocale: locale, fallback: false } : null;
  }

  const anyLocaleMatch = await prisma.seoArticleDescription.findFirst({
    where: { slug },
    include: { article: { include: { descriptions: true } } }
  });
  if (!anyLocaleMatch) return null;

  const localizedArticle = hydrateArticleFromDb(anyLocaleMatch.article, locale);
  if (localizedArticle) {
    return { article: localizedArticle, matchedLocale: locale, fallback: false };
  }

  const fallbackArticle = hydrateArticleFromDb(anyLocaleMatch.article, anyLocaleMatch.languageCode)
    ?? hydrateArticleFromDb(anyLocaleMatch.article, "en");
  return fallbackArticle
    ? { article: fallbackArticle, matchedLocale: fallbackArticle.language as SeoLocale, fallback: true }
    : null;
}

async function getDbArticleById(id: string) {
  return prisma.seoArticle.findUnique({
    where: { id },
    include: { descriptions: { orderBy: { languageCode: "asc" } } }
  });
}

export async function getSeoArticleCategoryBySlug(slug: string) {
  return (await getSeoArticleCategories()).find((category) => category.slug === slug || category.localizedSlug === slug) ?? null;
}

export async function getSeoArticleCategoryBySlugAndLocale(slug: string, locale: SeoLocale) {
  const categories = await getSeoArticleCategoriesByLocale(locale);
  return categories.find((category) => category.slug === slug || category.localizedSlug === slug) ?? null;
}

export async function getSeoArticleTagBySlug(slug: string) {
  return (await getSeoArticleTags()).find((tag) => tag.slug === slug) ?? null;
}

export async function getSeoArticlesByCategorySlug(slug: string) {
  const [category, articles] = await Promise.all([getSeoArticleCategoryBySlug(slug), getPublishedSeoArticles()]);
  if (!category) return { category: null, articles: [] as SeoArticleRecord[] };
  return { category, articles: articles.filter((article) => article.categoryId === category.id) };
}

export async function getSeoArticlesByCategorySlugAndLocale(slug: string, locale: SeoLocale) {
  const [category, articles, categories] = await Promise.all([
    getSeoArticleCategoryBySlugAndLocale(slug, locale),
    getPublishedSeoArticles(),
    getSeoArticleCategoriesByLocale(locale)
  ]);
  if (!category) return { category: null, articles: [] as SeoArticleRecord[], relatedCategories: [] as SeoArticleCategory[] };
  return {
    category,
    articles: articles.filter((article) => article.categoryId === category.id),
    relatedCategories: categories.filter((item) => item.id !== category.id)
  };
}

export async function getSeoArticlesByTagSlug(slug: string) {
  const [tag, articles] = await Promise.all([getSeoArticleTagBySlug(slug), getPublishedSeoArticles()]);
  if (!tag) return { tag: null, articles: [] as SeoArticleRecord[] };
  return { tag, articles: articles.filter((article) => article.tagIds.includes(tag.id)) };
}

export async function upsertSeoArticle(values: SeoArticleFormValues) {
  await ensureSeoDatabaseSeeded();
  const now = new Date();
  const article = await prisma.seoArticle.upsert({
    where: { id: values.id || `article-${values.slug}` },
    update: {
      categoryId: values.categoryId,
      status: values.status,
      coverImage: values.coverImage || null,
      relatedArticleIds: values.relatedArticleIds.length ? JSON.stringify(values.relatedArticleIds) : null,
      relatedLinksJson: values.relatedLinksJson || null,
      ctaType: values.ctaType,
      publishedAt: values.publishedAt ? new Date(values.publishedAt) : values.status === "published" ? now : null
    },
    create: {
      id: values.id || `article-${values.slug}`,
      categoryId: values.categoryId,
      status: values.status,
      coverImage: values.coverImage || null,
      relatedArticleIds: values.relatedArticleIds.length ? JSON.stringify(values.relatedArticleIds) : null,
      relatedLinksJson: values.relatedLinksJson || null,
      ctaType: values.ctaType,
      publishedAt: values.publishedAt ? new Date(values.publishedAt) : values.status === "published" ? now : null
    }
  });

  await prisma.seoArticleDescription.upsert({
    where: {
      articleId_languageCode: {
        articleId: article.id,
        languageCode: values.language || "en"
      }
    },
    update: {
      title: values.title,
      slug: values.localizedSlug || values.slug,
      excerpt: values.excerpt,
      content: values.content,
      seoTitle: values.seoTitle || values.title,
      seoDescription: values.seoDescription || values.excerpt,
      canonicalUrl: values.canonicalUrl || null,
      ogTitle: values.ogTitle || values.seoTitle || values.title,
      ogDescription: values.ogDescription || values.seoDescription || values.excerpt,
      ogImage: values.ogImage || values.coverImage || null,
      twitterTitle: values.twitterTitle || values.ogTitle || values.seoTitle || values.title,
      twitterDescription: values.twitterDescription || values.ogDescription || values.seoDescription || values.excerpt,
      twitterImage: values.twitterImage || values.ogImage || values.coverImage || null,
      faqJson: values.faqJson || null,
      structuredDataJson: null,
      robots: values.robots,
      readingTime: calculateReadingTime(values.content),
      tableOfContents: JSON.stringify(extractTableOfContents(values.content)),
      translationStatus: values.status === "published" ? "published" : "draft"
    },
    create: {
      articleId: article.id,
      languageCode: values.language || "en",
      title: values.title,
      slug: values.localizedSlug || values.slug,
      excerpt: values.excerpt,
      content: values.content,
      seoTitle: values.seoTitle || values.title,
      seoDescription: values.seoDescription || values.excerpt,
      canonicalUrl: values.canonicalUrl || null,
      ogTitle: values.ogTitle || values.seoTitle || values.title,
      ogDescription: values.ogDescription || values.seoDescription || values.excerpt,
      ogImage: values.ogImage || values.coverImage || null,
      twitterTitle: values.twitterTitle || values.ogTitle || values.seoTitle || values.title,
      twitterDescription: values.twitterDescription || values.ogDescription || values.seoDescription || values.excerpt,
      twitterImage: values.twitterImage || values.ogImage || values.coverImage || null,
      faqJson: values.faqJson || null,
      structuredDataJson: null,
      robots: values.robots,
      readingTime: calculateReadingTime(values.content),
      tableOfContents: JSON.stringify(extractTableOfContents(values.content)),
      translationStatus: values.status === "published" ? "published" : "draft"
    }
  });

  return {
    id: article.id,
    title: values.title,
    slug: values.localizedSlug || values.slug,
    localizedSlug: values.localizedSlug || values.slug,
    excerpt: values.excerpt,
    content: values.content,
    coverImage: values.coverImage || undefined,
    categoryId: values.categoryId,
    authorId: article.authorId || undefined,
    status: values.status,
    language: values.language || "en",
    translationGroupId: article.id,
    sourceLanguage: "en",
    publishedAt: toIso(article.publishedAt),
    createdAt: article.createdAt.toISOString(),
    updatedAt: now.toISOString(),
    seoTitle: values.seoTitle || values.title,
    seoDescription: values.seoDescription || values.excerpt,
    canonicalUrl: values.canonicalUrl || undefined,
    robots: values.robots,
    ogTitle: values.ogTitle || values.seoTitle || values.title,
    ogDescription: values.ogDescription || values.seoDescription || values.excerpt,
    ogImage: values.ogImage || values.coverImage || undefined,
    twitterTitle: values.twitterTitle || values.ogTitle || values.seoTitle || values.title,
    twitterDescription: values.twitterDescription || values.ogDescription || values.seoDescription || values.excerpt,
    twitterImage: values.twitterImage || values.ogImage || values.coverImage || undefined,
    readingTime: calculateReadingTime(values.content),
    tableOfContents: JSON.stringify(extractTableOfContents(values.content)),
    faqJson: values.faqJson || undefined,
    structuredDataJson: undefined,
    relatedArticleIds: values.relatedArticleIds,
    relatedLinksJson: values.relatedLinksJson || undefined,
    ctaType: values.ctaType
  } satisfies SeoArticle;
}

export async function getSeoLandingPages() {
  const items = (await loadDbLandingPages()).map((page) => hydrateLandingPageFromDb(page, "en")).filter(Boolean) as SeoLandingPageRecord[];
  return sortByUpdatedDesc(items);
}

export async function getPublishedSeoLandingPages() {
  return (await getSeoLandingPages()).filter((page) => page.status === "published");
}

export async function getPublishedSeoLandingPagesByLocale(locale: SeoLocale) {
  const items = (await loadDbLandingPages())
    .map((page) => hydrateLandingPageFromDb(page, locale))
    .filter(Boolean) as SeoLandingPageRecord[];
  return sortByUpdatedDesc(items.filter((page) => page.status === "published"));
}

export async function getSeoLandingPageById(id: string) {
  await ensureSeoDatabaseSeeded();
  const page = await prisma.seoLandingPage.findUnique({
    where: { id: Number(id) },
    include: { descriptions: { orderBy: { languageCode: "asc" } } }
  });
  return page ? hydrateLandingPageFromDb(page, "en") : null;
}

export async function getSeoLandingPageBySlug(type: SeoLandingPage["type"], slug: string) {
  await ensureSeoDatabaseSeeded();
  const page = await prisma.seoLandingPage.findFirst({
    where: { type, slug },
    include: { descriptions: true }
  });
  return page ? hydrateLandingPageFromDb(page, "en") : null;
}

export async function getSeoLandingPageBySlugAndLocale(type: SeoLandingPage["type"], slug: string, locale: SeoLocale) {
  await ensureSeoDatabaseSeeded();
  const page = await prisma.seoLandingPage.findFirst({
    where: {
      type,
      descriptions: {
        some: {
          languageCode: { in: getLocaleCandidates(locale) },
          OR: [{ localizedPath: { endsWith: `/${slug}` } }, { path: { endsWith: `/${slug}` } }]
        }
      }
    },
    include: { descriptions: true }
  });
  return page ? hydrateLandingPageFromDb(page, locale) : null;
}

export async function getSeoLandingPageByPath(pathname: string) {
  await ensureSeoDatabaseSeeded();
  const normalized = stripSeoLocale(pathname).pathname;
  const description = await prisma.seoLandingPageDescription.findFirst({
    where: {
      OR: [{ path: normalized }, { localizedPath: normalized }]
    },
    include: { landingPage: { include: { descriptions: true } } }
  });
  return description ? hydrateLandingPageFromDb(description.landingPage, description.languageCode) : null;
}

export async function getSeoLandingPageForLocale(type: SeoLandingPage["type"], slug: string, locale: SeoLocale) {
  const direct = await getSeoLandingPageBySlugAndLocale(type, slug, locale);
  if (direct) {
    return { page: direct, matchedLocale: locale, fallback: false };
  }

  await ensureSeoDatabaseSeeded();
  const anyLocaleMatch = await prisma.seoLandingPage.findFirst({
    where: {
      type,
      descriptions: {
        some: {
          OR: [{ localizedPath: { endsWith: `/${slug}` } }, { path: { endsWith: `/${slug}` } }]
        }
      }
    },
    include: { descriptions: { orderBy: { languageCode: "asc" } } }
  });
  if (!anyLocaleMatch) return null;

  const localizedPage = hydrateLandingPageFromDb(anyLocaleMatch, locale);
  if (localizedPage) {
    return { page: localizedPage, matchedLocale: locale, fallback: false };
  }

  const fallbackDescription = anyLocaleMatch.descriptions[0];
  const fallbackPage = fallbackDescription
    ? hydrateLandingPageFromDb(anyLocaleMatch, fallbackDescription.languageCode)
    : hydrateLandingPageFromDb(anyLocaleMatch, "en");
  return fallbackPage
    ? { page: fallbackPage, matchedLocale: fallbackPage.language as SeoLocale, fallback: true }
    : null;
}

export async function getSeoArticleTranslations(groupId?: string) {
  if (!groupId) return [];
  const source = await getDbArticleById(groupId).catch(() => null);
  if (!source) return [];
  return source.descriptions
    .map((description) => hydrateArticleFromDb(source, description.languageCode))
    .filter(Boolean) as SeoArticleRecord[];
}

export async function getSeoLandingPageTranslations(groupId?: string) {
  if (!groupId) return [];
  const page = await prisma.seoLandingPage.findUnique({
    where: { id: Number(groupId) },
    include: { descriptions: { orderBy: { languageCode: "asc" } } }
  }).catch(() => null);
  if (!page) return [];
  return page.descriptions
    .map((description) => hydrateLandingPageFromDb(page, description.languageCode))
    .filter(Boolean) as SeoLandingPageRecord[];
}

export async function upsertSeoLandingPage(values: SeoLandingPageFormValues) {
  await ensureSeoDatabaseSeeded();
  const now = new Date();
  const page = await prisma.seoLandingPage.upsert({
    where: { id: values.id ? Number(values.id) : -1 },
    update: {
      title: values.title,
      slug: values.slug,
      type: values.type,
      path: values.path,
      status: values.status,
      publishedAt: values.publishedAt ? new Date(values.publishedAt) : values.status === "published" ? now : null
    },
    create: {
      title: values.title,
      slug: values.slug,
      type: values.type,
      path: values.path,
      status: values.status,
      language: values.language || "en",
      heroTitle: values.heroTitle,
      heroSubtitle: values.heroSubtitle || null,
      content: values.content,
      sectionsJson: values.sectionsJson || null,
      faqJson: values.faqJson || null,
      ctaText: values.ctaText || null,
      ctaHref: values.ctaHref || null,
      seoTitle: values.seoTitle || values.heroTitle,
      seoDescription: values.seoDescription || values.heroSubtitle || null,
      canonicalUrl: values.canonicalUrl || null,
      robots: values.robots,
      ogTitle: values.ogTitle || values.seoTitle || values.heroTitle,
      ogDescription: values.ogDescription || values.seoDescription || values.heroSubtitle || null,
      ogImage: values.ogImage || null,
      twitterTitle: values.twitterTitle || values.ogTitle || values.seoTitle || values.heroTitle,
      twitterDescription: values.twitterDescription || values.ogDescription || values.seoDescription || values.heroSubtitle || null,
      twitterImage: values.twitterImage || values.ogImage || null,
      structuredDataJson: values.structuredDataJson || null,
      publishedAt: values.publishedAt ? new Date(values.publishedAt) : values.status === "published" ? now : null
    }
  });

  await prisma.seoLandingPageDescription.upsert({
    where: {
      landingPageId_languageCode: {
        landingPageId: page.id,
        languageCode: values.language || "en"
      }
    },
    update: {
      path: values.path,
      localizedPath: values.localizedPath || null,
      heroTitle: values.heroTitle,
      heroSubtitle: values.heroSubtitle || null,
      content: values.content,
      sectionsJson: values.sectionsJson || null,
      faqJson: values.faqJson || null,
      ctaText: values.ctaText || null,
      ctaHref: values.ctaHref || null,
      seoTitle: values.seoTitle || values.heroTitle,
      seoDescription: values.seoDescription || values.heroSubtitle || null,
      canonicalUrl: values.canonicalUrl || null,
      robots: values.robots,
      ogTitle: values.ogTitle || values.seoTitle || values.heroTitle,
      ogDescription: values.ogDescription || values.seoDescription || values.heroSubtitle || null,
      ogImage: values.ogImage || null,
      twitterTitle: values.twitterTitle || values.ogTitle || values.seoTitle || values.heroTitle,
      twitterDescription: values.twitterDescription || values.ogDescription || values.seoDescription || values.heroSubtitle || null,
      twitterImage: values.twitterImage || values.ogImage || null,
      structuredDataJson: values.structuredDataJson || null,
      translationStatus: values.status === "published" ? "published" : "draft"
    },
    create: {
      landingPageId: page.id,
      languageCode: values.language || "en",
      path: values.path,
      localizedPath: values.localizedPath || null,
      heroTitle: values.heroTitle,
      heroSubtitle: values.heroSubtitle || null,
      content: values.content,
      sectionsJson: values.sectionsJson || null,
      faqJson: values.faqJson || null,
      ctaText: values.ctaText || null,
      ctaHref: values.ctaHref || null,
      seoTitle: values.seoTitle || values.heroTitle,
      seoDescription: values.seoDescription || values.heroSubtitle || null,
      canonicalUrl: values.canonicalUrl || null,
      robots: values.robots,
      ogTitle: values.ogTitle || values.seoTitle || values.heroTitle,
      ogDescription: values.ogDescription || values.seoDescription || values.heroSubtitle || null,
      ogImage: values.ogImage || null,
      twitterTitle: values.twitterTitle || values.ogTitle || values.seoTitle || values.heroTitle,
      twitterDescription: values.twitterDescription || values.ogDescription || values.seoDescription || values.heroSubtitle || null,
      twitterImage: values.twitterImage || values.ogImage || null,
      structuredDataJson: values.structuredDataJson || null,
      translationStatus: values.status === "published" ? "published" : "draft"
    }
  });

  return {
    id: String(page.id),
    title: values.title,
    slug: values.slug,
    localizedPath: values.localizedPath || undefined,
    type: values.type,
    path: values.path,
    heroTitle: values.heroTitle,
    heroSubtitle: values.heroSubtitle || undefined,
    content: values.content,
    sectionsJson: values.sectionsJson || undefined,
    faqJson: values.faqJson || undefined,
    ctaText: values.ctaText || undefined,
    ctaHref: values.ctaHref || undefined,
    status: values.status,
    language: values.language || "en",
    translationGroupId: String(page.id),
    sourceLanguage: "en",
    publishedAt: toIso(page.publishedAt),
    createdAt: page.createdAt.toISOString(),
    updatedAt: now.toISOString(),
    seoTitle: values.seoTitle || values.heroTitle,
    seoDescription: values.seoDescription || values.heroSubtitle || undefined,
    canonicalUrl: values.canonicalUrl || undefined,
    robots: values.robots,
    ogTitle: values.ogTitle || values.seoTitle || values.heroTitle,
    ogDescription: values.ogDescription || values.seoDescription || values.heroSubtitle || undefined,
    ogImage: values.ogImage || undefined,
    twitterTitle: values.twitterTitle || values.ogTitle || values.seoTitle || values.heroTitle,
    twitterDescription: values.twitterDescription || values.ogDescription || values.seoDescription || values.heroSubtitle || undefined,
    twitterImage: values.twitterImage || values.ogImage || undefined,
    structuredDataJson: values.structuredDataJson || undefined
  } satisfies SeoLandingPage;
}

export async function deleteSeoLandingPage(id: string) {
  await prisma.seoLandingPage.delete({ where: { id: Number(id) } });
}

export async function getSeoRedirects() {
  await ensureSeoDatabaseSeeded();
  const redirects = await prisma.seoRedirect.findMany({ orderBy: { updatedAt: "desc" } });
  return redirects.map((redirect) => ({
    id: String(redirect.id),
    fromPath: redirect.fromPath,
    toPath: redirect.toPath,
    statusCode: redirect.statusCode as SeoRedirect["statusCode"],
    enabled: redirect.enabled,
    hitCount: redirect.hitCount,
    lastHitAt: toIso(redirect.lastHitAt),
    createdAt: redirect.createdAt.toISOString(),
    updatedAt: redirect.updatedAt.toISOString()
  }));
}

export async function getSeoRedirectById(id: string) {
  const redirect = await prisma.seoRedirect.findUnique({ where: { id: Number(id) } });
  return redirect ? {
    id: String(redirect.id),
    fromPath: redirect.fromPath,
    toPath: redirect.toPath,
    statusCode: redirect.statusCode as SeoRedirect["statusCode"],
    enabled: redirect.enabled,
    hitCount: redirect.hitCount,
    lastHitAt: toIso(redirect.lastHitAt),
    createdAt: redirect.createdAt.toISOString(),
    updatedAt: redirect.updatedAt.toISOString()
  } : null;
}

export async function upsertSeoRedirect(values: SeoRedirectFormValues) {
  const redirect = await prisma.seoRedirect.upsert({
    where: { id: values.id ? Number(values.id) : -1 },
    update: {
      fromPath: values.fromPath,
      toPath: values.toPath,
      statusCode: values.statusCode,
      enabled: values.enabled
    },
    create: {
      fromPath: values.fromPath,
      toPath: values.toPath,
      statusCode: values.statusCode,
      enabled: values.enabled
    }
  });
  return {
    id: String(redirect.id),
    fromPath: redirect.fromPath,
    toPath: redirect.toPath,
    statusCode: redirect.statusCode as SeoRedirect["statusCode"],
    enabled: redirect.enabled,
    hitCount: redirect.hitCount,
    lastHitAt: toIso(redirect.lastHitAt),
    createdAt: redirect.createdAt.toISOString(),
    updatedAt: redirect.updatedAt.toISOString()
  };
}

export async function deleteSeoRedirect(id: string) {
  await prisma.seoRedirect.delete({ where: { id: Number(id) } });
}

export async function deleteSeoArticle(id: string) {
  await prisma.seoArticle.delete({ where: { id } });
}

export async function upsertSeoArticleCategory(_category: SeoArticleCategory) {}

export async function upsertSeoArticleTag(_tag: SeoArticleTag) {}

export async function deleteSeoArticleTag(_id: string) {}

export async function getSeoSettingsFromStore(): Promise<SeoSettings> {
  if (isBuildTimeRuntime()) return seoSettingsMock;
  try {
    await ensureSeoDatabaseSeeded();
    const setting = await prisma.seoSetting.findFirst({ orderBy: { id: "asc" } });
    return setting ? {
      id: String(setting.id),
      siteName: setting.siteName,
      defaultTitle: setting.defaultTitle,
      titleTemplate: setting.titleTemplate,
      defaultDescription: setting.defaultDescription,
      defaultOgImage: setting.defaultOgImage || "",
      defaultTwitterImage: setting.defaultTwitterImage || "",
      defaultRobots: normalizeRobots(setting.defaultRobots),
      canonicalBaseUrl: setting.canonicalBaseUrl,
      googleSiteVerification: setting.googleSiteVerification || "",
      googleAnalyticsId: setting.googleAnalyticsId || "",
      googleTagManagerId: setting.googleTagManagerId || "",
      createdAt: setting.createdAt.toISOString(),
      updatedAt: setting.updatedAt.toISOString()
    } : seoSettingsMock;
  } catch {
    return seoSettingsMock;
  }
}

export function calculateReadingTime(content: string) {
  const words = content.replace(/<[^>]+>/g, " ").trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 180));
}

export function extractTableOfContents(content: string) {
  const matches = [...content.matchAll(/<h2[^>]*>(.*?)<\/h2>/gi)];
  return matches.map((match) => match[1].replace(/<[^>]+>/g, "").trim()).filter(Boolean);
}
