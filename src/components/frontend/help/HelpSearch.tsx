"use client";

import { useMemo, useState } from "react";
import { FileText, Search } from "lucide-react";
import { useTranslations } from "next-intl";

import { searchExampleKeys } from "@/components/frontend/help/help-center-data";
import { Badge } from "@/components/ui/badge";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from "@/components/ui/command";
import type { HelpArticle } from "@/types/help";

type HelpSearchProps = {
  articles: HelpArticle[];
  onOpenArticle: (article: HelpArticle) => void;
  compact?: boolean;
};

type SearchItem = {
  article: HelpArticle;
  value: string;
};

export function HelpSearch({ articles, onOpenArticle, compact = false }: HelpSearchProps) {
  const t = useTranslations("HelpCenter.search");
  const [query, setQuery] = useState("");

  const items = useMemo<SearchItem[]>(
    () =>
      articles.map((article) => ({
        article,
        value: [article.title, article.summary, article.category, ...article.keywords].join(" ")
      })),
    [articles]
  );

  const normalizedQuery = query.trim().toLowerCase();
  const filteredItems = normalizedQuery
    ? items.filter((item) => item.value.toLowerCase().includes(normalizedQuery)).slice(0, 8)
    : [];

  return (
    <section className={compact ? "" : "site-container pt-10 md:pt-14"}>
      <div className={`relative overflow-hidden border border-[#dfe7f1] bg-white ${compact ? "rounded-[24px] p-4 shadow-[0_14px_30px_rgba(15,23,42,0.08)]" : "rounded-[34px] p-6 shadow-[0_30px_80px_rgba(15,23,42,0.08)] md:p-9"}`}>
        <div className={`absolute right-0 top-0 ${compact ? "hidden" : "hidden h-full w-1/2 bg-[linear-gradient(135deg,rgba(217,20,47,0.08),rgba(56,189,248,0.12))] lg:block"}`} />
        <div className={`relative grid ${compact ? "gap-4" : "gap-8 lg:grid-cols-[1fr_430px] lg:items-center"}`}>
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#d9e7ff] bg-[#f7fbff] px-3 py-1 text-xs font-black uppercase text-[#0a83ff]">
              <Search size={14} />
              {t("eyebrow")}
            </div>
            <h1 className={`max-w-4xl font-black leading-tight text-[#101828] ${compact ? "mt-4 text-[28px]" : "mt-5 text-4xl md:text-6xl"}`}>
              {t("title")}
            </h1>
            <p className={`max-w-2xl font-semibold text-[#667085] ${compact ? "mt-3 text-sm leading-6" : "mt-5 text-base leading-8 md:text-lg"}`}>
              {t("subtitle")}
            </p>
          </div>

          <div className={`border border-[#eef2f6] bg-[#fbfdff] ${compact ? "rounded-[20px] p-3" : "rounded-[28px] p-4"}`}>
            <div className="text-xs font-black uppercase text-[#98a2b3]">{t("examplesTitle")}</div>
            <div className="mt-3 flex flex-wrap gap-2">
              {searchExampleKeys.map((key) => (
                <button
                  key={key}
                  type="button"
                  className="rounded-full border border-[#dfe7f1] bg-white px-3 py-1.5 text-xs font-bold text-[#667085] transition hover:border-[#0a83ff] hover:text-[#0a83ff]"
                  onClick={() => setQuery(t(`examples.${key}`))}
                >
                  {t(`examples.${key}`)}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className={`relative ${compact ? "mt-4" : "mt-7"}`}>
          <Command className={`border border-[#dfe7f1] bg-white p-2 shadow-none ${compact ? "rounded-[22px]" : "rounded-3xl"}`}>
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
                    <div className="mx-auto grid min-h-40 max-w-md place-items-center rounded-3xl bg-[#f8fafc] p-6 text-center">
                      <div>
                        <div className="mx-auto grid size-11 place-items-center rounded-2xl bg-white text-[#98a2b3]">
                          <Search size={20} />
                        </div>
                        <h3 className="mt-3 text-sm font-black text-[#101828]">{t("emptyTitle")}</h3>
                        <p className="mt-2 text-sm font-semibold leading-6 text-[#667085]">{t("emptyDescription")}</p>
                      </div>
                    </div>
                  </CommandEmpty>
                  <CommandGroup heading={t("results")}>
                    {filteredItems.map(({ article }) => (
                      <CommandItem
                        key={article.id}
                        value={[article.title, article.summary, article.category, ...article.keywords].join(" ")}
                        className="items-start gap-3 rounded-2xl px-3 py-3"
                        onSelect={() => onOpenArticle(article)}
                      >
                        <div className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-2xl border border-[#dfe7f1] bg-[#f8fafc] text-[#667085]">
                          <FileText size={16} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-black text-[#101828]">{article.title}</span>
                            <Badge variant="outline" className="border-[#d9e7ff] bg-[#f7fbff] text-[#0a83ff]">
                              {article.category}
                            </Badge>
                          </div>
                          <p className="mt-1 line-clamp-2 text-xs font-semibold leading-5 text-[#667085]">{article.summary}</p>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </>
              ) : null}
            </CommandList>
          </Command>
        </div>
      </div>
    </section>
  );
}
