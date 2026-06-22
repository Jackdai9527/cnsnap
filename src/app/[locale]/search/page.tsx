import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isSeoLocale } from "../../../../config/i18n";
import { getSearchPageMetadata, renderSearchPage } from "@/app/search/page";

type LocalizedSearchPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    q?: string;
    type?: string;
    platform?: string;
    page?: string;
    sort?: string;
    start_price?: string;
    end_price?: string;
    no_reason_return?: string;
    free_shipping?: string;
    tmall_flagship?: string;
  }>;
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isSeoLocale(locale)) return { title: "Not Found" };
  return getSearchPageMetadata(locale);
}

export default async function LocalizedSearchPage({ params, searchParams }: LocalizedSearchPageProps) {
  const { locale } = await params;

  if (!isSeoLocale(locale)) {
    notFound();
  }

  return renderSearchPage({ searchParams, localeOverride: locale });
}
