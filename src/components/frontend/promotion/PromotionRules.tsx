import { useTranslations } from "next-intl";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { promotionRuleKeys } from "@/components/frontend/promotion/promotion-data";

export function PromotionRules() {
  const t = useTranslations("Promotion.rules");

  return (
    <section>
      <div className="mb-5">
        <div className="label">{t("eyebrow")}</div>
        <h2 className="mt-2 text-3xl font-black text-[#101828]">{t("title")}</h2>
        <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-[#667085]">{t("description")}</p>
      </div>
      <Accordion>
        {promotionRuleKeys.map((key, index) => (
          <AccordionItem key={key} open={index === 0 ? true : undefined}>
            <AccordionTrigger>{t(`items.${key}.title`)}</AccordionTrigger>
            <AccordionContent>{t(`items.${key}.description`)}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
