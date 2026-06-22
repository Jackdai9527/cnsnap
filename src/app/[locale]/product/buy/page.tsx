import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isFrontendLocale, normalizeFrontendLocaleCandidate } from "../../../../../config/i18n";
import { getTranslations } from "next-intl/server";
import BuyPage from "@/app/en/product/buy/page";
import { createMetadataFromIndexPolicy } from "@/modules/seo/lib/metadata";

type LocalizedBuyPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ url?: string; nTag?: string; from?: string }>;
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const normalizedLocale = normalizeFrontendLocaleCandidate(locale);
  const t = await getTranslations({ locale: normalizedLocale || "en", namespace: "product.common" });
  const seo = await createMetadataFromIndexPolicy("/product/buy", {
    title: t("detailsTab"),
    description: t("buyingNote"),
    ogTitle: t("detailsTab"),
    ogDescription: t("buyingNote"),
    twitterTitle: t("detailsTab"),
    twitterDescription: t("buyingNote")
  });
  return seo.metadata;
}

export default async function LocalizedBuyPage({ params, searchParams }: LocalizedBuyPageProps) {
  const { locale } = await params;
  const normalizedLocale = normalizeFrontendLocaleCandidate(locale);

  if (!normalizedLocale || !isFrontendLocale(normalizedLocale)) {
    notFound();
  }

  return <BuyPage searchParams={searchParams} locale={locale} />;
}
