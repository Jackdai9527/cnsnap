import { getRequestConfig } from "next-intl/server";
import { headers } from "next/headers";
import { defaultLocale, isSeoLocale, type AppLocale } from "../../config/i18n";
import { getMergedMessages } from "@/lib/i18n/messages";
import { resolveAdminLocale, resolveFrontendLocale, resolveFrontendLocaleForSeoLocale } from "@/lib/i18n/runtime";

export default getRequestConfig(async ({ requestLocale }) => {
  const requestedLocale = await requestLocale;
  const headerStore = await headers();
  const routeScope = headerStore.get("x-app-route-scope");
  const headerSeoLocale = headerStore.get("x-app-seo-locale");

  let locale: AppLocale = defaultLocale;
  let namespaces: Array<"admin" | "frontend"> = ["frontend"];

  if (isSeoLocale(headerSeoLocale)) {
    locale = await resolveFrontendLocaleForSeoLocale(headerSeoLocale) ?? defaultLocale;
  } else if (isSeoLocale(requestedLocale)) {
    locale = await resolveFrontendLocaleForSeoLocale(requestedLocale) ?? defaultLocale;
  } else if (requestedLocale === "admin" || routeScope === "admin") {
    locale = await resolveAdminLocale();
    namespaces = ["admin"];
  } else if (requestedLocale === "frontend" || routeScope === "frontend") {
    locale = await resolveFrontendLocale();
  } else if (requestedLocale) {
    locale = await resolveFrontendLocale();
  }

  const messages = await getMergedMessages(locale, namespaces);

  return {
    locale,
    messages
  };
});
