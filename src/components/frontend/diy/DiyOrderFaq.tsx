import { useTranslations } from "next-intl";

import { faqKeys } from "@/components/frontend/diy/diy-order-data";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export function DiyOrderFaq() {
  const t = useTranslations("DiyOrder.faq");

  return (
    <section className="site-container py-10">
      <div className="grid gap-6 lg:grid-cols-[0.75fr_1.25fr]">
        <div>
          <div className="label">{t("eyebrow")}</div>
          <h2 className="mt-2 text-3xl font-black text-[#101828]">{t("title")}</h2>
          <p className="mt-3 text-sm font-semibold leading-7 text-[#667085]">{t("description")}</p>
        </div>
        <Accordion>
          {faqKeys.map((key, index) => (
            <AccordionItem key={key} open={index === 0 ? true : undefined}>
              <AccordionTrigger>{t(`items.${key}.question`)}</AccordionTrigger>
              <AccordionContent>{t(`items.${key}.answer`)}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
