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
    <Card className="border-slate-200 bg-white/90 shadow-[0_18px_45px_rgba(15,23,42,0.05)]">
      <CardHeader>
        <CardTitle className="text-lg font-black text-slate-950">{t("title")}</CardTitle>
        <p className="text-sm text-slate-500">{t("description")}</p>
      </CardHeader>
      <CardContent className="space-y-6 pt-0">
        {Object.entries(groupedFaqs).map(([category, items]) => (
          <section key={category}>
            <div className="mb-3 flex items-center gap-2">
              <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-600">
                {category}
              </Badge>
              <div className="h-px flex-1 bg-slate-100" />
            </div>
            <Accordion>
              {items.map((faq) => (
                <AccordionItem key={faq.id}>
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
