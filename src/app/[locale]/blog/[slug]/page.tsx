import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { isSeoLocale } from "../../../../../config/i18n";
import { SeoBlogArticleContent } from "@/components/pages/SeoBlogArticlePage";
import { getSeoArticleForLocale } from "@/modules/seo/lib/article-store";
import { createBlogArticleMetadata } from "@/modules/seo/lib/blog-metadata";
import { getSeoArticlePath } from "@/modules/seo/lib/locale-routing";

type SeoBlogArticlePageProps = {
  params: Promise<{ locale: string; slug: string }>;
};

export async function generateMetadata({ params }: SeoBlogArticlePageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isSeoLocale(locale)) return { title: "Not Found" };
  const resolved = await getSeoArticleForLocale(slug, locale);
  if (!resolved || resolved.article.status !== "published") return { title: "Article Not Found" };
  return createBlogArticleMetadata(resolved.article, {
    canonicalPathname: `/${locale}/blog/${slug}`,
    requestedLocale: locale
  });
}

export default async function SeoBlogArticlePage({ params }: SeoBlogArticlePageProps) {
  const { locale, slug } = await params;
  if (!isSeoLocale(locale)) notFound();
  const resolved = await getSeoArticleForLocale(slug, locale);
  if (!resolved || resolved.article.status !== "published") notFound();

  const localizedPath = getSeoArticlePath(resolved.article, resolved.article.language as typeof locale);
  if (!resolved.fallback && localizedPath !== `/${locale}/blog/${slug}`) {
    redirect(localizedPath);
  }

  return (
    <SeoBlogArticleContent
      article={resolved.article}
      canonicalPathname={`/${locale}/blog/${slug}`}
      rootPathname={`/${locale}`}
      blogPathname={`/${locale}/blog`}
    />
  );
}
