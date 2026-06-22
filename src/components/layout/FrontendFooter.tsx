import { FooterVisibility } from "@/components/layout/FooterVisibility";
import { MobileFooter } from "@/components/mobile/footer/MobileFooter";
import { getFooterContentForLocale } from "@/lib/frontend-content-blocks";

export async function FrontendFooter({ locale }: { locale: string }) {
  const footer = await getFooterContentForLocale(locale);

  return (
    <FooterVisibility>
      <footer className="m-footer border-t border-[#ebe7e0] bg-[#fbfaf8]/90 text-[#616b7c]">
        <div className="site-container py-5 md:py-10">
          <MobileFooter
            cta={footer.footer_cta_html}
            columns={footer.footer_columns_html}
            payment={footer.footer_payment_html}
            bottom={footer.footer_bottom_html}
          />

          <div className="hidden md:block">
            {footer.footer_cta_html.content ? (
              <section className="footer-cta-shell">
                <div
                  className="footer-cta-html rounded-[22px] border border-[#ebe7e0] bg-[linear-gradient(180deg,#fffdfa_0%,#f8f4ed_100%)] p-6 text-[#16202f] shadow-[0_12px_28px_rgba(17,24,39,0.08)]"
                  dangerouslySetInnerHTML={{ __html: footer.footer_cta_html.content }}
                />
              </section>
            ) : null}

            {footer.footer_columns_html.content ? (
              <section className="footer-columns-shell">
                <div
                  className="footer-columns-html mt-9 grid gap-7 md:grid-cols-5"
                  dangerouslySetInnerHTML={{ __html: footer.footer_columns_html.content }}
                />
              </section>
            ) : null}

            {footer.footer_payment_html.content ? (
              <section className="footer-payment-shell mt-8 border-t border-[#d9e7ff] pt-6">
                <div
                  className="footer-payment-html"
                  dangerouslySetInnerHTML={{ __html: footer.footer_payment_html.content }}
                />
              </section>
            ) : null}

            {footer.footer_bottom_html.content ? (
              <section className="footer-bottom-shell">
                <div
                  className="footer-bottom-html mt-6 border-t border-[#d9e7ff] pt-5 text-xs"
                  dangerouslySetInnerHTML={{ __html: footer.footer_bottom_html.content }}
                />
              </section>
            ) : null}
          </div>
        </div>
      </footer>
    </FooterVisibility>
  );
}
