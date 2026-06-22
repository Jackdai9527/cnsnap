import { Lightbulb } from "lucide-react";
import { useTranslations } from "next-intl";

import { Card, CardContent } from "@/components/ui/card";
import { exampleRequestKeys } from "@/components/frontend/diy/diy-order-data";

export function DiyOrderExamples() {
  const t = useTranslations("DiyOrder.examples");

  return (
    <section className="site-container py-10">
      <div className="mb-5">
        <div className="label">{t("eyebrow")}</div>
        <h2 className="mt-2 text-3xl font-black text-[#101828]">{t("title")}</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {exampleRequestKeys.map((key) => (
          <Card key={key} className="border-[#dfe7f1] bg-white shadow-[0_18px_45px_rgba(15,23,42,0.05)]">
            <CardContent className="flex gap-4 p-5">
              <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-[#fffbeb] text-[#b54708]">
                <Lightbulb size={18} />
              </span>
              <div>
                <h3 className="text-base font-black text-[#101828]">{t(`items.${key}.title`)}</h3>
                <p className="mt-2 text-sm font-semibold leading-6 text-[#667085]">{t(`items.${key}.description`)}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
