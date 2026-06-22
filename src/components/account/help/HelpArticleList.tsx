"use client";

import { CalendarDays, FileText } from "lucide-react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { HelpArticle } from "@/types/help";

type HelpArticleListProps = {
  articles: HelpArticle[];
  onOpenArticle: (article: HelpArticle) => void;
};

export function HelpArticleList({ articles, onOpenArticle }: HelpArticleListProps) {
  const t = useTranslations("HelpCenter.articlesSection");

  return (
    <Card className="border-slate-200 bg-white/90 shadow-[0_18px_45px_rgba(15,23,42,0.05)]">
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-lg font-black text-slate-950">{t("title")}</CardTitle>
          <p className="mt-1 text-sm text-slate-500">{t("description")}</p>
        </div>
        <Badge variant="outline" className="hidden border-sky-200 bg-sky-50 text-sky-700 sm:inline-flex">
          {t("guideCount", { count: articles.length })}
        </Badge>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="divide-y divide-slate-100">
          {articles.map((article) => (
            <button
              key={article.id}
              type="button"
              className="group flex w-full gap-3 py-4 text-left transition first:pt-0 last:pb-0"
              onClick={() => onOpenArticle(article)}
            >
              <div className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-400 transition group-hover:border-sky-200 group-hover:bg-sky-50 group-hover:text-sky-600">
                <FileText className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-black text-slate-950 transition group-hover:text-sky-700">{article.title}</h3>
                  <Badge variant="outline" className="border-pink-200 bg-pink-50 text-pink-700">
                    {article.category}
                  </Badge>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-500">{article.summary}</p>
                <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-slate-400">
                  <CalendarDays className="size-3.5" />
                  {t("updated", { date: article.updatedAt })}
                </div>
              </div>
              <Button variant="ghost" size="sm" className="hidden shrink-0 self-center text-slate-500 md:inline-flex">
                {t("read")}
              </Button>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
