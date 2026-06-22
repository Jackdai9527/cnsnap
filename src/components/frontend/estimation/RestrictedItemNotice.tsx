"use client";

import { AlertTriangle, BatteryCharging, CircleDollarSign, Droplets, ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";

export function RestrictedItemNotice() {
  const t = useTranslations("Estimation.restricted");
  const notices = [
    { icon: AlertTriangle, text: t("items.0") },
    { icon: BatteryCharging, text: t("items.1") },
    { icon: ShieldCheck, text: t("items.2") },
    { icon: CircleDollarSign, text: t("items.3") }
  ];

  return (
    <section className="site-container py-10">
      <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="rounded-[28px] border border-[#ffd7df] bg-[#fff1f2] p-6">
          <div className="grid size-12 place-items-center rounded-2xl bg-white text-[#d9142f] shadow-sm">
            <Droplets size={22} />
          </div>
          <h2 className="mt-5 text-3xl font-black text-[#101828]">{t("title")}</h2>
          <p className="mt-3 text-sm font-semibold leading-7 text-[#7a271a]">{t("description")}</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {notices.map((notice) => {
            const Icon = notice.icon;

            return (
              <div key={notice.text} className="flex gap-3 rounded-2xl border border-[#dfe7f1] bg-white p-4 shadow-[0_12px_30px_rgba(15,23,42,0.04)]">
                <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#fffbeb] text-[#b54708]">
                  <Icon size={17} />
                </div>
                <p className="text-sm font-semibold leading-6 text-[#667085]">{notice.text}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
