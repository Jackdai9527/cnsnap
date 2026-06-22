"use client";

import { useMemo } from "react";
import { Check, ChevronRight, Globe2, MoonStar, SunMedium, UserRound, WalletCards, BadgeHelp, Gift, Heart, MapPin, MessageSquareText, Package, ReceiptText, Search, ShoppingBag } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useSyncExternalStore } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { getEnabledFrontendLocaleConfigs, type FrontendLocale } from "../../../../config/i18n";
import { useCurrency } from "@/components/currency/CurrencyProvider";
import { buildLocalizedUiHref } from "@/lib/i18n/frontend-routing";

const FRONTEND_LOCALE_COOKIE = "NEXT_LOCALE";
const THEME_STORAGE_KEY = "cnsnap_theme";
type ThemeMode = "light" | "dark";
type ThemeChoice = ThemeMode | "system";

function getThemeSnapshot(): ThemeChoice {
  if (typeof window === "undefined") return "system";
  const stored = window.localStorage?.getItem(THEME_STORAGE_KEY);
  if (stored === "light" || stored === "dark" || stored === "system") return stored;
  return "system";
}

function getServerThemeSnapshot(): ThemeChoice {
  return "system";
}

function subscribeToThemeChange(onStoreChange: () => void) {
  const observer = new MutationObserver(onStoreChange);
  observer.observe(document.documentElement, { attributeFilter: ["data-theme"], attributes: true });
  window.addEventListener("storage", onStoreChange);
  window.addEventListener("cnsnap-theme-change", onStoreChange);

  return () => {
    observer.disconnect();
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener("cnsnap-theme-change", onStoreChange);
  };
}

