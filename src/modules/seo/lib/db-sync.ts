import { prisma } from "@/lib/db";
import { seoLandingPagesMock, seoRedirectsMock } from "@/modules/seo/mock/landing-pages";
import {
  seoArticleCategoriesMock,
  seoArticlesMock,
  seoArticleTagRelationsMock,
  seoArticleTagsMock
} from "@/modules/seo/mock/articles";
import { seoCorePageMetasMock, seoRobotsRulesMock, seoSettingsMock, seoSitemapEntriesMock } from "@/modules/seo/mock/data";

let initialized = false;

function toDate(value?: string | null) {
  return value ? new Date(value) : null;
}

export async function ensureSeoDatabaseSeeded() {
  if (initialized) return;

  const [landingCount, articleCount, settingsCount] = await Promise.all([
    prisma.seoLandingPage.count(),
    prisma.seoArticle.count().catch(() => 0),
    prisma.seoSetting.count()
  ]);

  if (!settingsCount) {
    await prisma.seoSetting.create({
      data: {
        siteName: seoSettingsMock.siteName,
        defaultTitle: seoSettingsMock.defaultTitle,
        titleTemplate: seoSettingsMock.titleTemplate,
        defaultDescription: seoSettingsMock.defaultDescription,
        defaultOgImage: seoSettingsMock.defaultOgImage,
        defaultTwitterImage: seoSettingsMock.defaultTwitterImage,
        defaultRobots: seoSettingsMock.defaultRobots,
        canonicalBaseUrl: seoSettingsMock.canonicalBaseUrl,
        googleSiteVerification: seoSettingsMock.googleSiteVerification,
        googleAnalyticsId: seoSettingsMock.googleAnalyticsId,
        googleTagManagerId: seoSettingsMock.googleTagManagerId
      }
    });
  }

  if (!articleCount) {
    for (const article of seoArticlesMock) {
      await prisma.seoArticle.upsert({
        where: { id: article.id },
        update: {
          categoryId: article.categoryId,
          authorId: article.authorId,
          coverImage: article.coverImage,
          relatedArticleIds: article.relatedArticleIds ? JSON.stringify(article.relatedArticleIds) : null,
          relatedLinksJson: article.relatedLinksJson || null,
          ctaType: article.ctaType,
          status: article.status,
          sortOrder: 0,
          publishedAt: toDate(article.publishedAt),
          createdAt: new Date(article.createdAt),
          updatedAt: new Date(article.updatedAt)
        },
        create: {
          id: article.id,
          categoryId: article.categoryId,
          authorId: article.authorId,
          coverImage: article.coverImage,
          relatedArticleIds: article.relatedArticleIds ? JSON.stringify(article.relatedArticleIds) : null,
          relatedLinksJson: article.relatedLinksJson || null,
          ctaType: article.ctaType,
          status: article.status,
          sortOrder: 0,
          publishedAt: toDate(article.publishedAt),
          createdAt: new Date(article.createdAt),
          updatedAt: new Date(article.updatedAt)
        }
      });

      await prisma.seoArticleDescription.upsert({
        where: {
          articleId_languageCode: {
            articleId: article.id,
            languageCode: article.language
          }
        },
        update: {
          title: article.title,
          slug: article.localizedSlug || article.slug,
          excerpt: article.excerpt,
          content: article.content,
          seoTitle: article.seoTitle,
          seoDescription: article.seoDescription,
          canonicalUrl: article.canonicalUrl,
          ogTitle: article.ogTitle,
          ogDescription: article.ogDescription,
          ogImage: article.ogImage,
          twitterTitle: article.twitterTitle,
          twitterDescription: article.twitterDescription,
          twitterImage: article.twitterImage,
          faqJson: article.faqJson,
          structuredDataJson: article.structuredDataJson,
          robots: article.robots,
          readingTime: article.readingTime,
          tableOfContents: article.tableOfContents,
          translationStatus: article.status === "published" ? "published" : "draft",
          createdAt: new Date(article.createdAt),
          updatedAt: new Date(article.updatedAt)
        },
        create: {
          articleId: article.id,
          languageCode: article.language,
          title: article.title,
          slug: article.localizedSlug || article.slug,
          excerpt: article.excerpt,
          content: article.content,
          seoTitle: article.seoTitle,
          seoDescription: article.seoDescription,
          canonicalUrl: article.canonicalUrl,
          ogTitle: article.ogTitle,
          ogDescription: article.ogDescription,
          ogImage: article.ogImage,
          twitterTitle: article.twitterTitle,
          twitterDescription: article.twitterDescription,
          twitterImage: article.twitterImage,
          faqJson: article.faqJson,
          structuredDataJson: article.structuredDataJson,
          robots: article.robots,
          readingTime: article.readingTime,
          tableOfContents: article.tableOfContents,
          translationStatus: article.status === "published" ? "published" : "draft",
          createdAt: new Date(article.createdAt),
          updatedAt: new Date(article.updatedAt)
        }
      });
    }
  }

  if (!landingCount) {
    for (const page of seoLandingPagesMock) {
      const landing = await prisma.seoLandingPage.upsert({
        where: { slug: page.slug },
        update: {
          title: page.title,
          type: page.type,
          path: page.path,
          heroTitle: page.heroTitle,
          heroSubtitle: page.heroSubtitle,
          content: page.content,
          sectionsJson: page.sectionsJson,
          faqJson: page.faqJson,
          ctaText: page.ctaText,
          ctaHref: page.ctaHref,
          status: page.status,
          language: page.language,
          publishedAt: toDate(page.publishedAt),
          seoTitle: page.seoTitle,
          seoDescription: page.seoDescription,
          canonicalUrl: page.canonicalUrl,
          robots: page.robots,
          ogTitle: page.ogTitle,
          ogDescription: page.ogDescription,
          ogImage: page.ogImage,
          twitterTitle: page.twitterTitle,
          twitterDescription: page.twitterDescription,
          twitterImage: page.twitterImage,
          structuredDataJson: page.structuredDataJson,
          createdAt: new Date(page.createdAt),
          updatedAt: new Date(page.updatedAt)
        },
        create: {
          title: page.title,
          slug: page.slug,
          type: page.type,
          path: page.path,
          heroTitle: page.heroTitle,
          heroSubtitle: page.heroSubtitle,
          content: page.content,
          sectionsJson: page.sectionsJson,
          faqJson: page.faqJson,
          ctaText: page.ctaText,
          ctaHref: page.ctaHref,
          status: page.status,
          language: page.language,
          publishedAt: toDate(page.publishedAt),
          seoTitle: page.seoTitle,
          seoDescription: page.seoDescription,
          canonicalUrl: page.canonicalUrl,
          robots: page.robots,
          ogTitle: page.ogTitle,
          ogDescription: page.ogDescription,
          ogImage: page.ogImage,
          twitterTitle: page.twitterTitle,
          twitterDescription: page.twitterDescription,
          twitterImage: page.twitterImage,
          structuredDataJson: page.structuredDataJson,
          createdAt: new Date(page.createdAt),
          updatedAt: new Date(page.updatedAt)
        }
      });

      await prisma.seoLandingPageDescription.upsert({
        where: {
          landingPageId_languageCode: {
            landingPageId: landing.id,
            languageCode: page.language
          }
        },
        update: {
          path: page.path,
          localizedPath: page.localizedPath,
          heroTitle: page.heroTitle,
          heroSubtitle: page.heroSubtitle,
          content: page.content,
          sectionsJson: page.sectionsJson,
          faqJson: page.faqJson,
          ctaText: page.ctaText,
          ctaHref: page.ctaHref,
          seoTitle: page.seoTitle,
          seoDescription: page.seoDescription,
          canonicalUrl: page.canonicalUrl,
          robots: page.robots,
          ogTitle: page.ogTitle,
          ogDescription: page.ogDescription,
          ogImage: page.ogImage,
          twitterTitle: page.twitterTitle,
          twitterDescription: page.twitterDescription,
          twitterImage: page.twitterImage,
          structuredDataJson: page.structuredDataJson,
          translationStatus: page.status === "published" ? "published" : "draft",
          createdAt: new Date(page.createdAt),
          updatedAt: new Date(page.updatedAt)
        },
        create: {
          landingPageId: landing.id,
          languageCode: page.language,
          path: page.path,
          localizedPath: page.localizedPath,
          heroTitle: page.heroTitle,
          heroSubtitle: page.heroSubtitle,
          content: page.content,
          sectionsJson: page.sectionsJson,
          faqJson: page.faqJson,
          ctaText: page.ctaText,
          ctaHref: page.ctaHref,
          seoTitle: page.seoTitle,
          seoDescription: page.seoDescription,
          canonicalUrl: page.canonicalUrl,
          robots: page.robots,
          ogTitle: page.ogTitle,
          ogDescription: page.ogDescription,
          ogImage: page.ogImage,
          twitterTitle: page.twitterTitle,
          twitterDescription: page.twitterDescription,
          twitterImage: page.twitterImage,
          structuredDataJson: page.structuredDataJson,
          translationStatus: page.status === "published" ? "published" : "draft",
          createdAt: new Date(page.createdAt),
          updatedAt: new Date(page.updatedAt)
        }
      });
    }
  }

  if (!(await prisma.seoPageMeta.count())) {
    for (const page of seoCorePageMetasMock) {
      await prisma.seoPageMeta.upsert({
        where: { path: page.path },
        update: {
          pageType: page.pageType,
          title: page.title,
          description: page.description,
          canonicalUrl: page.canonicalUrl,
          robots: page.robots,
          ogTitle: page.ogTitle,
          ogDescription: page.ogDescription,
          ogImage: page.ogImage,
          twitterTitle: page.twitterTitle,
          twitterDescription: page.twitterDescription,
          twitterImage: page.twitterImage,
          structuredDataJson: page.structuredDataJson,
          enabled: page.enabled
        },
        create: {
          path: page.path,
          pageType: page.pageType,
          title: page.title,
          description: page.description,
          canonicalUrl: page.canonicalUrl,
          robots: page.robots,
          ogTitle: page.ogTitle,
          ogDescription: page.ogDescription,
          ogImage: page.ogImage,
          twitterTitle: page.twitterTitle,
          twitterDescription: page.twitterDescription,
          twitterImage: page.twitterImage,
          structuredDataJson: page.structuredDataJson,
          enabled: page.enabled
        }
      });
    }
  }

  if (!(await prisma.seoRobotsRule.count())) {
    for (const rule of seoRobotsRulesMock) {
      await prisma.seoRobotsRule.create({
        data: {
          pathPattern: rule.pathPattern,
          ruleType: rule.ruleType,
          userAgent: rule.userAgent,
          enabled: rule.enabled,
          sortOrder: rule.sortOrder,
          createdAt: new Date(rule.createdAt),
          updatedAt: new Date(rule.updatedAt)
        }
      });
    }
  }

  if (!(await prisma.seoSitemapEntry.count())) {
    for (const entry of seoSitemapEntriesMock) {
      await prisma.seoSitemapEntry.create({
        data: {
          path: entry.path,
          changeFrequency: entry.changeFrequency,
          priority: entry.priority,
          lastModified: new Date(entry.lastModified),
          enabled: entry.enabled,
          sourceType: entry.sourceType,
          sourceId: entry.sourceId,
          createdAt: new Date(entry.createdAt),
          updatedAt: new Date(entry.updatedAt)
        }
      });
    }
  }

  if (!(await prisma.seoRedirect.count())) {
    for (const redirect of seoRedirectsMock) {
      await prisma.seoRedirect.create({
        data: {
          fromPath: redirect.fromPath,
          toPath: redirect.toPath,
          statusCode: redirect.statusCode,
          enabled: redirect.enabled,
          hitCount: redirect.hitCount,
          lastHitAt: toDate(redirect.lastHitAt),
          createdAt: new Date(redirect.createdAt),
          updatedAt: new Date(redirect.updatedAt)
        }
      });
    }
  }

  initialized = true;

  void seoArticleCategoriesMock;
  void seoArticleTagsMock;
  void seoArticleTagRelationsMock;
}
