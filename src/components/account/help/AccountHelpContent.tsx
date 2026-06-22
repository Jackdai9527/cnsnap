"use client";

import { useMemo, useState } from "react";
import { BadgeHelp, FilterX } from "lucide-react";
import { useTranslations } from "next-intl";
import { AccountEmptyState } from "@/components/account/AccountEmptyState";
import { AccountPageHeader } from "@/components/account/AccountPageHeader";
import { HelpArticleList } from "@/components/account/help/HelpArticleList";
import { HelpCategoryCard } from "@/components/account/help/HelpCategoryCard";
import { HelpContactSupportCard } from "@/components/account/help/HelpContactSupportCard";
import { HelpFaqAccordion } from "@/components/account/help/HelpFaqAccordion";
import { HelpSearch } from "@/components/account/help/HelpSearch";
import { MobileHelpArticleList } from "@/components/mobile/help/MobileHelpArticleList";
import { MobileHelpCategoryGrid } from "@/components/mobile/help/MobileHelpCategoryGrid";
import { MobileHelpContactSupportCard } from "@/components/mobile/help/MobileHelpContactSupportCard";
import { MobileHelpFaqAccordion } from "@/components/mobile/help/MobileHelpFaqAccordion";
import { MobileHelpPage } from "@/components/mobile/help/MobileHelpPage";
import { MobileHelpPopularQuestions } from "@/components/mobile/help/MobileHelpPopularQuestions";
import { MobileSectionShell } from "@/components/mobile/layout/MobileSectionShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { HelpArticle, HelpCategory, HelpFaq } from "@/types/help";

type OpenContent =
  | { type: "article"; item: HelpArticle }
  | { type: "faq"; item: HelpFaq }
  | null;

type AccountHelpContentProps = {
  categories: HelpCategory[];
  articles: HelpArticle[];
  faqs: HelpFaq[];
};

export function AccountHelpContent({ categories, articles, faqs }: AccountHelpContentProps) {
  const t = useTranslations("HelpCenter");
  const [selectedCategory, setSelectedCategory] = useState<HelpCategory | null>(null);
  const [openContent, setOpenContent] = useState<OpenContent>(null);

  const filteredArticles = useMemo(() => {
    if (!selectedCategory) {
      return articles.filter((article) => article.isPopular);
    }

    return articles.filter((article) => article.categoryId === selectedCategory.id);
  }, [articles, selectedCategory]);

  const filteredFaqs = useMemo(() => {
    if (!selectedCategory) {
      return faqs;
    }

    return faqs.filter((faq) => faq.categoryId === selectedCategory.id);
  }, [faqs, selectedCategory]);

  return (
    <>
      <MobileSectionShell
        title={t("search.eyebrow")}
        description={t("search.subtitle")}
        kicker={t("search.eyebrow")}
        className="md:hidden"
        minimalHeader
        showBackButton
      >
        <MobileHelpPage
          search={
            <HelpSearch
              articles={articles}
              faqs={faqs}
              onOpenArticle={(article) => setOpenContent({ type: "article", item: article })}
              onOpenFaq={(faq) => setOpenContent({ type: "faq", item: faq })}
            />
          }
          popular={
            <MobileHelpPopularQuestions
              articles={articles}
              onOpenArticle={(article) => setOpenContent({ type: "article", item: article })}
            />
          }
          categories={
            <MobileHelpCategoryGrid
              categories={categories}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
            />
          }
          faq={<MobileHelpFaqAccordion faqs={filteredFaqs} />}
          articles={
            <MobileHelpArticleList
              articles={filteredArticles}
              onOpenArticle={(article) => setOpenContent({ type: "article", item: article })}
            />
          }
          support={<MobileHelpContactSupportCard />}
        />
      </MobileSectionShell>

      <div className="hidden space-y-6 md:block">
        <AccountPageHeader
          title={t("search.eyebrow")}
          description={t("search.subtitle")}
        />

        <HelpSearch
          articles={articles}
          faqs={faqs}
          onOpenArticle={(article) => setOpenContent({ type: "article", item: article })}
          onOpenFaq={(faq) => setOpenContent({ type: "faq", item: faq })}
        />

        <section>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-lg font-black tracking-tight text-slate-950">{t("categoriesSection.title")}</h2>
              <p className="mt-1 text-sm text-slate-500">{t("categoriesSection.description")}</p>
            </div>
            {selectedCategory ? (
              <Button variant="outline" size="sm" className="rounded-full" onClick={() => setSelectedCategory(null)}>
                <FilterX className="size-4" />
                {t("categoriesSection.showAll")}
              </Button>
            ) : null}
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {categories.map((category) => (
              <HelpCategoryCard
                key={category.id}
                category={category}
                active={selectedCategory?.id === category.id}
                onSelect={setSelectedCategory}
              />
            ))}
          </div>
        </section>

        {selectedCategory ? (
          <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm text-slate-500">
            {t("filter.showing")}
            <Badge variant="outline" className="border-pink-200 bg-pink-50 text-pink-700">
              {selectedCategory.title}
            </Badge>
          </div>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(380px,0.75fr)]">
          {filteredArticles.length ? (
            <HelpArticleList
              articles={filteredArticles}
              onOpenArticle={(article) => setOpenContent({ type: "article", item: article })}
            />
          ) : (
            <AccountEmptyState
              title={t("empty.articlesTitle")}
              description={t("empty.articlesDescription")}
              icon={<BadgeHelp className="size-5" />}
            />
          )}

          {filteredFaqs.length ? (
            <HelpFaqAccordion faqs={filteredFaqs} />
          ) : (
            <AccountEmptyState
              title={t("empty.faqTitle")}
              description={t("empty.faqDescription")}
              icon={<BadgeHelp className="size-5" />}
            />
          )}
        </div>

        <HelpContactSupportCard />
      </div>

      <HelpContentDialog content={openContent} onOpenChange={(open) => !open && setOpenContent(null)} />
    </>
  );
}

function HelpContentDialog({ content, onOpenChange }: { content: OpenContent; onOpenChange: (open: boolean) => void }) {
  const t = useTranslations("HelpCenter.articleDialog");
  const isArticle = content?.type === "article";
  const item = content?.item;

  return (
    <Dialog open={Boolean(content)} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] overflow-y-auto rounded-3xl border-slate-200 bg-white p-5 sm:max-w-2xl">
        {item ? (
          <>
            <DialogHeader>
              <div className="mb-1">
                <Badge variant="outline" className="border-sky-200 bg-sky-50 text-sky-700">
                  {isArticle ? (item as HelpArticle).category : (item as HelpFaq).category}
                </Badge>
              </div>
              <DialogTitle className="text-xl font-black text-slate-950">
                {isArticle ? (item as HelpArticle).title : (item as HelpFaq).question}
              </DialogTitle>
              <DialogDescription>
                {isArticle ? (item as HelpArticle).summary : t("quickAnswer")}
              </DialogDescription>
            </DialogHeader>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-7 text-slate-600">
              {isArticle ? (item as HelpArticle).content : (item as HelpFaq).answer}
            </div>
            {isArticle ? (
              <div className="flex flex-wrap gap-2">
                {(item as HelpArticle).keywords.map((keyword) => (
                  <Badge key={keyword} variant="outline" className="border-slate-200 bg-white text-slate-500">
                    {keyword}
                  </Badge>
                ))}
              </div>
            ) : null}
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
