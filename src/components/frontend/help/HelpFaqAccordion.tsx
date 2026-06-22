"use client";

import { useTranslations } from "next-intl";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { HelpFaq } from "@/types/help";

type HelpFaqAccordionProps = {
  faqs: HelpFaq[];
};

export function HelpFaqAccordion({ faqs }: HelpFaqAccordionProps) {
  const t = useTranslations("HelpCenter.faqSection");
  const groupedFaqs = faqs.reduce<Record<string, HelpFaq[]>>((groups, faq) => {
    groups[faq.category] = [...(groups[faq.category] ?? []), faq];
    return groups;
  }, {});

  return (
    <Card className="border-[#dfe7f1] bg-white shadow-[0_18px_45px_rgba(15,23,42,0.05)]">
      <CardHeader>
        <div className="label">{t("eyebrow")}</div>
        <CardTitle className="mt-2 text-2xl font-black text-[#101828]">{t("title")}</CardTitle>
        <p className="text-sm font-semibold leading-6 text-[#667085]">{t("description")}</p>
      </CardHeader>
      <CardContent className="space-y-6 pt-0">
        {Object.entries(groupedFaqs).map(([category, items]) => (
          <section key={category}>
            <div className="mb-3 flex items-center gap-2">
              <Badge variant="outline" className="border-[#dfe7f1] bg-[#f8fafc] text-[#344054]">
                {category}
              </Badge>
              <div className="h-px flex-1 bg-[#eef2f6]" />
            </div>
            <Accordion>
              {items.map((faq, index) => (
                <AccordionItem key={faq.id} open={index === 0 ? true : undefined}>
                  <AccordionTrigger>{faq.question}</AccordionTrigger>
                  <AccordionContent>{faq.answer}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </section>
        ))}
      </CardContent>
    </Card>
  );
}
