export const defaultLocale = "en" as const;

export const adminLocales = ["en", "zh-CN"] as const;

export const frontendUiLocales = [
  "en",
  "zh-CN",
  "de",
  "fr",
  "it",
  "pl",
  "pt",
  "es"
] as const;

export const seoLocales = [
  "en",
  "zh",
  "de",
  "fr",
  "it",
  "pl",
  "pt",
  "es"
] as const;

export type AdminLocale = (typeof adminLocales)[number];
export type FrontendLocale = (typeof frontendUiLocales)[number];
export type SeoLocale = (typeof seoLocales)[number];
export type AppLocale = FrontendLocale;

export type LocaleConfigSeoLocale = SeoLocale | null;

export type LocaleConfig = {
  locale: AppLocale;
  seoLocale?: LocaleConfigSeoLocale;
  name: string;
  nativeName: string;
  enabled: boolean;
  adminEnabled: boolean;
  frontendEnabled: boolean;
  seoEnabled: boolean;
  isDefault: boolean;
  sortOrder: number;
};

export const localeConfigs: LocaleConfig[] = [
  {
    locale: "en",
    seoLocale: "en",
    name: "English",
    nativeName: "English",
    enabled: true,
    adminEnabled: true,
    frontendEnabled: true,
    seoEnabled: true,
    isDefault: true,
    sortOrder: 1
  },
  {
    locale: "zh-CN",
    seoLocale: "zh",
    name: "Chinese Simplified",
    nativeName: "简体中文",
    enabled: true,
    adminEnabled: true,
    frontendEnabled: true,
    seoEnabled: true,
    isDefault: false,
    sortOrder: 2
  },
  {
    locale: "de",
    seoLocale: "de",
    name: "German",
    nativeName: "Deutsch",
    enabled: true,
    adminEnabled: false,
    frontendEnabled: true,
    seoEnabled: true,
    isDefault: false,
    sortOrder: 3
  },
  {
    locale: "fr",
    seoLocale: "fr",
    name: "French",
    nativeName: "Français",
    enabled: true,
    adminEnabled: false,
    frontendEnabled: true,
    seoEnabled: true,
    isDefault: false,
    sortOrder: 4
  },
  {
    locale: "it",
    seoLocale: "it",
    name: "Italian",
    nativeName: "Italiano",
    enabled: true,
    adminEnabled: false,
    frontendEnabled: true,
    seoEnabled: true,
    isDefault: false,
    sortOrder: 5
  },
  {
    locale: "pl",
    seoLocale: "pl",
    name: "Polish",
    nativeName: "Polski",
    enabled: true,
    adminEnabled: false,
    frontendEnabled: true,
    seoEnabled: true,
    isDefault: false,
    sortOrder: 6
  },
  {
    locale: "pt",
    seoLocale: "pt",
    name: "Portuguese",
    nativeName: "Português",
    enabled: true,
    adminEnabled: false,
    frontendEnabled: true,
    seoEnabled: true,
    isDefault: false,
    sortOrder: 7
  },
  {
    locale: "es",
    seoLocale: "es",
    name: "Spanish",
    nativeName: "Español",
    enabled: true,
    adminEnabled: false,
    frontendEnabled: true,
    seoEnabled: true,
    isDefault: false,
    sortOrder: 8
  }
];

const localeConfigMap = new Map(
  localeConfigs.map((config) => [config.locale.toLowerCase(), config])
);

function sortLocales<T extends LocaleConfig>(locales: T[]) {
  return [...locales].sort((left, right) => left.sortOrder - right.sortOrder || left.locale.localeCompare(right.locale));
}

export function getLocaleConfigs() {
  return sortLocales(localeConfigs.filter((config) => config.enabled));
}

export function getEnabledAdminLocales() {
  return sortLocales(localeConfigs.filter((config) => config.enabled && config.adminEnabled)).map((config) => config.locale);
}

export function getEnabledFrontendLocales() {
  return sortLocales(localeConfigs.filter((config) => config.enabled && config.frontendEnabled)).map((config) => config.locale);
}

export function getEnabledSeoLocales() {
  return sortLocales(localeConfigs.filter((config) => config.enabled && config.seoEnabled && config.seoLocale)).map((config) => config.seoLocale as SeoLocale);
}

export function getEnabledAdminLocaleConfigs() {
  return sortLocales(localeConfigs.filter((config) => config.enabled && config.adminEnabled));
}

export function getEnabledFrontendLocaleConfigs() {
  return sortLocales(localeConfigs.filter((config) => config.enabled && config.frontendEnabled));
}

export function getEnabledSeoLocaleConfigs() {
  return sortLocales(localeConfigs.filter((config) => config.enabled && config.seoEnabled));
}

export function getLocaleConfig(locale?: string | null) {
  if (!locale) return undefined;
  return localeConfigMap.get(locale.toLowerCase());
}

export function isAdminLocale(locale?: string | null): locale is AdminLocale {
  return Boolean(locale && getEnabledAdminLocales().includes(locale as AdminLocale));
}

export function isFrontendLocale(locale?: string | null): locale is FrontendLocale {
  return Boolean(locale && getEnabledFrontendLocales().includes(locale as FrontendLocale));
}

export function isSeoLocale(locale?: string | null): locale is SeoLocale {
  return Boolean(locale && getEnabledSeoLocales().includes(locale as SeoLocale));
}

export function getLocaleNativeName(locale?: string | null) {
  return getLocaleConfig(locale)?.nativeName ?? locale ?? defaultLocale;
}

export function normalizeLocale(locale?: string | null) {
  if (!locale) return defaultLocale;
  return getLocaleConfig(locale)?.locale ?? defaultLocale;
}

export function getSeoLocaleByAppLocale(locale?: string | null) {
  return getLocaleConfig(locale)?.seoLocale ?? null;
}

export function getAppLocaleBySeoLocale(locale?: string | null): AppLocale | undefined {
  if (!locale) return undefined;
  return localeConfigs.find((config) => config.seoLocale === locale)?.locale;
}

export function getLocaleConfigBySeoLocale(locale?: string | null) {
  if (!locale) return undefined;
  return localeConfigs.find((config) => config.seoLocale === locale);
}

export function normalizeFrontendLocaleCandidate(locale?: string | null) {
  if (!locale) return undefined;
  const exact = getLocaleConfig(locale)?.locale;
  if (exact) return exact;

  const lowered = locale.toLowerCase();
  if (lowered === "zh" || lowered === "zh-cn" || lowered === "zh-hans") return "zh-CN" as const;
  if (lowered.startsWith("zh-")) return "zh-CN" as const;

  return undefined;
}

export function normalizeSeoLocaleCandidate(locale?: string | null) {
  if (!locale) return undefined;
  if (isSeoLocale(locale)) return locale;

  const lowered = locale.toLowerCase();
  if (lowered === "zh" || lowered === "zh-cn" || lowered === "zh-hans") return "zh" as const;
  if (lowered.startsWith("zh-")) return "zh" as const;

  const appLocale = getLocaleConfig(locale)?.locale;
  return appLocale ? getSeoLocaleByAppLocale(appLocale) ?? undefined : undefined;
}
