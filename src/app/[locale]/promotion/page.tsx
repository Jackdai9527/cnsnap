import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isSeoLocale } from "../../../../config/i18n";
import { PromotionPageContent } from "@/components/pages/SeoStaticPages";
import { createMetadataFromIndexPolicy } from "@/modules/seo/lib/metadata";

type SeoPromotionPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: SeoPromotionPageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isSeoLocale(locale)) return { title: "Not Found" };
  const seo = await createMetadataFromIndexPolicy(`/${locale}/promotion`);
  return seo.metadata;
}

export default async function SeoPromotionPage({ params }: SeoPromotionPageProps) {
  const { locale } = await params;
  if (!isSeoLocale(locale)) notFound();
  return <PromotionPageContent locale={locale} />;
}
