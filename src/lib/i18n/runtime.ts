import { cookies, headers } from "next/headers";
import {
  defaultLocale,
  getAppLocaleBySeoLocale,
  normalizeFrontendLocaleCandidate,
  normalizeLocale,
  normalizeSeoLocaleCandidate,
  type AdminLocale,
  type AppLocale,
  type FrontendLocale,
  type SeoLocale
} from "../../../config/i18n";
import { getCurrentAdmin } from "@/lib/admin-session";
import {
  getEnabledFrontendLocaleConfigsRuntime,
  getAppLocaleBySeoLocaleRuntime,
  isAdminLocaleRuntime,
  isFrontendLocaleRuntime,
  isSeoLocaleRuntime
} from "@/lib/i18n/locale-config-store";
import { getCurrentUser } from "@/lib/session";

export const ADMIN_LOCALE_COOKIE = "admin_locale";
export const FRONTEND_LOCALE_COOKIE = "NEXT_LOCALE";

export type RuntimeLocaleContext =
  | { kind: "admin"; locale: AdminLocale }
  | { kind: "frontend"; locale: FrontendLocale }
  | { kind: "seo"; locale: SeoLocale };

export async function resolveAdminLocale() {
  const [cookieStore, adminUser] = await Promise.all([cookies(), getCurrentAdmin().catch(() => null)]);
  const preferred = adminUser?.locale;
  const cookieLocale = cookieStore.get(ADMIN_LOCALE_COOKIE)?.value;

  if (await isAdminLocaleRuntime(cookieLocale)) return cookieLocale as AdminLocale;
  if (await isAdminLocaleRuntime(preferred)) return preferred as AdminLocale;
  return defaultLocale;
}

function getPreferredFrontendLocaleFromHeaders(acceptLanguage: string | null) {
  return getPreferredFrontendLocaleFromHeadersAsync(acceptLanguage);
}

async function getPreferredFrontendLocaleFromHeadersAsync(acceptLanguage: string | null) {
  if (!acceptLanguage) return undefined;
  const enabledFrontendConfigs = await getEnabledFrontendLocaleConfigsRuntime();

  for (const candidate of acceptLanguage.split(",").map((part) => part.split(";")[0]?.trim()).filter(Boolean)) {
    const normalized = normalizeFrontendLocaleCandidate(candidate);
    if (normalized && await isFrontendLocaleRuntime(normalized)) return normalized as FrontendLocale;

    const baseLanguage = candidate.split("-")[0];
    const normalizedBase = normalizeFrontendLocaleCandidate(baseLanguage);
    if (normalizedBase && await isFrontendLocaleRuntime(normalizedBase)) return normalizedBase as FrontendLocale;

    const exact = enabledFrontendConfigs.find((config) => config.locale.toLowerCase() === baseLanguage.toLowerCase());
    if (exact) return exact.locale;
  }

  return undefined;
}

export async function resolveFrontendLocale() {
  const [cookieStore, headerStore, currentUser] = await Promise.all([cookies(), headers(), getCurrentUser().catch(() => null)]);
  const preferred = currentUser?.locale;
  const cookieLocale = cookieStore.get(FRONTEND_LOCALE_COOKIE)?.value;
  const acceptLanguage = headerStore.get("accept-language");

  const normalizedCookieLocale = normalizeFrontendLocaleCandidate(cookieLocale);
  const normalizedPreferredLocale = normalizeFrontendLocaleCandidate(preferred);

  if (normalizedCookieLocale && await isFrontendLocaleRuntime(normalizedCookieLocale)) return normalizedCookieLocale as FrontendLocale;
  if (normalizedPreferredLocale && await isFrontendLocaleRuntime(normalizedPreferredLocale)) return normalizedPreferredLocale as FrontendLocale;

  const browserLocale = await getPreferredFrontendLocaleFromHeaders(acceptLanguage);
  if (browserLocale) return browserLocale;

  return defaultLocale;
}

export async function resolveRequestLocale(pathnameOrLocale?: string | null): Promise<RuntimeLocaleContext> {
  const seoLocale = normalizeSeoLocaleCandidate(pathnameOrLocale);
  if (seoLocale && await isSeoLocaleRuntime(seoLocale)) {
    return { kind: "seo", locale: seoLocale as SeoLocale };
  }

  if (pathnameOrLocale?.startsWith("/admin")) {
    return { kind: "admin", locale: await resolveAdminLocale() };
  }

  return { kind: "frontend", locale: await resolveFrontendLocale() };
}

export function normalizeAppLocale(locale?: string | null): AppLocale {
  return normalizeLocale(locale) as AppLocale;
}

export async function resolveFrontendLocaleForSeoLocale(locale?: string | null) {
  const seoLocale = normalizeSeoLocaleCandidate(locale);
  if (!seoLocale) return undefined;
  return (await getAppLocaleBySeoLocaleRuntime(seoLocale)) ?? getAppLocaleBySeoLocale(seoLocale);
}
