"use client";

import { useTranslations } from "next-intl";
import { popularTopics } from "@/components/frontend/help/help-center-data";
import type { HelpArticle } from "@/types/help";

export function MobileHelpPopularQuestions({
  articles,
  onOpenArticle
}: {
  articles: HelpArticle[];
  onOpenArticle: (article: HelpArticle) => void;
}) {
  const t = useTranslations("HelpCenter.popularTopics");

  function openTopic(articleId: string) {
    const article = articles.find((item) => item.id === articleId);
    if (article) onOpenArticle(article);
  }

  return (
    <section className="card-stack-section">
      <div className="mobile-home-section-heading">
        <div className="mobile-home-kicker">{t("eyebrow")}</div>
        <h2>{t("title")}</h2>
      </div>
      <div className="mobile-help-popular-list">
        {popularTopics.map((topic, index) => (
          <button key={topic.id} type="button" className="mobile-help-popular-card" onClick={() => openTopic(topic.articleId)}>
            <span className="mobile-help-popular-index">{index + 1}</span>
            <span className="mobile-help-popular-title">{t(`items.${topic.id}`)}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
