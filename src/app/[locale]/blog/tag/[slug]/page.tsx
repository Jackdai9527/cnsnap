import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { isSeoLocale } from "../../../../../../config/i18n";
import { SeoLocaleLink } from "@/components/seo/SeoLocaleLink";
import { Card, CardContent } from "@/components/ui/card";
import { SeoStructuredData } from "@/modules/seo/components/SeoStructuredData";
import { createBlogTagStructuredData, createBlogTaxonomyMetadata } from "@/modules/seo/lib/blog-metadata";
import { getSeoArticlesByTagSlug } from "@/modules/seo/lib/article-store";

type LocalizedBlogTagPageProps = {
  params: Promise<{ locale: string; slug: string }>;
};

export async function generateMetadata({ params }: LocalizedBlogTagPageProps): Promise<Metadata> {
  const t = await getTranslations("blog.taxonomy");
  const { locale, slug } = await params;
  if (!isSeoLocale(locale)) return { title: "Not Found" };
  const result = await getSeoArticlesByTagSlug(slug);
  if (!result.tag) return { title: t("tagNotFound") };
  return createBlogTaxonomyMetadata({
    title: t("tagMetaTitle", { name: result.tag.name }),
    description: result.tag.description || t("tagMetaDescription", { name: result.tag.name }),
    pathname: `/${locale}/blog/tag/${result.tag.slug}`
  });
}

export default async function LocalizedBlogTagPage({ params }: LocalizedBlogTagPageProps) {
  const t = await getTranslations("blog.taxonomy");
  const { locale, slug } = await params;
  if (!isSeoLocale(locale)) notFound();
  const result = await getSeoArticlesByTagSlug(slug);
  if (!result.tag) notFound();
  const structuredData = await createBlogTagStructuredData(result.tag);

  return (
    <main className="brand-page pb-14">
      <SeoStructuredData data={structuredData} />
      <section className="site-container py-10">
        <div className="rounded-[30px] border border-[#dfe7f1] bg-white p-6 shadow-[0_22px_60px_rgba(15,23,42,0.06)] md:p-8">
          <div className="label">{t("tagHero")}</div>
          <h1 className="mt-2 text-4xl font-black text-[#101828]">{t("tagTitle", { name: result.tag.name })}</h1>
          <p className="mt-3 max-w-3xl text-sm font-semibold leading-7 text-[#667085]">{result.tag.description || t("publishedRelated", { name: result.tag.name })}</p>
        </div>
      </section>

      <section className="site-container py-4">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {result.articles.map((article) => (
            <SeoLocaleLink key={article.id} href={`/blog/${article.localizedSlug || article.slug}`} className="rounded-[26px] border border-[#dfe7f1] bg-white p-5 shadow-[0_16px_36px_rgba(15,23,42,0.05)] transition hover:border-[#0a83ff]">
              <div className="text-xs font-black uppercase tracking-[0.12em] text-[#d9142f]">{article.category?.name || t("general")}</div>
              <div className="mt-3 text-xl font-black text-[#101828]">{article.title}</div>
              <p className="mt-2 text-sm font-semibold leading-6 text-[#667085]">{article.excerpt}</p>
            </SeoLocaleLink>
          ))}
        </div>
      </section>

      <section className="site-container py-8">
        <Card className="rounded-[28px] border-[#dfe7f1] bg-[linear-gradient(135deg,#fff1f2,#f7fbff)] shadow-[0_18px_45px_rgba(15,23,42,0.05)]">
          <CardContent className="flex flex-col gap-3 p-6 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-xl font-black text-[#101828]">{t("moveIntoActionTitle")}</div>
              <p className="mt-2 text-sm font-semibold leading-6 text-[#667085]">{t("moveIntoActionDescription")}</p>
            </div>
            <SeoLocaleLink href="/estimation" className="inline-flex items-center gap-2 rounded-full bg-[#d9142f] px-5 py-3 text-sm font-black text-white hover:bg-[#b90f25]">
              {t("estimateShipping")}
              <ArrowRight size={16} />
            </SeoLocaleLink>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
