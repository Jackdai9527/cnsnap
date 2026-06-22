"use client";

import { Boxes, Ruler, Scale, Warehouse } from "lucide-react";
import { useTranslations } from "next-intl";

export function ChargeableWeightGuide() {
  const t = useTranslations("Estimation.weightGuide");
  const items = [
    { icon: Scale, title: t("actual.title"), description: t("actual.description") },
    { icon: Ruler, title: t("volumetric.title"), description: t("volumetric.description") },
    { icon: Boxes, title: t("why.title"), description: t("why.description") },
    { icon: Warehouse, title: t("final.title"), description: t("final.description") }
  ];

  return (
    <section className="site-container py-10">
      <div className="rounded-[28px] border border-[#dfe7f1] bg-white p-5 shadow-[0_22px_60px_rgba(15,23,42,0.06)] md:p-7">
        <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <div>
            <div className="label">{t("eyebrow")}</div>
            <h2 className="mt-2 text-3xl font-black leading-tight text-[#101828] md:text-4xl">{t("title")}</h2>
            <p className="mt-4 text-sm font-semibold leading-7 text-[#667085]">{t("description")}</p>
            <div className="mt-5 rounded-2xl bg-[#101828] p-4 font-mono text-sm font-bold text-white">
              {t("formula")}
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {items.map((item) => {
              const Icon = item.icon;

              return (
                <article key={item.title} className="rounded-2xl border border-[#eef2f6] bg-[#fbfdff] p-4">
                  <div className="grid size-10 place-items-center rounded-2xl bg-[#fff1f2] text-[#d9142f]">
                    <Icon size={18} />
                  </div>
                  <h3 className="mt-4 text-base font-black text-[#101828]">{item.title}</h3>
                  <p className="mt-2 text-sm font-semibold leading-6 text-[#667085]">{item.description}</p>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
