import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Camera, Image as ImageIcon, Plane, ShieldCheck, ShoppingBag } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { getAppLocaleBySeoLocale, isSeoLocale, type FrontendLocale } from "../../../config/i18n";
import { DesktopHomePage } from "@/components/layout/desktop/DesktopHomePage";
import { MobileHomePage } from "@/components/mobile/home/MobileHomePage";
import { getHomepageStorefrontProducts } from "@/lib/storefront-products";
import { createMetadataFromIndexPolicy } from "@/modules/seo/lib/metadata";
import { resolveFrontendHrefForLocale } from "@/modules/seo/lib/route-resolver";

type SeoHomePageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: SeoHomePageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isSeoLocale(locale)) return { title: "Not Found" };
  const t = await getTranslations({ locale, namespace: "home" });
  const seo = await createMetadataFromIndexPolicy(`/${locale}`, {
    title: `${t("hero.titlePrefix")} ${t("hero.titleHighlight")}`,
    description: t("hero.description"),
    ogTitle: `${t("hero.titlePrefix")} ${t("hero.titleHighlight")}`,
    ogDescription: t("hero.description"),
    twitterTitle: `${t("hero.titlePrefix")} ${t("hero.titleHighlight")}`,
    twitterDescription: t("hero.description")
  });
  return seo.metadata;
}

export default async function SeoHomePage({ params }: SeoHomePageProps) {
  const { locale } = await params;
  if (!isSeoLocale(locale)) notFound();

  const [homeT, homeProducts] = await Promise.all([
    getTranslations({ locale, namespace: "home" }),
    getHomepageStorefrontProducts(16)
  ]);
  const appLocale = (getAppLocaleBySeoLocale(locale) ?? locale) as FrontendLocale;
  const searchHref = resolveFrontendHrefForLocale({
    pathname: "/search",
    locale: appLocale
  });

  const solutions = [
    {
      title: homeT("solutions.items.shoppingAgent.title"),
      description: homeT("solutions.items.shoppingAgent.description"),
      cta: homeT("solutions.items.shoppingAgent.cta"),
      href: "/help",
      imageSrc: "/brand/cnsnap-home/cnsnap-solution-shopping-agent.jpg",
      imageAlt: homeT("solutions.items.shoppingAgent.title")
    },
    {
      title: homeT("solutions.items.forwarding.title"),
      description: homeT("solutions.items.forwarding.description"),
      cta: homeT("solutions.items.forwarding.cta"),
      href: "/forwarding",
      imageSrc: "/brand/cnsnap-home/cnsnap-solution-forwarding.jpg",
      imageAlt: homeT("solutions.items.forwarding.title")
    },
    {
      title: homeT("solutions.items.sourcing.title"),
      description: homeT("solutions.items.sourcing.description"),
      cta: homeT("solutions.items.sourcing.cta"),
      href: "/diy-order",
      imageSrc: "/brand/cnsnap-home/cnsnap-solution-sourcing.jpg",
      imageAlt: homeT("solutions.items.sourcing.title")
    },
    {
      title: homeT("solutions.items.estimation.title"),
      description: homeT("solutions.items.estimation.description"),
      cta: homeT("solutions.items.estimation.cta"),
      href: "/estimation",
      imageSrc: "/brand/cnsnap-home/cnsnap-solution-shipping-planning.png",
      imageAlt: homeT("solutions.items.estimation.title")
    }
  ] as const;

  const processSteps = [
    {
      title: homeT("process.items.purchaseOrders.title"),
      description: homeT("process.items.purchaseOrders.description")
    },
    {
      title: homeT("process.items.shipToWarehouse.title"),
      description: homeT("process.items.shipToWarehouse.description")
    },
    {
      title: homeT("process.items.qualityCheck.title"),
      description: homeT("process.items.qualityCheck.description")
    },
    {
      title: homeT("process.items.globalShipping.title"),
      description: homeT("process.items.globalShipping.description")
    }
  ] as const;

  const advantages = [
    {
      title: homeT("advantages.items.multiPlatform.title"),
      description: homeT("advantages.items.multiPlatform.description"),
      icon: ShoppingBag
    },
    {
      title: homeT("advantages.items.imageSearch.title"),
      description: homeT("advantages.items.imageSearch.description"),
      icon: ImageIcon
    },
    {
      title: homeT("advantages.items.warehouseQc.title"),
      description: homeT("advantages.items.warehouseQc.description"),
      icon: Camera
    },
    {
      title: homeT("advantages.items.globalShipping.title"),
      description: homeT("advantages.items.globalShipping.description"),
      icon: Plane
    },
    {
      title: homeT("advantages.items.transparentFees.title"),
      description: homeT("advantages.items.transparentFees.description"),
      icon: ShieldCheck
    }
  ] as const;

  return (
    <main className="brand-page">
      <MobileHomePage
        heroEyebrow={homeT("hero.eyebrow")}
        heroTitlePrefix={homeT("hero.titlePrefix")}
        heroTitleHighlight={homeT("hero.titleHighlight")}
        heroDescription={homeT("hero.description")}
        whyTitle={homeT("why.title")}
        whyDescription={homeT("why.description")}
        solutionsTitle={homeT("solutions.title")}
        solutionsDescription={homeT("solutions.description")}
        solutions={[...solutions]}
        processTitle={homeT("process.title")}
        processSteps={[...processSteps]}
        advantages={[...advantages]}
        homeProducts={homeProducts}
        storefrontPicksLabel={homeT("sections.storefrontPicks")}
        hotSellersLabel={homeT("sections.hotSellers")}
        viewMoreLabel={homeT("sections.viewMore")}
        searchHref={searchHref}
        buyLocale={locale}
      />
      <DesktopHomePage
        heroEyebrow={homeT("hero.eyebrow")}
        heroTitlePrefix={homeT("hero.titlePrefix")}
        heroTitleHighlight={homeT("hero.titleHighlight")}
        heroDescription={homeT("hero.description")}
        whyTitle={homeT("why.title")}
        whyDescription={homeT("why.description")}
        solutionsTitle={homeT("solutions.title")}
        solutionsDescription={homeT("solutions.description")}
        solutions={[...solutions]}
        processTitle={homeT("process.title")}
        processSteps={[...processSteps]}
        advantages={[...advantages]}
        homeProducts={homeProducts}
        storefrontPicksLabel={homeT("sections.storefrontPicks")}
        hotSellersLabel={homeT("sections.hotSellers")}
        viewMoreLabel={homeT("sections.viewMore")}
        searchHref={searchHref}
        buyLocale={locale}
      />
    </main>
  );
}
