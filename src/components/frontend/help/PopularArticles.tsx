"use client";

import { CalendarDays, FileText } from "lucide-react";
import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { HelpArticle } from "@/types/help";

type PopularArticlesProps = {
  articles: HelpArticle[];
  onOpenArticle: (article: HelpArticle) => void;
};

export function PopularArticles({ articles, onOpenArticle }: PopularArticlesProps) {
  const t = useTranslations("HelpCenter.articlesSection");

  return (
    <Card className="border-[#dfe7f1] bg-white shadow-[0_18px_45px_rgba(15,23,42,0.05)]">
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <div>
          <div className="label">{t("eyebrow")}</div>
          <CardTitle className="mt-2 text-2xl font-black text-[#101828]">{t("title")}</CardTitle>
          <p className="mt-1 text-sm font-semibold leading-6 text-[#667085]">{t("description")}</p>
        </div>
        <Badge variant="outline" className="hidden border-[#d9e7ff] bg-[#f7fbff] text-[#0a83ff] sm:inline-flex">
          {t("guideCount", { count: articles.length })}
        </Badge>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="divide-y divide-[#eef2f6]">
          {articles.map((article) => (
            <button
              key={article.id}
              type="button"
              className="group flex w-full gap-3 py-4 text-left transition first:pt-0 last:pb-0"
              onClick={() => onOpenArticle(article)}
            >
              <div className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-2xl border border-[#dfe7f1] bg-[#f8fafc] text-[#667085] transition group-hover:border-[#0a83ff] group-hover:bg-[#f7fbff] group-hover:text-[#0a83ff]">
                <FileText size={16} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-black text-[#101828] transition group-hover:text-[#0a83ff]">{article.title}</h3>
                  <Badge variant="outline" className="border-[#ffd7df] bg-[#fff1f2] text-[#d9142f]">
                    {article.category}
                  </Badge>
                </div>
                <p className="mt-2 text-sm font-semibold leading-6 text-[#667085]">{article.summary}</p>
                <div className="mt-3 flex items-center gap-2 text-xs font-bold text-[#98a2b3]">
                  <CalendarDays size={14} />
                  {t("updated", { date: article.updatedAt })}
                </div>
              </div>
              <span className="hidden h-9 shrink-0 items-center justify-center rounded-md px-3 text-sm font-medium text-[#667085] transition group-hover:bg-[#f8fafc] group-hover:text-[#0a83ff] md:inline-flex">
                {t("read")}
              </span>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
