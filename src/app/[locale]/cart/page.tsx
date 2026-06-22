import { notFound } from "next/navigation";
import { isSeoLocale } from "../../../../config/i18n";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { CartClient } from "@/components/cart/CartClient";
import { prisma } from "@/lib/db";
import { requireActiveUserPage } from "@/lib/session";
import { createMetadataFromIndexPolicy } from "@/modules/seo/lib/metadata";

type LocalizedCartPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: LocalizedCartPageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isSeoLocale(locale)) return { title: "Not Found" };
  const t = await getTranslations({ locale: locale === "zh" ? "zh-CN" : locale, namespace: "CartPage.meta" });
  const seo = await createMetadataFromIndexPolicy("/cart", {
    title: t("title"),
    description: t("description")
  });
  return seo.metadata;
}

export default async function LocalizedCartPage({ params }: LocalizedCartPageProps) {
  const { locale } = await params;

  if (!isSeoLocale(locale)) {
    notFound();
  }

  const t = await getTranslations({ locale: locale === "zh" ? "zh-CN" : locale, namespace: "CartPage.page" });
  const user = await requireActiveUserPage(`/${locale}/cart`);
  const addresses = user
    ? await prisma.address.findMany({
        where: { userId: user.id },
        orderBy: [{ isDefault: "desc" }, { updatedAt: "desc" }]
      })
    : [];

  return (
    <main className="brand-page pb-12">
      <section className="frontend-page-shell hidden md:block">
        <div className="frontend-page-inner">
          <div className="label">{t("label")}</div>
          <h1 className="frontend-title">{t("title")}</h1>
          <p className="frontend-lede">{t("description")}</p>
        </div>
      </section>
      <div className="site-container py-8">
        <CartClient
          addresses={addresses.map((address) => ({
            id: address.id,
            label: address.label,
            contactName: address.contactName,
            country: address.country,
            city: address.city,
            line1: address.line1,
            isDefault: address.isDefault
          }))}
        />
      </div>
    </main>
  );
}
