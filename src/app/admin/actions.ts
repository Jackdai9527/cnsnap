"use server";

import { setAdminLocaleCookie } from "@/lib/i18n/admin";

export async function updateAdminLanguage(locale: string) {
  await setAdminLocaleCookie(locale);
}
