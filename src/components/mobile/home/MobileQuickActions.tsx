import { SeoLocaleLink } from "@/components/seo/SeoLocaleLink";

export type MobileQuickActionItem = {
  title: string;
  href: string;
  description: string;
};

export function MobileQuickActions({ actions }: { actions: MobileQuickActionItem[] }) {
  return (
    <section className="card-stack-section">
      <div className="mobile-home-quick-actions">
        {actions.map((item) => (
          <SeoLocaleLink key={item.href} href={item.href} className="mobile-home-quick-action">
            <span className="mobile-home-quick-action-title">{item.title}</span>
            <span className="mobile-home-quick-action-copy">{item.description}</span>
          </SeoLocaleLink>
        ))}
      </div>
    </section>
  );
}
