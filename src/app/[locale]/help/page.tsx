import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { isSeoLocale } from "../../../../config/i18n";
import { HelpPageContent } from "@/components/pages/SeoStaticPages";
import { createMetadataFromIndexPolicy } from "@/modules/seo/lib/metadata";

type SeoHelpPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: SeoHelpPageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isSeoLocale(locale)) return { title: "Not Found" };
  const t = await getTranslations({ locale, namespace: "HelpCenter" });
  const seo = await createMetadataFromIndexPolicy(`/${locale}/help`, {
    title: t("search.eyebrow"),
    description: t("articlesSection.description"),
    ogTitle: t("search.eyebrow"),
    ogDescription: t("search.subtitle"),
    twitterTitle: t("search.eyebrow"),
    twitterDescription: t("search.subtitle")
  });
  return seo.metadata;
}

export default async function SeoHelpPage({ params }: SeoHelpPageProps) {
  const { locale } = await params;
  if (!isSeoLocale(locale)) notFound();
  return <HelpPageContent locale={locale} />;
}
