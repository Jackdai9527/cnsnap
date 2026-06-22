import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isSeoLocale } from "../../../../config/i18n";
import { SeoBlogIndexPage } from "@/components/pages/SeoBlogIndexPage";
import { createBlogIndexMetadata } from "@/modules/seo/lib/blog-metadata";

type SeoBlogIndexPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: SeoBlogIndexPageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isSeoLocale(locale)) return { title: "Not Found" };
  return createBlogIndexMetadata(`/${locale}/blog`);
}

export default async function LocalizedBlogIndexPage({ params }: SeoBlogIndexPageProps) {
  const { locale } = await params;
  if (!isSeoLocale(locale)) notFound();
  return <SeoBlogIndexPage locale={locale} />;
}
