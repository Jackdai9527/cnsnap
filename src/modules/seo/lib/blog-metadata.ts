import type { Metadata } from "next";
import { getEnabledSeoLocales, type SeoLocale } from "../../../../config/i18n";
import { createBreadcrumbSchema, createFAQSchema, createWebPageSchema, createArticleSchema, parseFaqJson } from "@/modules/seo/lib/structured-data";
import { getSeoArticlePath } from "@/modules/seo/lib/locale-routing";
import { getHreflangAlternates } from "@/modules/seo/lib/hreflang";
import { getSeoArticleTranslations, getSeoSettingsFromStore } from "@/modules/seo/lib/article-store";
import type { SeoArticleRecord, SeoArticleCategory, SeoArticleTag } from "@/modules/seo/types";

function absoluteUrl(baseUrl: string, pathname: string) {
  const normalizedBase = baseUrl.replace(/\/+$/, "");
  return pathname === "/" ? normalizedBase : `${normalizedBase}${pathname}`;
}

export async function createBlogIndexMetadata(pathname = "/en/blog"): Promise<Metadata> {
  const settings = await getSeoSettingsFromStore();
  const canonical = absoluteUrl(settings.canonicalBaseUrl, pathname);
  return {
    title: settings.titleTemplate.replace("%s", "Blog"),
    description: "Guides for shopping agents, shipping estimation, forwarding, DIY orders, restricted items, and platform buying workflows.",
    alternates: {
      canonical,
      languages: {
        ...Object.fromEntries(
          getEnabledSeoLocales().map((locale) => [locale, absoluteUrl(settings.canonicalBaseUrl, `/${locale}/blog`)])
        ),
        "x-default": absoluteUrl(settings.canonicalBaseUrl, "/en/blog")
      }
    },
    robots: { index: true, follow: true },
    openGraph: {
      title: "CNSnap Blog",
      description: "Guides for shopping agents, shipping estimation, forwarding, DIY orders, restricted items, and platform buying workflows.",
      url: canonical,
      images: [absoluteUrl(settings.canonicalBaseUrl, settings.defaultOgImage)]
    },
    twitter: {
      card: "summary_large_image",
      title: "CNSnap Blog",
      description: "Guides for shopping agents, shipping estimation, forwarding, DIY orders, restricted items, and platform buying workflows.",
      images: [absoluteUrl(settings.canonicalBaseUrl, settings.defaultTwitterImage)]
    }
  };
}

export async function createBlogArticleMetadata(
  article: SeoArticleRecord,
  options?: { canonicalPathname?: string; requestedLocale?: SeoLocale }
): Promise<Metadata> {
  const settings = await getSeoSettingsFromStore();
  const canonical = absoluteUrl(
    settings.canonicalBaseUrl,
    options?.canonicalPathname || getSeoArticlePath(article, article.language as never)
  );
  const title = article.seoTitle || article.title;
  const description = article.seoDescription || article.excerpt;
  const alternates = getHreflangAlternates({
    type: "article",
    entity: article,
    siblings: await getSeoArticleTranslations(article.translationGroupId),
    baseUrl: settings.canonicalBaseUrl
  });
  const robots = article.robots === "index,follow"
    ? { index: true, follow: true }
    : article.robots === "noindex,follow"
      ? { index: false, follow: true }
      : { index: false, follow: false };

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
    robots,
    openGraph: {
      title: article.ogTitle || title,
      description: article.ogDescription || description,
      url: canonical,
      images: [absoluteUrl(settings.canonicalBaseUrl, article.ogImage || article.coverImage || settings.defaultOgImage)]
    },
    twitter: {
      card: "summary_large_image",
      title: article.twitterTitle || article.ogTitle || title,
      description: article.twitterDescription || article.ogDescription || description,
      images: [absoluteUrl(settings.canonicalBaseUrl, article.twitterImage || article.ogImage || article.coverImage || settings.defaultTwitterImage)]
    }
  };
}

