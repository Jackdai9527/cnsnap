import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminPermissionProvider } from "@/components/admin/Can";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { AdminLanguageSwitcher } from "@/components/admin/AdminLanguageSwitcher";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { NextIntlClientProvider } from "next-intl";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { Toaster } from "@/components/ui/sonner";
import { requireAdminPage } from "@/lib/admin-session";
import { getAdminI18nState } from "@/lib/i18n/admin";
import { getMergedMessages } from "@/lib/i18n/messages";
import { createMetadataFromIndexPolicy } from "@/modules/seo/lib/metadata";

export async function generateMetadata(): Promise<Metadata> {
  const seo = await createMetadataFromIndexPolicy("/admin", {
    title: "Admin Center",
    description: "Administrative workspace for CNSnap operations."
  });
  return seo.metadata;
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdminPage("/admin");
  const i18nState = await getAdminI18nState();
  const messages = await getMergedMessages(i18nState.locale, ["admin"]);
  const headerMessages = (((messages as Record<string, unknown>).common as Record<string, unknown> | undefined)?.header ?? {}) as Record<string, string>;
  const switcherMessages = (((messages as Record<string, unknown>).common as Record<string, unknown> | undefined)?.switcher ?? {}) as Record<string, string>;
  const metaMessages = (((messages as Record<string, unknown>).common as Record<string, unknown> | undefined)?.meta ?? {}) as Record<string, string>;

  return (
    <NextIntlClientProvider locale={i18nState.locale} messages={messages}>
      <QueryProvider>
        <div className="admin-light-shell min-h-screen bg-[#f7f8fb] text-slate-950">
          <AdminPermissionProvider role={user.role}>
            <Suspense fallback={null}>
              <AdminSidebar userRole={user.role} className="fixed inset-y-0 left-0 z-40 hidden w-[292px] border-r border-slate-200/80 shadow-[8px_0_30px_rgba(15,23,42,0.04)] lg:flex" />
            </Suspense>
            <div className="min-w-0 lg:pl-[292px]">
              <AdminHeader
                user={{
                  email: user.email,
                  name: user.name,
                  avatarUrl: user.avatarUrl,
                  role: user.role
                }}
                languageSwitcher={(
                  <AdminLanguageSwitcher
                    locale={i18nState.locale}
                    locales={i18nState.locales}
                    label={headerMessages.language ?? "Language"}
                    title={switcherMessages.title ?? metaMessages.adminLanguageTitle ?? "Admin language"}
                    description={switcherMessages.description ?? metaMessages.adminLanguageDescription ?? "Choose the language used across the admin console."}
                  />
                )}
              />
              <div role="main" className="w-full max-w-none px-4 py-5 sm:px-6 lg:px-8 2xl:px-10">{children}</div>
            </div>
          </AdminPermissionProvider>
          <Toaster richColors position="top-right" />
        </div>
      </QueryProvider>
    </NextIntlClientProvider>
  );
}
