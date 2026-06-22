import Link from "next/link";
import { Gift, HandCoins, PackageSearch, Sparkles, Users, WalletCards } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { SeoLocaleLink } from "@/components/seo/SeoLocaleLink";
import { Button } from "@/components/ui/button";

export async function PromotionHero() {
  const t = await getTranslations("Promotion.hero");

  return (
    <section className="site-container pt-10 md:pt-14">
      <div className="relative overflow-hidden rounded-[34px] border border-[#dfe7f1] bg-[#101828] p-6 text-white shadow-[0_30px_80px_rgba(15,23,42,0.16)] md:p-9">
        <div className="absolute inset-y-0 right-0 hidden w-1/2 bg-[linear-gradient(135deg,rgba(217,20,47,0.28),rgba(56,189,248,0.20))] lg:block" />
        <div className="relative grid gap-8 lg:grid-cols-[1fr_420px] lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-black uppercase text-white">
              <Sparkles size={14} />
              {t("eyebrow")}
            </div>
            <h1 className="mt-5 max-w-4xl text-4xl font-black leading-tight md:text-6xl">
              {t("title")}
            </h1>
            <p className="mt-5 max-w-2xl text-base font-semibold leading-8 text-white/72 md:text-lg">
              {t("subtitle")}
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Button asChild className="h-12 rounded-full bg-white px-6 font-black text-[#101828] hover:bg-[#f8fafc]">
                <SeoLocaleLink href="/">
                  <PackageSearch size={18} />
                  {t("startShopping")}
                </SeoLocaleLink>
              </Button>
              <Button asChild variant="outline" className="h-12 rounded-full border-white/20 bg-white/10 px-6 font-black text-white hover:bg-white/15">
                <Link href="/account/recharge">
                  <WalletCards size={18} />
                  {t("rechargeWallet")}
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-12 rounded-full border-white/20 bg-white/10 px-6 font-black text-white hover:bg-white/15">
                <Link href="/account/affiliate">
                  <Users size={18} />
                  {t("joinAffiliate")}
                </Link>
              </Button>
            </div>
          </div>
          <div className="grid gap-3">
            {[
              { icon: Gift, label: t("highlights.newUser"), value: "$5" },
              { icon: WalletCards, label: t("highlights.recharge"), value: "$40" },
              { icon: HandCoins, label: t("highlights.affiliate"), value: "3%" }
            ].map((item) => {
              const Icon = item.icon;

              return (
                <div key={item.label} className="flex items-center justify-between gap-4 rounded-2xl border border-white/12 bg-white/10 p-4 backdrop-blur">
                  <div className="flex items-center gap-3">
                    <span className="grid size-10 place-items-center rounded-2xl bg-white text-[#d9142f]">
                      <Icon size={18} />
                    </span>
                    <span className="text-sm font-black text-white/82">{item.label}</span>
                  </div>
                  <span className="text-2xl font-black text-white">{item.value}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
