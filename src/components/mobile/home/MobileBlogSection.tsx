import { BookOpenText, FileText, ScrollText } from "lucide-react";
import { SeoLocaleLink } from "@/components/seo/SeoLocaleLink";
import type { SeoArticleRecord } from "@/modules/seo/types";

export function MobileBlogSection({
  kicker,
  title,
  viewAllLabel,
  openHelpLabel,
  articles
}: {
  kicker: string;
  title: string;
  viewAllLabel: string;
  openHelpLabel: string;
  articles: SeoArticleRecord[];
}) {
  return (
    <section className="mobile-home-blog card-stack-section">
      <div className="mobile-home-section-heading">
        <div className="mobile-home-kicker">{kicker}</div>
        <h2>{title}</h2>
      </div>
      <div className="mobile-home-link-grid">
        {articles.map((article) => (
          <SeoLocaleLink key={article.id} href={`/blog/${article.localizedSlug || article.slug}`} className="mobile-home-link-card">
            <span className="mobile-home-link-icon">
              <BookOpenText size={16} />
            </span>
            <span className="mobile-home-link-content">
              <span className="mobile-home-link-title">{article.title}</span>
              <span className="mobile-home-link-copy">{article.excerpt}</span>
            </span>
          </SeoLocaleLink>
        ))}
      </div>
      <div className="mobile-home-link-actions">
        <SeoLocaleLink href="/blog" className="mobile-home-text-link">
          <ScrollText size={15} />
          {viewAllLabel}
        </SeoLocaleLink>
        <SeoLocaleLink href="/help" className="mobile-home-text-link">
          <FileText size={15} />
          {openHelpLabel}
        </SeoLocaleLink>
      </div>
    </section>
  );
}
