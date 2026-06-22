import { Camera, PackageCheck, PackageOpen, ShieldCheck, Truck, Warehouse } from "lucide-react";
import { useTranslations } from "next-intl";

import { handlingServiceKeys } from "@/components/frontend/forwarding/forwarding-data";
import { Card, CardContent } from "@/components/ui/card";

const serviceIcons = [Warehouse, ShieldCheck, PackageCheck, Camera, PackageOpen, PackageCheck, Truck, ShieldCheck];

export function PackageHandlingServices() {
  const t = useTranslations("Forwarding.services");

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
        {handlingServiceKeys.map((key, index) => {
          const Icon = serviceIcons[index] ?? PackageCheck;

          return (
            <Card key={key} className="border-[#dfe7f1] bg-white shadow-[0_18px_45px_rgba(15,23,42,0.05)]">
              <CardContent className="p-5">
                <span className="grid size-11 place-items-center rounded-2xl bg-[#edf7ff] text-[#0a83ff]">
                  <Icon size={19} />
                </span>
                <h3 className="mt-4 text-base font-black text-[#101828]">{t(`items.${key}.title`)}</h3>
                <p className="mt-2 text-sm font-semibold leading-6 text-[#667085]">{t(`items.${key}.description`)}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
