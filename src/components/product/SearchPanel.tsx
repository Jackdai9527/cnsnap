"use client";

import { FormEvent, useState } from "react";
import { useLocale } from "next-intl";
import { LinkIcon, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { platforms } from "@/lib/constants";
import { buildBuyUrl, isSourceUrl } from "@/lib/source-url";
import { cn } from "@/lib/utils";
import { getSeoLocaleByAppLocale } from "../../../config/i18n";

type SearchPanelProps = {
  compact?: boolean;
  mobile?: boolean;
  initialQuery?: string;
  initialType?: string;
  initialPlatform?: string;
};

function normalizeSearchType(value?: string) {
  return value === "url" ? "url" : "keyword";
}

export function SearchPanel({
  compact = false,
  mobile = false,
  initialQuery = "",
  initialType = "keyword",
  initialPlatform = "all"
}: SearchPanelProps) {
  const locale = useLocale();
  const buyLocale = getSeoLocaleByAppLocale(locale) ?? locale;
  const searchPath = `/${buyLocale}/search`;
  const t = useTranslations("search");
  const [type, setType] = useState(normalizeSearchType(initialType));
  const [platform, setPlatform] = useState(initialPlatform);
  const [query, setQuery] = useState(initialQuery);
  const effectiveType = type;
  const effectivePlatform = platform;
  const effectiveQuery = query;

  const tabs = [
    { value: "keyword", label: t("panel.keyword"), icon: Search },
    { value: "url", label: t("panel.url"), icon: LinkIcon }
  ] as const;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    const trimmed = effectiveQuery.trim();
    if (!trimmed) {
      event.preventDefault();
      return;
    }

    document.cookie = `NEXT_LOCALE=${encodeURIComponent(locale)}; Path=/; Max-Age=31536000; SameSite=Lax`;

    if (effectiveType === "url" || isSourceUrl(trimmed)) {
      event.preventDefault();
      window.location.href = buildBuyUrl(trimmed, buyLocale);
    }
  }

  return (
    <form key={`${initialType}-${initialPlatform}-${initialQuery}`} action={searchPath} onSubmit={handleSubmit} className={cn("site-card", compact ? "p-3" : "p-5", mobile && "mobile-search-panel")}>
      <input type="hidden" name="type" value={effectiveType} />
      <div className={cn("flex flex-wrap gap-2", mobile && "mobile-search-tabs")}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => setType(tab.value)}
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-black transition ${
                effectiveType === tab.value ? "border-[#d9142f] bg-[#d9142f] text-white shadow-[0_10px_22px_rgba(217,20,47,0.16)]" : "border-[#d9e7ff] bg-white text-[#667085] hover:border-[#d9142f] hover:text-[#d9142f]"
              }`}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>
      <div className={cn("mt-4 grid gap-3 md:grid-cols-[170px_minmax(0,1fr)_auto]", mobile && "mobile-search-controls")}>
        <select name="platform" value={effectivePlatform} onChange={(event) => setPlatform(event.target.value)} className={cn("input", mobile && "mobile-search-select")}>
          <option value="all">{t("platformLabels.all")}</option>
          {platforms.map((item) => (
            <option key={item} value={item}>
              {t.has(`platformLabels.${item}`) ? t(`platformLabels.${item}`) : item}
            </option>
          ))}
        </select>
        <input
          className={cn("input", mobile && "mobile-search-input")}
          name="q"
          placeholder={effectiveType === "url" ? t("panel.urlPlaceholder") : t("panel.keywordPlaceholder")}
          value={effectiveQuery}
          onChange={(event) => setQuery(event.target.value)}
          required
        />
        <button className={cn("btn-primary min-h-12 px-6", mobile && "mobile-search-submit")} type="submit">
          <Search size={17} />
          {t("panel.submit")}
        </button>
      </div>
    </form>
  );
}
