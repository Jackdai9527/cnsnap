import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { isSeoLocale } from "../../../../../../config/i18n";
import { SeoLocaleLink } from "@/components/seo/SeoLocaleLink";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { createMetadataFromIndexPolicy } from "@/modules/seo/lib/metadata";
import { withSeoLocale } from "@/modules/seo/lib/locale-routing";
import { getHelpCategoryAlternatesBySlug, getHelpCategoryForLocale } from "@/lib/help-center-service";

type SeoHelpCategoryPageProps = {
  params: Promise<{ locale: string; slug: string }>;
};

export async function generateMetadata({ params }: SeoHelpCategoryPageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isSeoLocale(locale)) return { title: "Not Found" };

  const entry = await getHelpCategoryForLocale(locale, slug);
  if (!entry) return { title: "Not Found" };

  const seo = await createMetadataFromIndexPolicy(`/${locale}/help/category/${slug}`, {
    title: entry.category.title,
    description: entry.category.description,
    ogTitle: entry.category.title,
    ogDescription: entry.category.description,
    twitterTitle: entry.category.title,
    twitterDescription: entry.category.description
  });

  const alternates = await getHelpCategoryAlternatesBySlug(slug);
  const canonicalUrl = typeof seo.metadata.alternates?.canonical === "string" ? seo.metadata.alternates.canonical : undefined;
  const baseUrl = canonicalUrl ? new URL(canonicalUrl).origin : undefined;
  const languageAlternates = Object.fromEntries(
    alternates.map((item) => [
      item.locale,
      baseUrl
        ? `${baseUrl}${withSeoLocale(item.locale as never, `/help/category/${item.category.slug || slug}`)}`
        : withSeoLocale(item.locale as never, `/help/category/${item.category.slug || slug}`)
    ])
  );

  return {
    ...seo.metadata,
    alternates: seo.metadata.alternates?.canonical
      ? {
          canonical: seo.metadata.alternates.canonical,
          languages: {
            ...languageAlternates,
            "x-default": baseUrl
              ? `${baseUrl}${withSeoLocale("en", `/help/category/${entry.category.slug || slug}`)}`
              : withSeoLocale("en", `/help/category/${entry.category.slug || slug}`)
          }
        }
      : seo.metadata.alternates
  };
}

export default async function SeoHelpCategoryPage({ params }: SeoHelpCategoryPageProps) {
  const { locale, slug } = await params;
  if (!isSeoLocale(locale)) notFound();

  const entry = await getHelpCategoryForLocale(locale, slug);
  if (!entry) notFound();
  const t = await getTranslations({ locale, namespace: "HelpCenter" });

  return (
    <main className="brand-page pb-12">
      <section className="frontend-page-shell">
        <div className="frontend-page-inner">
          <div className="label">{t("categoriesSection.eyebrow")}</div>
          <h1 className="frontend-title">{entry.category.title}</h1>
          <p className="mt-4 max-w-3xl text-sm font-semibold leading-7 text-[#667085]">
            {entry.category.description}
          </p>
        </div>
      </section>

      {entry.articles.length ? (
        <section className="site-container py-8">
          <div className="grid gap-4 md:grid-cols-2">
            {entry.articles.map((article) => (
              <SeoLocaleLink key={article.id} href={`/help/${article.slug}`} className="rounded-[24px] border border-[#dfe7f1] bg-white p-5 shadow-[0_16px_36px_rgba(15,23,42,0.05)] transition hover:border-[#0a83ff]">
                <div className="text-xs font-black uppercase text-[#0a83ff]">{article.category}</div>
                <h2 className="mt-2 text-lg font-black text-[#101828]">{article.title}</h2>
                <p className="mt-2 text-sm font-semibold leading-6 text-[#667085]">{article.summary}</p>
              </SeoLocaleLink>
            ))}
          </div>
        </section>
      ) : null}

      {entry.faqs.length ? (
        <section className="site-container py-6">
          <div className="mb-4">
            <div className="label">{t("faqSection.eyebrow")}</div>
            <h2 className="mt-2 text-2xl font-black text-[#101828]">{t("faqSection.title")}</h2>
          </div>
          <Accordion>
            {entry.faqs.map((faq, index) => (
              <AccordionItem key={faq.id} open={index === 0 ? true : undefined}>
                <AccordionTrigger>{faq.question}</AccordionTrigger>
                <AccordionContent>{faq.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>
      ) : null}
    </main>
  );
}