export async function createBlogTaxonomyMetadata(input: { title: string; description: string; pathname: string }): Promise<Metadata> {
  const settings = await getSeoSettingsFromStore();
  const canonical = absoluteUrl(settings.canonicalBaseUrl, input.pathname);
  const strippedPath = input.pathname.replace(/^\/[a-z]{2}(?:-[A-Z]{2})?(?=\/|$)/, "") || "/";

  return {
    title: settings.titleTemplate.replace("%s", input.title),
    description: input.description,
    alternates: {
      canonical,
      languages: {
        ...Object.fromEntries(
          getEnabledSeoLocales().map((locale) => [locale, absoluteUrl(settings.canonicalBaseUrl, `/${locale}${strippedPath}`)])
        ),
        "x-default": absoluteUrl(settings.canonicalBaseUrl, `/en${strippedPath}`)
      }
    },
    robots: { index: true, follow: true },
    openGraph: {
      title: input.title,
      description: input.description,
      url: canonical,
      images: [absoluteUrl(settings.canonicalBaseUrl, settings.defaultOgImage)]
    },
    twitter: {
      card: "summary_large_image",
      title: input.title,
      description: input.description,
      images: [absoluteUrl(settings.canonicalBaseUrl, settings.defaultTwitterImage)]
    }
  };
}

export async function createBlogIndexStructuredData() {
  const settings = await getSeoSettingsFromStore();
  const rootPath = "/en";
  const localizedPath = "/en/blog";
  const canonical = absoluteUrl(settings.canonicalBaseUrl, localizedPath);
  return [
    createWebPageSchema({
      name: "CNSnap Blog",
      url: canonical,
      description: "Guides for shopping agents, shipping estimation, forwarding, DIY orders, restricted items, and platform buying workflows."
    }),
    createBreadcrumbSchema([
      { name: "Home", url: absoluteUrl(settings.canonicalBaseUrl, rootPath) },
      { name: "Blog", url: canonical }
    ])
  ];
}

export async function createBlogArticleStructuredData(article: SeoArticleRecord, options?: { canonicalPathname?: string; blogPathname?: string; rootPathname?: string }) {
  const settings = await getSeoSettingsFromStore();
  const rootPath = options?.rootPathname || "/en";
  const blogPath = options?.blogPathname || "/en/blog";
  const canonical = absoluteUrl(
    settings.canonicalBaseUrl,
    options?.canonicalPathname || getSeoArticlePath(article, article.language as never)
  );
  const faqItems = parseFaqJson(article.faqJson);
  const articleSchema = {
    ...createArticleSchema(),
    headline: article.title,
    description: article.seoDescription || article.excerpt,
    datePublished: article.publishedAt,
    dateModified: article.updatedAt,
    author: {
      "@type": "Organization",
      name: article.authorName
    },
    mainEntityOfPage: canonical,
    image: absoluteUrl(settings.canonicalBaseUrl, article.ogImage || article.coverImage || settings.defaultOgImage)
  };

  const schemas: Record<string, unknown>[] = [
    articleSchema,
    createBreadcrumbSchema([
      { name: "Home", url: absoluteUrl(settings.canonicalBaseUrl, rootPath) },
      { name: "Blog", url: absoluteUrl(settings.canonicalBaseUrl, blogPath) },
      { name: article.title, url: canonical }
    ])
  ];

  if (faqItems.length) {
    schemas.push(createFAQSchema(faqItems));
  }

  return schemas;
}

export async function createBlogCategoryStructuredData(category: SeoArticleCategory, locale: SeoLocale = "en") {
  const settings = await getSeoSettingsFromStore();
  const rootPath = `/${locale}`;
  const blogPath = `/${locale}/blog`;
  const slug = category.localizedSlug || category.slug;
  const canonical = absoluteUrl(settings.canonicalBaseUrl, `/${locale}/blog/category/${slug}`);
  return [
    createBreadcrumbSchema([
      { name: "Home", url: absoluteUrl(settings.canonicalBaseUrl, rootPath) },
      { name: "Blog", url: absoluteUrl(settings.canonicalBaseUrl, blogPath) },
      { name: category.name, url: canonical }
    ])
  ];
}

export async function createBlogTagStructuredData(tag: SeoArticleTag) {
  const settings = await getSeoSettingsFromStore();
  const rootPath = "/en";
  const blogPath = "/en/blog";
  const canonical = absoluteUrl(settings.canonicalBaseUrl, `/en/blog/tag/${tag.slug}`);
  return [
    createBreadcrumbSchema([
      { name: "Home", url: absoluteUrl(settings.canonicalBaseUrl, rootPath) },
      { name: "Blog", url: absoluteUrl(settings.canonicalBaseUrl, blogPath) },
      { name: tag.name, url: canonical }
    ])
  ];
}
