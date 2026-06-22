import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import type { HelpFaq } from "@/types/help";

export function MobileFaqSection({
  kicker,
  title,
  faqs
}: {
  kicker: string;
  title: string;
  faqs: HelpFaq[];
}) {
  return (
    <section className="mobile-home-faq card-stack-section">
      <div className="mobile-home-section-heading">
        <div className="mobile-home-kicker">{kicker}</div>
        <h2>{title}</h2>
      </div>
      <Accordion className="mobile-home-faq-list">
        {faqs.map((faq, index) => (
          <AccordionItem key={faq.id} open={index === 0 ? true : undefined}>
            <AccordionTrigger>{faq.question}</AccordionTrigger>
            <AccordionContent>{faq.answer}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
