"use client";

import { useTranslations } from "next-intl";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import type { HelpFaq } from "@/types/help";

export function MobileHelpFaqAccordion({ faqs }: { faqs: HelpFaq[] }) {
  const t = useTranslations("HelpCenter.faqSection");
  const emptyT = useTranslations("HelpCenter.empty");

  return (
    <section className="card-stack-section">
      <div className="mobile-home-section-heading">
        <div className="mobile-home-kicker">{t("eyebrow")}</div>
        <h2>{t("title")}</h2>
      </div>
      {faqs.length ? (
        <Accordion className="mobile-help-faq-list">
          {faqs.map((faq, index) => (
            <AccordionItem key={faq.id} open={index === 0 ? true : undefined}>
              <AccordionTrigger>{faq.question}</AccordionTrigger>
              <AccordionContent>{faq.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      ) : (
        <div className="mobile-help-empty-card">
          <strong>{emptyT("faqTitle")}</strong>
          <p>{emptyT("faqDescription")}</p>
        </div>
      )}
    </section>
  );
}
