import { notFound } from "next/navigation";
import { isSeoLocale } from "../../../../config/i18n";
import type { Metadata } from "next";
import CheckoutPage from "@/app/checkout/page";
import { CheckoutClient } from "@/components/checkout/CheckoutClient";
import { prisma } from "@/lib/db";
import { requireActiveUserPage } from "@/lib/session";
import { serializeValueAddedService } from "@/lib/value-added-services";
import { createMetadataFromIndexPolicy } from "@/modules/seo/lib/metadata";
import { getTranslations } from "next-intl/server";

type LocalizedCheckoutPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isSeoLocale(locale)) return { title: "Not Found" };
  const localized = locale === "zh" ? "zh-CN" : locale;
  const t = await getTranslations({ locale: localized, namespace: "CheckoutPage" });
  const seo = await createMetadataFromIndexPolicy("/checkout", {
    title: t("breadcrumbs.payment"),
    description: t("empty.description")
  });
  return seo.metadata;
}

export default async function LocalizedCheckoutPage({ params, searchParams }: LocalizedCheckoutPageProps) {
  const { locale } = await params;
  const resolvedSearchParams = await searchParams;

  if (!isSeoLocale(locale)) {
    notFound();
  }

  const orderId = readParam(resolvedSearchParams, "order");
  if (orderId) {
    return <CheckoutPage searchParams={Promise.resolve(resolvedSearchParams)} />;
  }

  const user = await requireActiveUserPage(`/${locale}/checkout`);
  const [addresses, valueAddedServices] = await Promise.all([
    prisma.address.findMany({
      where: { userId: user.id },
      orderBy: [{ isDefault: "desc" }, { updatedAt: "desc" }]
    }),
    prisma.valueAddedService.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { id: "asc" }]
    })
  ]);

  return (
    <CheckoutClient
      userEmail={user?.email}
      valueAddedServices={valueAddedServices.map(serializeValueAddedService)}
      addresses={addresses.map((address) => ({
        id: address.id,
        label: address.label,
        contactName: address.contactName,
        phone: address.phone,
        country: address.country,
        state: address.state,
        city: address.city,
        postalCode: address.postalCode,
        line1: address.line1,
        line2: address.line2,
        isDefault: address.isDefault
      }))}
    />
  );
}

function readParam(params: Record<string, string | string[] | undefined>, key: string) {
  const value = params[key];
  return Array.isArray(value) ? value[0] : value;
}
