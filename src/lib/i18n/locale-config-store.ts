import { cache } from "react";
import {
  defaultLocale,
  frontendUiLocales,
  getAppLocaleBySeoLocale,
  localeConfigs,
  normalizeFrontendLocaleCandidate,
  type AdminLocale,
  type AppLocale,
  type FrontendLocale,
  type LocaleConfig,
  type SeoLocale
} from "../../../config/i18n";
import { prisma } from "@/lib/db";

const LOCALE_CONFIGS_SETTING_KEY = "locale_configs_json";

function isLocaleConfig(value: unknown): value is LocaleConfig {
  if (!value || typeof value !== "object") return false;
  const config = value as Record<string, unknown>;
  return typeof config.locale === "string"
    && (typeof config.seoLocale === "string" || config.seoLocale === null || typeof config.seoLocale === "undefined")
    && typeof config.name === "string"
    && typeof config.nativeName === "string"
    && typeof config.enabled === "boolean"
    && typeof config.adminEnabled === "boolean"
    && typeof config.frontendEnabled === "boolean"
    && typeof config.seoEnabled === "boolean"
    && typeof config.isDefault === "boolean"
    && typeof config.sortOrder === "number";
}

function normalizeConfigs(input: LocaleConfig[]) {
  const known = new Map(localeConfigs.map((config) => [config.locale, config]));
  const merged = input
    .filter(isLocaleConfig)
    .map((config) => ({
      ...(known.get(config.locale) ?? config),
      ...config
    }))
    .filter((config, index, list) => list.findIndex((item) => item.locale === config.locale) === index)
    .sort((left, right) => left.sortOrder - right.sortOrder || left.locale.localeCompare(right.locale));

  const missingDefaults = localeConfigs.filter((config) => !merged.some((item) => item.locale === config.locale));
  const next = [...merged, ...missingDefaults].sort((left, right) => left.sortOrder - right.sortOrder || left.locale.localeCompare(right.locale));

  const hasDefault = next.some((config) => config.isDefault && config.locale === defaultLocale);
  return next.map((config) => ({
    ...config,
    isDefault: hasDefault ? config.isDefault && config.locale === defaultLocale : config.locale === defaultLocale
  }));
}

export const getLocaleConfigsSnapshot = cache(async (): Promise<LocaleConfig[]> => {
  const setting = await prisma.setting.findUnique({ where: { key: LOCALE_CONFIGS_SETTING_KEY } }).catch(() => null);
  if (!setting?.value) return normalizeConfigs(localeConfigs);

  try {
    const parsed = JSON.parse(setting.value);
    if (!Array.isArray(parsed)) return normalizeConfigs(localeConfigs);
    return normalizeConfigs(parsed as LocaleConfig[]);
  } catch {
    return normalizeConfigs(localeConfigs);
  }
});

export async function saveLocaleConfigsSnapshot(configs: LocaleConfig[]) {
  const normalized = normalizeConfigs(configs);
  const payload = JSON.stringify(normalized);
  await prisma.setting.upsert({
    where: { key: LOCALE_CONFIGS_SETTING_KEY },
    update: {
      value: payload,
      label: "Locale Configs JSON",
      description: "Runtime locale configuration for admin, frontend UI, and SEO routing."
    },
    create: {
      key: LOCALE_CONFIGS_SETTING_KEY,
      value: payload,
      label: "Locale Configs JSON",
      description: "Runtime locale configuration for admin, frontend UI, and SEO routing."
    }
  });
}

export async function getEnabledAdminLocalesRuntime() {
  return (await getLocaleConfigsSnapshot()).filter((config) => config.enabled && config.adminEnabled).map((config) => config.locale as AdminLocale);
}

export async function getEnabledFrontendLocalesRuntime() {
  return (await getLocaleConfigsSnapshot()).filter((config) => config.enabled && config.frontendEnabled).map((config) => config.locale as FrontendLocale);
}

export async function getEnabledSeoLocalesRuntime() {
  return (await getLocaleConfigsSnapshot())
    .filter((config) => config.enabled && config.seoEnabled && config.seoLocale)
    .map((config) => config.seoLocale as SeoLocale);
}

export async function getEnabledAdminLocaleConfigsRuntime() {
  return (await getLocaleConfigsSnapshot()).filter((config) => config.enabled && config.adminEnabled);
}

export async function getEnabledFrontendLocaleConfigsRuntime() {
  return (await getLocaleConfigsSnapshot()).filter((config) => config.enabled && config.frontendEnabled);
}

export async function getEnabledSeoLocaleConfigsRuntime() {
  return (await getLocaleConfigsSnapshot()).filter((config) => config.enabled && config.seoEnabled && config.seoLocale);
}

export async function getLocaleConfigRuntime(locale?: string | null) {
  if (!locale) return undefined;
  return (await getLocaleConfigsSnapshot()).find((config) => config.locale.toLowerCase() === locale.toLowerCase());
}

export async function isAdminLocaleRuntime(locale?: string | null) {
  if (!locale) return false;
  return (await getEnabledAdminLocalesRuntime()).includes(locale as AdminLocale);
}

export async function isFrontendLocaleRuntime(locale?: string | null) {
  if (!locale) return false;
  const normalized = normalizeFrontendLocaleCandidate(locale);
  if (!normalized) return false;
  return (await getEnabledFrontendLocalesRuntime()).includes(normalized as FrontendLocale);
}

export async function isSeoLocaleRuntime(locale?: string | null) {
  if (!locale) return false;
  return (await getEnabledSeoLocalesRuntime()).includes(locale as SeoLocale);
}

export async function getAppLocaleBySeoLocaleRuntime(locale?: string | null) {
  const fromStatic = getAppLocaleBySeoLocale(locale);
  if (!fromStatic) return undefined;
  const config = (await getLocaleConfigsSnapshot()).find((item) => item.locale === fromStatic && item.enabled && item.frontendEnabled);
  return config?.locale;
}

export async function getLocaleNativeNameRuntime(locale?: string | null) {
  return (await getLocaleConfigRuntime(locale))?.nativeName ?? locale ?? defaultLocale;
}

export function createEditableLocaleConfig(locale: AppLocale) {
  return localeConfigs.find((config) => config.locale === locale) ?? {
    locale,
    name: locale,
    nativeName: locale,
    enabled: frontendUiLocales.includes(locale as FrontendLocale),
    adminEnabled: false,
    frontendEnabled: true,
    seoEnabled: false,
    isDefault: locale === defaultLocale,
    sortOrder: localeConfigs.length + 1
  };
}