function resolveSystemTheme(): ThemeMode {
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(theme: ThemeChoice) {
  const effectiveTheme = theme === "system" ? resolveSystemTheme() : theme;
  document.documentElement.dataset.theme = effectiveTheme;
  document.documentElement.classList.toggle("dark", effectiveTheme === "dark");
  document.documentElement.style.colorScheme = effectiveTheme;
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {}
  document.cookie = `${THEME_STORAGE_KEY}=${theme}; path=/; max-age=31536000; samesite=lax`;
  window.dispatchEvent(new Event("cnsnap-theme-change"));
}

const themeOptions: Array<{ value: ThemeChoice; label: string; icon: typeof SunMedium }> = [
  { value: "light", label: "Light", icon: SunMedium },
  { value: "dark", label: "Dark", icon: MoonStar },
  { value: "system", label: "System", icon: SunMedium }
];

const menuIcons = {
  dashboard: ShoppingBag,
  orders: ShoppingBag,
  packages: Package,
  wallet: WalletCards,
  billing: ReceiptText,
  recharge: ReceiptText,
  addresses: MapPin,
  favorites: Heart,
  diyOrders: Search,
  affiliate: Gift,
  coupons: Gift,
  ticketsCenter: MessageSquareText,
  support: BadgeHelp,
  profile: UserRound,
  helpCenter: BadgeHelp
} as const;

export function MobileAccountPreferencesCard({
  items = []
}: {
  items?: Array<{
    href: string;
    iconKey: keyof typeof menuIcons;
    title: string;
    copy?: string;
  }>;
}) {
  const locale = useLocale() as FrontendLocale;
  const t = useTranslations("account.profile.preferences");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { selectedCurrency, currencies, selectCurrency } = useCurrency();
  const theme = useSyncExternalStore(subscribeToThemeChange, getThemeSnapshot, getServerThemeSnapshot);
  const languageOptions = useMemo(() => getEnabledFrontendLocaleConfigs(), []);
  const currentLanguage = languageOptions.find((item) => item.locale === locale) ?? languageOptions[0];
  const search = searchParams.toString();

  async function switchLanguage(code: FrontendLocale) {
    try {
      localStorage.setItem(FRONTEND_LOCALE_COOKIE, code);
    } catch {}
    const href = buildLocalizedUiHref(pathname, code, search || undefined);
    router.push(href);
    router.refresh();
  }

  return (
    <section className="mobile-account-settings-group">
      <div className="mobile-account-settings-title">{t("title")}</div>
      <div className="mobile-account-settings-list is-preferences">
        {items.map((item) => {
          const Icon = menuIcons[item.iconKey];
          return (
            <a key={item.href} href={item.href} className="mobile-account-settings-row">
              <span className="mobile-account-settings-row-main">
                <span className="mobile-account-settings-row-icon"><Icon className="size-4" /></span>
                <span className="mobile-account-settings-row-copy">
                  <span className="mobile-account-settings-row-title">{item.title}</span>
                  {item.copy ? <span className="mobile-account-settings-row-text">{item.copy}</span> : null}
                </span>
              </span>
              <span className="mobile-account-settings-row-side">
                <ChevronRight className="size-4 text-slate-300" />
              </span>
            </a>
          );
        })}

        <div className="mobile-account-theme-block">
          <div className="mobile-account-theme-copy">
            <div className="mobile-account-theme-title">{t("themeLabel")}</div>
            <div className="mobile-account-theme-text">{t("themeDescription")}</div>
          </div>
          <div className="mobile-account-theme-segmented">
            {themeOptions.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.value}
                  type="button"
                  className={theme === item.value ? "mobile-account-theme-option is-active" : "mobile-account-theme-option"}
                  onClick={() => applyTheme(item.value)}
                >
                  <Icon className="size-4" />
                  <span>{t(`themeChoices.${item.value}`)}</span>
                </button>
              );
            })}
          </div>
        </div>

        <Sheet>
          <SheetTrigger render={<button type="button" className="mobile-account-settings-row" />}>
            <span className="mobile-account-settings-row-main">
              <span className="mobile-account-settings-row-icon"><Globe2 className="size-4" /></span>
              <span className="mobile-account-settings-row-copy">
                <span className="mobile-account-settings-row-title">{t("language")}</span>
                <span className="mobile-account-settings-row-text">{t("languageDescription")}</span>
              </span>
            </span>
            <span className="mobile-account-settings-row-side">
              <span className="mobile-account-settings-value">{currentLanguage?.nativeName}</span>
              <ChevronRight className="size-4 text-slate-300" />
            </span>
          </SheetTrigger>
          <SheetContent side="bottom" className="max-h-[82dvh] overflow-y-auto rounded-t-[28px] border-t border-[#ebe7e0] bg-[#fbfaf8] p-0">
            <SheetHeader className="border-b border-[#ebe7e0] px-4 pb-3 pt-4">
              <SheetTitle>{t("language")}</SheetTitle>
            </SheetHeader>
            <div className="mobile-account-picker-list">
              {languageOptions.map((item) => (
                <button
                  key={item.locale}
                  type="button"
                  className={item.locale === locale ? "mobile-account-picker-row is-active" : "mobile-account-picker-row"}
                  onClick={() => void switchLanguage(item.locale)}
                >
                  <span>{item.nativeName}</span>
                  {item.locale === locale ? <Check className="size-4" /> : null}
                </button>
              ))}
            </div>
          </SheetContent>
        </Sheet>

        <Sheet>
          <SheetTrigger render={<button type="button" className="mobile-account-settings-row" />}>
            <span className="mobile-account-settings-row-main">
              <span className="mobile-account-settings-row-icon"><WalletCards className="size-4" /></span>
              <span className="mobile-account-settings-row-copy">
                <span className="mobile-account-settings-row-title">{t("currency")}</span>
                <span className="mobile-account-settings-row-text">{t("currencyDescription")}</span>
              </span>
            </span>
            <span className="mobile-account-settings-row-side">
              <span className="mobile-account-settings-value">{selectedCurrency}</span>
              <ChevronRight className="size-4 text-slate-300" />
            </span>
          </SheetTrigger>
          <SheetContent side="bottom" className="max-h-[82dvh] overflow-y-auto rounded-t-[28px] border-t border-[#ebe7e0] bg-[#fbfaf8] p-0">
            <SheetHeader className="border-b border-[#ebe7e0] px-4 pb-3 pt-4">
              <SheetTitle>{t("currency")}</SheetTitle>
            </SheetHeader>
            <div className="mobile-account-picker-list">
              {currencies.map((currency) => (
                <button
                  key={currency}
                  type="button"
                  className={currency === selectedCurrency ? "mobile-account-picker-row is-active" : "mobile-account-picker-row"}
                  onClick={() => selectCurrency(currency)}
                >
                  <span>{currency}</span>
                  {currency === selectedCurrency ? <Check className="size-4" /> : null}
                </button>
              ))}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </section>
  );
}
