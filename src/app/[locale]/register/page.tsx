import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isSeoLocale } from "../../../../config/i18n";
import { getTranslations } from "next-intl/server";
import { AuthPanel } from "@/components/auth/AuthPanel";
import { getEnabledAuthProviders } from "@/lib/auth-ui";
import { createMetadataFromIndexPolicy } from "@/modules/seo/lib/metadata";

type LocalizedRegisterPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: LocalizedRegisterPageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isSeoLocale(locale)) return { title: "Not Found" };
  const localized = locale === "zh" ? "zh-CN" : locale;
  const t = await getTranslations({ locale: localized, namespace: "AuthPage.register" });
  const seo = await createMetadataFromIndexPolicy("/register", {
    title: t("title"),
    description: t("eyebrow")
  });
  return seo.metadata;
}

export default async function LocalizedRegisterPage({ params }: LocalizedRegisterPageProps) {
  const { locale } = await params;

  if (!isSeoLocale(locale)) {
    notFound();
  }

  const localized = locale === "zh" ? "zh-CN" : locale;
  const t = await getTranslations({ locale: localized, namespace: "AuthPage.register" });

  return (
    <Suspense fallback={<div className="p-10 text-sm text-slate-500">{t("loading")}</div>}>
      <AuthPanel mode="register" enabledProviders={await getEnabledAuthProviders()} />
    </Suspense>
  );
}
