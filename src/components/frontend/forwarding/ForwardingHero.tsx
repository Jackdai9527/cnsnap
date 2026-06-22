import { Calculator, MapPinned, PackagePlus, Warehouse } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { SeoLocaleLink } from "@/components/seo/SeoLocaleLink";
import { Button } from "@/components/ui/button";

export async function ForwardingHero() {
  const t = await getTranslations("Forwarding.hero");

  return (
    <section className="site-container pt-10 md:pt-14">
      <div className="relative overflow-hidden rounded-[34px] border border-[#dfe7f1] bg-white p-6 shadow-[0_30px_80px_rgba(15,23,42,0.08)] md:p-9">
        <div className="absolute right-0 top-0 hidden h-full w-1/2 bg-[linear-gradient(135deg,rgba(10,131,255,0.10),rgba(217,20,47,0.08))] lg:block" />
        <div className="relative grid gap-8 lg:grid-cols-[1fr_430px] lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#d9e7ff] bg-[#f7fbff] px-3 py-1 text-xs font-black uppercase text-[#0a83ff]">
              <Warehouse size={14} />
              {t("eyebrow")}
            </div>
            <h1 className="mt-5 max-w-4xl text-4xl font-black leading-tight text-[#101828] md:text-6xl">
              {t("title")}
            </h1>
            <p className="mt-5 max-w-2xl text-base font-semibold leading-8 text-[#667085] md:text-lg">
              {t("subtitle")}
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Button asChild className="h-12 rounded-full bg-[#0a83ff] px-6 font-black text-white hover:bg-[#0768cc]">
                <a href="#warehouse-address">
                  <MapPinned size={18} />
                  {t("warehouseAddress")}
                </a>
              </Button>
              <Button asChild variant="outline" className="h-12 rounded-full border-[#dfe7f1] bg-white px-6 font-black text-[#101828]">
                <a href="#incoming-parcel-form">
                  <PackagePlus size={18} />
                  {t("submitParcel")}
                </a>
              </Button>
              <Button asChild variant="outline" className="h-12 rounded-full border-[#dfe7f1] bg-white px-6 font-black text-[#101828]">
                <SeoLocaleLink href="/estimation">
                  <Calculator size={18} />
                  {t("estimateFee")}
                </SeoLocaleLink>
              </Button>
            </div>
          </div>

          <div className="grid gap-3 rounded-[28px] border border-[#eef2f6] bg-[#fbfdff] p-4">
            {["warehouse", "code", "consolidate"].map((key, index) => (
              <div key={key} className="flex gap-3 rounded-2xl bg-white p-4 shadow-[0_10px_28px_rgba(15,23,42,0.04)]">
                <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-[#101828] text-sm font-black text-white">
                  {index + 1}
                </span>
                <div>
                  <h2 className="text-sm font-black text-[#101828]">{t(`cards.${key}.title`)}</h2>
                  <p className="mt-1 text-sm font-semibold leading-6 text-[#667085]">{t(`cards.${key}.description`)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
