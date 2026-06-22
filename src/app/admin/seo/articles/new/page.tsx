import { requirePermission } from "@/lib/admin-session";
import { getEnabledSeoLocalesRuntime } from "@/lib/i18n/locale-config-store";
import { getTranslations } from "next-intl/server";
import { createSeoArticleMock, calculateReadingTimeMock, generateSeoSlugMock, generateTableOfContentsMock } from "@/app/admin/seo/actions";
import { SeoArticleEditorForm } from "@/modules/seo/components/SeoArticleEditorForm";
import { getSeoArticleCategories, getSeoArticles, getSeoArticleTags } from "@/modules/seo/lib/article-store";

type AdminSeoArticleNewPageProps = {
  searchParams?: Promise<{ sourceId?: string; locale?: string }>;
};

export default async function AdminSeoArticleNewPage({ searchParams }: AdminSeoArticleNewPageProps) {
  await requirePermission("seo.manage");
  const t = await getTranslations("seo.articlePages.new");
  const params = await searchParams;
  const [categories, tags, articles, seoLocales] = await Promise.all([
    getSeoArticleCategories(),
    getSeoArticleTags(),
    getSeoArticles(),
    getEnabledSeoLocalesRuntime()
  ]);
  const sourceArticle = params?.sourceId ? articles.find((item) => item.id === params.sourceId) ?? null : null;
  const locale = params?.locale && seoLocales.includes(params.locale as never) ? params.locale : undefined;
  const articleDraft = sourceArticle && locale
    ? {
        title: sourceArticle.title,
        slug: sourceArticle.slug,
        localizedSlug: sourceArticle.localizedSlug || sourceArticle.slug,
        excerpt: sourceArticle.excerpt,
        content: sourceArticle.content,
        coverImage: sourceArticle.coverImage || "",
        categoryId: sourceArticle.categoryId,
        tagIds: sourceArticle.tagIds,
        status: "draft" as const,
        language: locale,
        translationGroupId: sourceArticle.translationGroupId,
        sourceLanguage: sourceArticle.language,
        translatedFromId: sourceArticle.id,
        seoTitle: sourceArticle.seoTitle || "",
        seoDescription: sourceArticle.seoDescription || "",
        canonicalUrl: "",
        robots: sourceArticle.robots,
        ogTitle: sourceArticle.ogTitle || "",
        ogDescription: sourceArticle.ogDescription || "",
        ogImage: sourceArticle.ogImage || "",
        twitterTitle: sourceArticle.twitterTitle || "",
        twitterDescription: sourceArticle.twitterDescription || "",
        twitterImage: sourceArticle.twitterImage || "",
        faqJson: sourceArticle.faqJson || "",
        relatedArticleIds: sourceArticle.relatedArticleIds || [],
        relatedLinksJson: sourceArticle.relatedLinksJson || "",
        ctaType: sourceArticle.ctaType
      }
    : null;

  return (
    <div className="space-y-6">
      <section className="admin-card p-6">
        <div className="text-[11px] font-black uppercase tracking-[0.18em] text-[#ff1d5e]">{t("kicker")}</div>
        <h1 className="mt-2 text-3xl font-black text-slate-950">{t("title")}</h1>
        <p className="mt-2 max-w-3xl text-sm font-semibold leading-7 text-slate-500">
          {t("description")}
        </p>
      </section>

      <SeoArticleEditorForm
        initialValues={articleDraft}
        categories={categories}
        tags={tags}
        relatedArticles={articles}
        seoLocales={seoLocales}
        onSave={createSeoArticleMock}
        onGenerateSlug={generateSeoSlugMock}
        onCalculateReadingTime={calculateReadingTimeMock}
        onGenerateTableOfContents={generateTableOfContentsMock}
      />
    </div>
  );
}
