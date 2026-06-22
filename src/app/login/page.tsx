import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { AuthPanel } from "@/components/auth/AuthPanel";
import { getEnabledAuthProviders } from "@/lib/auth-ui";
import { resolveFrontendLocale } from "@/lib/i18n/runtime";

export default async function LoginPage() {
  const locale = await resolveFrontendLocale();
  const t = await getTranslations({ locale, namespace: "AuthPage.login" });
  return (
    <Suspense fallback={<div className="p-10 text-sm text-slate-500">{t("loading")}</div>}>
      <AuthPanel mode="login" enabledProviders={await getEnabledAuthProviders()} />
    </Suspense>
  );
}
