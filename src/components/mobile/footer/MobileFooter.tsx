import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useTranslations } from "next-intl";

type FooterBlock = {
  content: string;
};

export function MobileFooter({
  cta,
  columns,
  payment,
  bottom
}: {
  cta: FooterBlock;
  columns: FooterBlock;
  payment: FooterBlock;
  bottom: FooterBlock;
}) {
  const t = useTranslations("common.header.footer");

  return (
    <div className="mobile-footer-shell md:hidden">
      {cta.content ? (
        <section className="footer-cta-shell">
          <div
            className="footer-cta-html rounded-[22px] border border-[#ebe7e0] bg-[linear-gradient(180deg,#fffdfa_0%,#f8f4ed_100%)] p-6 text-[#16202f] shadow-[0_12px_28px_rgba(17,24,39,0.08)]"
            dangerouslySetInnerHTML={{ __html: cta.content }}
          />
        </section>
      ) : null}

      <Accordion className="mobile-footer-accordion">
        {columns.content ? (
          <AccordionItem>
            <AccordionTrigger>{t("helpCenter")}</AccordionTrigger>
            <AccordionContent>
              <section className="footer-columns-shell">
                <div
                  className="footer-columns-html mt-3 grid gap-7"
                  dangerouslySetInnerHTML={{ __html: columns.content }}
                />
              </section>
            </AccordionContent>
          </AccordionItem>
        ) : null}

        {payment.content ? (
          <AccordionItem>
            <AccordionTrigger>{t("payment")}</AccordionTrigger>
            <AccordionContent>
              <section className="footer-payment-shell mt-2 border-t border-[#d9e7ff] pt-4">
                <div
                  className="footer-payment-html"
                  dangerouslySetInnerHTML={{ __html: payment.content }}
                />
              </section>
            </AccordionContent>
          </AccordionItem>
        ) : null}

        {bottom.content ? (
          <AccordionItem>
            <AccordionTrigger>{t("copyright")}</AccordionTrigger>
            <AccordionContent>
              <section className="footer-bottom-shell">
                <div
                  className="footer-bottom-html mt-2 border-t border-[#d9e7ff] pt-4 text-xs"
                  dangerouslySetInnerHTML={{ __html: bottom.content }}
                />
              </section>
            </AccordionContent>
          </AccordionItem>
        ) : null}
      </Accordion>
    </div>
  );
}
