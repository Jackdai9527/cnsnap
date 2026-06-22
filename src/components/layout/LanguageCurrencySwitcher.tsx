"use client";

import { ChevronDown, Globe2 } from "lucide-react";
import { useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCurrency } from "@/components/currency/CurrencyProvider";
import type { FrontendLanguageOption } from "@/lib/i18n/frontend";
import { buildLocalizedUiHref } from "@/lib/i18n/frontend-routing";

const FRONTEND_LOCALE_COOKIE = "NEXT_LOCALE";

export function LanguageCurrencySwitcher({
  currencies,
  defaultCurrency = "USD",
  pageLanguage = "en" as FrontendLanguageOption["code"],
  publicLocale,
  languages
}: {
  currencies: string[];
  defaultCurrency?: string;
  pageLanguage?: FrontendLanguageOption["code"];
  publicLocale?: string;
  languages: FrontendLanguageOption[];
}) {
  const t = useTranslations("common.header.switcher");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currencyState = useCurrency();
  const currencyOptions = currencies.length ? currencies : currencyState.currencies;
  const selectedCurrency = currencyOptions.includes(currencyState.selectedCurrency) ? currencyState.selectedCurrency : defaultCurrency;
  const currentLanguage = useMemo(() => languages.find((language) => language.code === pageLanguage), [languages, pageLanguage]);
  const languageOptions = useMemo(() => languages.filter((language) => language.code !== pageLanguage), [languages, pageLanguage]);
  const selectedLanguageLabel = currentLanguage?.label ?? pageLanguage.toUpperCase();

  async function switchLanguage(code: FrontendLanguageOption["code"]) {
    document.cookie = `${FRONTEND_LOCALE_COOKIE}=${encodeURIComponent(code)}; Path=/; Max-Age=31536000; SameSite=Lax`;
    const search = searchParams.toString();
    let nextHref = buildLocalizedUiHref(pathname, code, search, publicLocale);

    try {
      const response = await fetch(`/api/i18n/route?pathname=${encodeURIComponent(pathname)}&locale=${encodeURIComponent(code)}`, {
        method: "GET",
        credentials: "same-origin"
      });

      if (response.ok) {
        const payload = await response.json() as { pathname?: string };
        if (payload.pathname) {
          nextHref = search ? `${payload.pathname}?${search}` : payload.pathname;
        }
      }
    } catch {
      nextHref = buildLocalizedUiHref(pathname, code, search, publicLocale);
    }

    router.push(nextHref);
    router.refresh();
  }

  return (
    <div className="language-currency-switcher group relative notranslate" translate="no">
      <button type="button" className="inline-flex h-[38px] items-center gap-1.5 rounded-full border border-[#d9e7ff] bg-white px-3 text-xs font-black text-[#344054] shadow-[0_8px_20px_rgba(10,131,255,0.05)] transition hover:border-[#0a83ff] hover:text-[#0a83ff]">
        <Globe2 size={14} />
        <span className="hidden max-w-[76px] truncate md:inline">{selectedLanguageLabel}</span>
        <span className="hidden text-[#c2c8d2] md:inline">/</span>
        <span>{selectedCurrency}</span>
        <ChevronDown size={13} className="transition group-hover:rotate-180" />
      </button>

      <div className="language-currency-panel absolute right-0 top-[calc(100%+4px)] z-50 max-h-[min(520px,calc(100vh-92px))] w-[420px] max-w-[calc(100vw-24px)] overflow-y-auto rounded-2xl border border-[#e6edf8] bg-white p-3 shadow-[0_22px_60px_rgba(15,23,42,0.16)] transition">
        <div className="grid gap-3 md:grid-cols-[1fr_1fr]">
          <section className="select-list-wrap lang-select min-w-0">
            <span className="title col-111-e4 block px-2 pb-2 text-xs font-black uppercase text-[#11181c]">{t("language")}</span>
            <div className="select-list grid gap-1">
              <button
                type="button"
                className={`select-list-item rounded-xl px-3 py-2 text-left text-xs font-black transition ${pageLanguage === "en" ? "bg-[#fff1f2] text-[#e60012]" : "text-[#667085] hover:bg-[#edf7ff] hover:text-[#0a83ff]"}`}
                onClick={() => void switchLanguage(pageLanguage)}
              >
                {currentLanguage?.label ?? "English"}
              </button>
              {languageOptions.map((language) => (
                <button
                  key={language.code}
                  type="button"
                  className={`select-list-item rounded-xl px-3 py-2 text-left text-xs font-black transition ${pageLanguage === language.code ? "bg-[#fff1f2] text-[#e60012]" : "text-[#667085] hover:bg-[#edf7ff] hover:text-[#0a83ff]"}`}
                  onClick={() => void switchLanguage(language.code)}
                >
                  {language.label}
                </button>
              ))}
            </div>
          </section>

          <section className="select-list-wrap rate-select min-w-0">
            <span className="title col-111-e4 block px-2 pb-2 text-xs font-black uppercase text-[#11181c]">{t("currency")}</span>
            <div className="select-list grid grid-cols-2 gap-1">
              {currencyOptions.map((currency) => (
                <button
                  key={currency}
                  type="button"
                  className={`select-list-item rounded-xl px-3 py-2 text-left text-xs font-black transition ${selectedCurrency === currency ? "bg-[#fff1f2] text-[#e60012]" : "text-[#667085] hover:bg-[#edf7ff] hover:text-[#0a83ff]"}`}
                  onClick={() => currencyState.selectCurrency(currency)}
                >
                  {currency}
                </button>
              ))}
            </div>
          </section>
        </div>
      </div>

    </div>
  );
}
