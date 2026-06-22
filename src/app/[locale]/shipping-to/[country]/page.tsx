import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { isSeoLocale } from "../../../../../config/i18n";
import { SeoLandingPageView } from "@/modules/seo/components/SeoLandingPageView";
import { getSeoLandingPageForLocale } from "@/modules/seo/lib/article-store";
import { createLandingPageMetadata, createLandingPageStructuredData } from "@/modules/seo/lib/landing-metadata";
import { getSeoLandingPagePath } from "@/modules/seo/lib/locale-routing";

type SeoShippingLandingPageProps = {
  params: Promise<{ locale: string; country: string }>;
};

export async function generateMetadata({ params }: SeoShippingLandingPageProps): Promise<Metadata> {
  const { locale, country } = await params;
  if (!isSeoLocale(locale)) return { title: "Not Found" };
  const resolved = await getSeoLandingPageForLocale("shipping_country", country, locale);
  if (!resolved || resolved.page.status !== "published") return { title: "Page Not Found" };
  return createLandingPageMetadata(resolved.page, {
    canonicalPathname: `/${locale}/shipping-to/${country}`,
    requestedLocale: locale
  });
}

export default async function SeoShippingLandingPage({ params }: SeoShippingLandingPageProps) {
  const { locale, country } = await params;
  if (!isSeoLocale(locale)) notFound();
  const resolved = await getSeoLandingPageForLocale("shipping_country", country, locale);
  if (!resolved || resolved.page.status !== "published") notFound();

  const requestedPath = `/${locale}/shipping-to/${country}`;
  const localizedPath = getSeoLandingPagePath(resolved.page, resolved.page.language as typeof locale);
  if (!resolved.fallback && localizedPath !== requestedPath) {
    redirect(localizedPath);
  }

  const structuredData = await createLandingPageStructuredData(resolved.page, {
    canonicalPathname: requestedPath,
    rootPathname: `/${locale}`
  });

  return <SeoLandingPageView page={resolved.page} structuredData={structuredData} />;
}
