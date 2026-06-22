import { requirePermission } from "@/lib/admin-session";
import { getEnabledSeoLocalesRuntime } from "@/lib/i18n/locale-config-store";
import { getTranslations } from "next-intl/server";
import { createSeoLandingPageMock, generateSeoLandingPathMock, generateSeoSlugMock } from "@/app/admin/seo/actions";
import { SeoLandingPageEditorForm } from "@/modules/seo/components/SeoLandingPageEditorForm";
import { getSeoLandingPages } from "@/modules/seo/lib/article-store";

type AdminSeoLandingPageNewPageProps = {
  searchParams?: Promise<{ sourceId?: string; locale?: string }>;
};

export default async function AdminSeoLandingPageNewPage({ searchParams }: AdminSeoLandingPageNewPageProps) {
  await requirePermission("seo.manage");
  const t = await getTranslations("seo.landingPagePages.new");
  const params = await searchParams;
  const [seoLocales, pages] = await Promise.all([getEnabledSeoLocalesRuntime(), getSeoLandingPages()]);
  const sourcePage = params?.sourceId ? pages.find((item) => item.id === params.sourceId) ?? null : null;
  const locale = params?.locale && seoLocales.includes(params.locale as never) ? params.locale : undefined;
  const pageDraft = sourcePage && locale
    ? {
        title: sourcePage.title,
        slug: sourcePage.slug,
        localizedPath: sourcePage.localizedPath || sourcePage.path,
        type: sourcePage.type,
        path: sourcePage.path,
        heroTitle: sourcePage.heroTitle,
        heroSubtitle: sourcePage.heroSubtitle || "",
        content: sourcePage.content,
        sectionsJson: sourcePage.sectionsJson || "",
        faqJson: sourcePage.faqJson || "",
        ctaText: sourcePage.ctaText || "",
        ctaHref: sourcePage.ctaHref || "",
        seoTitle: sourcePage.seoTitle || "",
        seoDescription: sourcePage.seoDescription || "",
        canonicalUrl: "",
        robots: sourcePage.robots,
        ogTitle: sourcePage.ogTitle || "",
        ogDescription: sourcePage.ogDescription || "",
        ogImage: sourcePage.ogImage || "",
        twitterTitle: sourcePage.twitterTitle || "",
        twitterDescription: sourcePage.twitterDescription || "",
        twitterImage: sourcePage.twitterImage || "",
        structuredDataJson: sourcePage.structuredDataJson || "",
        language: locale,
        sourceLanguage: sourcePage.language,
        translatedFromId: sourcePage.id,
        status: "draft" as const,
        translationGroupId: sourcePage.translationGroupId,
        publishedAt: undefined
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

      <SeoLandingPageEditorForm initialValues={pageDraft} seoLocales={seoLocales} onSave={createSeoLandingPageMock} onGenerateSlug={generateSeoSlugMock} onGeneratePath={generateSeoLandingPathMock} />
    </div>
  );
}
