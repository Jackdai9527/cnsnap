import { headers } from "next/headers";
import { isSeoLocale } from "../../../../config/i18n";
import { stripSeoLocale, withSeoLocale } from "@/modules/seo/lib/locale-routing";

export async function getRequestSeoLocale() {
  const headerStore = await headers();
  const locale = headerStore.get("x-app-seo-locale");
  return isSeoLocale(locale) ? locale : undefined;
}

export async function getLocalizedSeoPath(pathname: string) {
  const locale = await getRequestSeoLocale();
  if (!locale) return pathname;
  const stripped = stripSeoLocale(pathname).pathname;
  return withSeoLocale(locale, stripped);
}

export async function getSeoRouteAlternates(pathname: string) {
  const locale = await getRequestSeoLocale();
  if (!locale) return undefined;

  const stripped = stripSeoLocale(pathname).pathname;
  return {
    locale,
    strippedPathname: stripped
  };
}
