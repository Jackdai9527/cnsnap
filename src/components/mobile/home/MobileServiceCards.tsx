import { ArrowRight } from "lucide-react";
import { SeoLocaleLink } from "@/components/seo/SeoLocaleLink";

export type MobileServiceCardItem = {
  title: string;
  href: string;
  description: string;
};

export function MobileServiceCards({
  kicker,
  title,
  ctaLabel,
  cards
}: {
  kicker: string;
  title: string;
  ctaLabel: string;
  cards: MobileServiceCardItem[];
}) {
  return (
    <section className="mobile-home-services card-stack-section">
      <div className="mobile-home-section-heading">
        <div className="mobile-home-kicker">{kicker}</div>
        <h2>{title}</h2>
      </div>
      <div className="mobile-home-service-grid">
        {cards.map((item) => (
          <SeoLocaleLink key={item.href} href={item.href} className="mobile-home-service-card">
            <span className="mobile-home-service-card-title">{item.title}</span>
            <span className="mobile-home-service-card-copy">{item.description}</span>
            <span className="mobile-home-service-card-link">
              {ctaLabel} <ArrowRight size={14} />
            </span>
          </SeoLocaleLink>
        ))}
      </div>
    </section>
  );
}
