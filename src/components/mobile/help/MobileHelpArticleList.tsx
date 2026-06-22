"use client";

import { useTranslations } from "next-intl";
import type { HelpArticle } from "@/types/help";

export function MobileHelpArticleList({
  articles,
  onOpenArticle
}: {
  articles: HelpArticle[];
  onOpenArticle: (article: HelpArticle) => void;
}) {
  const t = useTranslations("HelpCenter.articlesSection");
  const emptyT = useTranslations("HelpCenter.empty");

  return (
    <section className="card-stack-section">
      <div className="mobile-home-section-heading">
        <div className="mobile-home-kicker">{t("eyebrow")}</div>
        <h2>{t("title")}</h2>
      </div>
      {articles.length ? (
        <div className="mobile-help-article-list">
          {articles.map((article) => (
            <button key={article.id} type="button" className="mobile-help-article-card" onClick={() => onOpenArticle(article)}>
              <span className="mobile-help-article-category">{article.category}</span>
              <span className="mobile-help-article-title">{article.title}</span>
              <span className="mobile-help-article-copy">{article.summary}</span>
              <span className="mobile-help-article-meta">{t("updated", { date: article.updatedAt })}</span>
            </button>
          ))}
        </div>
      ) : (
        <div className="mobile-help-empty-card">
          <strong>{emptyT("articlesTitle")}</strong>
          <p>{emptyT("articlesDescription")}</p>
        </div>
      )}
    </section>
  );
}
