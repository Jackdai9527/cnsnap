import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { isSeoLocale } from "../../../../../../config/i18n";
import { SeoLocaleLink } from "@/components/seo/SeoLocaleLink";
import { Card, CardContent } from "@/components/ui/card";
import { SeoStructuredData } from "@/modules/seo/components/SeoStructuredData";
import { createBlogCategoryStructuredData, createBlogTaxonomyMetadata } from "@/modules/seo/lib/blog-metadata";
import { getSeoArticleCategoriesByLocale, getSeoArticlesByCategorySlugAndLocale } from "@/modules/seo/lib/article-store";

type LocalizedBlogCategoryPageProps = {
  params: Promise<{ locale: string; slug: string }>;
};

export async function generateMetadata({ params }: LocalizedBlogCategoryPageProps): Promise<Metadata> {
  const t = await getTranslations("blog.taxonomy");
  const { locale, slug } = await params;
  if (!isSeoLocale(locale)) return { title: "Not Found" };
  const result = await getSeoArticlesByCategorySlugAndLocale(slug, locale);
  if (!result.category) return { title: t("categoryNotFound") };
  return createBlogTaxonomyMetadata({
    title: result.category.seoTitle || result.category.name,
    description: result.category.seoDescription || result.category.description,
    pathname: `/${locale}/blog/category/${result.category.localizedSlug || result.category.slug}`
  });
}

export default async function LocalizedBlogCategoryPage({ params }: LocalizedBlogCategoryPageProps) {
  const t = await getTranslations("blog.taxonomy");
  const { locale, slug } = await params;
  if (!isSeoLocale(locale)) notFound();
  const [result, allCategories] = await Promise.all([
    getSeoArticlesByCategorySlugAndLocale(slug, locale),
    getSeoArticleCategoriesByLocale(locale)
  ]);
  if (!result.category) notFound();
  const structuredData = await createBlogCategoryStructuredData(result.category, locale);

  return (
    <main className="brand-page pb-14">
      <SeoStructuredData data={structuredData} />
      <section className="site-container py-10">
        <div className="rounded-[30px] border border-[#dfe7f1] bg-white p-6 shadow-[0_22px_60px_rgba(15,23,42,0.06)] md:p-8">
          <div className="label">{t("categoryHero")}</div>
          <h1 className="mt-2 text-4xl font-black text-[#101828]">{result.category.name}</h1>
          <p className="mt-3 max-w-3xl text-sm font-semibold leading-7 text-[#667085]">{result.category.description}</p>
        </div>
      </section>

      <section className="site-container py-4">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {result.articles.map((article) => (
            <SeoLocaleLink key={article.id} href={`/blog/${article.localizedSlug || article.slug}`} className="rounded-[26px] border border-[#dfe7f1] bg-white p-5 shadow-[0_16px_36px_rgba(15,23,42,0.05)] transition hover:border-[#0a83ff]">
              <div className="text-xl font-black text-[#101828]">{article.title}</div>
              <p className="mt-2 text-sm font-semibold leading-6 text-[#667085]">{article.excerpt}</p>
            </SeoLocaleLink>
          ))}
        </div>
      </section>

      <section className="site-container py-6">
        <h2 className="text-2xl font-black text-[#101828]">{t("relatedCategories")}</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {allCategories.filter((category) => category.id !== result.category?.id).slice(0, 4).map((category) => (
            <SeoLocaleLink key={category.id} href={`/blog/category/${category.localizedSlug || category.slug}`} className="rounded-[24px] border border-[#dfe7f1] bg-white p-5 shadow-[0_16px_36px_rgba(15,23,42,0.05)] transition hover:border-[#d9142f]">
              <div className="text-lg font-black text-[#101828]">{category.name}</div>
              <p className="mt-2 text-sm font-semibold leading-6 text-[#667085]">{category.description}</p>
            </SeoLocaleLink>
          ))}
        </div>
      </section>

      <section className="site-container py-8">
        <Card className="rounded-[28px] border-[#dfe7f1] bg-[linear-gradient(135deg,#fff1f2,#f7fbff)] shadow-[0_18px_45px_rgba(15,23,42,0.05)]">
          <CardContent className="flex flex-col gap-3 p-6 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-xl font-black text-[#101828]">{t("needWorkflowTitle")}</div>
              <p className="mt-2 text-sm font-semibold leading-6 text-[#667085]">{t("needWorkflowDescription")}</p>
            </div>
            <SeoLocaleLink href="/" className="inline-flex items-center gap-2 rounded-full bg-[#d9142f] px-5 py-3 text-sm font-black text-white hover:bg-[#b90f25]">
              {t("startShopping")}
              <ArrowRight size={16} />
            </SeoLocaleLink>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
