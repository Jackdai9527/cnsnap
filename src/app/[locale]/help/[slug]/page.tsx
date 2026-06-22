import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { getSeoLocaleByAppLocale, isSeoLocale } from "../../../../../config/i18n";
import { getHelpArticleAlternatesBySlug, getHelpArticleForLocale } from "@/lib/help-center-service";
import { createMetadataFromIndexPolicy } from "@/modules/seo/lib/metadata";
import { withSeoLocale } from "@/modules/seo/lib/locale-routing";
import { SeoLocaleLink } from "@/components/seo/SeoLocaleLink";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

type SeoHelpArticlePageProps = {
  params: Promise<{ locale: string; slug: string }>;
};

export async function generateMetadata({ params }: SeoHelpArticlePageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isSeoLocale(locale)) return { title: "Not Found" };

  const entry = await getHelpArticleForLocale(locale, slug);
  if (!entry) return { title: "Not Found" };

  const t = await getTranslations({ locale, namespace: "HelpCenter" });
  const seo = await createMetadataFromIndexPolicy(`/${locale}/help/${slug}`, {
    title: entry.article.title,
    description: entry.article.summary || t("articlesSection.description"),
    ogTitle: entry.article.title,
    ogDescription: entry.article.summary || t("articlesSection.description"),
    twitterTitle: entry.article.title,
    twitterDescription: entry.article.summary || t("articlesSection.description")
  });

  const alternates = await getHelpArticleAlternatesBySlug(slug);
  const canonicalUrl = typeof seo.metadata.alternates?.canonical === "string" ? seo.metadata.alternates.canonical : undefined;
  const baseUrl = canonicalUrl ? new URL(canonicalUrl).origin : undefined;
  const languageAlternates = Object.fromEntries(
    alternates.flatMap((item) => {
      const seoLocale = isSeoLocale(item.locale) ? item.locale : getSeoLocaleByAppLocale(item.locale);
      if (!seoLocale) return [];
      const localizedPath = withSeoLocale(seoLocale, `/help/${item.article.slug}`);
      return [[seoLocale, baseUrl ? `${baseUrl}${localizedPath}` : localizedPath] as const];
    })
  );

  return {
    ...seo.metadata,
    alternates: seo.metadata.alternates?.canonical
      ? {
          canonical: seo.metadata.alternates.canonical,
          languages: {
            ...languageAlternates,
            ...(languageAlternates.en ? { "x-default": languageAlternates.en } : {})
          }
        }
      : seo.metadata.alternates
  };
}

export default async function SeoHelpArticlePage({ params }: SeoHelpArticlePageProps) {
  const { locale, slug } = await params;
  if (!isSeoLocale(locale)) notFound();

  const entry = await getHelpArticleForLocale(locale, slug);
  if (!entry) notFound();
  const t = await getTranslations({ locale, namespace: "HelpCenter.articlePage" });

  return (
    <main className="brand-page help-article-page pb-16 md:pb-20">
      <section className="frontend-page-shell">
        <div className="frontend-page-inner">
          <div className="label">{entry.article.category}</div>
          <h1 className="frontend-title">{entry.article.title}</h1>
          {entry.article.summary ? (
            <p className="mt-4 max-w-3xl text-sm font-semibold leading-7 text-[#667085]">
              {entry.article.summary}
            </p>
          ) : null}
          <div className="mt-4 flex flex-wrap items-center gap-3 text-xs font-bold text-[#98a2b3]">
            <Link href={`/${locale}/help`} className="text-[#0a83ff] hover:text-[#d9142f]">
              {t("backToHelp")}
            </Link>
            <span>{t("updated", { date: entry.article.updatedAt })}</span>
          </div>
        </div>
      </section>
      <article className="site-container py-10 md:py-14">
        <div className="mx-auto max-w-[900px]">
          <div className="content-page-panel help-article-content max-w-none text-[#667085]" dangerouslySetInnerHTML={{ __html: entry.article.content }} />
        </div>
      </article>
      {entry.relatedFaqs.length ? (
        <section className="site-container py-6">
          <div className="mx-auto max-w-[900px] border-t border-[#e5e7eb] pt-10">
            <div className="label">{t("faqEyebrow")}</div>
            <h2 className="mt-2 text-2xl font-black text-[#101828]">{t("faqTitle")}</h2>
            <Accordion className="mt-5">
              {entry.relatedFaqs.map((faq, index) => (
                <AccordionItem key={faq.id} open={index === 0 ? true : undefined}>
                  <AccordionTrigger>{faq.question}</AccordionTrigger>
                  <AccordionContent>{faq.answer}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>
      ) : null}
      {entry.relatedArticles.length ? (
        <section className="site-container py-6">
          <div className="mx-auto max-w-[900px] border-t border-[#e5e7eb] pt-10">
            <div className="label">{t("guidesEyebrow")}</div>
            <h2 className="mt-2 text-2xl font-black text-[#101828]">{t("guidesTitle")}</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {entry.relatedArticles.map((item) => (
                <SeoLocaleLink key={item.id} href={`/help/${item.slug}`} className="rounded-[22px] border border-[#e5e7eb] bg-white/86 p-5 transition hover:border-[#0a83ff]">
                  <div className="text-xs font-black uppercase text-[#0a83ff]">{item.category}</div>
                  <h3 className="mt-2 text-lg font-black text-[#101828]">{item.title}</h3>
                  <p className="mt-2 text-sm font-semibold leading-6 text-[#667085]">{item.summary}</p>
                </SeoLocaleLink>
              ))}
            </div>
          </div>
        </section>
      ) : null}
      <section className="site-container py-8">
        <div className="rounded-[28px] bg-[#101828] p-6 text-white shadow-[0_24px_70px_rgba(15,23,42,0.18)]">
          <h2 className="text-2xl font-black">{t("supportTitle")}</h2>
          <p className="mt-3 max-w-2xl text-sm font-semibold leading-7 text-white/72">
            {t("supportDescription")}
          </p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <SeoLocaleLink href="/help" className="btn-secondary !border-white/20 !bg-white !text-[#101828]">
              {t("backToHelp")}
            </SeoLocaleLink>
            <LinkButton href="/account/tickets/new?category=other" label={t("createTicket")} />
          </div>
        </div>
      </section>
    </main>
  );
}

function LinkButton({ href, label }: { href: string; label: string }) {
  return (
    <a href={href} className="btn-secondary !border-white/20 !bg-white/10 !text-white hover:!bg-white/15">
      {label}
    </a>
  );
}
