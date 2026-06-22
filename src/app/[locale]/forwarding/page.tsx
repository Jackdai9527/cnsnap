import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isSeoLocale } from "../../../../config/i18n";
import { ForwardingPageContent } from "@/components/pages/SeoStaticPages";
import { createMetadataFromIndexPolicy } from "@/modules/seo/lib/metadata";

type SeoForwardingPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: SeoForwardingPageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isSeoLocale(locale)) return { title: "Not Found" };
  const seo = await createMetadataFromIndexPolicy(`/${locale}/forwarding`);
  return seo.metadata;
}

export default async function SeoForwardingPage({ params }: SeoForwardingPageProps) {
  const { locale } = await params;
  if (!isSeoLocale(locale)) notFound();
  return <ForwardingPageContent locale={locale} />;
}
