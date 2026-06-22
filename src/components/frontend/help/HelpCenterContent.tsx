"use client";

import { useMemo, useState } from "react";
import { ArrowRight, BadgeHelp } from "lucide-react";
import { useTranslations } from "next-intl";

import { HelpCategoryGrid } from "@/components/frontend/help/HelpCategoryGrid";
import { HelpFaqAccordion } from "@/components/frontend/help/HelpFaqAccordion";
import { HelpSearch } from "@/components/frontend/help/HelpSearch";
import { MobileHelpArticleList } from "@/components/mobile/help/MobileHelpArticleList";
import { MobileHelpCategoryGrid } from "@/components/mobile/help/MobileHelpCategoryGrid";
import { MobileHelpContactSupportCard } from "@/components/mobile/help/MobileHelpContactSupportCard";
import { MobileHelpFaqAccordion } from "@/components/mobile/help/MobileHelpFaqAccordion";
import { MobileHelpPage } from "@/components/mobile/help/MobileHelpPage";
import { MobileHelpPopularQuestions } from "@/components/mobile/help/MobileHelpPopularQuestions";
import { MobileHelpSearchBox } from "@/components/mobile/help/MobileHelpSearchBox";
import { popularTopics } from "@/components/frontend/help/help-center-data";
import { PopularArticles } from "@/components/frontend/help/PopularArticles";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { HelpArticle, HelpCategory, HelpFaq } from "@/types/help";

type HelpCenterContentProps = {
  categories: HelpCategory[];
  articles: HelpArticle[];
  faqs: HelpFaq[];
};

export function HelpCenterContent({ categories, articles, faqs }: HelpCenterContentProps) {
  const t = useTranslations("HelpCenter");
  const [selectedCategory, setSelectedCategory] = useState<HelpCategory | null>(null);
  const [openArticle, setOpenArticle] = useState<HelpArticle | null>(null);

  const selectedCategoryId = selectedCategory?.id;
  const filteredArticles = useMemo(() => {
    const nextArticles = selectedCategoryId
      ? articles.filter((article) => article.categoryId === selectedCategoryId)
      : articles.filter((article) => article.isPopular);

    return nextArticles;
  }, [articles, selectedCategoryId]);

  const filteredFaqs = useMemo(() => {
    if (!selectedCategoryId) return faqs;
    return faqs.filter((faq) => faq.categoryId === selectedCategoryId);
  }, [faqs, selectedCategoryId]);

  function openTopic(articleId: string) {
    const article = articles.find((item) => item.id === articleId);
    if (article) setOpenArticle(article);
  }

  return (
    <>
      <MobileHelpPage
        search={<MobileHelpSearchBox articles={articles} onOpenArticle={setOpenArticle} />}
        popular={<MobileHelpPopularQuestions articles={articles} onOpenArticle={setOpenArticle} />}
        categories={
          <MobileHelpCategoryGrid
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
          />
        }
        faq={<MobileHelpFaqAccordion faqs={filteredFaqs} />}
        articles={<MobileHelpArticleList articles={filteredArticles} onOpenArticle={setOpenArticle} />}
        support={<MobileHelpContactSupportCard />}
      />

      <div className="hidden md:block">
        <HelpSearch articles={articles} onOpenArticle={setOpenArticle} />
      </div>

      <section className="site-container hidden py-10 md:block">
        <div className="mb-5">
          <div className="label">{t("popularTopics.eyebrow")}</div>
          <h2 className="mt-2 text-3xl font-black text-[#101828]">{t("popularTopics.title")}</h2>
          <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-[#667085]">{t("popularTopics.description")}</p>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {popularTopics.map((topic, index) => (
            <button
              key={topic.id}
              type="button"
              className="group flex items-center gap-3 rounded-2xl border border-[#dfe7f1] bg-white p-4 text-left shadow-[0_14px_36px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 hover:border-[#0a83ff]"
              onClick={() => openTopic(topic.articleId)}
            >
              <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-[#101828] text-xs font-black text-white">
                {index + 1}
              </span>
              <span className="flex-1 text-sm font-black leading-5 text-[#101828] group-hover:text-[#0a83ff]">
                {t(`popularTopics.items.${topic.id}`)}
              </span>
              <ArrowRight size={16} className="text-[#98a2b3] group-hover:text-[#0a83ff]" />
            </button>
          ))}
        </div>
      </section>

      <div className="hidden md:block">
        <HelpCategoryGrid
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />
      </div>

      {selectedCategory ? (
        <section className="site-container hidden pb-2 md:block">
          <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-[#dfe7f1] bg-white px-4 py-3 text-sm font-semibold text-[#667085]">
            {t("filter.showing")}
            <Badge variant="outline" className="border-[#d9e7ff] bg-[#f7fbff] text-[#0a83ff]">
              {selectedCategory.title}
            </Badge>
          </div>
        </section>
      ) : null}

      <section className="site-container hidden grid gap-6 py-10 md:grid xl:grid-cols-[minmax(0,0.95fr)_minmax(380px,0.75fr)]">
        {filteredArticles.length ? (
          <PopularArticles articles={filteredArticles} onOpenArticle={setOpenArticle} />
        ) : (
          <EmptyHelpCard title={t("empty.articlesTitle")} description={t("empty.articlesDescription")} />
        )}

        {filteredFaqs.length ? (
          <HelpFaqAccordion faqs={filteredFaqs} />
        ) : (
          <EmptyHelpCard title={t("empty.faqTitle")} description={t("empty.faqDescription")} />
        )}
      </section>

      <ArticleDialog article={openArticle} onOpenChange={(open) => !open && setOpenArticle(null)} />
    </>
  );
}

function EmptyHelpCard({ title, description }: { title: string; description: string }) {
  return (
    <Card className="border-[#dfe7f1] bg-white shadow-[0_18px_45px_rgba(15,23,42,0.05)]">
      <CardContent className="grid min-h-72 place-items-center p-8 text-center">
        <div>
          <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-[#f8fafc] text-[#98a2b3]">
            <BadgeHelp size={22} />
          </div>
          <h3 className="mt-4 text-lg font-black text-[#101828]">{title}</h3>
          <p className="mt-2 max-w-sm text-sm font-semibold leading-6 text-[#667085]">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function ArticleDialog({ article, onOpenChange }: { article: HelpArticle | null; onOpenChange: (open: boolean) => void }) {
  const t = useTranslations("HelpCenter.articleDialog");

  return (
    <Dialog open={Boolean(article)} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] overflow-y-auto rounded-3xl border-[#dfe7f1] bg-white p-5 sm:max-w-2xl">
        {article ? (
          <>
            <DialogHeader>
              <div className="mb-1">
                <Badge variant="outline" className="border-[#d9e7ff] bg-[#f7fbff] text-[#0a83ff]">
                  {article.category}
                </Badge>
              </div>
              <DialogTitle className="text-xl font-black text-[#101828]">{article.title}</DialogTitle>
              <DialogDescription>{article.summary}</DialogDescription>
            </DialogHeader>
            <div className="rounded-2xl border border-[#dfe7f1] bg-[#f8fafc] p-4 text-sm font-semibold leading-7 text-[#344054]">
              {article.content}
            </div>
            <div>
              <div className="mb-2 text-xs font-black uppercase text-[#98a2b3]">{t("keywords")}</div>
              <div className="flex flex-wrap gap-2">
                {article.keywords.map((keyword) => (
                  <Badge key={keyword} variant="outline" className="border-[#dfe7f1] bg-white text-[#667085]">
                    {keyword}
                  </Badge>
                ))}
              </div>
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
