import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/admin-session";
import { getEnabledFrontendLocalesRuntime } from "@/lib/i18n/locale-config-store";
import { getTranslations } from "next-intl/server";
import { SeoArticleEditorForm } from "@/modules/seo/components/SeoArticleEditorForm";
import { getSeoArticleById, getSeoArticleCategories, getSeoArticles, getSeoArticleTags, getSeoArticleTranslations } from "@/modules/seo/lib/article-store";
import { calculateReadingTimeMock, generateSeoSlugMock, generateTableOfContentsMock, updateSeoArticleMock } from "@/app/admin/seo/actions";

type AdminSeoArticleEditPageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminSeoArticleEditPage({ params }: AdminSeoArticleEditPageProps) {
  await requirePermission("seo.manage");
  const t = await getTranslations("seo.articlePages.edit");
  const { id } = await params;
  const [article, categories, tags, articles, seoLocales] = await Promise.all([
    getSeoArticleById(id),
    getSeoArticleCategories(),
    getSeoArticleTags(),
    getSeoArticles(),
    getEnabledFrontendLocalesRuntime()
  ]);

  if (!article) notFound();
  const translations = await getSeoArticleTranslations(article.translationGroupId);

  return (
    <div className="space-y-6">
      <section className="admin-card p-6">
        <div className="text-[11px] font-black uppercase tracking-[0.18em] text-[#ff1d5e]">{t("kicker")}</div>
        <h1 className="mt-2 text-3xl font-black text-slate-950">{t("title")}</h1>
        <p className="mt-2 max-w-3xl text-sm font-semibold leading-7 text-slate-500">
          {t("description")}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {translations.map((item) => (
            <a
              key={item.id}
              href={`/admin/seo/articles/${item.id}/edit`}
              className={`rounded-full px-4 py-2 text-xs font-black ${item.id === article.id ? "bg-[#ff1d5e] text-white" : "border border-slate-200 bg-white text-slate-700"}`}
            >
              {item.language}
            </a>
          ))}
          {seoLocales.filter((locale) => !translations.some((item) => item.language === locale)).map((locale) => (
            <a
              key={locale}
              href={`/admin/seo/articles/new?sourceId=${article.id}&locale=${locale}`}
              className="rounded-full border border-dashed border-[#ff1d5e] bg-white px-4 py-2 text-xs font-black text-[#ff1d5e]"
            >
              {t("createTranslation", { locale })}
            </a>
          ))}
        </div>
      </section>

      <SeoArticleEditorForm
        article={article}
        categories={categories}
        tags={tags}
        relatedArticles={articles}
        seoLocales={seoLocales}
        onSave={updateSeoArticleMock}
        onGenerateSlug={generateSeoSlugMock}
        onCalculateReadingTime={calculateReadingTimeMock}
        onGenerateTableOfContents={generateTableOfContentsMock}
      />
    </div>
  );
}
