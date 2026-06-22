"use client";

import { useTranslations } from "next-intl";
import type { HelpCategory } from "@/types/help";
import { cn } from "@/lib/utils";

export function MobileHelpCategoryGrid({
  categories,
  selectedCategory,
  onSelectCategory
}: {
  categories: HelpCategory[];
  selectedCategory: HelpCategory | null;
  onSelectCategory: (category: HelpCategory | null) => void;
}) {
  const t = useTranslations("HelpCenter.categoriesSection");

  return (
    <section className="card-stack-section">
      <div className="mobile-home-section-heading">
        <div className="mobile-home-kicker">{t("eyebrow")}</div>
        <h2>{t("title")}</h2>
        {selectedCategory ? (
          <button type="button" className="mobile-help-reset-button" onClick={() => onSelectCategory(null)}>
            {t("showAll")}
          </button>
        ) : null}
      </div>
      <div className="mobile-help-category-grid">
        {categories.map((category) => {
          const active = selectedCategory?.id === category.id;
          return (
            <button
              key={category.id}
              type="button"
              className={cn("mobile-help-category-card", active && "is-active")}
              onClick={() => onSelectCategory(active ? null : category)}
            >
              <span className="mobile-help-category-title">{category.title}</span>
              <span className="mobile-help-category-copy">{category.description}</span>
              <span className="mobile-help-category-meta">{t("articleCount", { count: category.articleCount })}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
