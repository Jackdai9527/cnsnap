import { prisma } from "@/lib/db";
import { getAppLocaleBySeoLocale } from "../../config/i18n";
import { getEnabledFrontendLocaleConfigsRuntime } from "@/lib/i18n/locale-config-store";

const DEFAULT_LOCALE = "en";

function getLocaleCandidates(locale: string, fallbackToEnglish = true) {
  const candidates = [locale];
  const appLocale = getAppLocaleBySeoLocale(locale);
  if (appLocale && !candidates.includes(appLocale)) {
    candidates.push(appLocale);
  }
  if (fallbackToEnglish && !candidates.includes(DEFAULT_LOCALE)) {
    candidates.push(DEFAULT_LOCALE);
  }
  return candidates;
}

export async function ensureHelpArticleDescriptions() {
  const articles = await prisma.helpArticle.findMany();
  for (const article of articles) {
    await prisma.helpArticleDescription.upsert({
      where: {
        helpArticleId_languageCode: {
          helpArticleId: article.id,
          languageCode: article.locale || DEFAULT_LOCALE
        }
      },
      update: {
        title: article.title,
        slug: article.slug,
        summary: article.excerpt,
        content: article.content,
        translationStatus: article.isPublished ? "published" : "draft"
      },
      create: {
        helpArticleId: article.id,
        languageCode: article.locale || DEFAULT_LOCALE,
        title: article.title,
        slug: article.slug,
        summary: article.excerpt,
        content: article.content,
        translationStatus: article.isPublished ? "published" : "draft"
      }
    });
  }
}

export async function ensurePageDescriptions() {
  const pages = await prisma.page.findMany();
  for (const page of pages) {
    await prisma.pageDescription.upsert({
      where: {
        pageId_languageCode: {
          pageId: page.id,
          languageCode: DEFAULT_LOCALE
        }
      },
      update: {
        title: page.title,
        slug: page.slug,
        contentHtml: page.contentHtml,
        translationStatus: page.isPublished ? "published" : "draft"
      },
      create: {
        pageId: page.id,
        languageCode: DEFAULT_LOCALE,
        title: page.title,
        slug: page.slug,
        contentHtml: page.contentHtml,
        translationStatus: page.isPublished ? "published" : "draft"
      }
    });
  }
}

export async function getLocalizedHelpArticleBySlug(slug: string, locale: string, fallbackToEnglish = true) {
  await ensureHelpArticleDescriptions();
  for (const candidate of getLocaleCandidates(locale, fallbackToEnglish)) {
    const article = await prisma.helpArticleDescription.findFirst({
      where: { slug, languageCode: candidate },
      include: { helpArticle: true }
    });
    if (article && article.helpArticle.isPublished) return article;
  }
  return null;
}

export async function getLocalizedPageBySlug(slug: string, locale: string, fallbackToEnglish = true) {
  await ensurePageDescriptions();
  for (const candidate of getLocaleCandidates(locale, fallbackToEnglish)) {
    const page = await prisma.pageDescription.findFirst({
      where: { slug, languageCode: candidate },
      include: { page: true }
    });
    if (page && page.page.isPublished) return page;
  }
  return null;
}

export async function getLocalizedHelpArticleAlternates(helpArticleId: number) {
  await ensureHelpArticleDescriptions();
  return prisma.helpArticleDescription.findMany({
    where: {
      helpArticleId,
      translationStatus: "published",
      robots: "index,follow",
      helpArticle: {
        isPublished: true
      }
    },
    include: {
      helpArticle: true
    },
    orderBy: { languageCode: "asc" }
  });
}

export async function getHelpArticleEditorSnapshot() {
  await ensureHelpArticleDescriptions();
  const locales = await getEnabledFrontendLocaleConfigsRuntime();
  const articles = await prisma.helpArticle.findMany({
    include: {
      descriptions: {
        orderBy: { languageCode: "asc" }
      }
    },
    orderBy: [{ category: "asc" }, { updatedAt: "desc" }]
  });
  return { articles, locales };
}

export async function getPageEditorSnapshot() {
  await ensurePageDescriptions();
  const locales = await getEnabledFrontendLocaleConfigsRuntime();
  const pages = await prisma.page.findMany({
    include: {
      descriptions: {
        orderBy: { languageCode: "asc" }
      }
    },
    orderBy: { updatedAt: "desc" }
  });
  return { pages, locales };
}
