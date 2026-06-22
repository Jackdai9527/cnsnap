import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { CartClient } from "@/components/cart/CartClient";
import { prisma } from "@/lib/db";
import { resolveFrontendLocale } from "@/lib/i18n/runtime";
import { requireActiveUserPage } from "@/lib/session";
import { createMetadataFromIndexPolicy } from "@/modules/seo/lib/metadata";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await resolveFrontendLocale();
  const t = await getTranslations({ locale, namespace: "CartPage.meta" });
  const seo = await createMetadataFromIndexPolicy("/cart", {
    title: t("title"),
    description: t("description")
  });
  return seo.metadata;
}

export default async function CartPage() {
  const locale = await resolveFrontendLocale();
  const t = await getTranslations({ locale, namespace: "CartPage.page" });
  const user = await requireActiveUserPage("/cart");
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
