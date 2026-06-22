"use client";

import { Clock3, Globe2, Info, Route } from "lucide-react";
import { useTranslations } from "next-intl";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { shippingChannelRules } from "@/components/frontend/estimation/shipping-estimation-data";
import { countryNameLocalized } from "@/lib/countries";
import { useLocale } from "next-intl";

export function ShippingChannelCards() {
  const t = useTranslations("Estimation.channels");
  const channelT = useTranslations("Estimation.channelDetails");
  const locale = useLocale();

  return (
    <section className="site-container py-10">
      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="label">{t("eyebrow")}</div>
          <h2 className="mt-2 text-3xl font-black text-[#101828]">{t("title")}</h2>
        </div>
        <p className="max-w-xl text-sm font-semibold leading-6 text-[#667085]">{t("description")}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {shippingChannelRules.map((channel) => (
          <Card key={channel.code} className="border-[#dfe7f1] bg-white/92 shadow-[0_16px_42px_rgba(15,23,42,0.05)]">
            <CardHeader className="pb-3">
              <div className="mb-3 grid size-10 place-items-center rounded-2xl bg-[#edf7ff] text-[#0a83ff]">
                <Route size={18} />
              </div>
              <CardTitle className="text-lg font-black text-[#101828]">{channelT(`${channel.code}.name`)}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm font-semibold leading-6 text-[#667085]">
              <InfoLine icon={<Clock3 size={15} />} text={channelT(`${channel.code}.deliveryTime`)} />
              <InfoLine icon={<Globe2 size={15} />} text={channel.supportedCountries.map((code) => countryNameLocalized(code, locale)).join(", ")} />
              <InfoLine icon={<Info size={15} />} text={channelT(`${channel.code}.notes`)} />
              <p className="rounded-2xl bg-[#f8fafc] p-3">{channelT(`${channel.code}.suitableFor`)}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

function InfoLine({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex gap-2">
      <span className="mt-1 shrink-0 text-[#0a83ff]">{icon}</span>
      <span>{text}</span>
    </div>
  );
}
