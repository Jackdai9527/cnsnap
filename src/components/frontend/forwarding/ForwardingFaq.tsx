import { useTranslations } from "next-intl";

import { forwardingFaqKeys } from "@/components/frontend/forwarding/forwarding-data";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export function ForwardingFaq() {
  const t = useTranslations("Forwarding.faq");

  return (
    <section className="site-container py-10">
      <div className="grid gap-6 lg:grid-cols-[0.75fr_1.25fr]">
        <div>
          <div className="label">{t("eyebrow")}</div>
          <h2 className="mt-2 text-3xl font-black text-[#101828]">{t("title")}</h2>
          <p className="mt-3 text-sm font-semibold leading-7 text-[#667085]">{t("description")}</p>
        </div>
        <Accordion>
          {forwardingFaqKeys.map((key, index) => (
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
