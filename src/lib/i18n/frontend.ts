import { cookies } from "next/headers";
import { getSeoLocaleByAppLocale, type FrontendLocale } from "../../../config/i18n";
import { getEnabledFrontendLocaleConfigsRuntime, isFrontendLocaleRuntime } from "@/lib/i18n/locale-config-store";
import { FRONTEND_LOCALE_COOKIE, resolveFrontendLocale } from "@/lib/i18n/runtime";

export type FrontendLanguageOption = {
  code: FrontendLocale;
  seoCode?: string;
  label: string;
};

export async function getFrontendI18nState() {
  const locale = await resolveFrontendLocale();
  const locales = await getEnabledFrontendLocaleConfigsRuntime();

  return {
    locale,
    locales,
    languages: locales.map((item) => ({
      code: item.locale,
      seoCode: getSeoLocaleByAppLocale(item.locale) ?? undefined,
      label: item.nativeName
    })) satisfies FrontendLanguageOption[]
  };
}

export async function setFrontendLocaleCookie(locale: string) {
  if (!(await isFrontendLocaleRuntime(locale))) {
    throw new Error("Unsupported frontend locale.");
  }

  const cookieStore = await cookies();
  cookieStore.set(FRONTEND_LOCALE_COOKIE, locale, {
    path: "/",
    sameSite: "lax",
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 365
  });
}

export function ensureFrontendLocale(locale?: string | null): FrontendLocale {
  if (locale) return locale as FrontendLocale;
  return "en" as FrontendLocale;
}
