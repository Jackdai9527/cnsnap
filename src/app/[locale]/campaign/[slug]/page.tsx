import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { isSeoLocale } from "../../../../../config/i18n";
import { SeoLandingPageView } from "@/modules/seo/components/SeoLandingPageView";
import { getSeoLandingPageForLocale } from "@/modules/seo/lib/article-store";
import { createLandingPageMetadata, createLandingPageStructuredData } from "@/modules/seo/lib/landing-metadata";
import { getSeoLandingPagePath } from "@/modules/seo/lib/locale-routing";

type SeoCampaignLandingPageProps = {
  params: Promise<{ locale: string; slug: string }>;
};

export async function generateMetadata({ params }: SeoCampaignLandingPageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isSeoLocale(locale)) return { title: "Not Found" };
  const resolved = await getSeoLandingPageForLocale("campaign", slug, locale);
  if (!resolved || resolved.page.status !== "published") return { title: "Page Not Found" };
  return createLandingPageMetadata(resolved.page, {
    canonicalPathname: `/${locale}/campaign/${slug}`,
    requestedLocale: locale
  });
}

export default async function SeoCampaignLandingPage({ params }: SeoCampaignLandingPageProps) {
  const { locale, slug } = await params;
  if (!isSeoLocale(locale)) notFound();
  const resolved = await getSeoLandingPageForLocale("campaign", slug, locale);
  if (!resolved || resolved.page.status !== "published") notFound();

  const requestedPath = `/${locale}/campaign/${slug}`;
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
