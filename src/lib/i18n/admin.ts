import { cookies } from "next/headers";
import { type AdminLocale } from "../../../config/i18n";
import { getEnabledAdminLocaleConfigsRuntime, isAdminLocaleRuntime } from "@/lib/i18n/locale-config-store";
import { ADMIN_LOCALE_COOKIE, resolveAdminLocale } from "@/lib/i18n/runtime";

export async function getAdminI18nState() {
  const locale = await resolveAdminLocale();

  return {
    locale,
    locales: await getEnabledAdminLocaleConfigsRuntime()
  };
}

export async function setAdminLocaleCookie(locale: string) {
  if (!(await isAdminLocaleRuntime(locale))) {
    throw new Error("Unsupported admin locale.");
  }

  const cookieStore = await cookies();
  cookieStore.set(ADMIN_LOCALE_COOKIE, locale, {
    path: "/",
    sameSite: "lax",
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 365
  });
}

export function ensureAdminLocale(locale?: string | null): AdminLocale {
  if (locale) return locale as AdminLocale;
  return "en" as AdminLocale;
}
