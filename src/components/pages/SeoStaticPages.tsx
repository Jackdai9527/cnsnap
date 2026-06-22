import Link from "next/link";
import { ArrowRight, Calculator, PackageSearch, PenLine, ArrowRight as PromoArrowRight, PackageSearch as PromoPackageSearch, Users, WalletCards, ClipboardList, Warehouse, PackagePlus } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { ChargeableWeightGuide } from "@/components/frontend/estimation/ChargeableWeightGuide";
import { RestrictedItemNotice } from "@/components/frontend/estimation/RestrictedItemNotice";
import { ShippingChannelCards } from "@/components/frontend/estimation/ShippingChannelCards";
import { ShippingEstimatorForm } from "@/components/frontend/estimation/ShippingEstimatorForm";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { SeoLocaleLink } from "@/components/seo/SeoLocaleLink";
import { AffiliateRewardCard } from "@/components/frontend/promotion/AffiliateRewardCard";
import { LimitedCampaignCards } from "@/components/frontend/promotion/LimitedCampaignCards";
import { PromotionCard } from "@/components/frontend/promotion/PromotionCard";
import { PromotionHero } from "@/components/frontend/promotion/PromotionHero";
import { PromotionRules } from "@/components/frontend/promotion/PromotionRules";
import { RechargeBonusTable } from "@/components/frontend/promotion/RechargeBonusTable";
import { ServiceFeeDiscounts } from "@/components/frontend/promotion/ServiceFeeDiscounts";
import { ShippingCouponCards } from "@/components/frontend/promotion/ShippingCouponCards";
import { newUserOffers } from "@/components/frontend/promotion/promotion-data";
import { DiyOrderComparison } from "@/components/frontend/diy/DiyOrderComparison";
import { DiyOrderExamples } from "@/components/frontend/diy/DiyOrderExamples";
import { DiyOrderFaq } from "@/components/frontend/diy/DiyOrderFaq";
import { DiyOrderForm } from "@/components/frontend/diy/DiyOrderForm";
import { DiyOrderHero } from "@/components/frontend/diy/DiyOrderHero";
import { QuotationSteps } from "@/components/frontend/diy/QuotationSteps";
import { WhenToUseDiyOrder } from "@/components/frontend/diy/WhenToUseDiyOrder";
import { ForwardingComparison } from "@/components/frontend/forwarding/ForwardingComparison";
import { ForwardingFaq } from "@/components/frontend/forwarding/ForwardingFaq";
import { ForwardingHero } from "@/components/frontend/forwarding/ForwardingHero";
import { ForwardingRestrictions } from "@/components/frontend/forwarding/ForwardingRestrictions";
import { ForwardingSteps } from "@/components/frontend/forwarding/ForwardingSteps";
import { IncomingParcelForm } from "@/components/frontend/forwarding/IncomingParcelForm";
import { PackageHandlingServices } from "@/components/frontend/forwarding/PackageHandlingServices";
import { WarehouseAddressCard } from "@/components/frontend/forwarding/WarehouseAddressCard";
import { HelpCenterContent } from "@/components/frontend/help/HelpCenterContent";
import { TicketsCenterCta } from "@/components/frontend/help/TicketsCenterCta";
import { getHelpCenterData } from "@/lib/help-center-service";

