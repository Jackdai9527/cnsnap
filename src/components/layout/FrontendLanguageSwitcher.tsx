"use client";

import { LanguageCurrencySwitcher } from "@/components/layout/LanguageCurrencySwitcher";
import type { FrontendLanguageOption } from "@/lib/i18n/frontend";

export function FrontendLanguageSwitcher({
  currencies,
  defaultCurrency = "USD",
  pageLanguage = "en",
  publicLocale,
  languages
}: {
  currencies: string[];
  defaultCurrency?: string;
  pageLanguage?: FrontendLanguageOption["code"];
  publicLocale?: string;
  languages: FrontendLanguageOption[];
}) {
  return (
    <LanguageCurrencySwitcher
      currencies={currencies}
      defaultCurrency={defaultCurrency}
      pageLanguage={pageLanguage}
      publicLocale={publicLocale}
      languages={languages}
    />
  );
}
