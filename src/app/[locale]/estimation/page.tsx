import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { isSeoLocale } from "../../../../config/i18n";
import { EstimationPageContent } from "@/components/pages/SeoStaticPages";
import { createMetadataFromIndexPolicy } from "@/modules/seo/lib/metadata";

type SeoEstimationPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: SeoEstimationPageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isSeoLocale(locale)) return { title: "Not Found" };
  const t = await getTranslations("Estimation");
  const seo = await createMetadataFromIndexPolicy(`/${locale}/estimation`, {
    title: t("hero.title"),
    description: t("hero.subtitle"),
    ogTitle: t("hero.title"),
    ogDescription: t("channels.description"),
    twitterTitle: t("hero.title"),
    twitterDescription: t("channels.description")
  });
  return seo.metadata;
}

export default async function SeoEstimationPage({ params }: SeoEstimationPageProps) {
  const { locale } = await params;
  if (!isSeoLocale(locale)) notFound();
  return <EstimationPageContent locale={locale} />;
}
