"use client";

import { useMemo, useState } from "react";
import { FileQuestion, FileText, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { searchExampleKeys } from "@/components/frontend/help/help-center-data";
import { AccountEmptyState } from "@/components/account/AccountEmptyState";
import { Badge } from "@/components/ui/badge";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from "@/components/ui/command";
import type { HelpArticle, HelpFaq } from "@/types/help";

type HelpSearchProps = {
  articles: HelpArticle[];
  faqs: HelpFaq[];
  onOpenArticle: (article: HelpArticle) => void;
  onOpenFaq: (faq: HelpFaq) => void;
};

type SearchItem =
  | {
      type: "article";
      id: string;
      title: string;
      category: string;
      summary: string;
      value: string;
      article: HelpArticle;
    }
  | {
      type: "faq";
      id: string;
      title: string;
      category: string;
      summary: string;
      value: string;
      faq: HelpFaq;
    };

export function HelpSearch({ articles, faqs, onOpenArticle, onOpenFaq }: HelpSearchProps) {
  const t = useTranslations("HelpCenter.search");
  const [query, setQuery] = useState("");

  const items = useMemo<SearchItem[]>(() => {
    const articleItems = articles.map((article) => ({
      type: "article" as const,
      id: article.id,
      title: article.title,
      category: article.category,
      summary: article.summary,
      value: [article.title, article.summary, article.category, ...article.keywords].join(" "),
      article
    }));

    const faqItems = faqs.map((faq) => ({
      type: "faq" as const,
      id: faq.id,
      title: faq.question,
      category: faq.category,
      summary: faq.answer,
      value: [faq.question, faq.answer, faq.category].join(" "),
      faq
    }));

    return [...articleItems, ...faqItems];
  }, [articles, faqs]);

  const normalizedQuery = query.trim().toLowerCase();
  const filteredItems = normalizedQuery
    ? items.filter((item) => item.value.toLowerCase().includes(normalizedQuery)).slice(0, 8)
    : [];

  return (
    <section className="rounded-3xl border border-slate-200 bg-white/90 p-4 shadow-[0_18px_45px_rgba(15,23,42,0.05)] md:p-5">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_290px] lg:items-center">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-pink-200 bg-pink-50 px-3 py-1 text-xs font-black text-pink-700">
            <Search className="size-3.5" />
            {t("eyebrow")}
          </div>
          <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-950 md:text-3xl">{t("title")}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            {t("subtitle")}
          </p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
          <div className="text-xs font-bold uppercase text-slate-400">{t("examplesTitle")}</div>
          <div className="mt-3 flex flex-wrap gap-2">
            {searchExampleKeys.map((key) => (
              <button
                key={key}
                type="button"
                className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 transition hover:border-sky-200 hover:text-sky-700"
                onClick={() => setQuery(t(`examples.${key}`))}
              >
                {t(`examples.${key}`)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-5">
        <Command className="rounded-3xl border border-slate-200 bg-white p-2 shadow-none">
          <CommandInput
            value={query}
            onValueChange={setQuery}
            placeholder={t("placeholder")}
            inputGroupClassName="h-10 rounded-[20px]"
            className="h-full"
          />
          <CommandList className="max-h-[360px]">
            {query ? (
              <>
                <CommandEmpty>
                  <AccountEmptyState
                    title={t("emptyTitle")}
                    description={t("emptyDescription")}
                    className="min-h-44 border-0 bg-transparent p-6 shadow-none"
                  />
                </CommandEmpty>
                <CommandGroup heading={t("results")}>
                  {filteredItems.map((item) => {
                    const Icon = item.type === "article" ? FileText : FileQuestion;
                    return (
                      <CommandItem
                        key={`${item.type}-${item.id}`}
                        value={item.value}
                        className="items-start gap-3 rounded-2xl px-3 py-3"
                        onSelect={() => {
                          if (item.type === "article") {
                            onOpenArticle(item.article);
                          } else {
                            onOpenFaq(item.faq);
                          }
                        }}
                      >
                        <div className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-500">
                          <Icon className="size-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-black text-slate-950">{item.title}</span>
                            <Badge variant="outline" className="border-sky-200 bg-sky-50 text-sky-700">
                              {item.category}
                            </Badge>
                          </div>
                          <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{item.summary}</p>
                        </div>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </>
            ) : null}
          </CommandList>
        </Command>
      </div>
    </section>
  );
}
