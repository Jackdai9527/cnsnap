"use client";

import { AlertTriangle, Clock3, PackageCheck, Scale3D, Truck } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { countryNameLocalized } from "@/lib/countries";
import { money } from "@/lib/pricing";
import type { ShippingEstimateResult as EstimateResult } from "@/components/frontend/estimation/shipping-estimation-data";

export function ShippingEstimateResult({ result }: { result: EstimateResult | null }) {
  const t = useTranslations("Estimation.result");
  const channelT = useTranslations("Estimation.channelDetails");
  const locale = useLocale();

  if (!result) {
    return (
      <Card className="border-[#dfe7f1] bg-white/90 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
        <CardContent className="grid min-h-[360px] place-items-center p-8 text-center">
          <div>
            <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-[#edf7ff] text-[#0a83ff]">
              <Scale3D size={24} />
            </div>
            <h2 className="mt-5 text-2xl font-black text-[#101828]">{t("emptyTitle")}</h2>
            <p className="mx-auto mt-3 max-w-md text-sm font-semibold leading-6 text-[#667085]">
              {t("emptyDescription")}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const bestChannel = result.available[0];

  return (
    <Card className="border-[#dfe7f1] bg-white shadow-[0_22px_60px_rgba(15,23,42,0.08)]">
      <CardHeader className="border-b border-[#eef2f6]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="text-2xl font-black text-[#101828]">{t("title")}</CardTitle>
            <p className="mt-2 text-sm font-semibold leading-6 text-[#667085]">{t("description")}</p>
          </div>
          {bestChannel ? (
            <div className="rounded-2xl bg-[#fff1f2] px-4 py-3 text-right">
              <div className="text-xs font-black uppercase text-[#d9142f]">{t("lowestEstimate")}</div>
              <div className="text-3xl font-black text-[#d9142f]">{money(bestChannel.estimatedFeeUsd)}</div>
            </div>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-5 p-5">
        <div className="grid gap-3 sm:grid-cols-3">
          <WeightMetric icon={<PackageCheck size={18} />} label={t("actualWeight")} value={`${result.actualWeightKg.toFixed(2)} kg`} />
          <WeightMetric icon={<Scale3D size={18} />} label={t("volumetricWeight")} value={`${result.volumetricWeightKg.toFixed(2)} kg`} />
          <WeightMetric icon={<Truck size={18} />} label={t("chargeableWeight")} value={`${result.chargeableWeightKg.toFixed(2)} kg`} highlight />
        </div>

        {result.available.length ? (
          <section>
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="text-sm font-black uppercase text-[#101828]">{t("availableChannels")}</h3>
              <Badge className="rounded-full bg-[#ecfdf3] text-[#027a48] hover:bg-[#ecfdf3]">{result.available.length}</Badge>
            </div>
            <div className="grid gap-3">
              {result.available.map((item) => (
                <div key={item.channel.code} className="grid gap-3 rounded-2xl border border-[#dfe7f1] bg-[#fbfdff] p-4 sm:grid-cols-[1fr_auto] sm:items-center">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-base font-black text-[#101828]">{channelT(`${item.channel.code}.name`)}</span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs font-black text-[#667085] ring-1 ring-[#dfe7f1]">
                        <Clock3 size={13} />
                        {channelT(`${item.channel.code}.deliveryTime`)}
                      </span>
                    </div>
                    <p className="mt-2 text-sm font-semibold leading-6 text-[#667085]">{channelT(`${item.channel.code}.notes`)}</p>
                    <p className="mt-2 rounded-2xl bg-white px-3 py-2 text-sm font-semibold leading-6 text-[#667085]">{channelT(`${item.channel.code}.suitableFor`)}</p>
                  </div>
                  <div className="sm:text-right">
                    <div className="text-2xl font-black text-[#d9142f]">{money(item.estimatedFeeUsd)}</div>
                    <div className="text-xs font-bold text-[#98a2b3]">{item.chargeableWeightKg.toFixed(2)} kg</div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : (
          <div className="rounded-2xl border border-[#ffd7df] bg-[#fff1f2] p-4 text-sm font-bold leading-6 text-[#b42318]">
            {t("noAvailable")}
          </div>
        )}

        {result.unavailable.length ? (
          <section>
            <h3 className="mb-3 text-sm font-black uppercase text-[#101828]">{t("unavailableChannels")}</h3>
            <div className="grid gap-2">
              {result.unavailable.map((item) => (
                <div key={item.channel.code} className="flex flex-col gap-1 rounded-2xl border border-[#eef2f6] bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <span className="font-black text-[#344054]">{channelT(`${item.channel.code}.name`)}</span>
                  <span className="text-sm font-semibold text-[#667085]">
                    {item.unavailableReasonKey
                      ? t(`unavailableReasons.${item.unavailableReasonKey}`, {
                          value: item.unavailableReasonKey === "unsupportedCountry"
                            ? countryNameLocalized(String(item.unavailableReasonValue ?? ""), locale)
                            : item.unavailableReasonValue ?? ""
                        })
                      : ""}
                  </span>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        <div className="flex gap-3 rounded-2xl border border-[#ffe4b5] bg-[#fffbeb] p-4 text-sm font-semibold leading-6 text-[#92400e]">
          <AlertTriangle className="mt-0.5 size-5 shrink-0" />
          <p>{t(`restrictionNotices.${result.restrictionNoticeKey}`)}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function WeightMetric({ icon, label, value, highlight = false }: { icon: React.ReactNode; label: string; value: string; highlight?: boolean }) {
  return (
    <div className={highlight ? "rounded-2xl border border-[#ffd7df] bg-[#fff1f2] p-4" : "rounded-2xl border border-[#dfe7f1] bg-white p-4"}>
      <div className={highlight ? "flex items-center gap-2 text-xs font-black uppercase text-[#d9142f]" : "flex items-center gap-2 text-xs font-black uppercase text-[#667085]"}>
        {icon}
        {label}
      </div>
      <div className={highlight ? "mt-2 text-2xl font-black text-[#d9142f]" : "mt-2 text-2xl font-black text-[#101828]"}>
        {value}
      </div>
    </div>
  );
}
