import { PercentCircle } from "lucide-react";
import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { serviceFeeDiscounts } from "@/components/frontend/promotion/promotion-data";

export function ServiceFeeDiscounts() {
  const t = useTranslations("Promotion");

  return (
    <section>
      <div className="mb-5">
        <div className="label">{t("serviceFee.eyebrow")}</div>
        <h2 className="mt-2 text-3xl font-black text-[#101828]">{t("serviceFee.title")}</h2>
        <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-[#667085]">{t("serviceFee.description")}</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {serviceFeeDiscounts.map((discount) => (
          <Card key={discount.id} className="border-[#dfe7f1] bg-white shadow-[0_18px_45px_rgba(15,23,42,0.05)]">
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-4">
                <span className="grid size-11 place-items-center rounded-2xl bg-[#edf7ff] text-[#0a83ff]">
                  <PercentCircle size={20} />
                </span>
                <Badge className="rounded-full bg-[#fff1f2] px-3 py-1 text-[#d9142f]">{t(discount.badgeKey)}</Badge>
              </div>
              <div className="mt-5 text-4xl font-black text-[#101828]">{discount.discount}</div>
              <h3 className="mt-3 text-lg font-black text-[#101828]">{t(discount.titleKey)}</h3>
              <p className="mt-2 text-sm font-semibold leading-6 text-[#667085]">{t(discount.descriptionKey)}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
