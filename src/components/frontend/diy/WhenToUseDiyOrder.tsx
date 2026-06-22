import { HelpCircle } from "lucide-react";
import { useTranslations } from "next-intl";

import { Card, CardContent } from "@/components/ui/card";
import { diyUseCaseKeys } from "@/components/frontend/diy/diy-order-data";

export function WhenToUseDiyOrder() {
  const t = useTranslations("DiyOrder.when");

  return (
    <section className="site-container py-10">
      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="label">{t("eyebrow")}</div>
          <h2 className="mt-2 text-3xl font-black text-[#101828]">{t("title")}</h2>
        </div>
        <p className="max-w-xl text-sm font-semibold leading-6 text-[#667085]">{t("description")}</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {diyUseCaseKeys.map((key, index) => (
          <Card key={key} className="border-[#dfe7f1] bg-white shadow-[0_18px_45px_rgba(15,23,42,0.05)]">
            <CardContent className="flex gap-4 p-5">
              <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-[#edf7ff] text-[#0a83ff]">
                {index + 1}
              </span>
              <div>
                <h3 className="text-base font-black text-[#101828]">{t(`items.${key}.title`)}</h3>
                <p className="mt-2 text-sm font-semibold leading-6 text-[#667085]">{t(`items.${key}.description`)}</p>
              </div>
              <HelpCircle className="ml-auto mt-1 hidden size-4 shrink-0 text-[#cbd5e1] sm:block" />
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
