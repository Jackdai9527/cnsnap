"use client";

import type { HelpArticle } from "@/types/help";
import { HelpSearch } from "@/components/frontend/help/HelpSearch";

export function MobileHelpSearchBox({
  articles,
  onOpenArticle
}: {
  articles: HelpArticle[];
  onOpenArticle: (article: HelpArticle) => void;
}) {
  return (
    <section className="card-stack-section mobile-help-search-wrap">
      <HelpSearch articles={articles} onOpenArticle={onOpenArticle} compact />
    </section>
  );
}