export async function EstimationPageContent({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "Estimation" });
  const faqItems = ["separateShipping", "volumetricWeight", "finalFee", "restrictedItems", "chooseChannel", "deliveryTime"] as const;

  return (
    <main className="brand-page pb-14">
      <Toaster richColors position="top-right" />
      <section className="site-container pt-10 md:pt-14">
        <div className="relative overflow-hidden rounded-[32px] border border-[#dfe7f1] bg-white shadow-[0_30px_80px_rgba(15,23,42,0.08)]">
          <div className="absolute right-0 top-0 h-full w-1/2 bg-[linear-gradient(135deg,rgba(217,20,47,0.08),rgba(56,189,248,0.10))]" />
          <div className="relative grid gap-8 p-6 md:p-9 lg:grid-cols-[1.08fr_0.92fr] lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#ffd7df] bg-[#fff1f2] px-3 py-1 text-xs font-black uppercase text-[#d9142f]">
                <Calculator size={14} />
                {t("hero.eyebrow")}
              </div>
              <h1 className="mt-5 max-w-3xl text-4xl font-black leading-tight text-[#101828] md:text-6xl">
                {t("hero.title")}
              </h1>
              <p className="mt-5 max-w-2xl text-base font-semibold leading-8 text-[#667085] md:text-lg">
                {t("hero.subtitle")}
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Button asChild className="h-12 rounded-full bg-[#d9142f] px-6 font-black text-white hover:bg-[#b90f25]">
                  <SeoLocaleLink href="/">
                    <PackageSearch size={18} />
                    {t("hero.startShopping")}
                  </SeoLocaleLink>
                </Button>
                <Button asChild variant="outline" className="h-12 rounded-full border-[#dfe7f1] bg-white px-6 font-black text-[#101828]">
                  <SeoLocaleLink href="/diy-order">
                    <PenLine size={18} />
                    {t("hero.submitDiyOrder")}
                  </SeoLocaleLink>
                </Button>
              </div>
            </div>

            <div className="grid gap-3 rounded-[28px] border border-[#eef2f6] bg-[#fbfdff]/90 p-4">
              {["actual", "volumetric", "warehouse"].map((key, index) => (
                <div key={key} className="flex gap-3 rounded-2xl bg-white p-4 shadow-[0_10px_28px_rgba(15,23,42,0.04)]">
                  <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#101828] text-sm font-black text-white">
                    {index + 1}
                  </div>
                  <div>
                    <h2 className="text-sm font-black text-[#101828]">{t(`hero.steps.${key}.title`)}</h2>
                    <p className="mt-1 text-sm font-semibold leading-6 text-[#667085]">{t(`hero.steps.${key}.description`)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <ShippingEstimatorForm />
      <ShippingChannelCards />
      <ChargeableWeightGuide />
      <RestrictedItemNotice />

      <section className="site-container py-10">
        <div className="grid gap-6 lg:grid-cols-[0.75fr_1.25fr]">
          <div>
            <div className="label">{t("faq.eyebrow")}</div>
            <h2 className="mt-2 text-3xl font-black text-[#101828]">{t("faq.title")}</h2>
            <p className="mt-3 text-sm font-semibold leading-7 text-[#667085]">{t("faq.description")}</p>
          </div>
          <Accordion>
            {faqItems.map((item, index) => (
              <AccordionItem key={item} open={index === 0 ? true : undefined}>
                <AccordionTrigger>{t(`faq.items.${item}.question`)}</AccordionTrigger>
                <AccordionContent>{t(`faq.items.${item}.answer`)}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      <section className="site-container py-10">
        <div className="rounded-[30px] bg-[#101828] p-6 text-white shadow-[0_24px_70px_rgba(15,23,42,0.18)] md:p-8">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <h2 className="text-3xl font-black">{t("cta.title")}</h2>
              <p className="mt-3 max-w-2xl text-sm font-semibold leading-7 text-white/72">{t("cta.description")}</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild className="h-11 rounded-full bg-white px-5 font-black text-[#101828] hover:bg-[#f8fafc]">
                <SeoLocaleLink href="/">
                  {t("cta.startShopping")}
                  <ArrowRight size={16} />
                </SeoLocaleLink>
              </Button>
              <Button asChild variant="outline" className="h-11 rounded-full border-white/25 bg-white/10 px-5 font-black text-white hover:bg-white/15">
                <SeoLocaleLink href="/diy-order">{t("cta.submitDiyOrder")}</SeoLocaleLink>
              </Button>
              <Button asChild variant="outline" className="h-11 rounded-full border-white/25 bg-white/10 px-5 font-black text-white hover:bg-white/15">
                <SeoLocaleLink href="/forwarding">{t("cta.forwarding")}</SeoLocaleLink>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export async function PromotionPageContent({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "Promotion" });

  return (
    <main className="brand-page pb-14">
      <PromotionHero />

      <section className="site-container py-10">
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="label">{t("newUser.eyebrow")}</div>
            <h2 className="mt-2 text-3xl font-black text-[#101828]">{t("newUser.title")}</h2>
          </div>
          <p className="max-w-xl text-sm font-semibold leading-6 text-[#667085]">{t("newUser.description")}</p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {newUserOffers.map((offer) => (
            <PromotionCard key={offer.id} offer={offer} />
          ))}
        </div>
      </section>

      <section className="site-container py-10">
        <RechargeBonusTable />
      </section>

      <section className="site-container space-y-10 py-10">
        <ShippingCouponCards />
        <ServiceFeeDiscounts />
      </section>

      <section className="site-container py-10">
        <AffiliateRewardCard />
      </section>

      <section className="site-container space-y-10 py-10">
        <LimitedCampaignCards />
        <PromotionRules />
      </section>

      <section className="site-container py-10">
        <div className="rounded-[30px] border border-[#dfe7f1] bg-white p-6 shadow-[0_24px_70px_rgba(15,23,42,0.08)] md:p-8">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <div className="label">{t("cta.eyebrow")}</div>
              <h2 className="mt-2 text-3xl font-black text-[#101828]">{t("cta.title")}</h2>
              <p className="mt-3 max-w-2xl text-sm font-semibold leading-7 text-[#667085]">{t("cta.description")}</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild className="h-11 rounded-full bg-[#d9142f] px-5 font-black text-white hover:bg-[#b90f25]">
                <Link href="/">
                  <PromoPackageSearch size={17} />
                  {t("cta.startShopping")}
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-11 rounded-full px-5 font-black">
                <Link href="/account/recharge">
                  <WalletCards size={17} />
                  {t("cta.rechargeWallet")}
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-11 rounded-full px-5 font-black">
                <Link href="/account/affiliate">
                  <Users size={17} />
                  {t("cta.joinAffiliate")}
                  <PromoArrowRight size={15} />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export async function DiyOrderPageContent({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "DiyOrder.cta" });

  return (
    <main className="brand-page pb-14">
      <Toaster richColors position="top-right" />
      <DiyOrderHero />
      <WhenToUseDiyOrder />
      <DiyOrderForm />
      <QuotationSteps />
      <DiyOrderComparison />
      <DiyOrderExamples />
      <DiyOrderFaq />

      <section className="site-container py-10">
        <div className="rounded-[30px] bg-[#101828] p-6 text-white shadow-[0_24px_70px_rgba(15,23,42,0.18)] md:p-8">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <h2 className="text-3xl font-black">{t("title")}</h2>
              <p className="mt-3 max-w-2xl text-sm font-semibold leading-7 text-white/72">{t("description")}</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild className="h-11 rounded-full bg-white px-5 font-black text-[#101828] hover:bg-[#f8fafc]">
                <a href="#diy-order-form">
                  <ClipboardList size={17} />
                  {t("submit")}
                </a>
              </Button>
              <Button asChild variant="outline" className="h-11 rounded-full border-white/25 bg-white/10 px-5 font-black text-white hover:bg-white/15">
                <Link href="/account/diy-orders">
                  <PackageSearch size={17} />
                  {t("viewMine")}
                  <ArrowRight size={15} />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export async function ForwardingPageContent({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "Forwarding.cta" });

  return (
    <main className="brand-page pb-14">
      <Toaster richColors position="top-right" />
      <ForwardingHero />
      <ForwardingComparison />
      <ForwardingSteps />
      <WarehouseAddressCard />
      <IncomingParcelForm />
      <PackageHandlingServices />
      <ForwardingRestrictions />
      <ForwardingFaq />

      <section className="site-container py-10">
        <div className="rounded-[30px] bg-[#101828] p-6 text-white shadow-[0_24px_70px_rgba(15,23,42,0.18)] md:p-8">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <h2 className="text-3xl font-black">{t("title")}</h2>
              <p className="mt-3 max-w-2xl text-sm font-semibold leading-7 text-white/72">{t("description")}</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild className="h-11 rounded-full bg-white px-5 font-black text-[#101828] hover:bg-[#f8fafc]">
                <a href="#warehouse-address">
                  <Warehouse size={17} />
                  {t("warehouseAddress")}
                </a>
              </Button>
              <Button asChild variant="outline" className="h-11 rounded-full border-white/25 bg-white/10 px-5 font-black text-white hover:bg-white/15">
                <a href="#incoming-parcel-form">
                  <PackagePlus size={17} />
                  {t("submitParcel")}
                </a>
              </Button>
              <Button asChild variant="outline" className="h-11 rounded-full border-white/25 bg-white/10 px-5 font-black text-white hover:bg-white/15">
                <SeoLocaleLink href="/estimation">
                  <Calculator size={17} />
                  {t("estimateFee")}
                  <ArrowRight size={15} />
                </SeoLocaleLink>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export async function HelpPageContent({ locale }: { locale: string }) {
  const data = await getHelpCenterData(locale);
  return (
    <main className="brand-page pb-14">
      <HelpCenterContent {...data} />
      <div className="hidden md:block">
        <TicketsCenterCta />
      </div>
    </main>
  );
}
