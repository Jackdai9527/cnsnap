import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isSeoLocale } from "../../../../config/i18n";
import { DiyOrderPageContent } from "@/components/pages/SeoStaticPages";
import { createMetadataFromIndexPolicy } from "@/modules/seo/lib/metadata";

type SeoDiyOrderPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: SeoDiyOrderPageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isSeoLocale(locale)) return { title: "Not Found" };
  const seo = await createMetadataFromIndexPolicy(`/${locale}/diy-order`);
  return seo.metadata;
}

export default async function SeoDiyOrderPage({ params }: SeoDiyOrderPageProps) {
  const { locale } = await params;
  if (!isSeoLocale(locale)) notFound();
  return <DiyOrderPageContent locale={locale} />;
}
