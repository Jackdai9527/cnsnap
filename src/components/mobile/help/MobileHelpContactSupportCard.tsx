 "use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

export function MobileHelpContactSupportCard() {
  const t = useTranslations("HelpCenter.ticketsCta");

  return (
    <section className="card-stack-section">
      <div className="mobile-help-support-card">
        <div className="mobile-home-section-heading">
          <div className="mobile-home-kicker">{t("open")}</div>
          <h2>{t("title")}</h2>
          <p className="mobile-home-copy">{t("description")}</p>
        </div>
        <div className="mobile-help-support-actions">
          <Link href="/account/tickets" className="cnsnap-home-mobile-more">
            {t("open")}
          </Link>
          <Link href="/account/tickets/new?category=other" className="mobile-help-secondary-link">
            {t("create")}
          </Link>
        </div>
      </div>
    </section>
  );
}
